import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Plus, Trash2, LineChart, Activity, Info, Pencil } from "lucide-react";
import { useSupply, useReadings } from "@/db/hooks";
import { useTarifasData } from "@/db/use-tarifas";
import type { Reading } from "@/db/db";
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function SupplyDetailPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const { supply, updateSupply } = useSupply(supplyId);
  const { readings, addReading, updateReading, deleteReading } = useReadings(supplyId);

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
      setEditPricePowerOffPeak(supply.currentPricePowerOffPeak?.toString() || "");
      setEditPriceEnergyPeak(supply.currentPriceEnergyPeak?.toString() || "");
      setEditPriceEnergyFlat(supply.currentPriceEnergyFlat?.toString() || "");
      setEditPriceEnergyOffPeak(supply.currentPriceEnergyOffPeak?.toString() || "");
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

  if (supply === undefined) return <div className="p-12 text-center">Cargando...</div>;
  if (supply === null) return <div className="p-12 text-center text-destructive">Suministro no encontrado.</div>;

  const handleAddReading = async () => {
    if (!startDate || !endDate) return;
    await addReading(
      supplyId!, 
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
    if (!readingToEdit || !editRStartDate || !editREndDate) return;
    await updateReading(readingToEdit.id, {
      startDate: editRStartDate,
      endDate: editREndDate,
      consumptionPeak: Number(editRPeak) || 0,
      consumptionFlat: Number(editRFlat) || 0,
      consumptionOffPeak: Number(editROffPeak) || 0,
      cost: editRCost ? Number(editRCost) : undefined
    });
    setReadingToEdit(null);
  };

  const handleEditSupply = async () => {
    if (!editName.trim()) return;
    await updateSupply({
      name: editName,
      contractedPowerPeak: Number(editPowerPeak) || 0,
      contractedPowerOffPeak: Number(editPowerOffPeak) || 0,
      currentPricePowerPeak: editPricePowerPeak ? Number(editPricePowerPeak) : undefined,
      currentPricePowerOffPeak: editPricePowerOffPeak ? Number(editPricePowerOffPeak) : undefined,
      currentPriceEnergyPeak: editPriceEnergyPeak ? Number(editPriceEnergyPeak) : undefined,
      currentPriceEnergyFlat: editPriceEnergyFlat ? Number(editPriceEnergyFlat) : undefined,
      currentPriceEnergyOffPeak: editPriceEnergyOffPeak ? Number(editPriceEnergyOffPeak) : undefined,
    });
    setIsEditDialogOpen(false);
  };

  const sortedReadings = [...(readings || [])].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  
  const totalPages = Math.ceil(sortedReadings.length / ITEMS_PER_PAGE);
  const paginatedReadings = sortedReadings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  // Preparar datos para el gráfico de barras (filtrado por año natural, máx 5 años)
  const availableYears = Array.from(new Set(sortedReadings.map(r => new Date(r.endDate).getFullYear().toString())))
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);
  
  const currentSelectedYear = selectedYear || (availableYears[0] ?? new Date().getFullYear().toString());

  const chartData = [...sortedReadings]
    .filter(r => new Date(r.endDate).getFullYear().toString() === currentSelectedYear)
    .reverse()
    .map(r => ({
      name: new Date(r.endDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      Punta: r.consumptionPeak,
      Llano: r.consumptionFlat,
      Valle: r.consumptionOffPeak,
    }));

  // Preparar datos para el gráfico de líneas (solo último año desde la última lectura)
  const lastYearChartData = (() => {
    if (!sortedReadings.length) return [];
    const lastDate = new Date(sortedReadings[0].endDate).getTime();
    const oneYearAgo = lastDate - (365 * 24 * 60 * 60 * 1000);
    return [...sortedReadings]
      .filter(r => new Date(r.endDate).getTime() >= oneYearAgo)
      .reverse()
      .map(r => ({
        name: new Date(r.endDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        Punta: r.consumptionPeak,
        Llano: r.consumptionFlat,
        Valle: r.consumptionOffPeak,
      }));
  })();

  const handleLegendMouseEnter = (o: any) => {
    const { dataKey } = o;
    // Efecto de opacity como en el ejemplo de recharts (resaltar el hovered, atenuar los demás)
    setOpacity({
      Punta: dataKey === 'Punta' ? 1 : 0.2,
      Llano: dataKey === 'Llano' ? 1 : 0.2,
      Valle: dataKey === 'Valle' ? 1 : 0.2,
    });
  };

  const handleLegendMouseLeave = () => {
    setOpacity({ Punta: 1, Llano: 1, Valle: 1 });
  };

  // Estadísticas agregadas de todas las lecturas
  let statsDays = 0;
  let statsPeak = 0;
  let statsFlat = 0;
  let statsOffPeak = 0;
  let statsAccCost = 0;

  for (const r of sortedReadings) {
    const days = Math.max(1, (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24));
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
      const pwCost = (supply.contractedPowerPeak * (supply.currentPricePowerPeak || 0) + supply.contractedPowerOffPeak * (supply.currentPricePowerOffPeak || 0)) * days;
      const enCost = r.consumptionPeak * (supply.currentPriceEnergyPeak || 0) + r.consumptionFlat * (supply.currentPriceEnergyFlat || 0) + r.consumptionOffPeak * (supply.currentPriceEnergyOffPeak || 0);
      const kWh = r.consumptionPeak + r.consumptionFlat + r.consumptionOffPeak;
      const impuesto = Math.max(kWh * 0.001, (pwCost + enCost) * ie);
      statsAccCost += (pwCost + enCost + impuesto + alq * days) * (1 + iva);
    }
  }
  const statsTotalKwh = statsPeak + statsFlat + statsOffPeak;
  const dailyAverage = statsDays > 0 ? (statsTotalKwh / statsDays).toFixed(1) : "0";
  const accumulatedCost = statsAccCost > 0 ? statsAccCost.toFixed(2) : "0.00";

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <Dialog open={!!readingToDelete} onOpenChange={(open) => !open && setReadingToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Lectura?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer y la lectura desaparecerá de tu historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReadingToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteReading}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver a Suministros
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{supply.name}</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Luz</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Potencias: <strong className="text-foreground">{supply.contractedPowerPeak} kW</strong> Punta / <strong className="text-foreground">{supply.contractedPowerOffPeak} kW</strong> Valle
          </p>
          {supply.currentPriceEnergyPeak !== undefined && (
            <p className="text-muted-foreground text-xs mt-1">
              Precios energía configurados: {supply.currentPriceEnergyPeak}€ / {supply.currentPriceEnergyFlat}€ / {supply.currentPriceEnergyOffPeak}€
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="gap-2 shadow-sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Link to={`/${supplyId}/compare`}>
            <Button variant="secondary" className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
              <Activity className="h-4 w-4" /> Comparar Tarifas
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Añadir Lectura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={(e) => { e.preventDefault(); handleAddReading(); }}>
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
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha Fin</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Punta (kWh)</Label>
                      <Input type="number" value={peak} onChange={e => setPeak(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Llano (kWh)</Label>
                      <Input type="number" value={flat} onChange={e => setFlat(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Valle (kWh)</Label>
                      <Input type="number" value={offPeak} onChange={e => setOffPeak(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2 pt-2 border-t">
                    <Label className="text-xs font-semibold text-indigo-700">Precio Pagado en Factura (€) (Opcional)</Label>
                    <Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="Ej. 45.20" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!readingToEdit} onOpenChange={(open) => !open && setReadingToEdit(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); handleEditReading(); }}>
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
                  <Input type="date" value={editRStartDate} onChange={e => setEditRStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input type="date" value={editREndDate} onChange={e => setEditREndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Punta (kWh)</Label>
                  <Input type="number" value={editRPeak} onChange={e => setEditRPeak(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Llano (kWh)</Label>
                  <Input type="number" value={editRFlat} onChange={e => setEditRFlat(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Valle (kWh)</Label>
                  <Input type="number" value={editROffPeak} onChange={e => setEditROffPeak(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2 pt-2 border-t">
                <Label className="text-xs font-semibold text-indigo-700">Precio Pagado en Factura (€) (Opcional)</Label>
                <Input type="number" step="0.01" value={editRCost} onChange={e => setEditRCost(e.target.value)} placeholder="Ej. 45.20" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReadingToEdit(null)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleEditSupply(); }}>
            <DialogHeader>
              <DialogTitle>Editar Suministro</DialogTitle>
              <DialogDescription>
                Modifica los datos y precios de tu contrato actual.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Nombre / Identificador</Label>
                <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium border-b pb-1">Potencias Contratadas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Punta (kW)</Label>
                    <Input type="number" step="0.1" value={editPowerPeak} onChange={(e) => setEditPowerPeak(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Valle (kW)</Label>
                    <Input type="number" step="0.1" value={editPowerOffPeak} onChange={(e) => setEditPowerOffPeak(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium border-b pb-1 flex items-center justify-between">
                  <span>Precios Actuales (Opcional)</span>
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Para calcular ahorros</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Precio Potencia Punta (€/kW/año)</Label>
                    <Input type="number" step="0.000001" value={editPricePowerPeak} onChange={(e) => setEditPricePowerPeak(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Precio Potencia Valle (€/kW/año)</Label>
                    <Input type="number" step="0.000001" value={editPricePowerOffPeak} onChange={(e) => setEditPricePowerOffPeak(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Energía Punta (€/kWh)</Label>
                    <Input type="number" step="0.000001" value={editPriceEnergyPeak} onChange={(e) => setEditPriceEnergyPeak(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Energía Llana (€/kWh)</Label>
                    <Input type="number" step="0.000001" value={editPriceEnergyFlat} onChange={(e) => setEditPriceEnergyFlat(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Energía Valle (€/kWh)</Label>
                    <Input type="number" step="0.000001" value={editPriceEnergyOffPeak} onChange={(e) => setEditPriceEnergyOffPeak(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {sortedReadings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyAverage} <span className="text-sm font-normal text-muted-foreground">kWh/día</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Distribución de Consumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm mt-1">
                {statsTotalKwh === 0 ? (
                  <span>Sin consumo</span>
                ) : (
                  <div className="w-full">
                    <div className="flex h-2 rounded-full overflow-hidden mb-1">
                      <div style={{ width: `${(statsPeak/statsTotalKwh)*100}%` }} className="bg-red-500" />
                      <div style={{ width: `${(statsFlat/statsTotalKwh)*100}%` }} className="bg-yellow-500" />
                      <div style={{ width: `${(statsOffPeak/statsTotalKwh)*100}%` }} className="bg-green-500" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span><span className="text-red-500 font-bold">P</span> {Math.round((statsPeak/statsTotalKwh)*100)}%</span>
                      <span><span className="text-yellow-500 font-bold">LL</span> {Math.round((statsFlat/statsTotalKwh)*100)}%</span>
                      <span><span className="text-green-500 font-bold">V</span> {Math.round((statsOffPeak/statsTotalKwh)*100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 bg-indigo-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800">Coste Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">
                {accumulatedCost} <span className="text-sm font-normal">€</span>
                <p className="text-[10px] font-normal text-indigo-600/70 mt-1">Suma de reales + estimados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {sortedReadings.length > 0 && (
        <Card className="mb-6 shadow-sm border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="h-5 w-5 text-muted-foreground" />
              Evolución del Consumo (Histórico)
            </CardTitle>
            {availableYears.length > 0 && (
              <div className="flex gap-1 bg-muted/50 p-1 rounded-md overflow-x-auto max-w-[50%]">
                {availableYears.map(year => (
                  <Button 
                    key={year} 
                    variant={currentSelectedYear === year ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <RechartsTooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Punta" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Llano" stackId="a" fill="#eab308" />
                  <Bar dataKey="Valle" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {lastYearChartData.length > 0 && (
        <Card className="mb-6 shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Tendencia del Último Año
            </CardTitle>
            <CardDescription>
              Comparativa de franjas horarias en los últimos 365 días. Pasa el ratón por la leyenda para resaltar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={lastYearChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '12px', cursor: 'pointer' }}
                    onMouseEnter={handleLegendMouseEnter}
                    onMouseLeave={handleLegendMouseLeave}
                  />
                  <Line type="monotone" dataKey="Punta" strokeOpacity={opacity.Punta} stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Llano" strokeOpacity={opacity.Llano} stroke="#eab308" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Valle" strokeOpacity={opacity.Valle} stroke="#22c55e" strokeWidth={3} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Historial de Lecturas</CardTitle>
          <CardDescription>Visualiza el consumo registrado en este suministro.</CardDescription>
        </CardHeader>
        <CardContent>
          {!sortedReadings.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 rounded-lg border border-dashed">
              <Info className="h-8 w-8 text-muted-foreground mb-3 opacity-30" />
              <h3 className="text-sm font-medium">No hay lecturas registradas</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">Añade una factura para empezar a analizar tu consumo y comparar tarifas.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead className="text-right">Punta</TableHead>
                    <TableHead className="text-right">Llano</TableHead>
                    <TableHead className="text-right">Valle</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                    <TableHead className="text-right font-medium text-indigo-700">Coste Real</TableHead>
                    {supply.currentPriceEnergyPeak !== undefined && (
                      <TableHead className="text-right font-medium text-indigo-700/70" title="Calculado con tus precios actuales configurados">Coste Actual Est.</TableHead>
                    )}
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReadings.map(reading => {
                    const total = reading.consumptionPeak + reading.consumptionFlat + reading.consumptionOffPeak;
                    const days = Math.max(1, (new Date(reading.endDate).getTime() - new Date(reading.startDate).getTime()) / (1000 * 60 * 60 * 24));
                    
                    let estimatedCost = null;
                    if (supply.currentPriceEnergyPeak !== undefined) {
                      const iva = datosGenerales?.iva ?? 0.1;
                      const impuestoElectrico = datosGenerales?.impuestoElectrico ?? 0.005;
                      const alquilerContador = datosGenerales?.alquilerContador ?? 0.027;
                      const powerCost = ((supply.contractedPowerPeak * (supply.currentPricePowerPeak || 0)) + (supply.contractedPowerOffPeak * (supply.currentPricePowerOffPeak || 0))) * days;
                      const energyCost = (reading.consumptionPeak * (supply.currentPriceEnergyPeak || 0)) + (reading.consumptionFlat * (supply.currentPriceEnergyFlat || 0)) + (reading.consumptionOffPeak * (supply.currentPriceEnergyOffPeak || 0));
                      const totalKwh = reading.consumptionPeak + reading.consumptionFlat + reading.consumptionOffPeak;
                      const impuestoAmount = Math.max(totalKwh * 0.001, (powerCost + energyCost) * impuestoElectrico);
                      const totalBruto = powerCost + energyCost + impuestoAmount + (alquilerContador * days);
                      estimatedCost = totalBruto * (1 + iva);
                    }

                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium text-sm whitespace-nowrap">
                          {new Date(reading.startDate).toLocaleDateString()} <span className="text-muted-foreground font-normal mx-1">al</span> {new Date(reading.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm">{days}</TableCell>
                        <TableCell className="text-right text-red-600/80 text-sm">{reading.consumptionPeak} <span className="text-xs text-muted-foreground">kWh</span></TableCell>
                        <TableCell className="text-right text-yellow-600/80 text-sm">{reading.consumptionFlat} <span className="text-xs text-muted-foreground">kWh</span></TableCell>
                        <TableCell className="text-right text-green-600/80 text-sm">{reading.consumptionOffPeak} <span className="text-xs text-muted-foreground">kWh</span></TableCell>
                        <TableCell className="text-right font-semibold text-sm">{total} <span className="text-xs text-muted-foreground font-normal">kWh</span></TableCell>
                        
                        <TableCell className="text-right text-sm font-bold text-indigo-900">
                          {reading.cost !== undefined ? `${reading.cost.toFixed(2)}€` : <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                        
                        {supply.currentPriceEnergyPeak !== undefined && (
                          <TableCell className="text-right text-sm font-medium text-indigo-700/60">
                            {estimatedCost !== null ? `${estimatedCost.toFixed(2)}€` : <span className="text-muted-foreground/30">-</span>}
                          </TableCell>
                        )}

                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setReadingToEdit(reading)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setReadingToDelete(reading.id)}>
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
                <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6 bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, sortedReadings.length)}</span> de <span className="font-medium">{sortedReadings.length}</span> lecturas
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Component = SupplyDetailPage;
