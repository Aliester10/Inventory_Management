import { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';

import * as XLSX from 'xlsx';
import { api } from '../api';

export function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setSuccess(false);
      setErrorMsg('');
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setIsParsing(true);
    setErrorMsg('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const items: any[] = [];
        const transactions: any[] = [];

        const row3 = rows[2] || [];
        const row4 = rows[3] || [];
        const dateMap: { col: number, date: number, type: 'M' | 'K' }[] = [];

        for (let i = 13; i < row4.length; i++) {
          const val = row4[i];
          if (val === 'M' || val === 'K') {
            const dateVal = row3[i] || row3[i-1];
            let dateNum = 1;
            if (dateVal instanceof Date) {
              dateNum = dateVal.getDate();
            } else if (typeof dateVal === 'string' && dateVal.includes('/')) {
              dateNum = parseInt(dateVal.split('/')[0]);
            } else if (!isNaN(Number(dateVal))) {
              dateNum = Number(dateVal);
            }
            dateMap.push({ col: i, date: dateNum, type: val as 'M' | 'K' });
          }
        }

        for (let rowIndex = 4; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          if (!row || !row[2]) continue; // Stop if CODE is empty
          
          const code = String(row[2]).trim();
          const spec = String(row[3] || '').trim();
          const unit = String(row[4] || '').trim();
          const ket = String(row[5] || '').trim();
          const handcarry = String(row[6] || '').trim();
          
          let saldoAwal = Number(row[7]) || 0;
          
          items.push({
             code, spec, unit, ket, handcarry, saldoAwal
          });

          dateMap.forEach(d => {
             let qty = Number(row[d.col]) || 0;
             if (qty > 0) {
                transactions.push({
                   code,
                   date: d.date,
                   type: d.type,
                   qty
                });
             }
          });
        }
        
        setPreviewData({ items, transactions });
      } catch (err) {
        setErrorMsg('Gagal membaca file Excel: pastikan format sesuai template.');
        console.error(err);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file Excel.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommit = async () => {
    if (!previewData) return;
    setIsCommitting(true);
    setErrorMsg('');

    try {
      const currentDate = new Date();
      const res = await api.saveImport({
        items: previewData.items,
        transactions: previewData.transactions,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
      
      if (res.success) {
        setSuccess(true);
        setPreviewData(null);
        setFile(null);
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan ke database.');
      }
    } catch (err) {
      setErrorMsg('Koneksi ke server / Apps Script gagal.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase bg-[#ffed66] inline-block px-4 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-1 mb-2">
          Import Data Excel
        </h1>
        <p className="font-medium text-gray-700 mt-2">Migrasi data historis dari template Excel lama.</p>
      </header>

      <div className="neo-box bg-white p-6">
        <label className="block font-bold text-lg mb-4">Upload File Template (.xlsx)</label>
        
        <div className="flex gap-4 items-center">
          <input 
            type="file" 
            accept=".xlsx" 
            className="neo-input flex-1"
            onChange={handleFileChange}
          />
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={handleParse}
            disabled={!file || isParsing}
          >
            {isParsing ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
            Parse Data
          </Button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-100 border-[3px] border-red-500 font-bold flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            <span className="text-red-700">{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-100 border-[3px] border-green-500 font-bold flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            <span className="text-green-700">Data berhasil di-import ke database!</span>
          </div>
        )}
      </div>

      {previewData && (
        <div className="neo-box bg-white p-6">
          <h2 className="text-2xl font-black mb-4">Preview Data</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#00cecb] border-[3px] border-[#1a1a1a]">
              <div className="font-bold">Total Master Item</div>
              <div className="text-4xl font-black">{previewData.items.length}</div>
            </div>
            <div className="p-4 bg-[#ffed66] border-[3px] border-[#1a1a1a]">
              <div className="font-bold">Total Transaksi Harian</div>
              <div className="text-4xl font-black">{previewData.transactions.length}</div>
            </div>
          </div>

          <div className="flex justify-end border-t-[3px] border-[#1a1a1a] pt-4">
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={handleCommit}
              disabled={isCommitting}
            >
              {isCommitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              Simpan Permanen ke Database
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
