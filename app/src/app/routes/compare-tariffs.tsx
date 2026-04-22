import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Trophy,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReadings, useSupply } from "@/db/hooks";
import type { TarifaDetalles } from "@/db/use-tarifas";
import { useTarifasData } from "@/db/use-tarifas";

function calculateSavings(
  currentSimulated: number | undefined,
  realCost: number | undefined,
  newSimulated: number
): number | undefined {
  if (currentSimulated !== undefined) {
    return Number((currentSimulated - newSimulated).toFixed(2));
  }
  if (realCost === undefined) {
    return undefined;
  }
  return Number((realCost - newSimulated).toFixed(2));
}

function calculateInvoiceCost(
  reading: {
    consumptionPeak: number;
    consumptionFlat: number;
    consumptionOffPeak: number;
  },
  prices: {
    peakPower: number;
    offPeakPower: number;
    peakEnergy: number;
    flatEnergy: number;
    offPeakEnergy: number;
  },
  billedDays: number,
  contractedPowerPeak: number,
  contractedPowerOffPeak: number,
  iva: number,
  impuestoElectrico: number,
  alquilerContador: number,
  bonoSocial: number,
  incluyeBonoSocial = true
): number {
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
}

function calculateFirstYearTotal(
  d: TarifaDetalles,
  estimatedAnnualTotal: number
): number | undefined {
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
}

function InvoiceRow({ invoice: inv }: { invoice: InvoiceSimulation }) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-xs">
        {new Date(inv.startDate).toLocaleDateString()} al{" "}
        {new Date(inv.endDate).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right font-medium text-xs">
        {inv.realAmount === undefined ? (
          <span className="text-muted-foreground/40">-</span>
        ) : (
          `${inv.realAmount.toFixed(2)}€`
        )}
      </TableCell>
      <TableCell className="text-right font-medium text-muted-foreground text-xs">
        {inv.currentSimulated === undefined ? (
          <span className="text-muted-foreground/40">-</span>
        ) : (
          `${inv.currentSimulated.toFixed(2)}€`
        )}
      </TableCell>
      <TableCell className="text-right font-bold text-indigo-700 text-xs">
        {inv.newSimulated.toFixed(2)}€
      </TableCell>
      <TableCell className="text-right text-xs">
        {inv.savings === undefined ? (
          <span className="text-muted-foreground/40">-</span>
        ) : (
          <span
            className={`font-semibold bg-${inv.savings > 0 ? "green" : "red"}-100 text-${inv.savings > 0 ? "green" : "red"}-800 rounded-full px-2 py-0.5`}
          >
            {inv.savings > 0 ? "+" : ""}
            {inv.savings.toFixed(2)}€
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

interface TariffRowProps {
  comparison: TariffComparison;
  expandedRow: number | null;
  index: number;
  onToggle: () => void;
  showSavings: boolean;
}

function TariffRow({
  comparison: c,
  expandedRow,
  index: i,
  onToggle,
  showSavings,
}: TariffRowProps) {
  return (
    <>
      <TableRow
        className={`cursor-pointer transition-colors ${
          i === 0 ? "bg-green-50/50 hover:bg-green-50/80" : "hover:bg-muted/50"
        }`}
        onClick={onToggle}
      >
        <TableCell className="text-center font-medium text-muted-foreground">
          {i + 1}
        </TableCell>
        <TableCell>
          <div className="font-semibold text-foreground/90">{c.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-foreground/80 text-sm">
            {c.tariffName}
            {c.details.mantenimientoPrecio === 3 && (
              <Badge
                className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                variant="outline"
              >
                Trimestral
              </Badge>
            )}
            {c.details.mantenimientoPrecio === 12 && (
              <Badge
                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                variant="outline"
              >
                Anual
              </Badge>
            )}
            {c.details.descuento && (
              <Badge
                className="border-purple-200 bg-purple-50 text-[10px] text-purple-700"
                variant="outline"
              >
                {c.details.descuento.tipo === "porcentaje"
                  ? `-${c.details.descuento.valor}%`
                  : `-${c.details.descuento.valor}€`}
                {c.details.descuento.meses
                  ? ` / ${c.details.descuento.meses}m`
                  : ""}
                {c.details.descuento.soloNuevosClientes ? " ★nuevos" : ""}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden text-center sm:table-cell">
          <div className="flex flex-col items-center gap-1">
            <span className="rounded bg-muted px-2 py-0.5 font-semibold text-foreground/90 text-xs">
              P: {c.details.potenciaPunta} / {c.details.potenciaValle}
            </span>
            <span className="text-muted-foreground text-xs">
              E: {c.details.energiaPunta} / {c.details.energiaLlana} /{""}{" "}
              {c.details.energiaValle}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="font-semibold text-foreground">
            {c.estimatedAnnualTotal.toFixed(2)}€
          </div>
          {c.firstYearTotal !== undefined && (
            <div className="mt-0.5 font-medium text-[11px] text-purple-600">
              1er año: {c.firstYearTotal.toFixed(2)}€
            </div>
          )}
        </TableCell>
        {showSavings && c.savings !== undefined && (
          <TableCell className="text-right">
            <span
              className={`font-bold text-base ${
                c.savings > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {c.savings > 0 ? "+" : ""}
              {c.savings.toFixed(2)}€
            </span>
          </TableCell>
        )}
        <TableCell className="text-right text-muted-foreground">
          {expandedRow === i ? (
            <ChevronUp className="ml-auto h-4 w-4" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" />
          )}
        </TableCell>
      </TableRow>
      {expandedRow === i && (
        <TableRow className="border-b bg-slate-50">
          <TableCell className="p-0" colSpan={9}>
            <div className="inner-shadow px-6 py-6">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-indigo-900">
                <Zap className="h-4 w-4" /> Simulación factura a factura
              </h4>
              <div className="overflow-hidden rounded-md border bg-white">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs">
                        Periodo de Facturación
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Importe Pagado
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Tu Tarifa
                      </TableHead>
                      <TableHead className="text-right font-semibold text-indigo-700 text-xs">
                        Nueva Tarifa
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Ahorro en el Periodo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.invoices.map((inv: InvoiceSimulation) => (
                      <InvoiceRow invoice={inv} key={inv.startDate} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface InvoiceSimulation {
  currentSimulated?: number;
  endDate: string;
  newSimulated: number;
  realAmount?: number;
  savings?: number;
  startDate: string;
}

interface TariffComparison {
  details: TarifaDetalles;
  estimatedAnnualTotal: number;
  firstYearTotal?: number;
  invoices: InvoiceSimulation[];
  name: string;
  savings?: number;
  tariffName: string;
}

export function CompareTariffsPage() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const { supply } = useSupply(supplyId);
  const { readings } = useReadings(supplyId);

  const { tarifasData, isLoading: isLoadingTariffs, error } = useTarifasData();

  // Solo lecturas del último año (desde la última lectura), igual que Finper
  const lastYearReadings = useMemo(() => {
    if (!readings || readings.length === 0) {
      return [];
    }
    const sorted = [...readings].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
    const lastEndDate = new Date(sorted[0].endDate).getTime();
    const oneYearAgo = lastEndDate - 365 * 24 * 60 * 60 * 1000;
    return sorted.filter((r) => new Date(r.startDate).getTime() >= oneYearAgo);
  }, [readings]);

  // Consumo anual estimado (solo para mostrar en la card resumen)
  const annualEstimate = useMemo(() => {
    if (!(lastYearReadings.length && supply)) {
      return null;
    }
    let peakkWh = 0,
      flatkWh = 0,
      offPeakkWh = 0;
    for (const r of lastYearReadings) {
      peakkWh += r.consumptionPeak;
      flatkWh += r.consumptionFlat;
      offPeakkWh += r.consumptionOffPeak;
    }
    return { peakkWh, flatkWh, offPeakkWh };
  }, [lastYearReadings, supply]);

  const comparisons = useMemo(() => {
    if (!(lastYearReadings.length && tarifasData && supply)) {
      return [];
    }

    const { iva, impuestoElectrico, alquilerContador, bonoSocial } =
      tarifasData.datosGenerales;

    const hasCurrentPrices =
      supply.currentPriceEnergyPeak !== undefined &&
      supply.currentPricePowerPeak !== undefined;

    const currentPrices = hasCurrentPrices
      ? {
          peakPower: supply.currentPricePowerPeak ?? 0,
          offPeakPower: supply.currentPricePowerOffPeak ?? 0,
          peakEnergy: supply.currentPriceEnergyPeak ?? 0,
          flatEnergy: supply.currentPriceEnergyFlat ?? 0,
          offPeakEnergy: supply.currentPriceEnergyOffPeak ?? 0,
        }
      : null;

    return tarifasData.tarifas
      .map((t) => {
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
        const invoices = lastYearReadings
          .map((r) => {
            const billedDays = Math.max(
              1,
              (new Date(r.endDate).getTime() -
                new Date(r.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const newSimulated = Number(
              calculateInvoiceCost(
                r,
                newPrices,
                billedDays,
                supply.contractedPowerPeak,
                supply.contractedPowerOffPeak,
                iva,
                impuestoElectrico,
                alquilerContador,
                bonoSocial,
                incluyeBS
              ).toFixed(2)
            );
            const currentSimulated = currentPrices
              ? Number(
                  calculateInvoiceCost(
                    r,
                    currentPrices,
                    billedDays,
                    supply.contractedPowerPeak,
                    supply.contractedPowerOffPeak,
                    iva,
                    impuestoElectrico,
                    alquilerContador,
                    bonoSocial,
                    incluyeBS
                  ).toFixed(2)
                )
              : undefined;
            return {
              startDate: r.startDate,
              endDate: r.endDate,
              realAmount: r.cost,
              currentSimulated,
              newSimulated,
              savings: calculateSavings(currentSimulated, r.cost, newSimulated),
            };
          })
          .sort(
            (a, b) =>
              new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );

        // Total anual = suma real de las facturas del último año (igual que Finper)
        const estimatedAnnualTotal = Number(
          invoices.reduce((sum, inv) => sum + inv.newSimulated, 0).toFixed(2)
        );
        const currentAnnualTotal = hasCurrentPrices
          ? invoices.reduce((sum, inv) => sum + (inv.currentSimulated ?? 0), 0)
          : undefined;
        const savings =
          currentAnnualTotal === undefined
            ? undefined
            : Number((currentAnnualTotal - estimatedAnnualTotal).toFixed(2));

        // Coste del primer año aplicando el descuento inicial (si existe)
        const firstYearTotal = calculateFirstYearTotal(d, estimatedAnnualTotal);

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
      })
      .sort((a: TariffComparison, b: TariffComparison) => {
        if (a.savings !== undefined && b.savings !== undefined) {
          return b.savings - a.savings;
        }
        return a.estimatedAnnualTotal - b.estimatedAnnualTotal;
      });
  }, [lastYearReadings, tarifasData, supply]);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (supply === undefined) {
    return <div className="p-12 text-center">Cargando suministro...</div>;
  }
  if (supply === null) {
    return (
      <div className="p-12 text-center text-destructive">
        Suministro no encontrado.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link to={`/${supplyId}`}>
          <Button
            className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Suministro
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">
          Comparativa de Tarifas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Analizando las mejores opciones para{" "}
          <strong className="text-foreground">{supply.name}</strong>
        </p>
      </div>

      {isLoadingTariffs ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <h3 className="font-semibold text-lg">
              Descargando tarifas actualizadas...
            </h3>
          </CardContent>
        </Card>
      ) : null}
      {!isLoadingTariffs && Boolean(error) && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="font-semibold text-destructive text-lg">{error}</h3>
          </CardContent>
        </Card>
      )}
      {!(isLoadingTariffs || error) && annualEstimate && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-indigo-100 bg-linear-to-br from-indigo-50 to-white shadow-sm md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-medium text-indigo-800 text-sm">
                  <Zap className="h-4 w-4" /> Consumo Último Año
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Punta
                    </span>
                    <span className="font-medium">
                      {Math.round(annualEstimate.peakkWh)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />{" "}
                      Llano
                    </span>
                    <span className="font-medium">
                      {Math.round(annualEstimate.flatkWh)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-green-500" />{" "}
                      Valle
                    </span>
                    <span className="font-medium">
                      {Math.round(annualEstimate.offPeakkWh)} kWh
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between border-t pt-3 font-bold text-base text-indigo-900">
                    <span>Total</span>
                    <span>
                      {Math.round(
                        annualEstimate.peakkWh +
                          annualEstimate.flatkWh +
                          annualEstimate.offPeakkWh
                      )}{" "}
                      kWh
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {comparisons.length > 0 && (
              <Card className="relative overflow-hidden border-green-200 bg-linear-to-r from-green-50 to-white shadow-sm md:col-span-2">
                <div className="absolute -top-4 -right-4 text-green-600 opacity-10">
                  <Trophy className="h-32 w-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-medium text-green-800 text-sm">
                    <Trophy className="h-4 w-4" /> Mejor Opción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative z-10 flex h-full items-end justify-between">
                    <div>
                      <h2 className="font-bold text-3xl text-green-900">
                        {comparisons[0].name}
                      </h2>
                      <p className="font-medium text-green-700">
                        {comparisons[0].tariffName}
                      </p>

                      {comparisons[0].savings !== undefined &&
                        comparisons[0].savings > 0 && (
                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-800 text-sm">
                            <ArrowDownCircle className="h-4 w-4" /> Ahorras{" "}
                            {comparisons[0].savings.toFixed(2)}€ al año
                          </div>
                        )}
                      {comparisons[0].savings !== undefined &&
                        comparisons[0].savings < 0 && (
                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 font-semibold text-red-800 text-sm">
                            <ArrowUpCircle className="h-4 w-4" /> Pierdes{" "}
                            {Math.abs(comparisons[0].savings).toFixed(2)}€ al
                            año
                          </div>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-5xl text-green-600 tracking-tight">
                        {comparisons[0].estimatedAnnualTotal.toFixed(2)}
                        <span className="font-bold text-2xl">€</span>
                      </p>
                      <p className="mt-1 font-medium text-green-700/80 text-xs uppercase tracking-wider">
                        / Año (IVA inc.)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Ranking de Tarifas</CardTitle>
              <CardDescription>
                Ordenadas de menor a mayor coste estimado anual. Pulsa sobre
                cualquier tarifa para ver la simulación factura a factura.
                (Datos de {tarifasData?.datosGenerales?.actualizadoEn})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Comercializadora / Tarifa</TableHead>
                    <TableHead className="hidden text-center sm:table-cell">
                      Precios
                    </TableHead>
                    <TableHead className="text-right">Coste Anual</TableHead>
                    {supply.currentPriceEnergyPeak !== undefined && (
                      <TableHead className="text-right font-medium">
                        Ahorro Anual
                      </TableHead>
                    )}
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.map((c: TariffComparison, i: number) => (
                    <TariffRow
                      comparison={c}
                      expandedRow={expandedRow}
                      index={i}
                      key={`${c.name}-${c.tariffName}`}
                      onToggle={() =>
                        setExpandedRow(expandedRow === i ? null : i)
                      }
                      showSavings={supply.currentPriceEnergyPeak !== undefined}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
      {!(isLoadingTariffs || error || annualEstimate) && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="font-semibold text-lg">Faltan datos de consumo</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              Necesitamos al menos una lectura de consumo para poder estimar tu
              gasto anual y compararlo con el mercado.
            </p>
            <Link className="mt-4" to={`/${supplyId}`}>
              <Button>Añadir Lectura</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const Component = CompareTariffsPage;
