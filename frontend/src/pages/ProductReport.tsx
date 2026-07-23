import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/Button';

export function ProductReport() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editReport, setEditReport] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleEdit = (report: any) => {
    setEditReport({
      ...report,
      tglPo: new Date(report.tglPo).toISOString().split('T')[0]
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus report ini?')) {
      try {
        await api.deleteProductReport(id);
        fetchItemData();
      } catch (err) {
        alert('Gagal menghapus report');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateProductReport(editReport.id, editReport);
      setIsEditModalOpen(false);
      fetchItemData();
    } catch (err) {
      alert('Gagal menyimpan perubahan');
    } finally {
      setSubmitting(false);
    }
  };

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
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-40">NO GR</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-40">TGL PO</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">ORDER QTY</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-48">PIC</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a]">KETERANGAN</th>
              <th className="p-4 font-black text-center w-32">AKSI</th>
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
                    {report.noGr || '-'}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-bold">
                    {new Date(report.tglPo).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-blue-600">
                    {report.orderQty}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] text-center font-bold">
                    {report.pic || '-'}
                  </td>
                  <td className="p-4 border-r-[3px] border-[#1a1a1a] font-medium break-words">
                    {report.keterangan || '-'}
                  </td>
                  <td className="p-4 text-center font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={() => handleEdit(report)} variant="secondary" className="!p-2 bg-blue-100 hover:bg-blue-200 text-blue-700" title="Edit">
                        <Pencil size={18} />
                      </Button>
                      <Button onClick={() => handleDelete(report.id)} variant="secondary" className="!p-2 bg-red-100 hover:bg-red-200 text-red-700" title="Hapus">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white neo-box w-full max-w-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b-[3px] border-[#1a1a1a] bg-[#ffed66] sticky top-0 z-10">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <Pencil size={28} /> Edit Report PO
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">No PO</label>
                  <input
                    type="text"
                    required
                    className="neo-input w-full"
                    value={editReport?.po || ''}
                    onChange={e => setEditReport({...editReport, po: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tanggal PO</label>
                  <input
                    type="date"
                    required
                    className="neo-input w-full"
                    value={editReport?.tglPo || ''}
                    onChange={e => setEditReport({...editReport, tglPo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">No GR (Opsional)</label>
                  <input
                    type="text"
                    className="neo-input w-full"
                    value={editReport?.noGr || ''}
                    onChange={e => setEditReport({...editReport, noGr: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Order Qty</label>
                  <input
                    type="number"
                    required
                    className="neo-input w-full"
                    value={editReport?.orderQty || ''}
                    onChange={e => setEditReport({...editReport, orderQty: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">PIC (Opsional)</label>
                  <input
                    type="text"
                    className="neo-input w-full"
                    value={editReport?.pic || ''}
                    onChange={e => setEditReport({...editReport, pic: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1">Keterangan (Opsional)</label>
                  <textarea
                    className="neo-input w-full h-24 resize-none"
                    value={editReport?.keterangan || ''}
                    onChange={e => setEditReport({...editReport, keterangan: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t-[3px] border-[#1a1a1a] mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
