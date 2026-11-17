import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, Download, Trash2 } from 'lucide-react';

export default function Helmets() {
  const [helmets, setHelmets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nama_helm: '', merek: '', warna: '', deskripsi: '' });
  const [qrValue, setQrValue] = useState('');
  const [qrHelmName, setQrHelmName] = useState('');

  useEffect(() => { fetchHelmets(); }, []);

  const fetchHelmets = async () => {
    const { data } = await supabase
      .from('helmets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHelmets(data);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    const helmetId = crypto.randomUUID();
    const scanUrl = `${window.location.origin}/scan/${helmetId}`;

    const { error } = await supabase.from('helmets').insert({
      id: helmetId,
      user_id: user.id,
      ...formData,
      qr_code_url: scanUrl
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setQrValue(scanUrl);
      setQrHelmName(formData.nama_helm);
      setShowForm(false);
      setFormData({ nama_helm: '', merek: '', warna: '', deskripsi: '' });
      fetchHelmets();
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${qrHelmName.replace(/\s/g, '-')}.png`;
    downloadLink.click();
  };

  const deleteHelmet = async (id) => {
    if (confirm('Yakin mau hapus helm ini?')) {
      await supabase.from('helmets').delete().eq('id', id);
      fetchHelmets();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-navy-900">Helm Saya</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 bg-navy-500 text-white px-4 py-2 rounded-lg hover:bg-navy-700"
        >
          <Plus size={20} /> Tambah Helm
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl shadow-xl space-y-4 max-w-md w-full">
            <h3 className="font-bold text-xl text-navy-900">Daftarkan Helm Baru</h3>
            <input 
              className="w-full p-3 border rounded-lg" 
              placeholder="Nama Helm (mis: Bogo Hitam)" 
              value={formData.nama_helm} 
              onChange={e => setFormData({...formData, nama_helm: e.target.value})} 
              required 
            />
            <input 
              className="w-full p-3 border rounded-lg" 
              placeholder="Merek (mis: KYT, INK, NHK)" 
              value={formData.merek} 
              onChange={e => setFormData({...formData, merek: e.target.value})} 
              required 
            />
            <input 
              className="w-full p-3 border rounded-lg" 
              placeholder="Warna" 
              value={formData.warna} 
              onChange={e => setFormData({...formData, warna: e.target.value})} 
              required 
            />
            <textarea 
              className="w-full p-3 border rounded-lg" 
              placeholder="Deskripsi / Ciri khas (opsional)" 
              value={formData.deskripsi} 
              onChange={e => setFormData({...formData, deskripsi: e.target.value})} 
              rows={3}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-safe text-white py-3 rounded-lg font-bold hover:bg-green-600">
                Simpan & Buat QR
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="flex-1 bg-gray-200 py-3 rounded-lg font-bold hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {qrValue && (
        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-sm mx-auto border-2 border-safe">
          <h3 className="font-bold text-lg mb-2 text-navy-900">✅ QR Code Berhasil Dibuat!</h3>
          <p className="text-sm text-gray-600 mb-4">Helm: <strong>{qrHelmName}</strong></p>
          <div className="bg-white p-4 inline-block rounded-lg">
            <QRCodeCanvas id="qr-canvas" value={qrValue} size={200} className="mx-auto" />
          </div>
          <p className="text-xs text-gray-500 mt-3 mb-4">
            URL: {qrValue}
          </p>
          <button 
            onClick={downloadQR} 
            className="flex items-center gap-2 mx-auto bg-navy-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-navy-700"
          >
            <Download size={18} /> Download QR Code (PNG)
          </button>
          <p className="text-sm text-gray-600 mt-4">
            📌 Tempelkan stiker ini di bagian dalam atau luar helm kamu.
          </p>
          <button 
            onClick={() => setQrValue('')} 
            className="text-sm text-navy-500 underline mt-2"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {helmets.map(h => (
          <div key={h.id} className="bg-white p-4 rounded-xl shadow border-l-4 border-safe relative">
            <button 
              onClick={() => deleteHelmet(h.id)} 
              className="absolute top-2 right-2 text-gray-400 hover:text-lost"
            >
              <Trash2 size={18} />
            </button>
            <h3 className="font-bold text-lg">{h.nama_helm}</h3>
            <p className="text-gray-600 text-sm">{h.merek} - {h.warna}</p>
            {h.deskripsi && <p className="text-gray-500 text-xs mt-1">{h.deskripsi}</p>}
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${h.status === 'HILANG' ? 'bg-lost text-white' : 'bg-safe text-white'}`}>
              STATUS: {h.status}
            </span>
          </div>
        ))}
        {helmets.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl shadow text-center text-gray-500">
            Belum ada helm terdaftar. Klik "Tambah Helm" untuk mulai!
          </div>
        )}
      </div>
    </div>
  );
}