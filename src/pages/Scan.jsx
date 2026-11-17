import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, CheckCircle, AlertTriangle, Shield, Loader2, XCircle } from 'lucide-react';

export default function Scan() {
  const { helmetId } = useParams();
  const [helmet, setHelmet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState('auto-trigger'); // auto-trigger, asking-permission, scanning, success, error, denied
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // AUTO-TRIGGER: Begitu halaman terbuka, langsung jalankan proses scan
    startAutoScan();
  }, [helmetId]);

  const startAutoScan = async () => {
    try {
      // 1. Ambil data helm dari database
      const { data, error } = await supabase
        .from('helmets')
        .select('*')
        .eq('id', helmetId)
        .single();

      if (error || !data) {
        setScanStatus('error');
        setErrorMessage('Helm tidak ditemukan di sistem HELM GUARD.');
        setLoading(false);
        return;
      }

      setHelmet(data);
      setLoading(false);

      // 2. AUTO: Langsung minta izin lokasi tanpa klik tombol
      setScanStatus('asking-permission');
      
      if (!navigator.geolocation) {
        // Browser tidak support GPS, tetap kirim scan tanpa lokasi
        await saveScanData(null, null, false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await saveScanData(latitude, longitude, true);
        },
        async (error) => {
          // User menolak izin lokasi
          if (error.code === 1) { // PERMISSION_DENIED
            setScanStatus('denied');
            // TETAP simpan scan tanpa lokasi
            await saveScanData(null, null, false);
          } else {
            // Error lain (timeout, posisi tidak tersedia)
            await saveScanData(null, null, false);
          }
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 0 
        }
      );
    } catch (err) {
      setScanStatus('error');
      setErrorMessage('Terjadi error: ' + err.message);
      setLoading(false);
    }
  };

  const saveScanData = async (lat, lng, hasPermission) => {
    setScanStatus('scanning');
    try {
      // 1. Simpan ke riwayat scan
      const { error: scanError } = await supabase.from('scan_history').insert({
        helmet_id: helmetId,
        latitude: lat,
        longitude: lng,
        location_permission: hasPermission
      });

      if (scanError) throw scanError;

      // 2. Buat notifikasi untuk pemilik
      const isLost = helmet.status === 'HILANG';
      const locationInfo = hasPermission 
        ? `di koordinat (${lat?.toFixed(5)}, ${lng?.toFixed(5)})` 
        : '(lokasi tidak tersedia)';
      
      const message = isLost 
        ? `🚨 PERINGATAN! Helm "${helmet.nama_helm}" yang dilaporkan HILANG baru saja dipindai ${locationInfo}!` 
        : `🔔 Helm "${helmet.nama_helm}" Anda baru saja dipindai ${locationInfo}.`;
      
      await supabase.from('notifications').insert({
        user_id: helmet.user_id,
        helmet_id: helmetId,
        message: message
      });

      // 3. Tampilkan sukses
      setScanStatus('success');
    } catch (err) {
      setScanStatus('error');
      setErrorMessage('Gagal menyimpan data: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Memproses pemindaian...</p>
        </div>
      </div>
    );
  }

  const isLost = helmet?.status === 'HILANG';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center text-white ${isLost ? 'bg-lost' : 'bg-navy-500'}`}>
          {isLost ? (
            <AlertTriangle size={48} className="mx-auto mb-2 animate-pulse" />
          ) : (
            <Shield size={48} className="mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold">HELM GUARD</h1>
          <p className="text-sm opacity-90 mt-1">Sistem Keamanan Helm Cerdas</p>
        </div>
        
        {/* Konten */}
        <div className="p-6 space-y-4">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">{helmet?.nama_helm}</h2>
            <p className="text-gray-600">{helmet?.merek} • {helmet?.warna}</p>
            {helmet?.deskripsi && (
              <p className="text-xs text-gray-500 mt-2 italic">"{helmet.deskripsi}"</p>
            )}
            
            {isLost && (
              <div className="mt-3 bg-red-50 border border-lost text-lost p-2 rounded-lg text-sm font-bold">
                ⚠️ HELM INI DILAPORKAN HILANG OLEH PEMILIK
              </div>
            )}
          </div>

          {/* Status Auto-Trigger */}
          {scanStatus === 'asking-permission' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
              <MapPin className="mx-auto mb-2 text-navy-500" size={32} />
              <p className="font-bold text-navy-900">Tolong Izinkan Lokasi 📍</p>
              <p className="text-sm text-gray-600 mt-2">
                Klik <strong>"Izinkan/Allow"</strong> pada popup browser untuk mengirim lokasi helm ke pemilik.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ⏳ Menunggu respons...
              </p>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <div className="text-center py-4 text-navy-500 font-semibold flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" size={32} />
              <p>Mengirim data ke pemilik helm...</p>
            </div>
          )}

          {scanStatus === 'success' && (
            <div className="bg-green-50 border border-safe text-safe p-4 rounded-xl text-center">
              <CheckCircle className="mx-auto mb-2" size={40} />
              <p className="font-bold text-lg">✅ Pemindaian Berhasil!</p>
              <p className="text-sm mt-2">
                {isLost 
                  ? 'Pemilik helm sudah menerima notifikasi darurat.' 
                  : 'Pemilik helm sudah menerima notifikasi.'}
              </p>
              <p className="text-xs text-gray-600 mt-3">
                Terima kasih sudah membantu! 🙏
              </p>
            </div>
          )}

          {scanStatus === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-xl text-center">
              <XCircle className="mx-auto mb-2" size={32} />
              <p className="font-bold">Lokasi Tidak Dikirim</p>
              <p className="text-sm mt-1">
                Pemilik tetap menerima notifikasi bahwa helm dipindai, tapi tanpa lokasi.
              </p>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="bg-red-50 border border-lost text-lost p-4 rounded-xl text-center">
              <AlertTriangle className="mx-auto mb-2" size={32} />
              <p className="font-bold">Gagal Memproses</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
          Auto-Triggered by NFC Tap • HELM GUARD Security System
        </div>
      </div>
    </div>
  );
}