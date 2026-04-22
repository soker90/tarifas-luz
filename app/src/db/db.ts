import Dexie, { type EntityTable } from "dexie";

export interface Supply {
  contractedPowerOffPeak: number; // Potencia contratada valle
  contractedPowerPeak: number; // Potencia contratada punta
  createdAt: string;
  currentPriceEnergyFlat?: number;
  currentPriceEnergyOffPeak?: number;
  currentPriceEnergyPeak?: number;
  currentPricePowerOffPeak?: number;
  currentPricePowerPeak?: number;
  id: string;
  name: string;
}

export interface Reading {
  consumptionFlat: number; // Consumo llano kWh
  consumptionOffPeak: number; // Consumo valle kWh
  consumptionPeak: number; // Consumo punta kWh
  cost?: number; // Precio real pagado
  createdAt: string;
  endDate: string;
  id: string;
  startDate: string;
  supplyId: string;
}

export const db = new Dexie("TarifasLuzDB") as Dexie & {
  supplies: EntityTable<Supply, "id">;
  readings: EntityTable<Reading, "id">;
};

// Declarar esquema de la base de datos
db.version(1).stores({
  supplies: "id, name, createdAt", // Primary key and indexed props
  readings: "id, supplyId, startDate, endDate", // Primary key and indexed props
});
