import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/Button';

export function ProductReport() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReport, setNewReport] = useState({
    po: '',
    tglPo: new Date().toISOString().split('T')[0],
    orderQty: 0,
    pic: '',
    keterangan: ''
  });
  const [addError, setAddError] = useState('');

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.po || !newReport.tglPo) {
      setAddError('Nomor PO dan Tanggal PO wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    setAddError('');
    try {
      const res: any = await api.addProductReport({
        itemId: itemId as string | number,
        ...newReport
      });

      if (res.success) {
        setShowAddModal(false);
        setNewReport({
          po: '',
          tglPo: new Date().toISOString().split('T')[0],
          orderQty: 0,
          pic: '',
          keterangan: ''
        });
        fetchItemData(); // refresh data
      } else {
        setAddError(res.error || 'Gagal menyimpan report PO');
      }
    } catch (err: any) {
      setAddError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
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
        
        <Button variant="accent" className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Tambah Report PO
        </Button>
      </header>

      <div className="bg-white neo-box overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#00cecb] border-b-[3px] border-[#1a1a1a]">
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a]">PO</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-40">TGL PO</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">ORDER QTY</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-48">PIC</th>
              <th className="p-4 font-black">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {!item.productReports || item.productReports.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500 font-bold">
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white neo-box max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b-[3px] border-[#1a1a1a] bg-[#ffed66]">
              <h2 className="text-2xl font-black">TAMBAH REPORT PO</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-black hover:text-white transition-colors rounded-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-100 border-[3px] border-red-500 p-3 font-bold text-red-700">
                  {addError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Nomor PO *</label>
                  <input 
                    type="text" 
                    required
                    className="neo-input w-full" 
                    value={newReport.po}
                    onChange={e => setNewReport({...newReport, po: e.target.value})}
                    placeholder="PO-XXXX..."
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tanggal PO *</label>
                  <input 
                    type="date" 
                    required
                    className="neo-input w-full" 
                    value={newReport.tglPo}
                    onChange={e => setNewReport({...newReport, tglPo: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Order Qty</label>
                  <input 
                    type="number" 
                    min="0"
                    className="neo-input w-full" 
                    value={newReport.orderQty}
                    onChange={e => setNewReport({...newReport, orderQty: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">PIC</label>
                  <input 
                    type="text" 
                    className="neo-input w-full" 
                    value={newReport.pic}
                    onChange={e => setNewReport({...newReport, pic: e.target.value})}
                    placeholder="Nama Penanggung Jawab"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan</label>
                <textarea 
                  className="neo-input w-full" 
                  rows={3}
                  value={newReport.keterangan}
                  onChange={e => setNewReport({...newReport, keterangan: e.target.value})}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  type="button" 
                  variant="default" 
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 flex justify-center items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                  Simpan Data
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
