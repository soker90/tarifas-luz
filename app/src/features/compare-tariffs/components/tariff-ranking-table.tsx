import { useState } from "react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TariffComparison } from "../types";
import { TariffRow } from "./tariff-row";

interface TariffRankingTableProps {
  comparisons: TariffComparison[];
  showSavings: boolean;
  updatedAt?: string;
}

export const TariffRankingTable = ({
  comparisons,
  showSavings,
  updatedAt,
}: TariffRankingTableProps) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleToggle = (i: number) =>
    setExpandedRow(expandedRow === i ? null : i);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Ranking de Tarifas</CardTitle>
        <CardDescription>
          Ordenadas de menor a mayor coste estimado anual. Pulsa sobre cualquier
          tarifa para ver la simulación factura a factura.
          {updatedAt && ` (Datos de ${updatedAt})`}
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
              {showSavings && (
                <TableHead className="text-right font-medium">
                  Ahorro Anual
                </TableHead>
              )}
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((c, i) => (
              <TariffRow
                comparison={c}
                expandedRow={expandedRow}
                index={i}
                key={`${c.name}-${c.tariffName}`}
                onToggle={() => handleToggle(i)}
                showSavings={showSavings}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
