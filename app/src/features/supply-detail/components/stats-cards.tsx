import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatsCardsProps {
  dailyAverage: string;
  accumulatedCost: string;
  statsPeak: number;
  statsFlat: number;
  statsOffPeak: number;
  statsTotalKwh: number;
}

export const StatsCards = ({
  dailyAverage,
  accumulatedCost,
  statsPeak,
  statsFlat,
  statsOffPeak,
  statsTotalKwh,
}: StatsCardsProps) => {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-muted-foreground text-sm">
            Promedio Diario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {dailyAverage}{" "}
            <span className="font-normal text-muted-foreground text-sm">
              kWh/día
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-muted-foreground text-sm">
            Distribución de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {statsTotalKwh === 0 ? (
              <span>Sin consumo</span>
            ) : (
              <div className="w-full">
                <div className="mb-1 flex h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(statsPeak / statsTotalKwh) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${(statsFlat / statsTotalKwh) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(statsOffPeak / statsTotalKwh) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>
                    <span className="font-bold text-red-500">P</span>{" "}
                    {Math.round((statsPeak / statsTotalKwh) * 100)}%
                  </span>
                  <span>
                    <span className="font-bold text-yellow-500">LL</span>{" "}
                    {Math.round((statsFlat / statsTotalKwh) * 100)}%
                  </span>
                  <span>
                    <span className="font-bold text-green-500">V</span>{" "}
                    {Math.round((statsOffPeak / statsTotalKwh) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-indigo-50/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-medium text-indigo-800 text-sm">
            Coste Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl text-indigo-700">
            {accumulatedCost}{" "}
            <span className="font-normal text-sm">€</span>
            <p className="mt-1 font-normal text-[10px] text-indigo-600/70">
              Suma de reales + estimados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
