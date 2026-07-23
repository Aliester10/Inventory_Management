// 1. Setup UI
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Stock Master')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 2. Helper to get or create sheets
function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d0e0e3");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function initializeSetup() {
  getSheet("Master", ["CODE", "SPEC", "UNIT"]);
  getSheet("Transactions", ["CODE", "DATE", "MASUK", "KELUAR"]);
  getSheet("Monthly", ["CODE", "MONTH", "YEAR", "SALDO_AWAL", "KET", "HANDCARRY"]);
  getSheet("ProductReports", ["CODE", "PO", "TGL_PO", "ORDER_QTY", "PIC", "NO_GR", "KETERANGAN"]);
}

// 3. API: Get Items (for Daily Input)
function apiGetDailyItems(dateString) {
  try {
    var masterSheet = getSheet("Master");
    var txSheet = getSheet("Transactions");
    var monthlySheet = getSheet("Monthly");

    var masterData = masterSheet.getDataRange().getValues().slice(1);
    var txData = txSheet.getDataRange().getValues().slice(1);
    var monthlyData = monthlySheet.getDataRange().getValues().slice(1);

    var queryDate = new Date(dateString);
    var targetMonth = queryDate.getUTCMonth() + 1;
    var targetYear = queryDate.getUTCFullYear();

    var result = masterData.map(function(row) {
      var code = row[0];
      var spec = row[1];
      var unit = row[2];

      // Find monthly
      var mRow = monthlyData.find(function(m) { return m[0] == code && m[1] == targetMonth && m[2] == targetYear; });
      var saldoAwal = mRow ? mRow[3] : 0;
      var ket = mRow ? mRow[4] : '';
      var handcarry = mRow ? mRow[5] : '';

      // Transactions
      var txs = txData.filter(function(t) { return t[0] == code; });
      var txUntilYesterday = txs.filter(function(t) { 
        var tDate = new Date(t[1]);
        return tDate.getUTCMonth() + 1 == targetMonth && tDate.getUTCFullYear() == targetYear && tDate.getUTCDate() < queryDate.getUTCDate();
      });
      var masukUntilYesterday = txUntilYesterday.reduce(function(acc, t) { return acc + (t[2] || 0); }, 0);
      var keluarUntilYesterday = txUntilYesterday.reduce(function(acc, t) { return acc + (t[3] || 0); }, 0);
      
      var stock = saldoAwal + masukUntilYesterday - keluarUntilYesterday;

      var todayTx = txs.find(function(t) { 
        var tDate = new Date(t[1]);
        return tDate.getTime() === queryDate.getTime();
      });

      return {
        id: code,
        code: code,
        spec: spec,
        unit: unit,
        ket: ket,
        handcarry: handcarry,
        saldoAwal: saldoAwal,
        stock: stock,
        qtyIn: todayTx ? todayTx[2] : 0,
        qtyOut: todayTx ? todayTx[3] : 0
      };
    });

    return { success: true, data: result };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 4. API: Save Daily Input
function apiSaveDailyInput(payload) {
  try {
    var code = payload.code;
    var dateString = payload.date;
    var qtyIn = payload.qtyIn;
    var qtyOut = payload.qtyOut;
    var ket = payload.ket;
    var handcarry = payload.handcarry;

    var txSheet = getSheet("Transactions");
    var monthlySheet = getSheet("Monthly");
    
    var queryDate = new Date(dateString);
    var month = queryDate.getUTCMonth() + 1;
    var year = queryDate.getUTCFullYear();

    // Update transactions
    if (qtyIn !== undefined && qtyOut !== undefined) {
      var txData = txSheet.getDataRange().getValues();
      var foundTxIdx = -1;
      for (var i = 1; i < txData.length; i++) {
        if (txData[i][0] == code && new Date(txData[i][1]).getTime() == queryDate.getTime()) {
          foundTxIdx = i;
          break;
        }
      }
      if (foundTxIdx > -1) {
        txSheet.getRange(foundTxIdx + 1, 3).setValue(qtyIn);
        txSheet.getRange(foundTxIdx + 1, 4).setValue(qtyOut);
      } else {
        txSheet.appendRow([code, queryDate.toISOString(), qtyIn, qtyOut]);
      }
    }

    // Update Monthly
    if (ket !== undefined || handcarry !== undefined) {
      var mData = monthlySheet.getDataRange().getValues();
      var foundMIdx = -1;
      for (var i = 1; i < mData.length; i++) {
        if (mData[i][0] == code && mData[i][1] == month && mData[i][2] == year) {
          foundMIdx = i;
          break;
        }
      }
      
      if (foundMIdx > -1) {
        if (ket !== undefined) monthlySheet.getRange(foundMIdx + 1, 5).setValue(ket);
        if (handcarry !== undefined) monthlySheet.getRange(foundMIdx + 1, 6).setValue(handcarry);
      } else {
        var mKet = ket !== undefined ? ket : '';
        var mHc = handcarry !== undefined ? handcarry : '';
        monthlySheet.appendRow([code, month, year, 0, mKet, mHc]); // Assumes SaldoAwal is 0 if missing
      }
    }

    return { success: true, message: 'Saved successfully' };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 5. API: Dashboard
function apiGetDashboard() {
  try {
    var masterSheet = getSheet("Master");
    var txSheet = getSheet("Transactions");
    var monthlySheet = getSheet("Monthly");

    var masterData = masterSheet.getDataRange().getValues().slice(1);
    var txData = txSheet.getDataRange().getValues().slice(1);
    var monthlyData = monthlySheet.getDataRange().getValues().slice(1);

    var today = new Date();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();

    var totalSaldoAwal = 0;
    var totalMasuk = 0;
    var totalKeluar = 0;
    var totalSisa = 0;

    var lowStockItems = [];

    masterData.forEach(function(row) {
      var code = row[0];
      var spec = row[1];

      var mRow = monthlyData.find(function(m) { return m[0] == code && m[1] == month && m[2] == year; });
      var saldo = mRow ? mRow[3] : 0;

      var txs = txData.filter(function(t) { 
        var tDate = new Date(t[1]);
        return t[0] == code && tDate.getMonth() + 1 == month && tDate.getFullYear() == year;
      });

      var masuk = txs.reduce(function(acc, t) { return acc + (t[2] || 0); }, 0);
      var keluar = txs.reduce(function(acc, t) { return acc + (t[3] || 0); }, 0);
      var sisa = saldo + masuk - keluar;

      totalSaldoAwal += saldo;
      totalMasuk += masuk;
      totalKeluar += keluar;
      totalSisa += sisa;

      if (sisa <= 10) {
        lowStockItems.push({ code: code, spec: spec, sisa: sisa });
      }
    });

    return {
      success: true,
      data: {
        totalSaldoAwal: totalSaldoAwal,
        totalMasuk: totalMasuk,
        totalKeluar: totalKeluar,
        totalSisa: totalSisa,
        lowStockItems: lowStockItems.slice(0, 5),
        monthName: today.toLocaleString('id-ID', { month: 'long' }),
        year: year
      }
    };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 6. API: Monthly Recap
function apiGetRecap(monthStr, yearStr) {
  try {
    var month = parseInt(monthStr);
    var year = parseInt(yearStr);

    var masterSheet = getSheet("Master");
    var txSheet = getSheet("Transactions");
    var monthlySheet = getSheet("Monthly");

    var masterData = masterSheet.getDataRange().getValues().slice(1);
    var txData = txSheet.getDataRange().getValues().slice(1);
    var monthlyData = monthlySheet.getDataRange().getValues().slice(1);

    var result = masterData.map(function(row) {
      var code = row[0];
      var spec = row[1];
      var unit = row[2];

      var mRow = monthlyData.find(function(m) { return m[0] == code && m[1] == month && m[2] == year; });
      var saldoAwal = mRow ? mRow[3] : 0;
      var ket = mRow ? mRow[4] : '';
      var handcarry = mRow ? mRow[5] : '';

      var txs = txData.filter(function(t) { 
        var tDate = new Date(t[1]);
        return t[0] == code && tDate.getUTCMonth() + 1 == month && tDate.getUTCFullYear() == year;
      });

      var masuk = txs.reduce(function(acc, t) { return acc + (t[2] || 0); }, 0);
      var keluar = txs.reduce(function(acc, t) { return acc + (t[3] || 0); }, 0);
      var sisa = saldoAwal + masuk - keluar;

      return {
        id: code,
        code: code,
        spec: spec,
        unit: unit,
        saldoAwal: saldoAwal,
        masuk: masuk,
        keluar: keluar,
        sisa: sisa,
        ket: ket,
        handcarry: handcarry
      };
    });

    return { success: true, data: result };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 7. API: Save Import Data
function apiSaveImport(payload) {
  try {
    var masterSheet = getSheet("Master");
    var txSheet = getSheet("Transactions");
    var monthlySheet = getSheet("Monthly");

    var month = payload.month || 6;
    var year = payload.year || 2026;

    var masterLast = masterSheet.getLastRow();
    if (masterLast > 1) masterSheet.getRange(2, 1, masterLast - 1, masterSheet.getLastColumn()).clearContent();

    var txLast = txSheet.getLastRow();
    if (txLast > 1) txSheet.getRange(2, 1, txLast - 1, txSheet.getLastColumn()).clearContent();

    var monthlyLast = monthlySheet.getLastRow();
    if (monthlyLast > 1) monthlySheet.getRange(2, 1, monthlyLast - 1, monthlySheet.getLastColumn()).clearContent();

    var masterRows = [];
    var monthlyRows = [];
    var txRows = [];

    payload.items.forEach(function(item) {
      masterRows.push([item.code, item.spec, item.unit]);
      monthlyRows.push([item.code, month, year, item.saldoAwal, item.ket, item.handcarry]);
    });

    payload.transactions.forEach(function(t) {
      // Date in JS starts month from 0, so month - 1
      // We set time to UTC midnight to avoid timezone shifts
      var tDate = new Date(Date.UTC(year, month - 1, t.date));
      var qtyIn = t.type === 'M' ? t.qty : 0;
      var qtyOut = t.type === 'K' ? t.qty : 0;
      txRows.push([t.code, tDate.toISOString(), qtyIn, qtyOut]);
    });

    if (masterRows.length > 0) {
      masterSheet.getRange(2, 1, masterRows.length, masterRows[0].length).setValues(masterRows);
    }
    if (monthlyRows.length > 0) {
      monthlySheet.getRange(2, 1, monthlyRows.length, monthlyRows[0].length).setValues(monthlyRows);
    }
    if (txRows.length > 0) {
      txSheet.getRange(2, 1, txRows.length, txRows[0].length).setValues(txRows);
    }

    return { success: true, message: 'Import successful' };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 8. API: Add Product
function apiAddProduct(payload) {
  try {
    var code = payload.code;
    var spec = payload.spec || '';
    var unit = payload.unit || '';
    var saldoAwal = payload.saldoAwal || 0;

    if (!code) {
      return { success: false, error: 'Code is required' };
    }

    var masterSheet = getSheet("Master");
    var masterData = masterSheet.getDataRange().getValues();
    
    for (var i = 1; i < masterData.length; i++) {
      if (masterData[i][0] == code) {
        return { success: false, error: 'Product with this code already exists' };
      }
    }

    // Add to Master
    masterSheet.appendRow([code, spec, unit]);

    // Add to Monthly (current month)
    var today = new Date();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    
    var monthlySheet = getSheet("Monthly");
    // columns: CODE, MONTH, YEAR, SALDO_AWAL, KET, HANDCARRY
    monthlySheet.appendRow([code, month, year, saldoAwal, '', '']);

    return { success: true, message: 'Product added successfully' };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 9. API: Get Product Reports
function apiGetProductReports(itemId) {
  try {
    var code = itemId; // In GAS, itemId is the item CODE
    var masterSheet = getSheet("Master");
    var masterData = masterSheet.getDataRange().getValues().slice(1);
    
    var itemRow = masterData.find(function(row) { return row[0] == code; });
    if (!itemRow) return { success: false, error: 'Product not found' };
    
    var item = {
      id: code,
      code: itemRow[0],
      spec: itemRow[1],
      unit: itemRow[2],
      productReports: []
    };

    var reportsSheet = getSheet("ProductReports", ["CODE", "PO", "TGL_PO", "ORDER_QTY", "PIC", "NO_GR", "KETERANGAN"]);
    var reportsData = reportsSheet.getDataRange().getValues().slice(1);
    
    var productReports = [];
    reportsData.forEach(function(row, index) {
      if (row[0] == code) {
        productReports.push({
          id: index + 1, // pseudo-id
          po: row[1],
          tglPo: row[2],
          orderQty: row[3],
          pic: row[4],
          noGr: row[5],
          keterangan: row[6]
        });
      }
    });

    // Sort descending by tglPo
    productReports.sort(function(a, b) {
      return new Date(b.tglPo) - new Date(a.tglPo);
    });

    item.productReports = productReports;

    return { success: true, data: item };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// 10. API: Add Product Report
function apiAddProductReport(payload) {
  try {
    var code = payload.itemId;
    var po = payload.po;
    var tglPo = payload.tglPo;
    var orderQty = payload.orderQty || 0;
    var pic = payload.pic || '';
    var noGr = payload.noGr || '';
    var keterangan = payload.keterangan || '';

    if (!code || !po || !tglPo) {
      return { success: false, error: 'Missing required fields' };
    }

    var reportsSheet = getSheet("ProductReports", ["CODE", "PO", "TGL_PO", "ORDER_QTY", "PIC", "NO_GR", "KETERANGAN"]);
    reportsSheet.appendRow([code, po, new Date(tglPo).toISOString(), orderQty, pic, noGr, keterangan]);

    var newReport = {
      id: reportsSheet.getLastRow() - 1,
      po: po,
      tglPo: new Date(tglPo).toISOString(),
      orderQty: orderQty,
      pic: pic,
      noGr: noGr,
      keterangan: keterangan
    };

    return { success: true, data: newReport, message: 'Report added successfully' };
  } catch(e) {
    return { success: false, error: e.message };
  }
}
