import { TableCell, TableRow } from "@/components/ui/table";
import type { InvoiceSimulation } from "../types";

interface InvoiceRowProps {
  invoice: InvoiceSimulation;
}

export const InvoiceRow = ({ invoice: inv }: InvoiceRowProps) => (
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
