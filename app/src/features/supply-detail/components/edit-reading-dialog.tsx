import { useEffect, useState } from "react";
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
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import type { Reading } from "@/db/db";
import type { ReadingFormData } from "../use-supply-detail";

interface EditReadingDialogProps {
  onClose: () => void;
  onSave: (id: string, data: ReadingFormData) => Promise<void>;
  reading: Reading | null;
}

export const EditReadingDialog = ({
  reading,
  onClose,
  onSave,
}: EditReadingDialogProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [peak, setPeak] = useState("");
  const [flat, setFlat] = useState("");
  const [offPeak, setOffPeak] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (reading) {
      setStartDate(reading.startDate);
      setEndDate(reading.endDate);
      setPeak(reading.consumptionPeak.toString());
      setFlat(reading.consumptionFlat.toString());
      setOffPeak(reading.consumptionOffPeak.toString());
      setCost(reading.cost?.toString() || "");
    }
  }, [reading]);

  const handleSubmit = async () => {
    if (!(reading && startDate && endDate)) {
      return;
    }
    await onSave(reading.id, {
      startDate,
      endDate,
      peak: Number(peak) || 0,
      flat: Number(flat) || 0,
      offPeak: Number(offPeak) || 0,
      cost: cost ? Number(cost) : undefined,
    });
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={!!reading}>
      <DialogContent className="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar Lectura</DialogTitle>
            <DialogDescription>
              Corrige los datos de esta lectura de consumo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha Inicio</Label>
                <DateInput
                  onChange={setStartDate}
                  value={startDate}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha Fin</Label>
                <DateInput
                  onChange={setEndDate}
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
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
