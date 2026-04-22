import { useMemo } from "react";
import type { Reading, Supply } from "@/db/db";
import type { TarifasData } from "@/db/use-tarifas";
import {
  calculateFirstYearTotal,
  calculateInvoiceCost,
  calculateSavings,
  getBilledDays,
} from "@/lib/tariff-calculations";
import type {
  AnnualEstimate,
  InvoiceSimulation,
  TariffComparison,
} from "./types";

export const useCompareTariffs = (
  readings: Reading[] | undefined,
  supply: Supply | null | undefined,
  tarifasData: TarifasData | null
): {
  annualEstimate: AnnualEstimate | null;
  comparisons: TariffComparison[];
  lastYearReadings: Reading[];
} => {
  const lastYearReadings = useMemo(() => {
    if (!readings?.length) {
      return [];
    }
    const sorted = [...readings].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
    const lastEndDate = new Date(sorted[0].endDate).getTime();
    const oneYearAgo = lastEndDate - 365 * 24 * 60 * 60 * 1000;
    return sorted.filter((r) => new Date(r.startDate).getTime() >= oneYearAgo);
  }, [readings]);

  const annualEstimate = useMemo((): AnnualEstimate | null => {
    if (!(lastYearReadings.length && supply)) {
      return null;
    }
    let peakkWh = 0;
    let flatkWh = 0;
    let offPeakkWh = 0;
    for (const r of lastYearReadings) {
      peakkWh += r.consumptionPeak;
      flatkWh += r.consumptionFlat;
      offPeakkWh += r.consumptionOffPeak;
    }
    return { peakkWh, flatkWh, offPeakkWh };
  }, [lastYearReadings, supply]);

  const comparisons = useMemo((): TariffComparison[] => {
    if (!(lastYearReadings.length && tarifasData && supply)) {
      return [];
    }

    const { iva, impuestoElectrico, alquilerContador, bonoSocial } =
      tarifasData.datosGenerales;

    const costParams = {
      contractedPowerPeak: supply.contractedPowerPeak,
      contractedPowerOffPeak: supply.contractedPowerOffPeak,
      iva,
      impuestoElectrico,
      alquilerContador,
      bonoSocial,
    };

    const hasCurrentPrices =
      supply.currentPriceEnergyPeak !== undefined &&
      supply.currentPricePowerPeak !== undefined;

    const currentPrices = hasCurrentPrices
      ? {
          peakPower: supply.currentPricePowerPeak ?? 0,
          offPeakPower: supply.currentPricePowerOffPeak ?? 0,
          peakEnergy: supply.currentPriceEnergyPeak ?? 0,
          flatEnergy: supply.currentPriceEnergyFlat ?? 0,
          offPeakEnergy: supply.currentPriceEnergyOffPeak ?? 0,
        }
      : null;

    return tarifasData.tarifas
      .map((t): TariffComparison => {
        const d = t.detalles;
        const newPrices = {
          peakPower: d.potenciaPunta || 0,
          offPeakPower: d.potenciaValle || 0,
          peakEnergy: d.energiaPunta || 0,
          flatEnergy: d.energiaLlana || 0,
          offPeakEnergy: d.energiaValle || 0,
        };
        const incluyeBS = d.incluyeBonoSocial !== false;

        const invoices: InvoiceSimulation[] = lastYearReadings
          .map((r) => {
            const billedDays = getBilledDays(r.startDate, r.endDate);
            const newSimulated = Number(
              calculateInvoiceCost(r, newPrices, billedDays, {
                ...costParams,
                incluyeBonoSocial: incluyeBS,
              }).toFixed(2)
            );
            const currentSimulated = currentPrices
              ? Number(
                  calculateInvoiceCost(r, currentPrices, billedDays, {
                    ...costParams,
                    incluyeBonoSocial: incluyeBS,
                  }).toFixed(2)
                )
              : undefined;
            return {
              startDate: r.startDate,
              endDate: r.endDate,
              realAmount: r.cost,
              currentSimulated,
              newSimulated,
              savings: calculateSavings(currentSimulated, r.cost, newSimulated),
            };
          })
          .sort(
            (a, b) =>
              new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );

        const estimatedAnnualTotal = Number(
          invoices.reduce((sum, inv) => sum + inv.newSimulated, 0).toFixed(2)
        );
        const currentAnnualTotal = hasCurrentPrices
          ? invoices.reduce((sum, inv) => sum + (inv.currentSimulated ?? 0), 0)
          : undefined;
        const savings =
          currentAnnualTotal === undefined
            ? undefined
            : Number((currentAnnualTotal - estimatedAnnualTotal).toFixed(2));

        return {
          name: t.comercializadora,
          tariffName: d.nombreTarifa,
          estimatedAnnualTotal,
          firstYearTotal: calculateFirstYearTotal(d, estimatedAnnualTotal),
          savings,
          details: d,
          invoices,
        };
      })
      .sort((a, b) => {
        if (a.savings !== undefined && b.savings !== undefined) {
          return b.savings - a.savings;
        }
        return a.estimatedAnnualTotal - b.estimatedAnnualTotal;
      });
  }, [lastYearReadings, tarifasData, supply]);

  return { lastYearReadings, annualEstimate, comparisons };
};
