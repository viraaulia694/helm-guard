import { Link, useNavigate } from 'react-router-dom';
import { Shield, Bike, MapPin, History, AlertTriangle, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/helmets', icon: <Bike size={20} />, label: 'Helm Saya' },
    { path: '/lost-mode', icon: <AlertTriangle size={20} />, label: 'Mode Hilang' },
    { path: '/location', icon: <MapPin size={20} />, label: 'Lokasi Helm' },
    { path: '/history', icon: <History size={20} />, label: 'Riwayat' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifikasi' },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-white flex flex-col shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-navy-700">
        <Shield size={32} className="text-safe" />
        <h1 className="text-xl font-bold tracking-wider">HELM GUARD</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-700 transition"
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
  );
}