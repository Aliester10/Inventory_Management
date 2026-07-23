import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const upload = multer({ dest: 'uploads/' });

// Helper function to extract data from excel
async function parseExcelFile(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0]; // Assume first sheet is the one

  const items = [];
  const transactions = [];

  // Parse row 3 for dates
  const row3 = worksheet.getRow(3).values as any[];
  const dateMap: { col: number, date: Date, type: 'M' | 'K' }[] = [];
  
  // Starting from column 14 (which is index 13 in the array, 'M' for date 1)
  // Let's dynamically find date columns by looking at row 3 and row 4
  const row4 = worksheet.getRow(4).values as any[];
  for (let i = 13; i < row4.length; i++) {
    const val = row4[i];
    if (val === 'M' || val === 'K') {
      const dateVal = row3[i] || row3[i-1]; // 'K' usually shares the merged date cell from 'M'
      if (dateVal instanceof Date) {
        dateMap.push({ col: i, date: dateVal, type: val as 'M' | 'K' });
      }
    }
  }

  // Iterate over rows starting from 5
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return;
    
    const values = row.values as any[];
    if (!values[2]) return; // Stop if CODE is empty

    const code = values[2]?.toString().trim();
    const spec = values[3]?.toString().trim() || '';
    const unit = values[4]?.toString().trim() || '';
    const ket = values[5]?.toString().trim() || '';
    const handcarry = values[6]?.toString().trim() || '';
    
    // Saldo Awal might be a formula result
    let saldoAwal = 0;
    if (values[7] && typeof values[7] === 'object' && 'result' in values[7]) saldoAwal = Number(values[7].result);
    else saldoAwal = Number(values[7]) || 0;

    const itemData = {
      code, spec, unit, ket, handcarry, saldoAwal, rowNumber
    };
    
    items.push(itemData);

    // Parse transactions
    dateMap.forEach(d => {
      const cellVal = values[d.col];
      let qty = 0;
      if (cellVal && typeof cellVal === 'object' && 'result' in cellVal) qty = Number(cellVal.result);
      else qty = Number(cellVal) || 0;

      if (qty > 0) {
        transactions.push({
          code,
          date: d.date,
          type: d.type,
          qty
        });
      }
    });
  });

  return { items, transactions };
}

// 1. Upload & Parse Endpoint
app.post('/api/import/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const data = await parseExcelFile(req.file.path);
    
    // Clean up file after parse
    fs.unlinkSync(req.file.path);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse Excel' });
  }
});

// 2. Commit Data Endpoint
app.post('/api/import/commit', async (req, res) => {
  try {
    const { items, transactions, month, year } = req.body;
    
    await prisma.$transaction(async (tx) => {
      // Upsert Items & Monthly Data
      for (const item of items) {
        const dbItem = await tx.item.upsert({
          where: { code: item.code },
          update: { spec: item.spec, unit: item.unit },
          create: { code: item.code, spec: item.spec, unit: item.unit }
        });

        await tx.itemMonthly.upsert({
          where: {
            itemId_month_year: {
              itemId: dbItem.id, month, year
            }
          },
          update: {
            saldoAwal: item.saldoAwal,
            ket: item.ket,
            handcarry: item.handcarry
          },
          create: {
            itemId: dbItem.id,
            month, year,
            saldoAwal: item.saldoAwal,
            ket: item.ket,
            handcarry: item.handcarry
          }
        });
      }

      // Upsert Transactions
      // Batch queries for performance
      for (const t of transactions) {
        const dbItem = await tx.item.findUnique({ where: { code: t.code } });
        if (dbItem) {
          // Normalize date to start of day
          const tDate = new Date(t.date);
          tDate.setUTCHours(0,0,0,0);

          const existing = await tx.dailyTransaction.findUnique({
            where: { itemId_date: { itemId: dbItem.id, date: tDate } }
          });

          if (existing) {
            await tx.dailyTransaction.update({
              where: { id: existing.id },
              data: {
                qtyIn: t.type === 'M' ? t.qty : existing.qtyIn,
                qtyOut: t.type === 'K' ? t.qty : existing.qtyOut,
              }
            });
          } else {
            await tx.dailyTransaction.create({
              data: {
                itemId: dbItem.id,
                date: tDate,
                qtyIn: t.type === 'M' ? t.qty : 0,
                qtyOut: t.type === 'K' ? t.qty : 0,
              }
            });
          }
        }
      }
    });

    res.json({ success: true, message: 'Data committed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to commit data' });
  }
});

// 3. Dashboard Endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    await ensureMonthlyData(month, year);

    const items = await prisma.item.findMany({
      include: {
        monthlyData: { where: { month, year } },
        transactions: { where: { date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } } }
      }
    });

    let totalSaldoAwal = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalSisa = 0;

    const lowStockItems = items.map(item => {
      const saldo = item.monthlyData[0]?.saldoAwal || 0;
      const masuk = item.transactions.reduce((acc, t) => acc + t.qtyIn, 0);
      const keluar = item.transactions.reduce((acc, t) => acc + t.qtyOut, 0);
      const sisa = saldo + masuk - keluar;
      
      totalSaldoAwal += saldo;
      totalMasuk += masuk;
      totalKeluar += keluar;
      totalSisa += sisa;

      return {
        code: item.code,
        spec: item.spec,
        sisa
      };
    }).filter(i => i.sisa <= 10).sort((a, b) => a.sisa - b.sisa);

    res.json({
      success: true,
      data: {
        totalSaldoAwal,
        totalMasuk,
        totalKeluar,
        totalSisa,
        lowStockItems,
        monthName: today.toLocaleString('id-ID', { month: 'long' }),
        year
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Utility to ensure monthly data exists and carries over from the previous month
async function ensureMonthlyData(month: number, year: number) {
  const totalItems = await prisma.item.count();
  const currentMonthlies = await prisma.itemMonthly.count({ where: { month, year } });
  
  if (currentMonthlies < totalItems) {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
    
    const allItems = await prisma.item.findMany({
      include: {
        monthlyData: { where: { month: prevMonth, year: prevYear } },
        transactions: { 
          where: { 
            date: { gte: new Date(Date.UTC(prevYear, prevMonth - 1, 1)), lte: new Date(Date.UTC(prevYear, prevMonth, 0)) } 
          } 
        }
      }
    });

    const existingMonthlies = await prisma.itemMonthly.findMany({ where: { month, year } });
    const existingIds = new Set(existingMonthlies.map(m => m.itemId));

    const newRecords = [];
    for (const item of allItems) {
      const pMonthly = item.monthlyData[0];
      const prevSaldo = pMonthly ? pMonthly.saldoAwal : 0;
      let pIn = 0;
      let pOut = 0;
      item.transactions.forEach(t => { pIn += t.qtyIn; pOut += t.qtyOut; });
      const expectedSaldo = prevSaldo + pIn - pOut;

      if (!existingIds.has(item.id)) {
        newRecords.push({
          itemId: item.id,
          month,
          year,
          saldoAwal: expectedSaldo,
          ket: pMonthly ? pMonthly.ket : '',
          handcarry: pMonthly ? pMonthly.handcarry : ''
        });
      } else {
        // Fix corrupted records that were created with 0 saldoAwal by the previous bug
        const current = existingMonthlies.find(m => m.itemId === item.id);
        if (current && current.saldoAwal === 0 && expectedSaldo !== 0) {
          await prisma.itemMonthly.update({
            where: { id: current.id },
            data: { saldoAwal: expectedSaldo }
          });
        }
      }
    }
    
    if (newRecords.length > 0) {
      await prisma.itemMonthly.createMany({ data: newRecords });
    }
  }
}

// 4. Recap Endpoint
app.get('/api/recap', async (req, res) => {
  try {
    const month = parseInt(req.query.month as string) || 6;
    const year = parseInt(req.query.year as string) || 2026;

    await ensureMonthlyData(month, year);

    const items = await prisma.item.findMany({
      include: {
        monthlyData: { where: { month, year } },
        transactions: { 
          where: { 
            date: { 
              gte: new Date(year, month - 1, 1), 
              lte: new Date(year, month, 0) 
            } 
          } 
        },
        productReports: {
          orderBy: { tglPo: 'desc' },
          take: 1
        }
      }
    });

    const data = items.map(item => {
      const saldoAwal = item.monthlyData[0]?.saldoAwal || 0;
      const ket = item.monthlyData[0]?.ket || '';
      const handcarry = item.monthlyData[0]?.handcarry || '';
      const masuk = item.transactions.reduce((acc, t) => acc + t.qtyIn, 0);
      const keluar = item.transactions.reduce((acc, t) => acc + t.qtyOut, 0);
      const latestReport = item.productReports[0];
      return {
        id: item.id,
        code: item.code,
        spec: item.spec,
        unit: item.unit,
        saldoAwal,
        masuk,
        keluar,
        sisa: saldoAwal + masuk - keluar,
        ket,
        handcarry,
        po: latestReport?.po || '',
        noGr: latestReport?.noGr || ''
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recap' });
  }
});

// 5. Daily Input Search Endpoint
app.get('/api/items/daily', async (req, res) => {
  try {
    const queryDate = new Date(req.query.date as string);
    const month = queryDate.getMonth() + 1;
    const year = queryDate.getFullYear();

    await ensureMonthlyData(month, year);

    const items = await prisma.item.findMany({
      include: {
        monthlyData: { where: { month, year } },
        transactions: { 
          where: { 
            date: { gte: new Date(year, month - 1, 1), lte: queryDate } 
          } 
        },
        productReports: {
          orderBy: { tglPo: 'desc' },
          take: 1
        }
      }
    });

    const data = items.map(item => {
      const saldoAwal = item.monthlyData[0]?.saldoAwal || 0;
      
      // Calculate stock until yesterday
      const txUntilYesterday = item.transactions.filter(t => t.date < queryDate);
      const masukUntilYesterday = txUntilYesterday.reduce((acc, t) => acc + t.qtyIn, 0);
      const keluarUntilYesterday = txUntilYesterday.reduce((acc, t) => acc + t.qtyOut, 0);
      
      const stock = saldoAwal + masukUntilYesterday - keluarUntilYesterday;
      
      // Today's transaction
      const todayTx = item.transactions.find(t => t.date.getTime() === queryDate.getTime());
      
      const latestReport = item.productReports[0];

      return {
        id: item.id,
        code: item.code,
        spec: item.spec,
        unit: item.unit,
        ket: item.monthlyData[0]?.ket || '',
        handcarry: item.monthlyData[0]?.handcarry || '',
        saldoAwal,
        stock,
        qtyIn: todayTx?.qtyIn || 0,
        qtyOut: todayTx?.qtyOut || 0,
        po: latestReport?.po || '',
        noGr: latestReport?.noGr || ''
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily items' });
  }
});

// 6. Save Daily Input Endpoint
app.post('/api/items/daily', async (req, res) => {
  try {
    const { code, date, qtyIn, qtyOut, ket, handcarry, user = 'System' } = req.body;
    
    const item = await prisma.item.findUnique({ where: { code } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const txDate = new Date(date);
    txDate.setUTCHours(0,0,0,0);
    const month = txDate.getMonth() + 1;
    const year = txDate.getFullYear();

    await ensureMonthlyData(month, year);

    // 1. Update Daily Transaction
    if (qtyIn !== undefined && qtyOut !== undefined) {
      const existing = await prisma.dailyTransaction.findUnique({
        where: { itemId_date: { itemId: item.id, date: txDate } }
      });

      if (existing) {
        if (existing.qtyIn !== qtyIn || existing.qtyOut !== qtyOut) {
          await prisma.dailyTransaction.update({
            where: { id: existing.id },
            data: { qtyIn, qtyOut }
          });
        }
      } else {
        await prisma.dailyTransaction.create({
          data: { itemId: item.id, date: txDate, qtyIn, qtyOut }
        });
      }
    }

    // 2. Update Monthly Metadata
    if (ket !== undefined || handcarry !== undefined) {
      const monthly = await prisma.itemMonthly.findFirst({
        where: { itemId: item.id, month, year }
      });
      if (monthly) {
        const newKet = ket !== undefined ? ket : monthly.ket;
        const newHc = handcarry !== undefined ? handcarry : monthly.handcarry;
        
        if (monthly.ket !== newKet || monthly.handcarry !== newHc) {
          await prisma.itemMonthly.update({
            where: { id: monthly.id },
            data: { ket: newKet, handcarry: newHc }
          });
        }
      }
    }

    res.json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// 7. Export Recap to Excel
app.get('/api/recap/export', async (req, res) => {
  try {
    const month = parseInt(req.query.month as string) || 6;
    const year = parseInt(req.query.year as string) || 2026;

    await ensureMonthlyData(month, year);

    const items = await prisma.item.findMany({
      include: {
        monthlyData: { where: { month, year } },
        transactions: { 
          where: { 
            date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } 
          } 
        }
      }
    });

    const templatePath = path.resolve('../STOCK JUNI 2026 (1).xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const sheet = workbook.worksheets[0]; // BAHAN BAKU

    // Map columns for dates dynamically
    const row3 = sheet.getRow(3).values as any[];
    const row4 = sheet.getRow(4).values as any[];
    const dateMap: { col: number, date: number, type: 'M' | 'K' }[] = [];
    
    for (let i = 13; i < row4.length; i++) {
      const type = row4[i];
      if (type === 'M' || type === 'K') {
        let dateCell = row3[i] || row3[i-1];
        let dateDay = 1;
        if (dateCell instanceof Date) {
          dateDay = dateCell.getUTCDate();
        } else if (typeof dateCell === 'string' && dateCell.includes('/')) {
          dateDay = parseInt(dateCell.split('/')[0]);
        }
        
        dateMap.push({ col: i, date: dateDay, type: type as 'M' | 'K' });
        
        // Update header in the template to the requested month/year
        const cell = sheet.getCell(3, i);
        if (cell.value && cell.type !== ExcelJS.ValueType.Merge) { 
           // Only update the primary cell of the merge
           cell.value = new Date(Date.UTC(year, month - 1, dateDay));
        }
      }
    }

    const processedCodes = new Set<string>();

    // Iterate items and update sheet
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 5) return; // Skip headers
      
      const values = row.values as any[];
      const code = values[2]?.toString().trim(); // Column B is index 2
      if (!code) return;

      const dbItem = items.find(i => i.code === code);
      if (dbItem) {
        processedCodes.add(dbItem.code);
        // Update basic info
        const monthly = dbItem.monthlyData[0];
        if (monthly) {
          row.getCell(5).value = monthly.ket || '';        // E: KET
          row.getCell(6).value = monthly.handcarry || '';  // F: HANDCARRY
          row.getCell(7).value = monthly.saldoAwal || 0;   // G: SALDO AWAL
        }

        // Clear existing daily M/K cells
        dateMap.forEach(d => {
          row.getCell(d.col).value = null;
        });

        // Fill daily transactions
        dbItem.transactions.forEach(tx => {
          const txDate = tx.date.getDate();
          
          if (tx.qtyIn > 0) {
            const mapObj = dateMap.find(d => d.date === txDate && d.type === 'M');
            if (mapObj) row.getCell(mapObj.col).value = tx.qtyIn;
          }
          
          if (tx.qtyOut > 0) {
            const mapObj = dateMap.find(d => d.date === txDate && d.type === 'K');
            if (mapObj) row.getCell(mapObj.col).value = tx.qtyOut;
          }
        });

        row.commit();
      }
    });

    // Append items that were not in the template
    // Find the actual last row by looking for the first row without a CODE starting from row 5
    let lastRowNumber = 4;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        const code = row.getCell(2).value?.toString().trim();
        if (code) {
          lastRowNumber = Math.max(lastRowNumber, rowNumber);
        }
      }
    });

    for (const dbItem of items) {
      if (!processedCodes.has(dbItem.code)) {
        lastRowNumber++;
        const newRow = sheet.getRow(lastRowNumber);
        
        // NO (A/1) 
        const prevRowNoCell = sheet.getRow(lastRowNumber - 1).getCell(1).value;
        const prevNo = Number(prevRowNoCell);
        newRow.getCell(1).value = !isNaN(prevNo) && prevNo > 0 ? prevNo + 1 : lastRowNumber - 3;
        // CODE (B/2)
        newRow.getCell(2).value = dbItem.code;
        // SPEC (C/3)
        newRow.getCell(3).value = dbItem.spec;
        // UNIT (D/4)
        newRow.getCell(4).value = dbItem.unit;
        
        const monthly = dbItem.monthlyData[0];
        if (monthly) {
          newRow.getCell(5).value = monthly.ket || '';        // E/5: KET
          newRow.getCell(6).value = monthly.handcarry || '';  // F/6: HANDCARRY
          newRow.getCell(7).value = monthly.saldoAwal || 0;   // G/7: SALDO AWAL
        }

        // Fill daily transactions
        dbItem.transactions.forEach(tx => {
          const txDate = tx.date.getUTCDate();
          
          if (tx.qtyIn > 0) {
            const mapObj = dateMap.find(d => d.date === txDate && d.type === 'M');
            if (mapObj) newRow.getCell(mapObj.col).value = tx.qtyIn;
          }
          
          if (tx.qtyOut > 0) {
            const mapObj = dateMap.find(d => d.date === txDate && d.type === 'K');
            if (mapObj) newRow.getCell(mapObj.col).value = tx.qtyOut;
          }
        });

        newRow.commit();
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rekap_Export_${month}_${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// 8. Add Product Endpoint
app.post('/api/products', async (req, res) => {
  try {
    const { code, spec, unit, saldoAwal } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const existing = await prisma.item.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Product with this code already exists' });
    }

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const newItem = await prisma.item.create({
      data: {
        code,
        spec: spec || '',
        unit: unit || '',
        monthlyData: {
          create: {
            month,
            year,
            saldoAwal: Number(saldoAwal) || 0,
            ket: '',
            handcarry: ''
          }
        }
      },
      include: {
        monthlyData: true
      }
    });

    res.json({ success: true, data: newItem, message: 'Product added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// 9. Product Reports Endpoints
app.get('/api/reports/:itemId', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid Item ID' });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        productReports: {
          orderBy: { tglPo: 'desc' }
        }
      }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product reports' });
  }
});

  app.post('/api/reports', async (req, res) => {
    try {
      const { itemId, po, tglPo, orderQty, pic, noGr, keterangan } = req.body;
      
      if (!itemId || !po || !tglPo) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const newReport = await prisma.productReport.create({
        data: {
          itemId: parseInt(itemId),
          po,
          tglPo: new Date(tglPo),
          orderQty: parseInt(orderQty) || 0,
          pic: pic || '',
          noGr: noGr || null,
          keterangan: keterangan || ''
        }
      });

    res.json({ success: true, data: newReport, message: 'Report added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product report' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid Report ID' });

    const { po, tglPo, orderQty, pic, noGr, keterangan } = req.body;

    const updated = await prisma.productReport.update({
      where: { id },
      data: {
        po: po !== undefined ? po : undefined,
        tglPo: tglPo ? new Date(tglPo) : undefined,
        orderQty: orderQty !== undefined ? parseInt(orderQty) : undefined,
        pic: pic !== undefined ? pic : undefined,
        noGr: noGr !== undefined ? noGr : undefined,
        keterangan: keterangan !== undefined ? keterangan : undefined
      }
    });

    res.json({ success: true, data: updated, message: 'Report updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid Report ID' });

    await prisma.productReport.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
