import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Obtener fuente del Excel (env var, argumento CLI o archivo local)
const excelSource = process.env.EXCEL_URL || process.argv[2] || path.join(__dirname, '../tarifas.xlsx');
const outputPath = path.join(__dirname, '../tarifas.json');

async function downloadFile(url, filePath) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
  console.log(`✅ Descargado: ${filePath}`);
}

function parseNumberField(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value).replace(/,/g, '.'));
  if (isNaN(num)) return null;
  // Redondear a 6 decimales y luego convertir a número para limpiar
  return parseFloat(num.toFixed(6));
}

function parseStringField(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim();
}

// Convertir número de Excel a fecha
function excelDateToISO(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  // Excel epoch: 1/1/1900
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0]; // Retorna YYYY-MM-DD
}

// Mapeo de filas a campos de tarifa
const rowMapping = {
  4: 'nombreTarifa',       // Row 4: Nombre de la tarifa específica
  5: 'permanencia',        // Row 5: PERMANENCIA
  6: 'potenciaMaxima',     // Row 6: Potencia máxima a contratar
  7: 'mantenimientoPrecio',// Row 7: Mantenimiento precios (meses)
  8: 'paraEmpresas',       // Row 8: Vale para empresas/comunidades?
  9: 'potenciaPunta',      // Row 9: Potencia punta (€/kW y día)
  10: 'potenciaValle',     // Row 10: Potencia valle (€/kW y día)
  13: 'periodos',          // Row 13: 1P o 3P
  14: 'energiaPunta',      // Row 14: Energía punta €/kWh
  15: 'energiaLlana',      // Row 15: Energía llana €/kWh
  16: 'energiaValle',      // Row 16: Energía valle €/kWh
  17: 'compensacionExcedentes', // Row 17: Compensación de excedentes
  18: 'incluyeBonoSocial', // Row 18: ¿Incluye financiación bono social? (SI/NO)
  // Row 19 no mapeado (no controlamos el Excel fuente)
  20: 'ultimoCambio',      // Row 20: Último cambio observado
  21: 'notaImportante',    // Row 21: Nota importante
  22: 'nota',              // Row 22: Nota
};

async function transformExcel() {
  try {
    let excelPath = excelSource;
    
    // Si es URL, descargar primero
    if (excelSource.startsWith('http')) {
      const tempPath = path.join(__dirname, '../temp-excel.xlsx');
      console.log('📥 Descargando Excel desde URL...');
      await downloadFile(excelSource, tempPath);
      excelPath = tempPath;
    }
    
    // Leer Excel
    console.log('📖 Leyendo Excel...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Leer las celdas directamente (layout horizontal)
    const tarifas = [];
    const maxCols = 50; // Asumir máximo 50 comercializadoras
    
    // Row 2 contiene nombres de comercializadoras
    // Empezamos desde columna 4 (D) - columnas A-C están vacías o contienen labels
    for (let col = 4; col < maxCols; col++) {
      const colLetter = XLSX.utils.encode_col(col);
      
      // Nombre comercializadora (Row 3 - shifted from 2)
      const cellComercializadora = worksheet[`${colLetter}3`];
      if (!cellComercializadora || !cellComercializadora.v) break; // Fin de datos
      
      const comercializadora = String(cellComercializadora.v).trim();
      if (!comercializadora) break;
      
      // Excluir filas que son encabezados o referencias, no tarifas reales
      if (comercializadora === 'Comercializadora -->') break;
      
      // Construir objeto tarifa extrayendo datos de cada fila
      const tarifa = {
        comercializadora: comercializadora,
        detalles: {}
      };
      
      // Extraer datos según rowMapping
      Object.entries(rowMapping).forEach(([rowNum, fieldName]) => {
        const cell = worksheet[`${colLetter}${rowNum}`];
        const value = cell ? cell.v : null;
        
        // Determinar si es campo numérico o string
        const numericFields = [
          'potenciaPunta', 'potenciaValle', 'energiaPunta', 
          'energiaLlana', 'energiaValle', 'periodos', 'potenciaMaxima',
          'mantenimientoPrecio'
        ];
        
        if (numericFields.includes(fieldName)) {
          tarifa.detalles[fieldName] = parseNumberField(value);
        } else if (fieldName === 'ultimoCambio') {
          tarifa.detalles[fieldName] = excelDateToISO(value);
        } else if (fieldName === 'incluyeBonoSocial') {
          // SI o cualquier valor positivo = incluye; NO, null o vacío = no incluye
          const str = parseStringField(value);
          tarifa.detalles[fieldName] = str !== null && str.toUpperCase() !== 'NO' && str !== '0';
        } else {
          let parsed = parseStringField(value);
          if (fieldName === 'compensacionExcedentes' && parsed === '0') {
            parsed = null;
          }
          tarifa.detalles[fieldName] = parsed;
        }
      });
      
      // No incluir datos generales (iva, impuestoElectrico, alquilerContador) 
      // a nivel de cada tarifa - irán consolidados en datosGenerales
      
      tarifas.push(tarifa);
    }

    // Post-procesado: detectar descuento con Gemini API (o regex como fallback)
    async function detectarDescuentos(tarifas) {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (GEMINI_API_KEY) {
        try {
          console.log('🤖 Detectando descuentos con Gemini...');
          const notas = tarifas.map((t, i) => ({
            idx: i,
            comercializadora: t.comercializadora,
            nombreTarifa: t.detalles.nombreTarifa,
            nota: t.detalles.nota || null,
            notaImportante: t.detalles.notaImportante || null,
          }));

          const prompt = `Analiza las siguientes notas de tarifas eléctricas españolas y extrae información de descuentos.

Para cada tarifa, devuelve un JSON con este formato exacto:
{
  "idx": <número>,
  "descuento": {
    "tipo": "porcentaje" | "fijo",
    "valor": <número>,
    "meses": <número o null si no se especifica>,
    "soloNuevosClientes": true | false
  } | null
}

Reglas:
- "tipo": "porcentaje" si el descuento es un %, "fijo" si es un importe en €
- "valor": el número del descuento (25 para 25%, 6 para 6€)
- "meses": duración en meses (convierte "tres" → 3, "seis" → 6, etc.). Si no se especifica duración, pon null
- "soloNuevosClientes": true si menciona "nuevas contrataciones", "nuevos clientes", "solo online", etc.
- Si no hay ningún descuento claro, devuelve null
- No confundas descuentos con otras menciones de euros o porcentajes en el texto
- Devuelve SOLO el array JSON sin texto adicional ni markdown

Tarifas:
${JSON.stringify(notas, null, 2)}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0, responseMimeType: 'application/json' }
              })
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const results = JSON.parse(text);
            results.forEach(r => {
              if (tarifas[r.idx]) {
                tarifas[r.idx].detalles.descuento = r.descuento || null;
              }
            });
            console.log('✅ Descuentos detectados por Gemini');
            return;
          }
        } catch (e) {
          console.warn('⚠️ Gemini falló, usando regex como fallback:', e.message);
        }
      } else {
        console.log('ℹ️ Sin GEMINI_API_KEY, usando regex para detectar descuentos');
      }

      // Fallback: regex
      function parseDescuentoFromNota(nota) {
        if (!nota) return null;

        // Patrón 1: "X% de los primeros N meses" (con duración)
        const matchConDuracion = nota.match(/(\d+(?:[.,]\d+)?)\s*(%|€)\s+de\s+los\s+primeros?\s+(\d+|un|dos|tres|cuatro|seis|doce)/i);
        if (matchConDuracion) {
          const wordsToNum = { un: 1, dos: 2, tres: 3, cuatro: 4, seis: 6, doce: 12 };
          const rawMeses = matchConDuracion[3].toLowerCase();
          const meses = isNaN(parseInt(rawMeses)) ? (wordsToNum[rawMeses] || null) : parseInt(rawMeses);
          const soloNuevosClientes = /nuevo|contrataci/i.test(nota);
          return {
            tipo: matchConDuracion[2] === '%' ? 'porcentaje' : 'fijo',
            valor: parseFloat(matchConDuracion[1].replace(',', '.')),
            meses: meses || null,
            soloNuevosClientes
          };
        }

        // Patrón 2: "Dcto. X%" o "descuento X%" sin duración especificada
        const matchSinDuracion = nota.match(/(?:dcto\.?|descuento)\s+(\d+(?:[.,]\d+)?)\s*(%|€)/i);
        if (matchSinDuracion) {
          const soloNuevosClientes = /nuevo|contrataci/i.test(nota);
          return {
            tipo: matchSinDuracion[2] === '%' ? 'porcentaje' : 'fijo',
            valor: parseFloat(matchSinDuracion[1].replace(',', '.')),
            meses: null, // duración desconocida
            soloNuevosClientes
          };
        }

        return null;
      }

      tarifas.forEach(t => {
        t.detalles.descuento = parseDescuentoFromNota(t.detalles.nota) || null;
      });
    }

    await detectarDescuentos(tarifas);

    // Post-procesado: asegurar que incluyeBonoSocial siempre esté definido.
    // La mayoría de comercializadoras SÍ incluyen la financiación del bono social.
    // Lista de comercializadoras conocidas que NO la incluyen:
    const sinBonoSocial = ['enérgya', 'energya'];
    tarifas.forEach(t => {
      if (t.detalles.incluyeBonoSocial === undefined || t.detalles.incluyeBonoSocial === null) {
        const nombre = t.comercializadora.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        t.detalles.incluyeBonoSocial = !sinBonoSocial.some(n => nombre.includes(n));
      }
    });

    console.log(`📋 Se encontraron ${tarifas.length} tarifas`);
    
    if (tarifas.length === 0) {
      throw new Error('No se pudieron extraer tarifas del Excel');
    }
    
    // Consolidar datos generales desde las filas de impuestos
    const datosGenerales = {
      iva: 0.21,  // 21% estándar en España
      impuestoElectrico: 0.0511,  // 5.11% estándar
      alquilerContador: 0.027, // €/día
      bonoSocial: 0, // €/día (por defecto)
      actualizadoEn: excelDateToISO(worksheet['B1']?.v) || new Date().toISOString().split('T')[0]
    };
    
    // Obtener valores del Excel de las celdas C (columna 2):
    // R49: Bono Social (shifted from 48)
    // R50: Impuesto Eléctrico (shifted from 49)
    // R51: Alquiler contador (shifted from 50)
    // R54: IVA (shifted from 53)
    const cellBonoSocial = worksheet['C49'];
    const cellImpuesto = worksheet['C50'];
    const cellAlquiler = worksheet['C51'];
    const cellIVA = worksheet['C54'];
    
    if (cellBonoSocial?.v) datosGenerales.bonoSocial = parseNumberField(cellBonoSocial.v);
    if (cellImpuesto?.v) datosGenerales.impuestoElectrico = parseNumberField(cellImpuesto.v);
    if (cellAlquiler?.v) datosGenerales.alquilerContador = parseNumberField(cellAlquiler.v);
    if (cellIVA?.v) datosGenerales.iva = parseNumberField(cellIVA.v);
    
    // Estructura final
    const output = {
      datosGenerales,
      tarifas
    };
    
    // Limpiar números flotantes antes de serializar
    const cleanJSON = JSON.stringify(output, (key, value) => {
      if (typeof value === 'number' && !Number.isInteger(value)) {
        // Redondear a 6 decimales y restaurar precisión
        const rounded = Math.round(value * 1000000) / 1000000;
        return parseFloat(rounded.toPrecision(12));
      }
      return value;
    }, 2);
    
    // Guardar JSON
    fs.writeFileSync(outputPath, cleanJSON);
    console.log(`✅ JSON generado: ${outputPath}`);
    console.log(`📊 Total tarifas: ${tarifas.length}`);
    console.log('\n✨ Primera tarifa como ejemplo:');
    console.log(JSON.stringify(tarifas[0], null, 2));

    // Sincronizar app/public/tarifas.json automáticamente si existe
    const publicPath = path.join(__dirname, '../app/public/tarifas.json');
    if (fs.existsSync(path.dirname(publicPath))) {
      fs.writeFileSync(publicPath, cleanJSON);
      console.log(`📂 Sincronizado: ${publicPath}`);
    }
    
    // Limpiar archivo temporal
    if (excelSource.startsWith('http') && fs.existsSync(excelPath)) {
      fs.unlinkSync(excelPath);
      console.log('🧹 Archivo temporal eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

transformExcel();
