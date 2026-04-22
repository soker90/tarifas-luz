import type { TarifaDetalles } from "@/db/use-tarifas";

export interface InvoiceSimulation {
  currentSimulated?: number;
  endDate: string;
  newSimulated: number;
  realAmount?: number;
  savings?: number;
  startDate: string;
}

export interface TariffComparison {
  details: TarifaDetalles;
  estimatedAnnualTotal: number;
  firstYearTotal?: number;
  invoices: InvoiceSimulation[];
  name: string;
  savings?: number;
  tariffName: string;
}

export interface AnnualEstimate {
  flatkWh: number;
  offPeakkWh: number;
  peakkWh: number;
}
