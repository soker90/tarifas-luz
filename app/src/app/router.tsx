import { createBrowserRouter, RouterProvider } from "react-router";

const appRouter = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("@/app/routes/home"),
  },
  {
    path: "/:supplyId",
    lazy: () => import("@/app/routes/supply-detail"),
  },
  {
    path: "/:supplyId/compare",
    lazy: () => import("@/app/routes/compare-tariffs"),
  },
  {
    path: "*",
    lazy: () => import("@/app/routes/not-found"),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={appRouter} />;
}
