import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceSimulation } from "../types";
import { InvoiceRow } from "./invoice-row";

interface InvoiceTableProps {
  invoices: InvoiceSimulation[];
}

export const InvoiceTable = ({ invoices }: InvoiceTableProps) => (
  <div className="overflow-hidden rounded-md border bg-white">
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="text-xs">Periodo de Facturación</TableHead>
          <TableHead className="text-right text-xs">Importe Pagado</TableHead>
          <TableHead className="text-right text-xs">Tu Tarifa</TableHead>
          <TableHead className="text-right font-semibold text-indigo-700 text-xs">
            Nueva Tarifa
          </TableHead>
          <TableHead className="text-right text-xs">
            Ahorro en el Periodo
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <InvoiceRow invoice={inv} key={inv.startDate} />
        ))}
      </TableBody>
    </Table>
  </div>
);
