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

export const calculateFirstYearTotal = (
  d: TarifaDetalles,
  estimatedAnnualTotal: number
): number | undefined => {
  if (!d.descuento?.meses) {
    return undefined;
  }
  const desc = d.descuento;
  const meses = desc.meses ?? 0;
  const mantenimiento = d.mantenimientoPrecio || 12;
  if (desc.tipo === "porcentaje") {
    const descuentoEuros =
      estimatedAnnualTotal * (meses / 12) * (desc.valor / 100);
    return Number((estimatedAnnualTotal - descuentoEuros).toFixed(2));
  }
  const numPeriodos = meses / mantenimiento;
  return Number((estimatedAnnualTotal - desc.valor * numPeriodos).toFixed(2));
};

export const getBilledDays = (startDate: string, endDate: string): number =>
  Math.max(
    1,
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
