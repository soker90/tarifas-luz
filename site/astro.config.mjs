import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://soker90.github.io",
  base: "/tarifas-luz",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
