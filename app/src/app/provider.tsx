import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppErrorPage from "@/features/errors/app-error";
import UpdateChecker from "@/features/updater";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>Loading...</>}>
      <ErrorBoundary FallbackComponent={AppErrorPage}>
        <TooltipProvider>
          <UpdateChecker />
          {children}
        </TooltipProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
