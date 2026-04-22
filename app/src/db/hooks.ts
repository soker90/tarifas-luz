import { useLiveQuery } from "dexie-react-hooks";
import { db, type Reading, type Supply } from "./db";

export function useSupplies() {
  const supplies = useLiveQuery(() => db.supplies.toArray());

  const addSupply = async (
    name: string,
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    currentPricePowerPeak?: number,
    currentPricePowerOffPeak?: number,
    currentPriceEnergyPeak?: number,
    currentPriceEnergyFlat?: number,
    currentPriceEnergyOffPeak?: number
  ) => {
    return await db.supplies.add({
      id: crypto.randomUUID(),
      name,
      contractedPowerPeak,
      contractedPowerOffPeak,
      currentPricePowerPeak,
      currentPricePowerOffPeak,
      currentPriceEnergyPeak,
      currentPriceEnergyFlat,
      currentPriceEnergyOffPeak,
      createdAt: new Date().toISOString(),
    });
  };

  const updateSupply = async (id: string, updates: Partial<Supply>) => {
    await db.supplies.update(id, updates);
  };

  const deleteSupply = async (id: string) => {
    await db.supplies.delete(id);
    // Also delete all readings for this supply
    const readings = await db.readings.where("supplyId").equals(id).toArray();
    const readingIds = readings.map((r) => r.id);
    await db.readings.bulkDelete(readingIds);
  };

  return { supplies, addSupply, updateSupply, deleteSupply };
}

export function useSupply(id?: string) {
  const supply = useLiveQuery(
    () => (id ? db.supplies.get(id) : undefined),
    [id]
  );

  const updateSupply = async (updates: Partial<Supply>) => {
    if (id) {
      await db.supplies.update(id, updates);
    }
  };

  return { supply, updateSupply };
}

export function useReadings(supplyId?: string) {
  const readings = useLiveQuery(() => {
    if (!supplyId) {
      return [];
    }
    return db.readings.where("supplyId").equals(supplyId).toArray();
  }, [supplyId]);

  const addReading = async (
    supplyId: string,
    startDate: string,
    endDate: string,
    consumptionPeak: number,
    consumptionFlat: number,
    consumptionOffPeak: number,
    cost?: number
  ) => {
    return await db.readings.add({
      id: crypto.randomUUID(),
      supplyId,
      startDate,
      endDate,
      consumptionPeak,
      consumptionFlat,
      consumptionOffPeak,
      cost,
      createdAt: new Date().toISOString(),
    });
  };

  const updateReading = async (id: string, updates: Partial<Reading>) => {
    await db.readings.update(id, updates);
  };

  const deleteReading = async (id: string) => {
    await db.readings.delete(id);
  };

  return { readings, addReading, updateReading, deleteReading };
}
