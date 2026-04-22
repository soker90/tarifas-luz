import { useState } from "react";
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
import type { ReadingFormData } from "../use-supply-detail";

interface AddReadingDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: ReadingFormData) => Promise<void>;
}

export const AddReadingDialog = ({
  open,
  onClose,
  onAdd,
}: AddReadingDialogProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [peak, setPeak] = useState("");
  const [flat, setFlat] = useState("");
  const [offPeak, setOffPeak] = useState("");
  const [cost, setCost] = useState("");

  const handleSubmit = async () => {
    if (!(startDate && endDate)) return;
    await onAdd({
      startDate,
      endDate,
      peak: Number(peak) || 0,
      flat: Number(flat) || 0,
      offPeak: Number(offPeak) || 0,
      cost: cost ? Number(cost) : undefined,
    });
    setStartDate("");
    setEndDate("");
    setPeak("");
    setFlat("");
    setOffPeak("");
    setCost("");
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent className="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Añadir Lectura de Consumo</DialogTitle>
            <DialogDescription>
              Introduce los datos de tu última factura de luz.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha Inicio</Label>
                <Input
                  onChange={(e) => setStartDate(e.target.value)}
                  type="date"
                  value={startDate}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha Fin</Label>
                <Input
                  onChange={(e) => setEndDate(e.target.value)}
                  type="date"
                  value={endDate}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Punta (kWh)</Label>
                <Input
                  onChange={(e) => setPeak(e.target.value)}
                  type="number"
                  value={peak}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Llano (kWh)</Label>
                <Input
                  onChange={(e) => setFlat(e.target.value)}
                  type="number"
                  value={flat}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Valle (kWh)</Label>
                <Input
                  onChange={(e) => setOffPeak(e.target.value)}
                  type="number"
                  value={offPeak}
                />
              </div>
            </div>
            <div className="grid gap-2 border-t pt-2">
              <Label className="font-semibold text-indigo-700 text-xs">
                Precio Pagado en Factura (€) (Opcional)
              </Label>
              <Input
                onChange={(e) => setCost(e.target.value)}
                placeholder="Ej. 45.20"
                step="0.01"
                type="number"
                value={cost}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
