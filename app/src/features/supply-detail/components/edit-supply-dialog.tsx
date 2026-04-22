import { useEffect, useState } from "react";
import type { Supply } from "@/db/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditSupplyFormData } from "../use-supply-detail";

interface EditSupplyDialogProps {
  open: boolean;
  supply: Supply;
  onClose: () => void;
  onSave: (data: EditSupplyFormData) => Promise<void>;
}

export function EditSupplyDialog({
  open,
  supply,
  onClose,
  onSave,
}: EditSupplyDialogProps) {
  const [name, setName] = useState("");
  const [powerPeak, setPowerPeak] = useState("");
  const [powerOffPeak, setPowerOffPeak] = useState("");
  const [pricePowerPeak, setPricePowerPeak] = useState("");
  const [pricePowerOffPeak, setPricePowerOffPeak] = useState("");
  const [priceEnergyPeak, setPriceEnergyPeak] = useState("");
  const [priceEnergyFlat, setPriceEnergyFlat] = useState("");
  const [priceEnergyOffPeak, setPriceEnergyOffPeak] = useState("");

  useEffect(() => {
    if (open) {
      setName(supply.name);
      setPowerPeak(supply.contractedPowerPeak.toString());
      setPowerOffPeak(supply.contractedPowerOffPeak.toString());
      setPricePowerPeak(supply.currentPricePowerPeak?.toString() || "");
      setPricePowerOffPeak(supply.currentPricePowerOffPeak?.toString() || "");
      setPriceEnergyPeak(supply.currentPriceEnergyPeak?.toString() || "");
      setPriceEnergyFlat(supply.currentPriceEnergyFlat?.toString() || "");
      setPriceEnergyOffPeak(supply.currentPriceEnergyOffPeak?.toString() || "");
    }
  }, [open, supply]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSave({
      name,
      contractedPowerPeak: Number(powerPeak) || 0,
      contractedPowerOffPeak: Number(powerOffPeak) || 0,
      currentPricePowerPeak: pricePowerPeak
        ? Number(pricePowerPeak)
        : undefined,
      currentPricePowerOffPeak: pricePowerOffPeak
        ? Number(pricePowerOffPeak)
        : undefined,
      currentPriceEnergyPeak: priceEnergyPeak
        ? Number(priceEnergyPeak)
        : undefined,
      currentPriceEnergyFlat: priceEnergyFlat
        ? Number(priceEnergyFlat)
        : undefined,
      currentPriceEnergyOffPeak: priceEnergyOffPeak
        ? Number(priceEnergyOffPeak)
        : undefined,
    });
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar Suministro</DialogTitle>
            <DialogDescription>
              Modifica los datos y precios de tu contrato actual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Nombre / Identificador</Label>
              <Input
                id="editName"
                onChange={(e) => setName(e.target.value)}
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
                    step="0.000001"
                    type="number"
                    value={priceEnergyOffPeak}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
