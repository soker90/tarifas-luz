import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteReadingDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}

export const DeleteReadingDialog = ({
  open,
  onClose,
  onConfirm,
}: DeleteReadingDialogProps) => {
  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar Lectura?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer y la lectura desaparecerá de tu
            historial.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
