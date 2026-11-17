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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="p-4 text-left">Tanggal & Waktu</th>
                  <th className="p-4 text-left">Nama Helm</th>
                  <th className="p-4 text-left">Koordinat</th>
                  <th className="p-4 text-left">Izin Lokasi</th>
                  <th className="p-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      {new Date(item.scanned_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 font-semibold text-sm">
                      {item.helmets?.nama_helm || 'Tidak Diketahui'}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">
                      {item.latitude && item.longitude
                        ? `${parseFloat(item.latitude).toFixed(5)}, ${parseFloat(item.longitude).toFixed(5)}`
                        : '-'}
                    </td>
                    <td className="p-4">
                      {item.location_permission ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-safe px-2 py-1 rounded-full">
                          <CheckCircle size={12} /> Diizinkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-lost px-2 py-1 rounded-full">
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
                          className="inline-flex items-center gap-1 text-sm text-navy-500 font-semibold hover:underline"
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
    </div>
  );
}