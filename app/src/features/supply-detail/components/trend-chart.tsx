import { Activity } from "lucide-react";
import type { LegendPayload } from "recharts";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartPoint } from "../use-supply-detail";

interface TrendChartProps {
  data: ChartPoint[];
  opacity: { Punta: number; Llano: number; Valle: number };
  onLegendMouseEnter: (o: LegendPayload) => void;
  onLegendMouseLeave: () => void;
}

export const TrendChart = ({
  data,
  opacity,
  onLegendMouseEnter,
  onLegendMouseLeave,
}: TrendChartProps) => {
  return (
    <Card className="mb-6 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-indigo-500" />
          Tendencia del Último Año
        </CardTitle>
        <CardDescription>
          Comparativa de franjas horarias en los últimos 365 días. Pasa el
          ratón por la leyenda para resaltar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <RechartsLineChart
              data={data}
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
              />
              <Legend
                iconType="circle"
                onMouseEnter={onLegendMouseEnter}
                onMouseLeave={onLegendMouseLeave}
                wrapperStyle={{ fontSize: "12px", cursor: "pointer" }}
              />
              <Line
                activeDot={{ r: 6 }}
                dataKey="Punta"
                stroke="#ef4444"
                strokeOpacity={opacity.Punta}
                strokeWidth={3}
                type="monotone"
              />
              <Line
                activeDot={{ r: 6 }}
                dataKey="Llano"
                stroke="#eab308"
                strokeOpacity={opacity.Llano}
                strokeWidth={3}
                type="monotone"
              />
              <Line
                activeDot={{ r: 6 }}
                dataKey="Valle"
                stroke="#22c55e"
                strokeOpacity={opacity.Valle}
                strokeWidth={3}
                type="monotone"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
