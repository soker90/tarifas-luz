import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
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

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    check()
      .then((update) => {
        if (update?.available) {
          setVersion(update.version);
          setUpdateAvailable(true);
        }
      })
      .catch(() => {
        // Silenciar errores de red — no crítico
      });
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const update = await check();
      if (update?.available) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog onOpenChange={setUpdateAvailable} open={updateAvailable}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Actualización disponible</DialogTitle>
          <DialogDescription>
            La versión <strong>{version}</strong> está disponible. Actualiza
            ahora para obtener las últimas mejoras y correcciones.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            disabled={isInstalling}
            onClick={() => setUpdateAvailable(false)}
            variant="outline"
          >
            Ahora no
          </Button>
          <Button disabled={isInstalling} onClick={handleInstall}>
            {isInstalling ? "Instalando..." : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
