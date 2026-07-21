import { useState, useEffect } from 'react';
import { Search, AlertCircle, Loader2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/Button';

export function DailyInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [newProduct, setNewProduct] = useState({ code: '', spec: '', unit: '', saldoAwal: 0 });

  const fetchItems = () => {
    setLoading(true);
    api.getDailyItems(selectedDate)
      .then((res: any) => {
        if(res.success) setItems(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [selectedDate]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code) {
      setAddError('CODE wajib diisi!');
      return;
    }
    
    setIsSubmitting(true);
    setAddError('');
    try {
      const res = await api.addProduct(newProduct);
      if (res.success) {
        setShowAddModal(false);
        setNewProduct({ code: '', spec: '', unit: '', saldoAwal: 0 });
        fetchItems(); // Refresh list
      } else {
        setAddError(res.error || 'Gagal menambahkan produk');
      }
    } catch (err: any) {
      setAddError('Terjadi kesalahan saat menambahkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setUTCDate(d.getUTCDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSave = (code: string, type: 'qtyIn' | 'qtyOut' | 'ket' | 'handcarry', value: string) => {
    let numValue: any = value;
    if (type === 'qtyIn' || type === 'qtyOut') {
      numValue = parseInt(value) || 0;
    }
    
    // Optimistic UI update
    const newItems = items.map(item => {
      if (item.code === code) {
        return { ...item, [type]: numValue };
      }
      return item;
    });
    setItems(newItems);

    // Send to backend
    const item = items.find(i => i.code === code);
    if (!item) return;

    api.saveDailyInput({
      code,
      date: selectedDate,
      qtyIn: type === 'qtyIn' ? numValue : item.qtyIn,
      qtyOut: type === 'qtyOut' ? numValue : item.qtyOut,
      ket: type === 'ket' ? numValue : item.ket,
      handcarry: type === 'handcarry' ? numValue : item.handcarry,
    }).catch((err: any) => console.error('Failed to save:', err));
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredItems = items.filter(item => 
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.spec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase bg-[#ffed66] inline-block px-4 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -rotate-1 mb-2">
            Input Harian
          </h1>
          <p className="font-medium text-gray-700 mt-2">Catat barang masuk & keluar harian.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => changeDate(-1)}
            className="p-3 bg-white border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] active:translate-y-[0px] active:translate-x-[0px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all rounded-md flex items-center justify-center"
            title="Hari Sebelumnya"
          >
            <ChevronLeft size={20} className="font-black" />
          </button>
          
          <div className="flex items-center space-x-3 bg-white p-3 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] neo-box">
            <label className="font-bold">Tanggal:</label>
            <input 
              type="date" 
              className="neo-input font-bold cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button 
            onClick={() => changeDate(1)}
            className="p-3 bg-white border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] active:translate-y-[0px] active:translate-x-[0px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all rounded-md flex items-center justify-center"
            title="Hari Berikutnya"
          >
            <ChevronRight size={20} className="font-black" />
          </button>
        </div>
      </header>

      {/* Search Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            className="neo-input w-full pl-12 py-3 text-lg"
            placeholder="Cari barang berdasarkan CODE atau SPEC... (Tekan / untuk fokus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Tambah Produk
        </Button>
      </div>

      {/* Input Table */}
      <div className="bg-white neo-box overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b-[3px] border-[#1a1a1a] bg-[#00cecb]">
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] w-64">CODE / SPEC</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">KET</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center w-32">HANDCARRY</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center">SALDO AWAL</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center bg-green-100">MASUK</th>
              <th className="p-4 font-black border-r-[3px] border-[#1a1a1a] text-center bg-red-100">KELUAR</th>
              <th className="p-4 font-black text-center">SISA BARANG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-bold flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  Memuat data...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-bold flex flex-col items-center justify-center">
                  <AlertCircle size={48} className="mb-4 opacity-20" />
                  Barang tidak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="border-b-[3px] border-[#1a1a1a] hover:bg-gray-50 last:border-0 group transition-colors">
                  <td className="p-3 border-r-[3px] border-[#1a1a1a]">
                    <div className="font-black font-mono">{item.code}</div>
                    <div className="text-sm font-bold text-gray-600">{item.spec}</div>
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] bg-white">
                    <input 
                      type="text" 
                      placeholder="-"
                      value={item.ket || ''}
                      onChange={(e) => setItems(prev => prev.map(i => i.code === item.code ? { ...i, ket: e.target.value } : i))}
                      onBlur={(e) => handleSave(item.code, 'ket', e.target.value)}
                      className="w-full neo-input py-1 px-2 text-center font-bold text-sm bg-white"
                    />
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] bg-white">
                    <input 
                      type="text" 
                      placeholder="-"
                      value={item.handcarry || ''}
                      onChange={(e) => setItems(prev => prev.map(i => i.code === item.code ? { ...i, handcarry: e.target.value } : i))}
                      onBlur={(e) => handleSave(item.code, 'handcarry', e.target.value)}
                      className="w-full neo-input py-1 px-2 text-center font-bold text-sm bg-white"
                    />
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] text-center font-black text-xl text-gray-600">
                    {item.saldoAwal}
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] bg-green-50">
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={item.qtyIn || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setItems(prev => prev.map(i => i.code === item.code ? { ...i, qtyIn: val } : i));
                      }}
                      onBlur={(e) => handleSave(item.code, 'qtyIn', e.target.value)}
                      className="w-full neo-input py-1 text-center font-black text-lg text-green-700 bg-white focus:bg-green-100"
                    />
                  </td>
                  <td className="p-3 border-r-[3px] border-[#1a1a1a] bg-red-50">
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={item.qtyOut || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setItems(prev => prev.map(i => i.code === item.code ? { ...i, qtyOut: val } : i));
                      }}
                      onBlur={(e) => handleSave(item.code, 'qtyOut', e.target.value)}
                      className="w-full neo-input py-1 text-center font-black text-lg text-red-700 bg-white focus:bg-red-100"
                    />
                  </td>
                  <td className="p-3 text-center font-black text-xl">
                    {item.stock + (item.qtyIn || 0) - (item.qtyOut || 0)}
                    <span className="text-xs font-bold text-gray-500 block">{item.unit}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white neo-box p-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Tampilkan:</span>
            <select 
              className="neo-input py-1 px-2 text-sm font-bold bg-white"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
            <span className="font-bold text-sm text-gray-500 ml-2">
              Total {filteredItems.length} barang
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold text-sm">
              Halaman {currentPage} dari {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="p-1 px-2 flex items-center justify-center"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button 
                variant="secondary" 
                className="p-1 px-2 flex items-center justify-center"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-[#ff5e5b] text-white p-4 neo-box font-bold flex justify-between items-center">
        <span>💡 Tip: Gunakan tombol <kbd className="bg-black text-white px-2 py-1 rounded">Tab</kbd> dan <kbd className="bg-black text-white px-2 py-1 rounded">Enter</kbd> untuk berpindah antar kolom secara cepat!</span>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white neo-box max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b-[3px] border-[#1a1a1a] bg-[#ffed66]">
              <h2 className="text-2xl font-black">TAMBAH PRODUK</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-black hover:text-white transition-colors rounded-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-100 border-[3px] border-red-500 p-3 font-bold text-red-700">
                  {addError}
                </div>
              )}
              
              <div>
                <label className="block font-bold mb-1">CODE *</label>
                <input 
                  type="text" 
                  required
                  className="neo-input w-full" 
                  value={newProduct.code}
                  onChange={e => setNewProduct({...newProduct, code: e.target.value})}
                  placeholder="Misal: BS201CR"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">SPEC</label>
                <input 
                  type="text" 
                  className="neo-input w-full" 
                  value={newProduct.spec}
                  onChange={e => setNewProduct({...newProduct, spec: e.target.value})}
                  placeholder="Deskripsi produk..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">UNIT</label>
                  <input 
                    type="text" 
                    className="neo-input w-full" 
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                    placeholder="SET/PCE/..."
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">SALDO AWAL</label>
                  <input 
                    type="number" 
                    min="0"
                    className="neo-input w-full" 
                    value={newProduct.saldoAwal}
                    onChange={e => setNewProduct({...newProduct, saldoAwal: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
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
                  Simpan Produk
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
