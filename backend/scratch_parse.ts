import ExcelJS from 'exceljs';
import path from 'path';

async function parseExcel() {
  const filePath = path.resolve('../STOCK JUNI 2026 (1).xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0]; // Assume first sheet
  
  console.log(`Sheet Name: ${worksheet.name}`);
  
  // Let's read the first 10 rows to see the structure
  for (let i = 1; i <= 10; i++) {
    const row = worksheet.getRow(i);
    console.log(`Row ${i}:`, row.values);
  }
}

parseExcel().catch(console.error);
