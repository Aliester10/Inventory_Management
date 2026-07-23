import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';
import { Link } from 'react-router-dom';
import { api } from '../api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    api.getDashboard()
      .then((res: any) => {
        if(res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  }

  const lowStockItems = data?.lowStockItems || [];
  
  const sortedLowStockItems = [...lowStockItems].sort((a, b) => {
    return sortOrder === 'asc' ? a.sisa - b.sisa : b.sisa - a.sisa;
  });

  const totalPages = Math.ceil(sortedLowStockItems.length / itemsPerPage);
  const paginatedData = sortedLowStockItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase bg-[#ffed66] inline-block px-4 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-1">
            Dashboard
          </h1>
          <p className="mt-4 text-lg font-medium">Ringkasan stock barang per hari ini.</p>
        </div>
        <Link to="/input">
          <Button variant="primary" className="text-lg flex items-center gap-2">
            <TrendingUp size={24} /> Input Transaksi
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="neo-box bg-[#ffed66] p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Saldo Awal</h3>
            <p className="text-4xl font-black">{(data?.totalSaldoAwal || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold bg-white inline-block px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              Bulan {data?.monthName} {data?.year}
            </div>
          </div>
        </div>

        <div className="neo-box bg-[#00cecb] p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Jumlah Barang Masuk</h3>
            <p className="text-4xl font-black">{(data?.totalMasuk || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="neo-box bg-[#ff5e5b] text-white p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Jumlah Barang Keluar</h3>
            <p className="text-4xl font-black">{(data?.totalKeluar || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="neo-box bg-white p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Sisa Barang</h3>
            <p className="text-4xl font-black">{(data?.totalSisa || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 neo-box bg-white overflow-hidden">
        <div className="p-4 border-b-[3px] border-[#1a1a1a] bg-[#ffed66] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <h2 className="text-xl font-black uppercase">Stock Menipis</h2>
          </div>
          <CustomSelect 
            options={[
              { value: 'desc', label: 'Sisa: Besar ke Kecil' },
              { value: 'asc', label: 'Sisa: Kecil ke Besar' }
            ]}
            value={sortOrder}
            onChange={(val) => setSortOrder(val as 'desc' | 'asc')}
          />
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[3px] border-[#1a1a1a]">
                <th className="p-4 font-black border-r-[3px] border-[#1a1a1a]">CODE</th>
                <th className="p-4 font-black border-r-[3px] border-[#1a1a1a]">SPEC</th>
                <th className="p-4 font-black">SISA</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((i: any) => (
                <tr key={i.code} className="border-b-[3px] border-[#1a1a1a] hover:bg-gray-50 last:border-0">
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] font-mono font-bold">{i.code}</td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a]">{i.spec}</td>
                  <td className="p-4 font-black text-red-600">{(i.sisa || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {!lowStockItems.length && (
                <tr>
                  <td colSpan={3} className="p-4 text-center font-bold">Semua stock aman.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {lowStockItems.length > 0 && (
          <div className="p-4 border-t-[3px] border-[#1a1a1a] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-bold">
                Tampilkan:
                <CustomSelect 
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' }
                  ]}
                  value={String(itemsPerPage)}
                  onChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="text-gray-600 font-bold">
                Total {lowStockItems.length} barang
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
    </div>
  );
}
