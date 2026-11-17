import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, CheckCircle, Shield, Loader2 } from 'lucide-react';

export default function LostMode() {
  const [helmets, setHelmets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelmets();
  }, []);

  const fetchHelmets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('helmets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setHelmets(data);
    setLoading(false);
  };

  const toggleStatus = async (helmetId, currentStatus) => {
    const newStatus = currentStatus === 'HILANG' ? 'AMAN' : 'HILANG';
    const helmet = helmets.find(h => h.id === helmetId);
    
    // 1. Update status di database
    const { error } = await supabase
      .from('helmets')
      .update({ status: newStatus })
      .eq('id', helmetId);

    if (!error) {
      // 2. Buat notifikasi
      const { data: { user } } = await supabase.auth.getUser();
      const message = newStatus === 'HILANG'
        ? `🚨 Mode Hilang diaktifkan untuk ${helmet.nama_helm}. Setiap pemindaian akan dilaporkan.`
        : `✅ Mode Hilang dinonaktifkan untuk ${helmet.nama_helm}. Status kembali AMAN.`;
      
      await supabase.from('notifications').insert({
        user_id: user.id,
        helmet_id: helmetId,
        message: message
      });

      fetchHelmets(); // Refresh data
    } else {
      alert('Gagal mengubah status: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Mode Hilang</h2>
        <p className="text-gray-600 text-sm">
          Aktifkan mode ini jika helm kamu hilang. Pemindai akan melihat peringatan khusus.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-2" size={32} />
          Memuat data helm...
        </div>
      ) : helmets.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-bold text-lg text-gray-700">Belum Ada Helm</h3>
          <p className="text-gray-500 mt-2">Daftarkan helm dulu di menu "Helm Saya".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {helmets.map(h => (
            <div 
              key={h.id} 
              className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${
                h.status === 'HILANG' ? 'border-lost' : 'border-safe'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{h.nama_helm}</h3>
                  <p className="text-gray-600 text-sm">{h.merek} • {h.warna}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  h.status === 'HILANG' 
                    ? 'bg-lost text-white' 
                    : 'bg-safe text-white'
                }`}>
                  {h.status}
                </span>
              </div>

              {h.status === 'HILANG' && (
                <div className="bg-red-50 border border-lost text-lost p-3 rounded-lg text-sm mb-4">
                  <AlertTriangle className="inline mr-1" size={16} />
                  Helm ini sedang dalam mode hilang. Setiap pemindaian akan dilaporkan ke kamu.
                </div>
              )}

              <button
                onClick={() => toggleStatus(h.id, h.status)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition ${
                  h.status === 'HILANG'
                    ? 'bg-safe hover:bg-green-600'
                    : 'bg-lost hover:bg-red-600'
                }`}
              >
                {h.status === 'HILANG' ? (
                  <>
                    <CheckCircle size={18} /> Tandai Sudah Ditemukan (AMAN)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} /> Laporkan Hilang
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}