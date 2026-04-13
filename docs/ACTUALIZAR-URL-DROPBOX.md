# Guía: Actualizar URL de Dropbox

Cuando tengas el archivo Excel actualizado en Dropbox y quieras que el transformador lo descargue automáticamente, sigue estos pasos:

## 1️⃣ Obtener el enlace de compartición en Dropbox

1. Ve a [dropbox.com](https://dropbox.com)
2. Carga el archivo Excel actualizado
3. Haz clic derecho → **Compartir** (o el ícono de compartición)
4. Selecciona **Crear enlace**
5. Copia el enlace

## 2️⃣ Transformar la URL a formato descargable

Si la URL es:
```
https://www.dropbox.com/scl/fi/XXXXX/archivo.xlsx?dl=0
```

Cámbiala a:
```
https://www.dropbox.com/scl/fi/XXXXX/archivo.xlsx?dl=1
```

**Cambio importante:** El `?dl=0` debe ser `?dl=1` para descargar directo.

## 3️⃣ Actualizar en el repositorio

### Opción A: Script local
Edita [package.json](../package.json):
```json
"transform:download": "node scripts/excel-to-json.js https://tu-nueva-url-aqui"
```

Luego ejecuta:
```bash
pnpm transform:download
```

### Opción B: GitHub Action (automatizado)
Edita [.github/workflows/transform-daily.yml](.github/workflows/transform-daily.yml):
```yaml
- name: Transform Excel
  run: pnpm transform:download
```

El archivo ya está configurado para descargar desde tu URL.

## 4️⃣ Probar la URL

Para validar que funciona:
```bash
curl -L -o test.xlsx "https://tu-url-aqui?dl=1"
file test.xlsx
```

Debe mostrar: `Microsoft Excel 2007+ XML Spreadsheet`

Si muestra `HTML document`, la URL no es válida.

## ⚠️ Problema Común: URL Expirada

Las URLs de Dropbox pueden expirar. Si el GitHub Action falla con error de HTML:

1. **Regenera el enlace** en Dropbox (elimina el anterior y crea uno nuevo)
2. **Verifica el formato** termina en `?dl=1`
3. **Prueba con `curl`** antes de actualizar

## 💡 Alternativas si Dropbox no funciona

Si la URL de Dropbox sigue sin funcionar, puedes:

### Opción 1: Usar GitHub Raw (si subes el Excel al repo)
```bash
"transform:download": "node scripts/excel-to-json.js https://raw.githubusercontent.com/tu-usuario/tarifas-luz/master/ejemplo.xlsx"
```

### Opción 2: Usar OneDrive
```bash
# Obtén la URL de OneDrive y añade ?download=1
```

### Opción 3: Alojar en tu propio servidor
```bash
"transform:download": "node scripts/excel-to-json.js https://tu-servidor.com/comparador.xlsx"
```

---

**¿Necesitas ayuda?** Revisa los logs del GitHub Action en **Actions → Transform Excel to JSON → ver detalles del run**.
