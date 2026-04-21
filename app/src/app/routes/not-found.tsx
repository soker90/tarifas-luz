import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  ErrorActions,
  ErrorDescription,
  ErrorHeader,
  ErrorView,
} from "@/features/errors/error-base";

export default function NotFoundErrorPage() {
  const navigate = useNavigate();
  return (
    <ErrorView>
      <ErrorHeader>Página no encontrada</ErrorHeader>
      <ErrorDescription>
        Lo sentimos, no hemos podido encontrar la página que buscas.
      </ErrorDescription>
      <ErrorActions>
        <Button onClick={() => navigate(-1)} size="lg">
          Volver
        </Button>
      </ErrorActions>
    </ErrorView>
  );
}

// Necessary for react router to lazy load.
export const Component = NotFoundErrorPage;
