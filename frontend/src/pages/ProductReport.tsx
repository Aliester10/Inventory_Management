import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/Button';

export function ProductReport() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Removed modal state since it moved to DailyInput

  const fetchItemData = async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res: any = await api.getProductReports(itemId as string | number);
      if (res.success) {
        setItem(res.data);
      } else {
        setError(res.error || 'Failed to fetch item data');
      }
    } catch (err: any) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [itemId]);

  // handleAddSubmit was moved to DailyInput

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 font-bold">
        <Loader2 className="animate-spin mb-4" size={48} />
        Memuat data produk...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-red-50 p-8 flex flex-col items-center justify-center neo-box">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-red-700">Error</h2>
        <p className="font-bold text-red-600">{error || 'Produk tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/recap')} variant="secondary" className="mt-4 flex items-center gap-2">
          <ChevronLeft size={20} /> Kembali ke Rekap
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => navigate('/recap')} variant="secondary" className="!p-2 flex items-center justify-center" title="Kembali">
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-3xl font-black uppercase bg-[#ff5e5b] text-white inline-block px-4 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-1">
              REPORT PRODUK
            </h1>
          </div>
          <p className="font-bold text-gray-700 text-xl bg-white px-4 py-2 neo-box inline-block">
            <span className="font-mono text-blue-600">{item.code}</span> - {item.spec}
          </p>
        </div>
        {/* Action button moved to DailyInput */}
      </header>

      <div className="bg-white neo-box overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#00cecb] border-b-[3px] border-[#1a1a1a]">
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a]">PO</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-40">TGL PO</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">ORDER QTY</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-40">NO GR</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-48">PIC</th>
              <th className="p-4 font-black">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {!item.productReports || item.productReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500 font-bold">
                  Belum ada data PO untuk produk ini.
                </td>
              </tr>
            ) : (
              item.productReports.map((report: any) => (
                <tr key={report.id} className="border-b-[3px] border-[#1a1a1a] hover:bg-gray-50 last:border-0 transition-colors">
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] font-bold">
                    {report.po}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-bold">
                    {new Date(report.tglPo).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-blue-600">
                    {report.orderQty}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-bold">
                    {report.noGr || '-'}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-bold">
                    {report.pic || '-'}
                  </td>
                  <td className="p-4 font-medium break-words">
                    {report.keterangan || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal moved to DailyInput */}
    </div>
  );
}
