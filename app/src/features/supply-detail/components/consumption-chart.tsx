import { LineChart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "../use-supply-detail";

interface ConsumptionChartProps {
  chartData: ChartPoint[];
  availableYears: string[];
  currentSelectedYear: string;
  onYearChange: (year: string) => void;
}

export function ConsumptionChart({
  chartData,
  availableYears,
  currentSelectedYear,
  onYearChange,
}: ConsumptionChartProps) {
  return (
    <Card className="mb-6 border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LineChart className="h-5 w-5 text-muted-foreground" />
          Evolución del Consumo (Histórico)
        </CardTitle>
        {availableYears.length > 0 && (
          <div className="flex max-w-[50%] gap-1 overflow-x-auto rounded-md bg-muted/50 p-1">
            {availableYears.map((year) => (
              <Button
                className="h-7 px-2 text-xs"
                key={year}
                onClick={() => onYearChange(year)}
                size="sm"
                variant={currentSelectedYear === year ? "secondary" : "ghost"}
              >
                {year}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#eee"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="name"
                tick={{ fontSize: 12, fill: "#888" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "#f8f9fa" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="Punta"
                fill="#ef4444"
                radius={[0, 0, 4, 4]}
                stackId="a"
              />
              <Bar dataKey="Llano" fill="#eab308" stackId="a" />
              <Bar
                dataKey="Valle"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
