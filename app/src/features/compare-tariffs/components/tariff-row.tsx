import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { TariffComparison } from "../types";
import { InvoiceTable } from "./invoice-table";

interface TariffRowProps {
  comparison: TariffComparison;
  expandedRow: number | null;
  index: number;
  onToggle: () => void;
  showSavings: boolean;
}

export const TariffRow = ({
  comparison: c,
  expandedRow,
  index: i,
  onToggle,
  showSavings,
}: TariffRowProps) => (
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
            E: {c.details.energiaPunta} / {c.details.energiaLlana} /{" "}
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
            <InvoiceTable invoices={c.invoices} />
          </div>
        </TableCell>
      </TableRow>
    )}
  </>
);
