import {
  Activity,
  ArrowLeft,
  Info,
  LineChart,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { LegendPayload } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Reading, Supply } from "@/db/db";
import { useReadings, useSupply } from "@/db/hooks";
import type { DatosGenerales } from "@/db/use-tarifas";
import { useTarifasData } from "@/db/use-tarifas";

function computeLastYearChartData(
  sortedReadings: Reading[]
): { name: string; Punta: number; Llano: number; Valle: number }[] {
  if (!sortedReadings.length) {
    return [];
  }
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

interface StatsResult {
  statsAccCost: number;
  statsDays: number;
  statsFlat: number;
  statsOffPeak: number;
  statsPeak: number;
}

function computeStats(
  sortedReadings: Reading[],
  supply: Supply,
  datosGenerales: DatosGenerales | null
): StatsResult {
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

export function SupplyDetailPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const { supply, updateSupply } = useSupply(supplyId);
  const { readings, addReading, updateReading, deleteReading } =
    useReadings(supplyId);

  // Datos generales del JSON de tarifas (IVA, impuesto eléctrico, alquiler contador)
  const { tarifasData } = useTarifasData();
  const datosGenerales = tarifasData?.datosGenerales ?? null;

  // Add Reading state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [peak, setPeak] = useState("");
  const [flat, setFlat] = useState("");
  const [offPeak, setOffPeak] = useState("");
  const [cost, setCost] = useState("");

  // Edit Reading state
  const [readingToEdit, setReadingToEdit] = useState<Reading | null>(null);
  const [editRStartDate, setEditRStartDate] = useState("");
  const [editREndDate, setEditREndDate] = useState("");
  const [editRPeak, setEditRPeak] = useState("");
  const [editRFlat, setEditRFlat] = useState("");
  const [editROffPeak, setEditROffPeak] = useState("");
  const [editRCost, setEditRCost] = useState("");

  // Edit Supply state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPowerPeak, setEditPowerPeak] = useState("");
  const [editPowerOffPeak, setEditPowerOffPeak] = useState("");
  const [editPricePowerPeak, setEditPricePowerPeak] = useState("");
  const [editPricePowerOffPeak, setEditPricePowerOffPeak] = useState("");
  const [editPriceEnergyPeak, setEditPriceEnergyPeak] = useState("");
  const [editPriceEnergyFlat, setEditPriceEnergyFlat] = useState("");
  const [editPriceEnergyOffPeak, setEditPriceEnergyOffPeak] = useState("");

  // Delete Reading state
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);

  // LineChart Legend opacity state
  const [opacity, setOpacity] = useState({
    Punta: 1,
    Llano: 1,
    Valle: 1,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Chart year filter state
  const [selectedYear, setSelectedYear] = useState<string>("");

  const confirmDeleteReading = async () => {
    if (readingToDelete) {
      await deleteReading(readingToDelete);
      setReadingToDelete(null);
    }
  };

  // Update edit supply form when supply loads
  useEffect(() => {
    if (supply && isEditDialogOpen) {
      setEditName(supply.name);
      setEditPowerPeak(supply.contractedPowerPeak.toString());
      setEditPowerOffPeak(supply.contractedPowerOffPeak.toString());
      setEditPricePowerPeak(supply.currentPricePowerPeak?.toString() || "");
      setEditPricePowerOffPeak(
        supply.currentPricePowerOffPeak?.toString() || ""
      );
      setEditPriceEnergyPeak(supply.currentPriceEnergyPeak?.toString() || "");
      setEditPriceEnergyFlat(supply.currentPriceEnergyFlat?.toString() || "");
      setEditPriceEnergyOffPeak(
        supply.currentPriceEnergyOffPeak?.toString() || ""
      );
    }
  }, [supply, isEditDialogOpen]);

  // Pre-fill Edit Reading form
  useEffect(() => {
    if (readingToEdit) {
      setEditRStartDate(readingToEdit.startDate);
      setEditREndDate(readingToEdit.endDate);
      setEditRPeak(readingToEdit.consumptionPeak.toString());
      setEditRFlat(readingToEdit.consumptionFlat.toString());
      setEditROffPeak(readingToEdit.consumptionOffPeak.toString());
      setEditRCost(readingToEdit.cost?.toString() || "");
    }
  }, [readingToEdit]);

  if (supply === undefined) {
    return <div className="p-12 text-center">Cargando...</div>;
  }
  if (supply === null) {
    return (
      <div className="p-12 text-center text-destructive">
        Suministro no encontrado.
      </div>
    );
  }

  const handleAddReading = async () => {
    if (!(startDate && endDate)) {
      return;
    }
    await addReading(
      supplyId ?? "",
      startDate,
      endDate,
      Number(peak) || 0,
      Number(flat) || 0,
      Number(offPeak) || 0,
      cost ? Number(cost) : undefined
    );
    setIsDialogOpen(false);
    setStartDate("");
    setEndDate("");
    setPeak("");
    setFlat("");
    setOffPeak("");
    setCost("");
  };

  const handleEditReading = async () => {
    if (!(readingToEdit && editRStartDate && editREndDate)) {
      return;
    }
    await updateReading(readingToEdit.id, {
      startDate: editRStartDate,
      endDate: editREndDate,
      consumptionPeak: Number(editRPeak) || 0,
      consumptionFlat: Number(editRFlat) || 0,
      consumptionOffPeak: Number(editROffPeak) || 0,
      cost: editRCost ? Number(editRCost) : undefined,
    });
    setReadingToEdit(null);
  };

  const handleEditSupply = async () => {
    if (!editName.trim()) {
      return;
    }
    await updateSupply({
      name: editName,
      contractedPowerPeak: Number(editPowerPeak) || 0,
      contractedPowerOffPeak: Number(editPowerOffPeak) || 0,
      currentPricePowerPeak: editPricePowerPeak
        ? Number(editPricePowerPeak)
        : undefined,
      currentPricePowerOffPeak: editPricePowerOffPeak
        ? Number(editPricePowerOffPeak)
        : undefined,
      currentPriceEnergyPeak: editPriceEnergyPeak
        ? Number(editPriceEnergyPeak)
        : undefined,
      currentPriceEnergyFlat: editPriceEnergyFlat
        ? Number(editPriceEnergyFlat)
        : undefined,
      currentPriceEnergyOffPeak: editPriceEnergyOffPeak
        ? Number(editPriceEnergyOffPeak)
        : undefined,
    });
    setIsEditDialogOpen(false);
  };

  const sortedReadings = [...(readings || [])].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const totalPages = Math.ceil(sortedReadings.length / ITEMS_PER_PAGE);
  const paginatedReadings = sortedReadings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Preparar datos para el gráfico de barras (filtrado por año natural, máx 5 años)
  const availableYears = Array.from(
    new Set(
      sortedReadings.map((r) => new Date(r.endDate).getFullYear().toString())
    )
  )
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);

  const currentSelectedYear =
    selectedYear || (availableYears[0] ?? new Date().getFullYear().toString());

  const chartData = [...sortedReadings]
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

  // Preparar datos para el gráfico de líneas (solo último año desde la última lectura)
  const lastYearChartData = computeLastYearChartData(sortedReadings);

  const handleLegendMouseEnter = (o: LegendPayload) => {
    const { dataKey } = o;
    // Efecto de opacity como en el ejemplo de recharts (resaltar el hovered, atenuar los demás)
    setOpacity({
      Punta: dataKey === "Punta" ? 1 : 0.2,
      Llano: dataKey === "Llano" ? 1 : 0.2,
      Valle: dataKey === "Valle" ? 1 : 0.2,
    });
  };

  const handleLegendMouseLeave = () => {
    setOpacity({ Punta: 1, Llano: 1, Valle: 1 });
  };

  // Estadísticas agregadas de todas las lecturas
  const { statsDays, statsPeak, statsFlat, statsOffPeak, statsAccCost } =
    computeStats(sortedReadings, supply, datosGenerales);
  const statsTotalKwh = statsPeak + statsFlat + statsOffPeak;
  const dailyAverage =
    statsDays > 0 ? (statsTotalKwh / statsDays).toFixed(1) : "0";
  const accumulatedCost = statsAccCost > 0 ? statsAccCost.toFixed(2) : "0.00";

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <Dialog
        onOpenChange={(open) => !open && setReadingToDelete(null)}
        open={!!readingToDelete}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Lectura?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer y la lectura desaparecerá de tu
              historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={() => setReadingToDelete(null)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={confirmDeleteReading} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Link to="/">
          <Button
            className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Suministros
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-3xl tracking-tight">{supply.name}</h1>
            <Badge
              className="border-blue-200 bg-blue-50 text-blue-700"
              variant="outline"
            >
              Luz
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            Potencias:{" "}
            <strong className="text-foreground">
              {supply.contractedPowerPeak} kW
            </strong>{" "}
            Punta /{" "}
            <strong className="text-foreground">
              {supply.contractedPowerOffPeak} kW
            </strong>{" "}
            Valle
          </p>
          {supply.currentPriceEnergyPeak !== undefined && (
            <p className="mt-1 text-muted-foreground text-xs">
              Precios energía configurados: {supply.currentPriceEnergyPeak}€ /{" "}
              {supply.currentPriceEnergyFlat}€ /{" "}
              {supply.currentPriceEnergyOffPeak}€
            </p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
          <Button
            className="gap-2 shadow-sm"
            onClick={() => setIsEditDialogOpen(true)}
            variant="outline"
          >
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Link to={`/${supplyId}/compare`}>
            <Button
              className="gap-2 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              variant="secondary"
            >
              <Activity className="h-4 w-4" /> Comparar Tarifas
            </Button>
          </Link>
          <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Añadir Lectura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddReading();
                }}
              >
                <DialogHeader>
                  <DialogTitle>Añadir Lectura de Consumo</DialogTitle>
                  <DialogDescription>
                    Introduce los datos de tu última factura de luz.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Fecha Inicio</Label>
                      <Input
                        onChange={(e) => setStartDate(e.target.value)}
                        type="date"
                        value={startDate}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha Fin</Label>
                      <Input
                        onChange={(e) => setEndDate(e.target.value)}
                        type="date"
                        value={endDate}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Punta (kWh)</Label>
                      <Input
                        onChange={(e) => setPeak(e.target.value)}
                        type="number"
                        value={peak}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Llano (kWh)</Label>
                      <Input
                        onChange={(e) => setFlat(e.target.value)}
                        type="number"
                        value={flat}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Valle (kWh)</Label>
                      <Input
                        onChange={(e) => setOffPeak(e.target.value)}
                        type="number"
                        value={offPeak}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 border-t pt-2">
                    <Label className="font-semibold text-indigo-700 text-xs">
                      Precio Pagado en Factura (€) (Opcional)
                    </Label>
                    <Input
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="Ej. 45.20"
                      step="0.01"
                      type="number"
                      value={cost}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && setReadingToEdit(null)}
        open={!!readingToEdit}
      >
        <DialogContent className="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditReading();
            }}
          >
            <DialogHeader>
              <DialogTitle>Editar Lectura</DialogTitle>
              <DialogDescription>
                Corrige los datos de esta lectura de consumo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    onChange={(e) => setEditRStartDate(e.target.value)}
                    type="date"
                    value={editRStartDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    onChange={(e) => setEditREndDate(e.target.value)}
                    type="date"
                    value={editREndDate}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Punta (kWh)</Label>
                  <Input
                    onChange={(e) => setEditRPeak(e.target.value)}
                    type="number"
                    value={editRPeak}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Llano (kWh)</Label>
                  <Input
                    onChange={(e) => setEditRFlat(e.target.value)}
                    type="number"
                    value={editRFlat}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Valle (kWh)</Label>
                  <Input
                    onChange={(e) => setEditROffPeak(e.target.value)}
                    type="number"
                    value={editROffPeak}
                  />
                </div>
              </div>
              <div className="grid gap-2 border-t pt-2">
                <Label className="font-semibold text-indigo-700 text-xs">
                  Precio Pagado en Factura (€) (Opcional)
                </Label>
                <Input
                  onChange={(e) => setEditRCost(e.target.value)}
                  placeholder="Ej. 45.20"
                  step="0.01"
                  type="number"
                  value={editRCost}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setReadingToEdit(null)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsEditDialogOpen} open={isEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSupply();
            }}
          >
            <DialogHeader>
              <DialogTitle>Editar Suministro</DialogTitle>
              <DialogDescription>
                Modifica los datos y precios de tu contrato actual.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Nombre / Identificador</Label>
                <Input
                  id="editName"
                  onChange={(e) => setEditName(e.target.value)}
                  value={editName}
                />
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-1 font-medium text-sm">
                  Potencias Contratadas
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Punta (kW)
                    </Label>
                    <Input
                      onChange={(e) => setEditPowerPeak(e.target.value)}
                      step="0.1"
                      type="number"
                      value={editPowerPeak}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Valle (kW)
                    </Label>
                    <Input
                      onChange={(e) => setEditPowerOffPeak(e.target.value)}
                      step="0.1"
                      type="number"
                      value={editPowerOffPeak}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center justify-between border-b pb-1 font-medium text-sm">
                  <span>Precios Actuales (Opcional)</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-normal text-muted-foreground text-xs">
                    Para calcular ahorros
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Precio Potencia Punta (€/kW/año)
                    </Label>
                    <Input
                      onChange={(e) => setEditPricePowerPeak(e.target.value)}
                      step="0.000001"
                      type="number"
                      value={editPricePowerPeak}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Precio Potencia Valle (€/kW/año)
                    </Label>
                    <Input
                      onChange={(e) => setEditPricePowerOffPeak(e.target.value)}
                      step="0.000001"
                      type="number"
                      value={editPricePowerOffPeak}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Energía Punta (€/kWh)
                    </Label>
                    <Input
                      onChange={(e) => setEditPriceEnergyPeak(e.target.value)}
                      step="0.000001"
                      type="number"
                      value={editPriceEnergyPeak}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Energía Llana (€/kWh)
                    </Label>
                    <Input
                      onChange={(e) => setEditPriceEnergyFlat(e.target.value)}
                      step="0.000001"
                      type="number"
                      value={editPriceEnergyFlat}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs">
                      Energía Valle (€/kWh)
                    </Label>
                    <Input
                      onChange={(e) =>
                        setEditPriceEnergyOffPeak(e.target.value)
                      }
                      step="0.000001"
                      type="number"
                      value={editPriceEnergyOffPeak}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsEditDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {sortedReadings.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Promedio Diario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {dailyAverage}{" "}
                <span className="font-normal text-muted-foreground text-sm">
                  kWh/día
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Distribución de Consumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-1 flex items-center gap-2 text-sm">
                {statsTotalKwh === 0 ? (
                  <span>Sin consumo</span>
                ) : (
                  <div className="w-full">
                    <div className="mb-1 flex h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${(statsPeak / statsTotalKwh) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-yellow-500"
                        style={{
                          width: `${(statsFlat / statsTotalKwh) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(statsOffPeak / statsTotalKwh) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>
                        <span className="font-bold text-red-500">P</span>{" "}
                        {Math.round((statsPeak / statsTotalKwh) * 100)}%
                      </span>
                      <span>
                        <span className="font-bold text-yellow-500">LL</span>{" "}
                        {Math.round((statsFlat / statsTotalKwh) * 100)}%
                      </span>
                      <span>
                        <span className="font-bold text-green-500">V</span>{" "}
                        {Math.round((statsOffPeak / statsTotalKwh) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-indigo-50/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-indigo-800 text-sm">
                Coste Acumulado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-indigo-700">
                {accumulatedCost} <span className="font-normal text-sm">€</span>
                <p className="mt-1 font-normal text-[10px] text-indigo-600/70">
                  Suma de reales + estimados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {sortedReadings.length > 0 && (
        <Card className="mb-6 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5 text-muted-foreground" />
              Evolución del Consumo (Histórico)
            </CardTitle>
            {availableYears.length > 0 && (
              <div className="flex max-w-[50%] gap-1 overflow-x-auto rounded-md bg-muted/50 p-1">
                {availableYears.map((year) => (
                  <Button
                    className="h-7 px-2 text-xs"
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    size="sm"
                    variant={
                      currentSelectedYear === year ? "secondary" : "ghost"
                    }
                  >
                    {year}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#eee"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    cursor={{ fill: "#f8f9fa" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="Punta"
                    fill="#ef4444"
                    radius={[0, 0, 4, 4]}
                    stackId="a"
                  />
                  <Bar dataKey="Llano" fill="#eab308" stackId="a" />
                  <Bar
                    dataKey="Valle"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {lastYearChartData.length > 0 && (
        <Card className="mb-6 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-indigo-500" />
              Tendencia del Último Año
            </CardTitle>
            <CardDescription>
              Comparativa de franjas horarias en los últimos 365 días. Pasa el
              ratón por la leyenda para resaltar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <RechartsLineChart
                  data={lastYearChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#eee"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    onMouseEnter={handleLegendMouseEnter}
                    onMouseLeave={handleLegendMouseLeave}
                    wrapperStyle={{ fontSize: "12px", cursor: "pointer" }}
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="Punta"
                    stroke="#ef4444"
                    strokeOpacity={opacity.Punta}
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="Llano"
                    stroke="#eab308"
                    strokeOpacity={opacity.Llano}
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="Valle"
                    stroke="#22c55e"
                    strokeOpacity={opacity.Valle}
                    strokeWidth={3}
                    type="monotone"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Historial de Lecturas</CardTitle>
          <CardDescription>
            Visualiza el consumo registrado en este suministro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedReadings.length ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead className="text-right">Punta</TableHead>
                    <TableHead className="text-right">Llano</TableHead>
                    <TableHead className="text-right">Valle</TableHead>
                    <TableHead className="text-right font-semibold">
                      Total
                    </TableHead>
                    <TableHead className="text-right font-medium text-indigo-700">
                      Coste Real
                    </TableHead>
                    {supply.currentPriceEnergyPeak !== undefined && (
                      <TableHead
                        className="text-right font-medium text-indigo-700/70"
                        title="Calculado con tus precios actuales configurados"
                      >
                        Coste Actual Est.
                      </TableHead>
                    )}
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReadings.map((reading) => {
                    const total =
                      reading.consumptionPeak +
                      reading.consumptionFlat +
                      reading.consumptionOffPeak;
                    const days = Math.max(
                      1,
                      (new Date(reading.endDate).getTime() -
                        new Date(reading.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    let estimatedCost: number | null = null;
                    if (supply.currentPriceEnergyPeak !== undefined) {
                      const iva = datosGenerales?.iva ?? 0.1;
                      const impuestoElectrico =
                        datosGenerales?.impuestoElectrico ?? 0.005;
                      const alquilerContador =
                        datosGenerales?.alquilerContador ?? 0.027;
                      const powerCost =
                        (supply.contractedPowerPeak *
                          (supply.currentPricePowerPeak || 0) +
                          supply.contractedPowerOffPeak *
                            (supply.currentPricePowerOffPeak || 0)) *
                        days;
                      const energyCost =
                        reading.consumptionPeak *
                          (supply.currentPriceEnergyPeak || 0) +
                        reading.consumptionFlat *
                          (supply.currentPriceEnergyFlat || 0) +
                        reading.consumptionOffPeak *
                          (supply.currentPriceEnergyOffPeak || 0);
                      const totalKwh =
                        reading.consumptionPeak +
                        reading.consumptionFlat +
                        reading.consumptionOffPeak;
                      const impuestoAmount = Math.max(
                        totalKwh * 0.001,
                        (powerCost + energyCost) * impuestoElectrico
                      );
                      const totalBruto =
                        powerCost +
                        energyCost +
                        impuestoAmount +
                        alquilerContador * days;
                      estimatedCost = totalBruto * (1 + iva);
                    }

                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="whitespace-nowrap font-medium text-sm">
                          {new Date(reading.startDate).toLocaleDateString()}{" "}
                          <span className="mx-1 font-normal text-muted-foreground">
                            al
                          </span>{" "}
                          {new Date(reading.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {days}
                        </TableCell>
                        <TableCell className="text-right text-red-600/80 text-sm">
                          {reading.consumptionPeak}{" "}
                          <span className="text-muted-foreground text-xs">
                            kWh
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-yellow-600/80">
                          {reading.consumptionFlat}{" "}
                          <span className="text-muted-foreground text-xs">
                            kWh
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-green-600/80 text-sm">
                          {reading.consumptionOffPeak}{" "}
                          <span className="text-muted-foreground text-xs">
                            kWh
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {total}{" "}
                          <span className="font-normal text-muted-foreground text-xs">
                            kWh
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-bold text-indigo-900 text-sm">
                          {reading.cost === undefined ? (
                            <span className="text-muted-foreground/30">-</span>
                          ) : (
                            `${reading.cost.toFixed(2)}€`
                          )}
                        </TableCell>

                        {supply.currentPriceEnergyPeak !== undefined && (
                          <TableCell className="text-right font-medium text-indigo-700/60 text-sm">
                            {estimatedCost === null ? (
                              <span className="text-muted-foreground/30">
                                -
                              </span>
                            ) : (
                              `${estimatedCost.toFixed(2)}€`
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setReadingToEdit(reading)}
                              size="icon"
                              variant="ghost"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setReadingToDelete(reading.id)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 sm:px-6">
                  <p className="text-muted-foreground text-sm">
                    Mostrando{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    a{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        sortedReadings.length
                      )}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium">{sortedReadings.length}</span>{" "}
                    lecturas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      size="sm"
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      size="sm"
                      variant="outline"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-10 text-center">
              <Info className="mb-3 h-8 w-8 text-muted-foreground opacity-30" />
              <h3 className="font-medium text-sm">
                No hay lecturas registradas
              </h3>
              <p className="mt-1 max-w-sm text-muted-foreground text-xs">
                Añade una factura para empezar a analizar tu consumo y comparar
                tarifas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Component = SupplyDetailPage;
