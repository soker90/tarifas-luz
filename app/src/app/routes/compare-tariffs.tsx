import { useMemo, useState, Fragment } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Trophy, Zap, Info, Loader2, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useSupply, useReadings } from "@/db/hooks";
import { useTarifasData } from "@/db/use-tarifas";
import type { TarifaDetalles } from "@/db/use-tarifas";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InvoiceSimulation {
  startDate: string;
  endDate: string;
  realAmount?: number;
  currentSimulated?: number;
  newSimulated: number;
  savings?: number;
}

interface TariffComparison {
  name: string;
  tariffName: string;
  estimatedAnnualTotal: number;
  firstYearTotal?: number;
  savings?: number;
  details: TarifaDetalles;
  invoices: InvoiceSimulation[];
}

export function CompareTariffsPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const { supply } = useSupply(supplyId);
  const { readings } = useReadings(supplyId);

  const { tarifasData, isLoading: isLoadingTariffs, error } = useTarifasData();

  // Solo lecturas del último año (desde la última lectura), igual que Finper
  const lastYearReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const sorted = [...readings].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    const lastEndDate = new Date(sorted[0].endDate).getTime();
    const oneYearAgo = lastEndDate - 365 * 24 * 60 * 60 * 1000;
    return sorted.filter(r => new Date(r.startDate).getTime() >= oneYearAgo);
  }, [readings]);

  // Consumo anual estimado (solo para mostrar en la card resumen)
  const annualEstimate = useMemo(() => {
    if (!lastYearReadings.length || !supply) return null;
    let peakkWh = 0, flatkWh = 0, offPeakkWh = 0;
    lastYearReadings.forEach(r => {
      peakkWh += r.consumptionPeak;
      flatkWh += r.consumptionFlat;
      offPeakkWh += r.consumptionOffPeak;
    });
    return { peakkWh, flatkWh, offPeakkWh };
  }, [lastYearReadings, supply]);

  const comparisons = useMemo(() => {
    if (!lastYearReadings.length || !tarifasData || !supply) return [];

    const { iva, impuestoElectrico, alquilerContador, bonoSocial } = tarifasData.datosGenerales;

    const hasCurrentPrices =
      supply.currentPriceEnergyPeak !== undefined &&
      supply.currentPricePowerPeak !== undefined;

    // Fórmula exacta del Excel:
    // ImpEléctrico = MAX(totalKWh × 0.001, (potencia + energía) × IEact)
    // TotalBruto = potencia + energía + impEléctrico + alquilerContador [+ bonoSocial si aplica]
    // Total = TotalBruto × (1 + IVA)
    const calculateInvoiceCost = (
      reading: { consumptionPeak: number; consumptionFlat: number; consumptionOffPeak: number },
      prices: { peakPower: number; offPeakPower: number; peakEnergy: number; flatEnergy: number; offPeakEnergy: number },
      billedDays: number,
      incluyeBonoSocial: boolean = true
    ) => {
      const powerCost = ((supply.contractedPowerPeak * prices.peakPower) + (supply.contractedPowerOffPeak * prices.offPeakPower)) * billedDays;
      const energyCost = ((reading.consumptionPeak || 0) * prices.peakEnergy) + ((reading.consumptionFlat || 0) * prices.flatEnergy) + ((reading.consumptionOffPeak || 0) * prices.offPeakEnergy);
      const totalKwh = (reading.consumptionPeak || 0) + (reading.consumptionFlat || 0) + (reading.consumptionOffPeak || 0);
      const impuestoElectricoAmount = Math.max(totalKwh * 0.001, (powerCost + energyCost) * impuestoElectrico);
      const bonoSocialAmount = incluyeBonoSocial ? bonoSocial * billedDays : 0;
      const totalBruto = powerCost + energyCost + impuestoElectricoAmount + (alquilerContador * billedDays) + bonoSocialAmount;
      return totalBruto * (1 + iva);
    };

    const currentPrices = hasCurrentPrices ? {
      peakPower: supply.currentPricePowerPeak!,
      offPeakPower: supply.currentPricePowerOffPeak!,
      peakEnergy: supply.currentPriceEnergyPeak!,
      flatEnergy: supply.currentPriceEnergyFlat!,
      offPeakEnergy: supply.currentPriceEnergyOffPeak!,
    } : null;

    return tarifasData.tarifas.map((t) => {
      const d = t.detalles;
      const newPrices = {
        peakPower: d.potenciaPunta || 0,
        offPeakPower: d.potenciaValle || 0,
        peakEnergy: d.energiaPunta || 0,
        flatEnergy: d.energiaLlana || 0,
        offPeakEnergy: d.energiaValle || 0,
      };

      // Simular cada factura igual que Finper
      const incluyeBS = d.incluyeBonoSocial !== false; // true por defecto si no está definido
      const invoices = lastYearReadings.map(r => {
        const billedDays = Math.max(1, (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24));
        const newSimulated = Number(calculateInvoiceCost(r, newPrices, billedDays, incluyeBS).toFixed(2));
        const currentSimulated = currentPrices ? Number(calculateInvoiceCost(r, currentPrices, billedDays, incluyeBS).toFixed(2)) : undefined;
        return {
          startDate: r.startDate,
          endDate: r.endDate,
          realAmount: r.cost,
          currentSimulated,
          newSimulated,
          savings: currentSimulated !== undefined ? Number((currentSimulated - newSimulated).toFixed(2)) : (r.cost !== undefined ? Number((r.cost - newSimulated).toFixed(2)) : undefined),
        };
      }).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

      // Total anual = suma real de las facturas del último año (igual que Finper)
      const estimatedAnnualTotal = Number(invoices.reduce((sum, inv) => sum + inv.newSimulated, 0).toFixed(2));
      const currentAnnualTotal = hasCurrentPrices
        ? invoices.reduce((sum, inv) => sum + (inv.currentSimulated ?? 0), 0)
        : undefined;
      const savings = currentAnnualTotal !== undefined ? Number((currentAnnualTotal - estimatedAnnualTotal).toFixed(2)) : undefined;

      // Coste del primer año aplicando el descuento inicial (si existe)
      let firstYearTotal: number | undefined = undefined;
      const desc = d.descuento;
      if (desc && desc.meses) { // solo calcular si hay duración definida
        const mantenimiento = d.mantenimientoPrecio || 12;
        if (desc.tipo === 'porcentaje') {
          // Descuento % sobre la parte proporcional del año
          const descuentoEuros = estimatedAnnualTotal * (desc.meses / 12) * (desc.valor / 100);
          firstYearTotal = Number((estimatedAnnualTotal - descuentoEuros).toFixed(2));
        } else {
          // Descuento fijo en € por periodo de facturación durante N meses
          const numPeriodos = desc.meses / mantenimiento;
          firstYearTotal = Number((estimatedAnnualTotal - desc.valor * numPeriodos).toFixed(2));
        }
      }

      return {
        name: t.comercializadora,
        tariffName: d.nombreTarifa,
        estimatedAnnualTotal,
        firstYearTotal,
        savings,
        details: d,
        invoices,
      };
    // Ordenar por ahorro descendente (mayor ahorro primero), igual que Finper
    }).sort((a: TariffComparison, b: TariffComparison) => {
      if (a.savings !== undefined && b.savings !== undefined) return b.savings - a.savings;
      return a.estimatedAnnualTotal - b.estimatedAnnualTotal;
    });
  }, [lastYearReadings, tarifasData, supply]);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (supply === undefined) return <div className="p-12 text-center">Cargando suministro...</div>;
  if (supply === null) return <div className="p-12 text-center text-destructive">Suministro no encontrado.</div>;

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link to={`/${supplyId}`}>
          <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al Suministro
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Comparativa de Tarifas</h1>
        <p className="text-muted-foreground mt-1">
          Analizando las mejores opciones para <strong className="text-foreground">{supply.name}</strong>
        </p>
      </div>

      {isLoadingTariffs ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Descargando tarifas actualizadas...</h3>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive">{error}</h3>
          </CardContent>
        </Card>
      ) : !annualEstimate ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Faltan datos de consumo</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Necesitamos al menos una lectura de consumo para poder estimar tu gasto anual y compararlo con el mercado.
            </p>
            <Link to={`/${supplyId}`} className="mt-4">
              <Button>Añadir Lectura</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 bg-linear-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Consumo Último Año
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Punta
                    </span>
                    <span className="font-medium">{Math.round(annualEstimate.peakkWh)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Llano
                    </span>
                    <span className="font-medium">{Math.round(annualEstimate.flatkWh)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Valle
                    </span>
                    <span className="font-medium">{Math.round(annualEstimate.offPeakkWh)} kWh</span>
                  </div>
                  <div className="pt-3 mt-3 border-t flex justify-between font-bold text-indigo-900 text-base">
                    <span>Total</span>
                    <span>{Math.round(annualEstimate.peakkWh + annualEstimate.flatkWh + annualEstimate.offPeakkWh)} kWh</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {comparisons.length > 0 && (
              <Card className="md:col-span-2 border-green-200 bg-linear-to-r from-green-50 to-white shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10 text-green-600">
                  <Trophy className="h-32 w-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Mejor Opción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between relative z-10 h-full">
                    <div>
                      <h2 className="text-3xl font-bold text-green-900">{comparisons[0].name}</h2>
                      <p className="text-green-700 font-medium">{comparisons[0].tariffName}</p>
                      
                      {comparisons[0].savings !== undefined && comparisons[0].savings > 0 && (
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                          <ArrowDownCircle className="h-4 w-4" /> Ahorras {comparisons[0].savings.toFixed(2)}€ al año
                        </div>
                      )}
                      {comparisons[0].savings !== undefined && comparisons[0].savings < 0 && (
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                          <ArrowUpCircle className="h-4 w-4" /> Pierdes {Math.abs(comparisons[0].savings).toFixed(2)}€ al año
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-black text-green-600 tracking-tight">
                        {comparisons[0].estimatedAnnualTotal.toFixed(2)}<span className="text-2xl font-bold">€</span>
                      </p>
                      <p className="text-xs font-medium text-green-700/80 mt-1 uppercase tracking-wider">/ Año (IVA inc.)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Ranking de Tarifas</CardTitle>
              <CardDescription>
                Ordenadas de menor a mayor coste estimado anual. Pulsa sobre cualquier tarifa para ver la simulación factura a factura. (Datos de {tarifasData?.datosGenerales?.actualizadoEn})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Comercializadora / Tarifa</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Precios</TableHead>
                    <TableHead className="text-right">Coste Anual</TableHead>
                    {supply.currentPriceEnergyPeak !== undefined && (
                      <TableHead className="text-right font-medium">Ahorro Anual</TableHead>
                    )}
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.map((c: TariffComparison, i: number) => (
                    <Fragment key={i}>
                      <TableRow 
                        className={`cursor-pointer transition-colors ${i === 0 ? "bg-green-50/50 hover:bg-green-50/80" : "hover:bg-muted/50"}`}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      >
                        <TableCell className="text-center font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground/90">{c.name}</div>
                          <div className="text-foreground/80 text-sm mt-0.5 flex flex-wrap items-center gap-2">
                            {c.tariffName}
                            {c.details.mantenimientoPrecio === 3 ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Trimestral</Badge>
                            ) : c.details.mantenimientoPrecio === 12 ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Anual</Badge>
                            ) : null}
                            {c.details.descuento && (
                              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                {c.details.descuento.tipo === 'porcentaje'
                                  ? `-${c.details.descuento.valor}%`
                                  : `-${c.details.descuento.valor}€`}
                                {c.details.descuento.meses ? ` / ${c.details.descuento.meses}m` : ''}
                                {c.details.descuento.soloNuevosClientes ? ' ★nuevos' : ''}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold text-foreground/90">
                              P: {c.details.potenciaPunta} / {c.details.potenciaValle}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              E: {c.details.energiaPunta} / {c.details.energiaLlana} / {c.details.energiaValle}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="font-semibold text-foreground">{c.estimatedAnnualTotal.toFixed(2)}€</div>
                          {c.firstYearTotal !== undefined && (
                            <div className="text-[11px] text-purple-600 font-medium mt-0.5">
                              1er año: {c.firstYearTotal.toFixed(2)}€
                            </div>
                          )}
                        </TableCell>

                        {c.savings !== undefined && (
                          <TableCell className="text-right">
                            <span className={`font-bold text-base ${c.savings > 0 ? "text-green-600" : "text-red-600"}`}>
                              {c.savings > 0 ? "+" : ""}{c.savings.toFixed(2)}€
                            </span>
                          </TableCell>
                        )}

                        <TableCell className="text-right text-muted-foreground">
                          {expandedRow === i ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </TableCell>
                      </TableRow>
                      
                      {expandedRow === i && (
                        <TableRow className="bg-slate-50 border-b">
                          <TableCell colSpan={9} className="p-0">
                            <div className="px-6 py-6 inner-shadow">
                              <h4 className="font-semibold mb-3 text-indigo-900 flex items-center gap-2">
                                <Zap className="h-4 w-4" /> Simulación factura a factura
                              </h4>
                              <div className="rounded-md border bg-white overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-muted/30">
                                    <TableRow>
                                      <TableHead className="text-xs">Periodo de Facturación</TableHead>
                                      <TableHead className="text-right text-xs">Importe Pagado</TableHead>
                                      <TableHead className="text-right text-xs">Tu Tarifa</TableHead>
                                      <TableHead className="text-right text-xs font-semibold text-indigo-700">Nueva Tarifa</TableHead>
                                      <TableHead className="text-right text-xs">Ahorro en el Periodo</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {c.invoices.map((inv: InvoiceSimulation, j: number) => (
                                      <TableRow key={j}>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {new Date(inv.startDate).toLocaleDateString()} al {new Date(inv.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-medium">
                                          {inv.realAmount !== undefined ? `${inv.realAmount.toFixed(2)}€` : <span className="text-muted-foreground/40">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-medium text-muted-foreground">
                                          {inv.currentSimulated !== undefined ? `${inv.currentSimulated.toFixed(2)}€` : <span className="text-muted-foreground/40">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-indigo-700">
                                          {inv.newSimulated.toFixed(2)}€
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                          {inv.savings !== undefined ? (
                                            <span className={`font-semibold bg-${inv.savings > 0 ? "green" : "red"}-100 text-${inv.savings > 0 ? "green" : "red"}-800 px-2 py-0.5 rounded-full`}>
                                              {inv.savings > 0 ? "+" : ""}{inv.savings.toFixed(2)}€
                                            </span>
                                          ) : <span className="text-muted-foreground/40">-</span>}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export const Component = CompareTariffsPage;
