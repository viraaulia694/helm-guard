import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bike, MapPin, History, AlertTriangle, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // Untuk mendeteksi halaman aktif

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/helmets', icon: <Bike size={20} />, label: 'Helm Saya' },
    { path: '/lost-mode', icon: <AlertTriangle size={20} />, label: 'Mode Hilang' },
    { path: '/location', icon: <MapPin size={20} />, label: 'Lokasi' },
    { path: '/history', icon: <History size={20} />, label: 'Riwayat' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifikasi' },
  ];

  // Fungsi untuk cek apakah link sedang aktif
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ========================================== */}
      {/* TAMPILAN DESKTOP (Sidebar di Kiri)         */}
      {/* ========================================== */}
      <aside className="hidden md:flex w-64 bg-navy-900 text-white flex-col shadow-xl fixed h-full z-40">
        <div className="p-6 flex items-center gap-3 border-b border-navy-700">
          <Shield size={32} className="text-safe" />
          <h1 className="text-xl font-bold tracking-wider">HELM GUARD</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                isActive(item.path) ? 'bg-navy-700 text-safe font-bold' : 'hover:bg-navy-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 p-4 m-4 rounded-lg bg-lost hover:bg-red-700 transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ========================================== */}
      {/* TAMPILAN HP (Menu di Bawah)                */}
      {/* ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-1 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        {menuItems.slice(0, 5).map((item) => ( // Tampilkan 5 menu utama di HP
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center p-2 rounded-lg transition ${
              isActive(item.path) ? 'text-navy-900' : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
        
        {/* Tombol Logout kecil di pojok untuk HP */}
        <button onClick={handleLogout} className="flex flex-col items-center p-2 text-gray-400 hover:text-lost">
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">Keluar</span>
        </button>
      </nav>
    </>
  );
}