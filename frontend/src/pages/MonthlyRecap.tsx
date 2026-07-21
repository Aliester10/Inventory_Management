import { useState, useEffect } from 'react';
import { Download, Filter, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../api';

export function MonthlyRecap() {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getRecap(month, year)
      .then((res: any) => {
        if(res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  const handleExport = () => {
    window.location.href = `http://localhost:3000/api/recap/export?month=${month}&year=${year}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase bg-[#00cecb] inline-block px-4 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-1 mb-2">
            Rekap Bulanan
          </h1>
          <p className="font-medium text-gray-700">Laporan transaksi dan sisa barang per bulan.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="neo-box bg-white p-2 flex items-center gap-2">
            <Filter size={20} className="ml-2" />
            <select className="neo-input py-1 bg-transparent border-none shadow-none font-bold" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
            </select>
            <select className="neo-input py-1 bg-transparent border-none shadow-none font-bold" value={year} onChange={e => setYear(e.target.value)}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          
          <Button variant="accent" className="flex items-center gap-2" onClick={handleExport}>
            <Download size={20} /> Export Excel
          </Button>
        </div>
      </header>

      <div className="neo-box bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#ffed66] border-b-[3px] border-[#1a1a1a]">
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] w-56">CODE / SPEC</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">KET</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">HANDCARRY</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center">SALDO AWAL</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center">MASUK</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center">KELUAR</th>
              <th className="p-3 font-black text-center">SISA BARANG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500 font-bold flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  Memuat data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 font-bold flex flex-col items-center justify-center">
                  <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                  Belum ada data di bulan ini.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b-[3px] border-[#1a1a1a] hover:bg-gray-50 last:border-0 transition-colors">
                  <td className="p-3 border-r-[3px] border-[#1a1a1a]">
                    <div className="font-black font-mono">{item.code}</div>
                    <div className="text-sm font-bold text-gray-600 whitespace-normal break-words max-w-[300px]">{item.spec}</div>
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center text-sm font-bold whitespace-normal break-words max-w-[150px]">
                    {item.ket || '-'}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center text-sm font-bold whitespace-normal break-words max-w-[150px]">
                    {item.handcarry || '-'}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-gray-500">
                    {item.saldoAwal}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-green-600">
                    +{item.masuk}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-red-600">
                    -{item.keluar}
                  </td>
                  <td className="p-3 text-center font-black text-xl">
                    {item.sisa}
                    <span className="text-xs font-bold text-gray-500 block">{item.unit}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
