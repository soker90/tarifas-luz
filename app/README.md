# Tarifas Luz

Aplicación de escritorio para gestionar suministros de luz, registrar lecturas de consumo y comparar tarifas del mercado libre.

Desarrollada con [Tauri](https://tauri.app), [React](https://reactjs.org), [TypeScript](https://typescriptlang.org), [Tailwind CSS](https://tailwindcss.com) y [shadcn/ui](https://ui.shadcn.com/).

## Características

- Gestión de múltiples puntos de suministro
- Registro histórico de lecturas de consumo (Punta / Llano / Valle)
- Gráficas de evolución del consumo
- Comparativa de tarifas del mercado libre con simulación factura a factura
- Datos almacenados localmente con [Dexie](https://dexie.org/) (IndexedDB)

## Desarrollo

Asegúrate de tener los [prerequisitos de Tauri](https://tauri.app/start/prerequisites/) instalados.

```bash
bun install
bun run tauri dev
```

## Build

```bash
bun run tauri build
```

## Linting y formato

```bash
bun run check   # comprobar
bun run fix     # auto-corregir
```
