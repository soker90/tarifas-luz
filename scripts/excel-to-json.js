import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Obtener fuente del Excel (argumento CLI o archivo local)
const excelSource = process.argv[2] || path.join(__dirname, '../tarifas.xlsx');
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
  3: 'nombreTarifa',       // Row 3: Nombre de la tarifa específica
  4: 'permanencia',        // Row 4: PERMANENCIA
  5: 'potenciaMaxima',     // Row 5: Potencia máxima a contratar
  6: 'mantenimientoPrecio',// Row 6: Mantenimiento precios (meses)
  7: 'paraEmpresas',       // Row 7: Vale para empresas/comunidades?
  8: 'potenciaPunta',      // Row 8: Potencia punta (€/kW y día)
  9: 'potenciaValle',      // Row 9: Potencia valle (€/kW y día)
  12: 'periodos',          // Row 12: 1P o 3P
  13: 'energiaPunta',      // Row 13: Energía punta €/kWh
  14: 'energiaLlana',      // Row 14: Energía llana €/kWh
  15: 'energiaValle',      // Row 15: Energía valle €/kWh
  16: 'compensacionExcedentes', // Row 16: Compensación de excedentes
  19: 'ultimoCambio',      // Row 19: Último cambio observado
  20: 'notaImportante',    // Row 20: Nota importante
  21: 'nota',              // Row 21: Nota
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
      
      // Nombre comercializadora (Row 2)
      const cellComercializadora = worksheet[`${colLetter}2`];
      if (!cellComercializadora || !cellComercializadora.v) break; // Fin de datos
      
      const comercializadora = String(cellComercializadora.v).trim();
      if (!comercializadora) break;
      
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
          // Convertir número de Excel a fecha
          tarifa.detalles[fieldName] = excelDateToISO(value);
        } else {
          let parsed = parseStringField(value);
          // Limpiar "0" en campos booleanos (compensación)
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
      actualizadoEn: new Date().toISOString()
    };
    
    // Obtener valores del Excel de las celdas C (columna 2):
    // R48: Bono Social
    // R49: Impuesto Eléctrico
    // R50: Alquiler contador
    // R53: IVA
    const cellBonoSocial = worksheet['C48'];
    const cellImpuesto = worksheet['C49'];
    const cellAlquiler = worksheet['C50'];
    const cellIVA = worksheet['C53'];
    
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
