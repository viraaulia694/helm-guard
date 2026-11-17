import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapPin, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Location() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (locations.length > 0 && mapRef.current && !mapInstanceRef.current) {
      const firstLoc = locations[0];
      const map = L.map(mapRef.current).setView(
        [parseFloat(firstLoc.latitude), parseFloat(firstLoc.longitude)],
        15
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      locations.forEach(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng]).addTo(map);
          marker.bindPopup(`
            <div style="text-align:center;">
              <strong>${loc.helmets?.nama_helm || 'Helm'}</strong><br/>
              <small>${new Date(loc.scanned_at).toLocaleString('id-ID')}</small><br/>
              ${loc.helmets?.status === 'HILANG' ? '<span style="color:red;font-weight:bold;">🚨 HILANG</span>' : ''}
            </div>
          `);
        }
      });

      mapInstanceRef.current = map;
    }
  }, [locations]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User tidak ditemukan.');
        setLoading(false);
        return;
      }

      const { data: myHelmets, error: helmetError } = await supabase
        .from('helmets')
        .select('id, nama_helm')
        .eq('user_id', user.id);

      if (helmetError) {
        setError('Gagal mengambil data helm: ' + helmetError.message);
        setLoading(false);
        return;
      }

      const helmetIds = myHelmets?.map(h => h.id) || [];
      if (helmetIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error: scanError } = await supabase
        .from('scan_history')
        .select(`id, latitude, longitude, scanned_at, location_permission, helmet_id, helmets (nama_helm, status)`)
        .in('helmet_id', helmetIds)
        .not('latitude', 'is', null)
        .order('scanned_at', { ascending: false });

      if (scanError) {
        setError('Gagal mengambil riwayat scan: ' + scanError.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const validLocations = data.filter(loc => 
          loc.latitude && loc.longitude && 
          !isNaN(parseFloat(loc.latitude)) && 
          !isNaN(parseFloat(loc.longitude))
        );
        setLocations(validLocations);
      }
    } catch (err) {
      setError('Terjadi error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full mb-2"></div>
        <p>Memuat peta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl">
          <AlertCircle className="inline mr-2" size={20} />
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Lokasi Pemindaian</h2>
        <p className="text-gray-600 text-sm">Titik lokasi saat QR Code helm dipindai</p>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-bold text-lg text-gray-700">Belum Ada Lokasi</h3>
          <p className="text-gray-500 mt-2">
            Lokasi akan muncul setelah seseorang memindai QR Code helm kamu dan mengizinkan akses GPS.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-2 rounded-xl shadow-md border border-gray-200">
            <div ref={mapRef} style={{ height: '500px', width: '100%', borderRadius: '8px' }}></div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md max-h-[500px] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-navy-900">Riwayat Lokasi</h3>
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <p className="font-semibold text-sm">{loc.helmets?.nama_helm || 'Helm Tidak Diketahui'}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock size={12} />
                    <span>{new Date(loc.scanned_at).toLocaleString('id-ID')}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-navy-500 hover:underline font-semibold"
                  >
                    Buka di Google Maps <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-green-800">
        <strong>✅ 100% Gratis:</strong> Peta ini menggunakan OpenStreetMap. Tidak ada biaya, tidak perlu kartu kredit.
      </div>
    </div>
  );
}