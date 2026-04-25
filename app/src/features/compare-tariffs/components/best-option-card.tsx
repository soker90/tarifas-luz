import { ArrowDownCircle, ArrowUpCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TariffComparison } from "../types";

interface BestOptionCardProps {
  best: TariffComparison;
}

export const BestOptionCard = ({ best }: BestOptionCardProps) => (
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
          <h2 className="font-bold text-3xl text-green-900">{best.name}</h2>
          <p className="font-medium text-green-700">{best.tariffName}</p>
          {best.savings !== undefined && best.savings > 0 && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-800 text-sm">
              <ArrowDownCircle className="h-4 w-4" /> Ahorras{" "}
              {best.savings.toFixed(2)}€ al año
            </div>
          )}
          {best.savings !== undefined && best.savings < 0 && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 font-semibold text-red-800 text-sm">
              <ArrowUpCircle className="h-4 w-4" /> Pierdes{" "}
              {Math.abs(best.savings).toFixed(2)}€ al año
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="font-black text-5xl text-green-600 tracking-tight">
            {best.estimatedAnnualTotal.toFixed(2)}
            <span className="font-bold text-2xl">€</span>
          </p>
          <p className="mt-1 font-medium text-green-700/80 text-xs uppercase tracking-wider">
            / Año (IVA inc.)
          </p>
          {best.firstYearTotal !== undefined && (
            <p className="mt-1 font-medium text-purple-600 text-xs">
              1er año: {best.firstYearTotal.toFixed(2)}€
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);
