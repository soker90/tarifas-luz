import { Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupplies } from "@/db/hooks";

export function HomePage() {
  const { supplies, addSupply, deleteSupply } = useSupplies();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [powerPeak, setPowerPeak] = useState("");
  const [powerOffPeak, setPowerOffPeak] = useState("");
  const [pricePowerPeak, setPricePowerPeak] = useState("");
  const [pricePowerOffPeak, setPricePowerOffPeak] = useState("");
  const [priceEnergyPeak, setPriceEnergyPeak] = useState("");
  const [priceEnergyFlat, setPriceEnergyFlat] = useState("");
  const [priceEnergyOffPeak, setPriceEnergyOffPeak] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }
    await addSupply(
      name,
      Number(powerPeak) || 0,
      Number(powerOffPeak) || 0,
      pricePowerPeak ? Number(pricePowerPeak) : undefined,
      pricePowerOffPeak ? Number(pricePowerOffPeak) : undefined,
      priceEnergyPeak ? Number(priceEnergyPeak) : undefined,
      priceEnergyFlat ? Number(priceEnergyFlat) : undefined,
      priceEnergyOffPeak ? Number(priceEnergyOffPeak) : undefined
    );
    setIsDialogOpen(false);
    setName("");
    setPowerPeak("");
    setPowerOffPeak("");
    setPricePowerPeak("");
    setPricePowerOffPeak("");
    setPriceEnergyPeak("");
    setPriceEnergyFlat("");
    setPriceEnergyOffPeak("");
  };

  const confirmDelete = async () => {
    if (supplyToDelete) {
      await deleteSupply(supplyToDelete);
      setSupplyToDelete(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Dialog
        onOpenChange={(open) => !open && setSupplyToDelete(null)}
        open={!!supplyToDelete}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Suministro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente el
              suministro y todas sus lecturas asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={() => setSupplyToDelete(null)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Mis Suministros</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona tus puntos de suministro de luz.
          </p>
        </div>

        <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Suministro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <DialogHeader>
                <DialogTitle>Añadir Suministro de Luz</DialogTitle>
                <DialogDescription>
                  Introduce los datos básicos de tu contrato de luz.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre / Identificador</Label>
                  <Input
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Casa Playa, Piso Madrid..."
                    value={name}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="border-b pb-1 font-medium text-sm">
                    Potencias Contratadas
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Punta (kW)
                      </Label>
                      <Input
                        onChange={(e) => setPowerPeak(e.target.value)}
                        placeholder="Ej. 4.6"
                        step="0.1"
                        type="number"
                        value={powerPeak}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Valle (kW)
                      </Label>
                      <Input
                        onChange={(e) => setPowerOffPeak(e.target.value)}
                        placeholder="Ej. 4.6"
                        step="0.1"
                        type="number"
                        value={powerOffPeak}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center justify-between border-b pb-1 font-medium text-sm">
                    <span>Precios Actuales (Opcional)</span>
                    <span className="rounded bg-muted px-2 py-0.5 font-normal text-muted-foreground text-xs">
                      Para calcular ahorros
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Precio Potencia Punta (€/kW/año)
                      </Label>
                      <Input
                        onChange={(e) => setPricePowerPeak(e.target.value)}
                        placeholder="Ej. 29.5"
                        step="0.000001"
                        type="number"
                        value={pricePowerPeak}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Precio Potencia Valle (€/kW/año)
                      </Label>
                      <Input
                        onChange={(e) => setPricePowerOffPeak(e.target.value)}
                        placeholder="Ej. 14.5"
                        step="0.000001"
                        type="number"
                        value={pricePowerOffPeak}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Energía Punta (€/kWh)
                      </Label>
                      <Input
                        onChange={(e) => setPriceEnergyPeak(e.target.value)}
                        placeholder="Ej. 0.15"
                        step="0.000001"
                        type="number"
                        value={priceEnergyPeak}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Energía Llana (€/kWh)
                      </Label>
                      <Input
                        onChange={(e) => setPriceEnergyFlat(e.target.value)}
                        placeholder="Ej. 0.11"
                        step="0.000001"
                        type="number"
                        value={priceEnergyFlat}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground text-xs">
                        Energía Valle (€/kWh)
                      </Label>
                      <Input
                        onChange={(e) => setPriceEnergyOffPeak(e.target.value)}
                        placeholder="Ej. 0.08"
                        step="0.000001"
                        type="number"
                        value={priceEnergyOffPeak}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {supplies?.length ? (
        <div className="grid grid-cols-1 gap-4">
          {supplies.map((supply) => (
            <Card
              className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden border-border/50 p-4 transition-all hover:border-blue-200 hover:shadow-md md:flex-row md:items-center md:gap-6 md:p-6"
              key={supply.id}
              onClick={() => navigate(`/${supply.id}`)}
            >
              <div className="absolute top-0 left-0 h-full w-1 bg-blue-500 transition-all group-hover:w-1.5" />

              <div className="flex w-full flex-1 items-start justify-between md:w-auto md:justify-start">
                <div>
                  <CardTitle className="text-xl">{supply.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Suministro de Luz
                  </CardDescription>
                </div>
                <Button
                  className="z-10 h-8 w-8 text-destructive transition-opacity hover:bg-destructive/10 md:hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSupplyToDelete(supply.id);
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-5 py-3 text-sm md:w-auto md:gap-8">
                <div>
                  <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                    P. Punta
                  </p>
                  <p className="font-medium text-base">
                    {supply.contractedPowerPeak} kW
                  </p>
                  {supply.currentPricePowerPeak !== undefined && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {supply.currentPricePowerPeak} €/kW
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                    P. Valle
                  </p>
                  <p className="font-medium text-base">
                    {supply.contractedPowerOffPeak} kW
                  </p>
                  {supply.currentPricePowerOffPeak !== undefined && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {supply.currentPricePowerOffPeak} €/kW
                    </p>
                  )}
                </div>
                {supply.currentPriceEnergyPeak !== undefined && (
                  <div className="text-left md:ml-4 md:text-right">
                    <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                      Precios Energía
                    </p>
                    <p className="mt-0.5 flex items-center justify-start gap-1.5 font-medium text-sm md:justify-end">
                      <span className="text-red-600">
                        {supply.currentPriceEnergyPeak}€
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-yellow-600">
                        {supply.currentPriceEnergyFlat}€
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-green-600">
                        {supply.currentPriceEnergyOffPeak}€
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="z-10 hidden h-10 w-10 shrink-0 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 md:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  setSupplyToDelete(supply.id);
                }}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <Zap className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="font-semibold text-lg">No tienes suministros</h3>
          <p className="mt-1 mb-4 text-muted-foreground text-sm">
            Empieza añadiendo tu primer punto de suministro.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="secondary">
            Añadir ahora
          </Button>
        </div>
      )}
    </div>
  );
}

export const Component = HomePage;
