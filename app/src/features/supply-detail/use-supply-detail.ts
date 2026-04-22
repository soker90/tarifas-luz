import { useState } from "react";
import type { LegendPayload } from "recharts";
import type { Reading, Supply } from "@/db/db";
import { useReadings, useSupply } from "@/db/hooks";
import type { DatosGenerales } from "@/db/use-tarifas";
import { useTarifasData } from "@/db/use-tarifas";

export interface ReadingFormData {
  startDate: string;
  endDate: string;
  peak: number;
  flat: number;
  offPeak: number;
  cost?: number;
}

export interface EditSupplyFormData {
  name: string;
  contractedPowerPeak: number;
  contractedPowerOffPeak: number;
  currentPricePowerPeak?: number;
  currentPricePowerOffPeak?: number;
  currentPriceEnergyPeak?: number;
  currentPriceEnergyFlat?: number;
  currentPriceEnergyOffPeak?: number;
}

export type ChartPoint = {
  name: string;
  Punta: number;
  Llano: number;
  Valle: number;
};

const computeLastYearChartData = (sortedReadings: Reading[]): ChartPoint[] => {
  if (!sortedReadings.length) return [];
  const lastDate = new Date(sortedReadings[0].endDate).getTime();
  const oneYearAgo = lastDate - 365 * 24 * 60 * 60 * 1000;
  return [...sortedReadings]
    .filter((r) => new Date(r.endDate).getTime() >= oneYearAgo)
    .reverse()
    .map((r) => ({
      name: new Date(r.endDate).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      }),
      Punta: r.consumptionPeak,
      Llano: r.consumptionFlat,
      Valle: r.consumptionOffPeak,
    }));
}

const computeStats = (
  sortedReadings: Reading[],
  supply: Supply,
  datosGenerales: DatosGenerales | null
) => {
  let statsDays = 0;
  let statsPeak = 0;
  let statsFlat = 0;
  let statsOffPeak = 0;
  let statsAccCost = 0;

  for (const r of sortedReadings) {
    const days = Math.max(
      1,
      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    statsDays += days;
    statsPeak += r.consumptionPeak;
    statsFlat += r.consumptionFlat;
    statsOffPeak += r.consumptionOffPeak;
    if (r.cost !== undefined) {
      statsAccCost += r.cost;
    } else if (supply.currentPriceEnergyPeak !== undefined) {
      const iva = datosGenerales?.iva ?? 0.1;
      const ie = datosGenerales?.impuestoElectrico ?? 0.005;
      const alq = datosGenerales?.alquilerContador ?? 0.027;
      const pwCost =
        (supply.contractedPowerPeak * (supply.currentPricePowerPeak || 0) +
          supply.contractedPowerOffPeak *
            (supply.currentPricePowerOffPeak || 0)) *
        days;
      const enCost =
        r.consumptionPeak * (supply.currentPriceEnergyPeak || 0) +
        r.consumptionFlat * (supply.currentPriceEnergyFlat || 0) +
        r.consumptionOffPeak * (supply.currentPriceEnergyOffPeak || 0);
      const kWh = r.consumptionPeak + r.consumptionFlat + r.consumptionOffPeak;
      const impuesto = Math.max(kWh * 0.001, (pwCost + enCost) * ie);
      statsAccCost += (pwCost + enCost + impuesto + alq * days) * (1 + iva);
    }
  }

  return { statsDays, statsPeak, statsFlat, statsOffPeak, statsAccCost };
}

export const ITEMS_PER_PAGE = 20;

export const useSupplyDetail = (supplyId: string | undefined) => {
  const { supply, updateSupply } = useSupply(supplyId);
  const { readings, addReading, updateReading, deleteReading } =
    useReadings(supplyId);
  const { tarifasData } = useTarifasData();
  const datosGenerales = tarifasData?.datosGenerales ?? null;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [readingToEdit, setReadingToEdit] = useState<Reading | null>(null);
  const [isEditSupplyDialogOpen, setIsEditSupplyDialogOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const [opacity, setOpacity] = useState({ Punta: 1, Llano: 1, Valle: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>("");

  const sortedReadings = [...(readings || [])].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const totalPages = Math.ceil(sortedReadings.length / ITEMS_PER_PAGE);
  const paginatedReadings = sortedReadings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const availableYears = Array.from(
    new Set(
      sortedReadings.map((r) => new Date(r.endDate).getFullYear().toString())
    )
  )
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);

  const currentSelectedYear =
    selectedYear || (availableYears[0] ?? new Date().getFullYear().toString());

  const chartData: ChartPoint[] = [...sortedReadings]
    .filter(
      (r) =>
        new Date(r.endDate).getFullYear().toString() === currentSelectedYear
    )
    .reverse()
    .map((r) => ({
      name: new Date(r.endDate).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      }),
      Punta: r.consumptionPeak,
      Llano: r.consumptionFlat,
      Valle: r.consumptionOffPeak,
    }));

  const lastYearChartData = computeLastYearChartData(sortedReadings);

  const stats =
    supply != null
      ? computeStats(sortedReadings, supply, datosGenerales)
      : {
          statsDays: 0,
          statsPeak: 0,
          statsFlat: 0,
          statsOffPeak: 0,
          statsAccCost: 0,
        };

  const statsTotalKwh = stats.statsPeak + stats.statsFlat + stats.statsOffPeak;
  const dailyAverage =
    stats.statsDays > 0 ? (statsTotalKwh / stats.statsDays).toFixed(1) : "0";
  const accumulatedCost =
    stats.statsAccCost > 0 ? stats.statsAccCost.toFixed(2) : "0.00";

  const handleAddReading = async (data: ReadingFormData) => {
    await addReading(
      supplyId ?? "",
      data.startDate,
      data.endDate,
      data.peak,
      data.flat,
      data.offPeak,
      data.cost
    );
    setIsAddDialogOpen(false);
  };

  const handleEditReading = async (id: string, data: ReadingFormData) => {
    await updateReading(id, {
      startDate: data.startDate,
      endDate: data.endDate,
      consumptionPeak: data.peak,
      consumptionFlat: data.flat,
      consumptionOffPeak: data.offPeak,
      cost: data.cost,
    });
    setReadingToEdit(null);
  };

  const handleEditSupply = async (data: EditSupplyFormData) => {
    await updateSupply(data);
    setIsEditSupplyDialogOpen(false);
  };

  const confirmDeleteReading = async () => {
    if (readingToDelete) {
      await deleteReading(readingToDelete);
      setReadingToDelete(null);
    }
  };

  const handleLegendMouseEnter = (o: LegendPayload) => {
    const { dataKey } = o;
    setOpacity({
      Punta: dataKey === "Punta" ? 1 : 0.2,
      Llano: dataKey === "Llano" ? 1 : 0.2,
      Valle: dataKey === "Valle" ? 1 : 0.2,
    });
  };

  const handleLegendMouseLeave = () => {
    setOpacity({ Punta: 1, Llano: 1, Valle: 1 });
  };

  return {
    supply,
    datosGenerales,
    sortedReadings,
    paginatedReadings,
    totalPages,
    currentPage,
    setCurrentPage,
    availableYears,
    currentSelectedYear,
    setSelectedYear,
    chartData,
    lastYearChartData,
    opacity,
    handleLegendMouseEnter,
    handleLegendMouseLeave,
    isAddDialogOpen,
    setIsAddDialogOpen,
    readingToEdit,
    setReadingToEdit,
    isEditSupplyDialogOpen,
    setIsEditSupplyDialogOpen,
    readingToDelete,
    setReadingToDelete,
    handleAddReading,
    handleEditReading,
    handleEditSupply,
    confirmDeleteReading,
    statsPeak: stats.statsPeak,
    statsFlat: stats.statsFlat,
    statsOffPeak: stats.statsOffPeak,
    statsTotalKwh,
    dailyAverage,
    accumulatedCost,
  };
}
