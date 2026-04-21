import Dexie, { type EntityTable } from 'dexie';

export interface Supply {
  id: string;
  name: string;
  contractedPowerPeak: number; // Potencia contratada punta
  contractedPowerOffPeak: number; // Potencia contratada valle
  currentPricePowerPeak?: number;
  currentPricePowerOffPeak?: number;
  currentPriceEnergyPeak?: number;
  currentPriceEnergyFlat?: number;
  currentPriceEnergyOffPeak?: number;
  createdAt: string;
}

export interface Reading {
  id: string;
  supplyId: string;
  startDate: string;
  endDate: string;
  consumptionPeak: number; // Consumo punta kWh
  consumptionFlat: number; // Consumo llano kWh
  consumptionOffPeak: number; // Consumo valle kWh
  cost?: number; // Precio real pagado
  createdAt: string;
}

export const db = new Dexie('TarifasLuzDB') as Dexie & {
  supplies: EntityTable<Supply, 'id'>;
  readings: EntityTable<Reading, 'id'>;
};

// Declarar esquema de la base de datos
db.version(1).stores({
  supplies: 'id, name, createdAt', // Primary key and indexed props
  readings: 'id, supplyId, startDate, endDate' // Primary key and indexed props
});
