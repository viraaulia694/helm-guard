import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: myHelmets } = await supabase
      .from('helmets')
      .select('id, nama_helm')
      .eq('user_id', user.id);

    const helmetIds = myHelmets?.map(h => h.id) || [];

    if (helmetIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('scan_history')
      .select(`
        id,
        latitude,
        longitude,
        location_permission,
        scanned_at,
        helmet_id,
        helmets (nama_helm)
      `)
      .in('helmet_id', helmetIds)
      .order('scanned_at', { ascending: false });

    if (data) setHistory(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Riwayat Pemindaian</h2>
        <p className="text-gray-600 text-sm">Semua aktivitas scan QR Code/NFC pada helm kamu</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-2" size={32} />
          Memuat riwayat...
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-bold text-lg text-gray-700">Belum Ada Riwayat</h3>
          <p className="text-gray-500 mt-2">
            Riwayat akan muncul setelah seseorang memindai QR Code/NFC helm kamu.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* overflow-x-auto: Mengaktifkan scroll horizontal di HP */}
          <div className="overflow-x-auto">
            {/* min-w-[600px]: Mencegah tabel mengecil/pecah di layar kecil */}
            <table className="w-full min-w-[600px]">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold">Tanggal & Waktu</th>
                  <th className="p-4 text-left text-sm font-semibold">Nama Helm</th>
                  <th className="p-4 text-left text-sm font-semibold">Koordinat</th>
                  <th className="p-4 text-left text-sm font-semibold">Izin Lokasi</th>
                  <th className="p-4 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* whitespace-nowrap: Mencegah tanggal/koordinat turun ke baris baru */}
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(item.scanned_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 font-semibold text-sm text-navy-900">
                      {item.helmets?.nama_helm || 'Tidak Diketahui'}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {item.latitude && item.longitude
                        ? `${parseFloat(item.latitude).toFixed(5)}, ${parseFloat(item.longitude).toFixed(5)}`
                        : '-'}
                    </td>
                    <td className="p-4">
                      {item.location_permission ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          <CheckCircle size={12} /> Diizinkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          <XCircle size={12} /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.latitude && item.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-navy-600 font-semibold hover:text-navy-800 hover:underline transition-colors"
                        >
                          <MapPin size={14} /> Lihat Peta
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-800">
        <strong>ℹ️ Info:</strong> "Izin Lokasi Ditolak" berarti pemindai tidak mengizinkan akses GPS. 
        Scan tetap tercatat tapi tanpa koordinat. <em>(Geser tabel ke samping jika tampilan terpotong di HP)</em>.
      </div>
    </div>
  );
}