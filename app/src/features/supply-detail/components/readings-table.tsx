import { Info, Pencil, Trash2 } from "lucide-react";
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
import type { Reading, Supply } from "@/db/db";
import type { DatosGenerales } from "@/db/use-tarifas";
import { ITEMS_PER_PAGE } from "../use-supply-detail";

interface ReadingsTableProps {
  allReadingsCount: number;
  currentPage: number;
  datosGenerales: DatosGenerales | null;
  onDeleteReading: (id: string) => void;
  onEditReading: (reading: Reading) => void;
  onPageChange: (page: number) => void;
  readings: Reading[];
  supply: Supply;
  totalPages: number;
}

const computeEstimatedCost = (
  reading: Reading,
  supply: Supply,
  datosGenerales: DatosGenerales | null
): number | null => {
  if (supply.currentPriceEnergyPeak === undefined) {
    return null;
  }

  const days = Math.max(
    1,
    (new Date(reading.endDate).getTime() -
      new Date(reading.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const iva = datosGenerales?.iva ?? 0.1;
  const impuestoElectrico = datosGenerales?.impuestoElectrico ?? 0.005;
  const alquilerContador = datosGenerales?.alquilerContador ?? 0.027;
  const powerCost =
    (supply.contractedPowerPeak * (supply.currentPricePowerPeak || 0) +
      supply.contractedPowerOffPeak * (supply.currentPricePowerOffPeak || 0)) *
    days;
  const energyCost =
    reading.consumptionPeak * (supply.currentPriceEnergyPeak || 0) +
    reading.consumptionFlat * (supply.currentPriceEnergyFlat || 0) +
    reading.consumptionOffPeak * (supply.currentPriceEnergyOffPeak || 0);
  const totalKwh =
    reading.consumptionPeak +
    reading.consumptionFlat +
    reading.consumptionOffPeak;
  const impuestoAmount = Math.max(
    totalKwh * 0.001,
    (powerCost + energyCost) * impuestoElectrico
  );
  const totalBruto =
    powerCost + energyCost + impuestoAmount + alquilerContador * days;
  return totalBruto * (1 + iva);
};

export const ReadingsTable = ({
  readings,
  allReadingsCount,
  supply,
  datosGenerales,
  currentPage,
  totalPages,
  onPageChange,
  onEditReading,
  onDeleteReading,
}: ReadingsTableProps) => {
  if (!allReadingsCount) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Historial de Lecturas</CardTitle>
          <CardDescription>
            Visualiza el consumo registrado en este suministro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-10 text-center">
            <Info className="mb-3 h-8 w-8 text-muted-foreground opacity-30" />
            <h3 className="font-medium text-sm">No hay lecturas registradas</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-xs">
              Añade una factura para empezar a analizar tu consumo y comparar
              tarifas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Historial de Lecturas</CardTitle>
        <CardDescription>
          Visualiza el consumo registrado en este suministro.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {readings.map((reading) => {
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
                const estimatedCost = computeEstimatedCost(
                  reading,
                  supply,
                  datosGenerales
                );

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
                      <span className="text-muted-foreground text-xs">kWh</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-yellow-600/80">
                      {reading.consumptionFlat}{" "}
                      <span className="text-muted-foreground text-xs">kWh</span>
                    </TableCell>
                    <TableCell className="text-right text-green-600/80 text-sm">
                      {reading.consumptionOffPeak}{" "}
                      <span className="text-muted-foreground text-xs">kWh</span>
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
                          <span className="text-muted-foreground/30">-</span>
                        ) : (
                          `${estimatedCost.toFixed(2)}€`
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onEditReading(reading)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteReading(reading.id)}
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
                  {Math.min(currentPage * ITEMS_PER_PAGE, allReadingsCount)}
                </span>{" "}
                de <span className="font-medium">{allReadingsCount}</span>{" "}
                lecturas
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  size="sm"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
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
      </CardContent>
    </Card>
  );
};
