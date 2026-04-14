import XLSX from 'xlsx';
const wb = XLSX.readFile('tarifas.xlsx');
const ws = wb.Sheets['Comparador'];

console.log('Dimensiones del sheet:');
console.log('Ref:', ws['!ref']);

// Leer primeras 15 filas y primeras 10 columnas como celdas
console.log('\nPrimeras 15 filas x 10 columnas (valores crudos):');
for (let r = 1; r <= 15; r++) {
  let row = [];
  for (let c = 1; c <= 10; c++) {
    const cell = ws[XLSX.utils.encode_cell({r: r-1, c: c-1})];
    const val = cell ? (cell.v || '') : '';
    row.push(String(val).slice(0, 20).padEnd(20));
  }
  console.log(`R${r}: ${row.join(' | ')}`);
}
