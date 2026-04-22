import { Activity, ArrowLeft, Pencil, Plus } from "lucide-react";
import { Link } from "react-router";
import type { Supply } from "@/db/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SupplyHeaderProps {
  supply: Supply;
  supplyId: string;
  onEditClick: () => void;
  onAddReadingClick: () => void;
}

export function SupplyHeader({
  supply,
  supplyId,
  onEditClick,
  onAddReadingClick,
}: SupplyHeaderProps) {
  return (
    <>
      <div className="mb-6">
        <Link to="/">
          <Button
            className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Suministros
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-3xl tracking-tight">{supply.name}</h1>
            <Badge
              className="border-blue-200 bg-blue-50 text-blue-700"
              variant="outline"
            >
              Luz
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            Potencias:{" "}
            <strong className="text-foreground">
              {supply.contractedPowerPeak} kW
            </strong>{" "}
            Punta /{" "}
            <strong className="text-foreground">
              {supply.contractedPowerOffPeak} kW
            </strong>{" "}
            Valle
          </p>
          {supply.currentPriceEnergyPeak !== undefined && (
            <p className="mt-1 text-muted-foreground text-xs">
              Precios energía configurados: {supply.currentPriceEnergyPeak}€ /{" "}
              {supply.currentPriceEnergyFlat}€ /{" "}
              {supply.currentPriceEnergyOffPeak}€
            </p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
          <Button
            className="gap-2 shadow-sm"
            onClick={onEditClick}
            variant="outline"
          >
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Link to={`/${supplyId}/compare`}>
            <Button
              className="gap-2 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              variant="secondary"
            >
              <Activity className="h-4 w-4" /> Comparar Tarifas
            </Button>
          </Link>
          <Button className="gap-2 shadow-sm" onClick={onAddReadingClick}>
            <Plus className="h-4 w-4" /> Añadir Lectura
          </Button>
        </div>
      </div>
    </>
  );
}
