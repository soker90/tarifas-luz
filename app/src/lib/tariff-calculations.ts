import type { TarifaDetalles } from "@/db/use-tarifas";

export interface EnergyPrices {
  flatEnergy: number;
  offPeakEnergy: number;
  offPeakPower: number;
  peakEnergy: number;
  peakPower: number;
}

export interface EnergyReading {
  consumptionFlat: number;
  consumptionOffPeak: number;
  consumptionPeak: number;
}

export interface TariffCostParams {
  alquilerContador: number;
  bonoSocial: number;
  contractedPowerOffPeak: number;
  contractedPowerPeak: number;
  impuestoElectrico: number;
  incluyeBonoSocial?: boolean;
  iva: number;
}

export const calculateInvoiceCost = (
  reading: EnergyReading,
  prices: EnergyPrices,
  billedDays: number,
  params: TariffCostParams
): number => {
  const {
    contractedPowerPeak,
    contractedPowerOffPeak,
    iva,
    impuestoElectrico,
    alquilerContador,
    bonoSocial,
    incluyeBonoSocial = true,
  } = params;

  const powerCost =
    (contractedPowerPeak * prices.peakPower +
      contractedPowerOffPeak * prices.offPeakPower) *
    billedDays;
  const energyCost =
    (reading.consumptionPeak || 0) * prices.peakEnergy +
    (reading.consumptionFlat || 0) * prices.flatEnergy +
    (reading.consumptionOffPeak || 0) * prices.offPeakEnergy;
  const totalKwh =
    (reading.consumptionPeak || 0) +
    (reading.consumptionFlat || 0) +
    (reading.consumptionOffPeak || 0);
  const impuestoElectricoAmount = Math.max(
    totalKwh * 0.001,
    (powerCost + energyCost) * impuestoElectrico
  );
  const bonoSocialAmount = incluyeBonoSocial ? bonoSocial * billedDays : 0;
  const totalBruto =
    powerCost +
    energyCost +
    impuestoElectricoAmount +
    alquilerContador * billedDays +
    bonoSocialAmount;

  return totalBruto * (1 + iva);
};

export const calculateSavings = (
  currentSimulated: number | undefined,
  realCost: number | undefined,
  newSimulated: number
): number | undefined => {
  if (currentSimulated !== undefined) {
    return Number((currentSimulated - newSimulated).toFixed(2));
  }
  if (realCost === undefined) {
    return undefined;
  }
  return Number((realCost - newSimulated).toFixed(2));
};

interface ReadingPeriod {
  startDate: string | number;
  endDate: string | number;
}

const toTimestamp = (value: string | number): number =>
  typeof value === "number" ? value : new Date(value).getTime();

export const hasFullYearCoverage = (
  readings: ReadingPeriod[],
  periodStart: number,
  periodEnd: number
): boolean => {
  const sorted = [...readings].toSorted(
    (a, b) => toTimestamp(a.startDate) - toTimestamp(b.startDate)
  );
  let coveredUntil = periodStart;

  for (const reading of sorted) {
    const start = toTimestamp(reading.startDate);
    const end = toTimestamp(reading.endDate);
    if (end <= coveredUntil) {
      continue;
    }
    if (start > coveredUntil) {
      return false;
    }
    coveredUntil = Math.max(coveredUntil, end);
    if (coveredUntil >= periodEnd) {
      return true;
    }
  }

  return false;
};

export const calculateWindowTotal = <T extends ReadingPeriod>(
  items: T[],
  periodStart: number,
  periodEnd: number,
  getAmount: (item: T) => number
): number =>
  items.reduce((total, item) => {
    const start = toTimestamp(item.startDate);
    const end = toTimestamp(item.endDate);
    const duration = end - start;
    if (duration <= 0) {
      return total;
    }

    const overlap = Math.max(
      0,
      Math.min(end, periodEnd) - Math.max(start, periodStart)
    );
    return total + (getAmount(item) * overlap) / duration;
  }, 0);

export const calculateFirstYearTotal = (
  d: TarifaDetalles,
  estimatedAnnualTotal: number
): number | undefined => {
  if (!d.descuento) {
    return undefined;
  }
  const desc = d.descuento;
  // Una duración desconocida no permite estimar el descuento del primer año.
  if (desc.meses === null) {
    return undefined;
  }

  const mesesPrimerAno = Math.min(desc.meses, 12);
  if (desc.tipo === "porcentaje") {
    const descuentoEuros =
      estimatedAnnualTotal * (mesesPrimerAno / 12) * (desc.valor / 100);
    return Number((estimatedAnnualTotal - descuentoEuros).toFixed(2));
  }
  // Los descuentos fijos se expresan en euros por cada mes promocionado.
  return Number(
    (estimatedAnnualTotal - desc.valor * mesesPrimerAno).toFixed(2)
  );
};

export const getBilledDays = (startDate: string, endDate: string): number =>
  Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
