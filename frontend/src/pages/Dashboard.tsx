import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { api } from '../api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            <p className="text-4xl font-black">{data?.totalSaldoAwal || 0}</p>
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
            <p className="text-4xl font-black">{data?.totalMasuk || 0}</p>
          </div>
        </div>

        <div className="neo-box bg-[#ff5e5b] text-white p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Jumlah Barang Keluar</h3>
            <p className="text-4xl font-black">{data?.totalKeluar || 0}</p>
          </div>
        </div>

        <div className="neo-box bg-white p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={80} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Sisa Barang</h3>
            <p className="text-4xl font-black">{data?.totalSisa || 0}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 neo-box bg-white overflow-hidden">
        <div className="p-4 border-b-[3px] border-[#1a1a1a] bg-[#ffed66] flex items-center gap-2">
          <AlertTriangle size={20} />
          <h2 className="text-xl font-black uppercase">Stock Menipis</h2>
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
              {data?.lowStockItems?.map((i: any) => (
                <tr key={i.code} className="border-b-[3px] border-[#1a1a1a] hover:bg-gray-50 last:border-0">
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] font-mono font-bold">{i.code}</td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a]">{i.spec}</td>
                  <td className="p-4 font-black text-red-600">{i.sisa}</td>
                </tr>
              ))}
              {!data?.lowStockItems?.length && (
                <tr>
                  <td colSpan={3} className="p-4 text-center font-bold">Semua stock aman.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
