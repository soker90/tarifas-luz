import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReadings, useSupply } from "@/db/hooks";
import { useTarifasData } from "@/db/use-tarifas";
import { BestOptionCard } from "@/features/compare-tariffs/components/best-option-card";
import { ConsumptionSummaryCard } from "@/features/compare-tariffs/components/consumption-summary-card";
import { TariffRankingTable } from "@/features/compare-tariffs/components/tariff-ranking-table";
import { useCompareTariffs } from "@/features/compare-tariffs/use-compare-tariffs";

export const CompareTariffsPage = () => {
  const { supplyId } = useParams<{ supplyId: string }>();
  const { supply } = useSupply(supplyId);
  const { readings } = useReadings(supplyId);
  const { tarifasData, isLoading: isLoadingTariffs, error } = useTarifasData();

  const { annualEstimate, comparisons } = useCompareTariffs(
    readings,
    supply,
    tarifasData
  );

  if (supply === undefined) {
    return <div className="p-12 text-center">Cargando suministro...</div>;
  }
  if (supply === null) {
    return (
      <div className="p-12 text-center text-destructive">
        Suministro no encontrado.
      </div>
    );
  }

  const showSavings = supply.currentPriceEnergyPeak !== undefined;

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link to={`/${supplyId}`}>
          <Button
            className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Suministro
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">
          Comparativa de Tarifas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Analizando las mejores opciones para{" "}
          <strong className="text-foreground">{supply.name}</strong>
        </p>
      </div>

      {isLoadingTariffs && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <h3 className="font-semibold text-lg">
              Descargando tarifas actualizadas...
            </h3>
          </CardContent>
        </Card>
      )}

      {!isLoadingTariffs && Boolean(error) && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="font-semibold text-destructive text-lg">{error}</h3>
          </CardContent>
        </Card>
      )}

      {!(isLoadingTariffs || error) && annualEstimate && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <ConsumptionSummaryCard estimate={annualEstimate} />
            {comparisons.length > 0 && <BestOptionCard best={comparisons[0]} />}
          </div>
          <TariffRankingTable
            comparisons={comparisons}
            showSavings={showSavings}
            updatedAt={tarifasData?.datosGenerales?.actualizadoEn}
          />
        </div>
      )}

      {!(isLoadingTariffs || error || annualEstimate) && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="font-semibold text-lg">Faltan datos de consumo</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              Necesitamos al menos una lectura de consumo para poder estimar tu
              gasto anual y compararlo con el mercado.
            </p>
            <Link className="mt-4" to={`/${supplyId}`}>
              <Button>Añadir Lectura</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const Component = CompareTariffsPage;
