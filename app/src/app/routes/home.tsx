import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Zap, Trash2 } from "lucide-react";
import { useSupplies } from "@/db/hooks";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    if (!name.trim()) return;
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
      <Dialog open={!!supplyToDelete} onOpenChange={(open) => !open && setSupplyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Suministro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente el suministro y todas sus lecturas asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSupplyToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Suministros</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus puntos de suministro de luz.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Suministro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <DialogHeader>
                <DialogTitle>Añadir Suministro de Luz</DialogTitle>
                <DialogDescription>
                  Introduce los datos básicos de tu contrato de luz.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre / Identificador</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Casa Playa, Piso Madrid..." />
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium border-b pb-1">Potencias Contratadas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Punta (kW)</Label>
                      <Input type="number" step="0.1" value={powerPeak} onChange={(e) => setPowerPeak(e.target.value)} placeholder="Ej. 4.6" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Valle (kW)</Label>
                      <Input type="number" step="0.1" value={powerOffPeak} onChange={(e) => setPowerOffPeak(e.target.value)} placeholder="Ej. 4.6" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium border-b pb-1 flex items-center justify-between">
                    <span>Precios Actuales (Opcional)</span>
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Para calcular ahorros</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Precio Potencia Punta (€/kW/año)</Label>
                      <Input type="number" step="0.000001" value={pricePowerPeak} onChange={(e) => setPricePowerPeak(e.target.value)} placeholder="Ej. 29.5" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Precio Potencia Valle (€/kW/año)</Label>
                      <Input type="number" step="0.000001" value={pricePowerOffPeak} onChange={(e) => setPricePowerOffPeak(e.target.value)} placeholder="Ej. 14.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Energía Punta (€/kWh)</Label>
                      <Input type="number" step="0.000001" value={priceEnergyPeak} onChange={(e) => setPriceEnergyPeak(e.target.value)} placeholder="Ej. 0.15" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Energía Llana (€/kWh)</Label>
                      <Input type="number" step="0.000001" value={priceEnergyFlat} onChange={(e) => setPriceEnergyFlat(e.target.value)} placeholder="Ej. 0.11" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">Energía Valle (€/kWh)</Label>
                      <Input type="number" step="0.000001" value={priceEnergyOffPeak} onChange={(e) => setPriceEnergyOffPeak(e.target.value)} placeholder="Ej. 0.08" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!supplies?.length ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/30">
          <Zap className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No tienes suministros</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Empieza añadiendo tu primer punto de suministro.</p>
          <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>Añadir ahora</Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {supplies.map(supply => (
            <Card 
              key={supply.id} 
              className="relative group overflow-hidden transition-all hover:shadow-md border-border/50 cursor-pointer hover:border-blue-200 flex flex-col md:flex-row md:items-center p-4 md:p-6 gap-4 md:gap-6"
              onClick={() => navigate(`/${supply.id}`)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
              
              <div className="flex-1 flex justify-between md:justify-start items-start w-full md:w-auto">
                <div>
                  <CardTitle className="text-xl">{supply.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3" /> Suministro de Luz
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive md:hidden transition-opacity h-8 w-8 z-10 hover:bg-destructive/10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSupplyToDelete(supply.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-8 text-sm bg-muted/30 px-5 py-3 rounded-lg w-full md:w-auto items-center flex-shrink-0 border border-border/50">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">P. Punta</p>
                  <p className="font-medium text-base">{supply.contractedPowerPeak} kW</p>
                  {supply.currentPricePowerPeak !== undefined && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{supply.currentPricePowerPeak} €/kW</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">P. Valle</p>
                  <p className="font-medium text-base">{supply.contractedPowerOffPeak} kW</p>
                  {supply.currentPricePowerOffPeak !== undefined && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{supply.currentPricePowerOffPeak} €/kW</p>
                  )}
                </div>
                {supply.currentPriceEnergyPeak !== undefined && (
                  <div className="md:ml-4 text-left md:text-right">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Precios Energía</p>
                    <p className="font-medium flex items-center justify-start md:justify-end gap-1.5 text-sm mt-0.5">
                      <span className="text-red-600">{supply.currentPriceEnergyPeak}€</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-yellow-600">{supply.currentPriceEnergyFlat}€</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-green-600">{supply.currentPriceEnergyOffPeak}€</span>
                    </p>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 z-10 hover:bg-destructive/10 hidden md:flex shrink-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSupplyToDelete(supply.id);
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const Component = HomePage;
