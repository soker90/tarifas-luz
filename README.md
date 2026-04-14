# Tarifas Luz - Transformador Excel a JSON

Sistema automatizado para transformar un Excel de tarifas de electricidad en JSON y publicarlo en GitHub Pages.

## 📋 Estructura

```
.
├── scripts/
│   ├── analyze-excel.js      # Script para analizar estructura del Excel
│   ├── excel-to-json.js      # Transformador principal
│   └── inspect-cells.js      # Utilidad para inspeccionar celdas
├── .github/workflows/
│   └── transform-daily.yml   # GitHub Action automatizada
├── package.json              # Dependencias y scripts npm
├── tarifas.json             # Salida JSON generada
```

## 🚀 Uso Local

### Instalación
```bash
pnpm install
```

### Analizar estructura del Excel
```bash
pnpm analyze
```
Muestra todas las columnas y primeras 2 filas de datos.

### Transformar Excel local
```bash
pnpm transform
```
Lee `tarifas.xlsx` y genera `tarifas.json`.

### Descargar y transformar desde Dropbox
```bash
pnpm transform:download
```
Descarga el Excel de la URL en Dropbox y lo transforma.

## 🤖 GitHub Action

La acción se ejecuta automáticamente:
- **Diariamente** a medianoche UTC (`0 0 * * *`)
- **Manualmente** con el botón "Run workflow" en Actions

## 📊 Estructura del JSON generado

```json
{
  "datosGenerales": {
    "iva": 0.21,                  // 21%
    "impuestoElectrico": 0.0511,  // 5.11%
    "alquilerContador": 0.027,    // €/día
    "actualizadoEn": "2026-04-13T17:51:22.873Z"
  },
  "tarifas": [
    {
      "comercializadora": "OCTOPUS",
      "detalles": {
        "nombreTarifa": "SUN CLUB",
        "permanencia": "NO",
        "potenciaMaxima": 15,
        "mantenimientoPrecio": 12,
        "paraEmpresas": "NO",
        "potenciaPunta": 0.097,
        "potenciaValle": 0.027,
        "periodos": 1,
        "energiaPunta": 0.12,
        "energiaLlana": 0.12,
        "energiaValle": 0.12,
        "compensacionExcedentes": null,
        "bateriaVirtual": null,
        "ultimoCambio": "2026-01-08",
        "notaImportante": "* Precio kWh estimativo..."
      }
    }
  ]
}
```

## ⚙️ Configuración

### Cambiar URL de descarga
Edita la variable `EXCEL_URL` en github.

### Cambiar mapeo de columnas
Edita la tabla `rowMapping` en [scripts/excel-to-json.js](scripts/excel-to-json.js) para mapear otras filas del Excel.

## 🔧 Troubleshooting

### Error: "Invalid HTML: could not find <table>"
**Causa:** La URL de Dropbox está devolviendo HTML (página web) en lugar del archivo Excel.

**Solución:**
1. Verifica que la URL sea correcta
2. Regenera el enlace de sharing en Dropbox
3. Asegúrate que el `?raw=1` esté al final
4. Prueba la descargar con `curl`:
   ```bash
   curl -L -o test.xlsx "https://tu-url-dropbox.xlsx?dl=1"
   ```

### Las tarifas no se extraen correctamente
**Causa:** La estructura del Excel cambió.

**Solución:**
1. Ejecuta `pnpm analyze` para ver la nueva estructura
2. Actualiza el `rowMapping` en [scripts/excel-to-json.js](scripts/excel-to-json.js)

## 📦 Dependencias

- **xlsx** (0.18.5) - Lectura de archivos Excel
- **Node.js** 24.x o superior

## 📝 Notas

- El script valida campos numéricos y strings
- Los valores de fecha (ultimoCambio) se convierten del formato Excel a ISO (YYYY-MM-DD)
- Los valores null o "0" en compensación/batería se limpian
- El JSON se genera con indentación de 2 espacios para legibilidad

