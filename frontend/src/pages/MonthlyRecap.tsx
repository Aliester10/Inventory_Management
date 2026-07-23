import { useState, useEffect } from 'react';
import { Download, Filter, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';
import { api } from '../api';

const formatNumber = (num: any) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return Number(num).toLocaleString('id-ID');
};

const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 1 + i;
  return { value: String(y), label: String(y) };
});

export function MonthlyRecap() {
  const navigate = useNavigate();
  
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    setLoading(true);
    api.getRecap(month, year)
      .then((res: any) => {
        if(res.success) {
          setData(res.data);
          setCurrentPage(1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = data.map((item, index) => ({
      'NO': index + 1,
      'CODE': item.code,
      'SPEC': item.spec,
      'KET': item.ket || '-',
      'HANDCARRY': item.handcarry || '-',
      'SALDO AWAL': item.saldoAwal,
      'MASUK': item.masuk,
      'KELUAR': item.keluar,
      'SISA BARANG': item.sisa,
      'UNIT': item.unit
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${month}-${year}`);
    
    XLSX.writeFile(workbook, `Rekap_Export_${month}_${year}.xlsx`);
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
            <Filter size={20} className="ml-2 mr-2" />
            <CustomSelect 
              options={MONTHS} 
              value={month} 
              onChange={setMonth} 
            />
            <CustomSelect 
              options={YEARS} 
              value={year} 
              onChange={setYear} 
            />
          </div>
          
          <Button variant="accent" className="flex items-center gap-2" onClick={handleExport}>
            <Download size={20} /> Export Excel
          </Button>
        </div>
      </header>

      <div className="neo-box bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
          <thead>
            <tr className="bg-[#ffed66] border-b-[3px] border-[#1a1a1a]">
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] w-[25%]">CODE / SPEC</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-[15%]">KET</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-[15%]">HANDCARRY</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-[10%]">SALDO AWAL</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-[10%]">MASUK</th>
              <th className="p-3 font-black border-r-[3px] border-[#1a1a1a] text-center w-[10%]">KELUAR</th>
              <th className="p-3 font-black text-center w-[15%]">SISA BARANG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 font-bold">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500 font-bold">
                  <div className="flex flex-col items-center justify-center">
                    <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                    Belum ada data di bulan ini.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => navigate(`/report/${item.id}`)}
                  className="border-b-[3px] border-[#1a1a1a] hover:bg-yellow-100 last:border-0 transition-colors cursor-pointer group"
                >
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] break-words">
                    <div className="font-black font-mono whitespace-normal break-words group-hover:text-blue-600 transition-colors">{item.code}</div>
                    <div className="text-sm font-bold text-gray-600 whitespace-normal break-words">{item.spec}</div>
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center text-sm font-bold whitespace-normal break-words max-w-[150px]">
                    {item.ket || '-'}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center text-sm font-bold whitespace-normal break-words max-w-[150px]">
                    {item.handcarry || '-'}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-gray-500">
                    {formatNumber(item.saldoAwal)}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-green-600">
                    +{formatNumber(item.masuk)}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-red-600">
                    -{formatNumber(item.keluar)}
                  </td>
                  <td className="p-3 text-center font-black text-xl">
                    {formatNumber(item.sisa)}
                    <span className="text-xs font-bold text-gray-500 block">{item.unit}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="neo-box bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold">
              Tampilkan:
              <select 
                className="neo-input py-1 px-2 cursor-pointer"
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-gray-600 font-bold">
              Total {data.length} barang
            </div>
          </div>
          
          <div className="flex items-center gap-4 font-bold">
            <div>
              Halaman {currentPage} dari {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="!p-2 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button 
                variant="secondary" 
                className="!p-2 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
