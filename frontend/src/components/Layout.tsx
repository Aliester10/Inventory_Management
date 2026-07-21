import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, PlusCircle, FileSpreadsheet, Upload } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <Package size={20} /> },
    { path: '/input', label: 'Input Harian', icon: <PlusCircle size={20} /> },
    { path: '/recap', label: 'Rekap Bulanan', icon: <FileSpreadsheet size={20} /> },
    { path: '/import', label: 'Import Excel', icon: <Upload size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#fdf5e6]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-[3px] border-[#1a1a1a] flex flex-col justify-between shadow-[4px_0px_0px_0px_rgba(26,26,26,1)] z-10 relative">
        <div>
          <div className="p-6 border-b-[3px] border-[#1a1a1a] bg-[#ffed66]">
            <h1 className="text-2xl font-black uppercase tracking-tight">Stock<br/>Master</h1>
          </div>
          <nav className="p-4 space-y-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 border-[3px] border-[#1a1a1a] font-bold rounded-md transition-all ${
                    isActive 
                      ? 'bg-[#ff5e5b] text-white shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] translate-x-[2px] translate-y-[2px]' 
                      : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
