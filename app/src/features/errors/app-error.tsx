import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import {
  ErrorActions,
  ErrorDescription,
  ErrorHeader,
  ErrorView,
} from "@/features/errors/error-base";

export default function AppErrorPage() {
  return (
    <ErrorView>
      <ErrorHeader>Algo ha salido mal</ErrorHeader>
      <ErrorDescription>
        La aplicación ha encontrado un error y necesita reiniciarse.
      </ErrorDescription>
      <ErrorActions>
        <Button onClick={relaunch} size="lg">
          Reiniciar
        </Button>
      </ErrorActions>
    </ErrorView>
  );
}
