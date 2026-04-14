import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.join(__dirname, '../tarifas.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log('\n📊 ESTRUCTURA DEL EXCEL\n');
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📄 Sheet: "${sheetName}"`);
    console.log(`Columnas: ${Object.keys(data[0] || {}).join(', ')}`);
    console.log(`Total filas: ${data.length}`);
    console.log(`\nPrimeras 2 filas:`);
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
  });
} catch (error) {
  console.error('❌ Error al leer Excel:', error.message);
}
