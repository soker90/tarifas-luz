import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnnualEstimate } from "../types";

interface ConsumptionSummaryCardProps {
  estimate: AnnualEstimate;
}

export const ConsumptionSummaryCard = ({
  estimate,
}: ConsumptionSummaryCardProps) => (
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
            {Math.round(estimate.peakkWh)} kWh
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-yellow-500" /> Llano
          </span>
          <span className="font-medium">
            {Math.round(estimate.flatkWh)} kWh
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Valle
          </span>
          <span className="font-medium">
            {Math.round(estimate.offPeakkWh)} kWh
          </span>
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 font-bold text-base text-indigo-900">
          <span>Total</span>
          <span>
            {Math.round(
              estimate.peakkWh + estimate.flatkWh + estimate.offPeakkWh
            )}{" "}
            kWh
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);
