import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
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
    <Dialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
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
            variant="outline"
            onClick={() => setUpdateAvailable(false)}
            disabled={isInstalling}
          >
            Ahora no
          </Button>
          <Button onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? "Instalando..." : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
