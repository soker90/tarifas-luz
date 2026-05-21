import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://tarifas-luz.vercel.app",
  vite: {
    plugins: [tailwindcss()],
  },
});
