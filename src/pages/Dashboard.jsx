import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bike, AlertTriangle, ScanLine, Shield } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ helmets: 0, lost: 0, scans: 0 });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil nama dari profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('nama')
      .eq('id', user.id)
      .single();
    
    if (profile) setUserName(profile.nama);

    // Hitung helm
    const { count: helmetCount } = await supabase
      .from('helmets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Hitung helm hilang
    const { count: lostCount } = await supabase
      .from('helmets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'HILANG');

    // Hitung total scan
    const { data: myHelmets } = await supabase
      .from('helmets')
      .select('id')
      .eq('user_id', user.id);
    
    const helmetIds = myHelmets?.map(h => h.id) || [];
    let scanCount = 0;
    if (helmetIds.length > 0) {
      const { count } = await supabase
        .from('scan_history')
        .select('*', { count: 'exact', head: true })
        .in('helmet_id', helmetIds);
      scanCount = count || 0;
    }

    setStats({ 
      helmets: helmetCount || 0, 
      lost: lostCount || 0, 
      scans: scanCount 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={32} className="text-safe" />
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Selamat Datang, {userName || 'Pemilik Helm'}!</h2>
          <p className="text-gray-600">Ini adalah ringkasan keamanan helm kamu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4 border-l-4 border-navy-500">
          <Bike size={32} className="text-navy-500" />
          <div>
            <p className="text-gray-500 text-sm">Total Helm</p>
            <p className="text-3xl font-bold">{stats.helmets}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4 border-l-4 border-lost">
          <AlertTriangle size={32} className="text-lost" />
          <div>
            <p className="text-gray-500 text-sm">Status Hilang</p>
            <p className="text-3xl font-bold">{stats.lost}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4 border-l-4 border-safe">
          <ScanLine size={32} className="text-safe" />
          <div>
            <p className="text-gray-500 text-sm">Total Pemindaian</p>
            <p className="text-3xl font-bold">{stats.scans}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-2">🎯 Mulai dari sini:</h3>
        <p className="text-gray-600">Klik menu <strong>"Helm Saya"</strong> di sidebar untuk mendaftarkan helm pertamamu dan membuat QR Code!</p>
      </div>
    </div>
  );
}