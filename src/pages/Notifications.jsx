import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, Shield, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notifications')
      .select(`*, helmets(nama_helm, status)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    if (confirm('Hapus notifikasi ini?')) {
      await supabase.from('notifications').delete().eq('id', id);
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Notifikasi</h2>
          <p className="text-gray-600 text-sm">Peringatan aktivitas pemindaian helm kamu</p>
        </div>
        <div className="bg-navy-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Bell size={20} />
          <span className="font-bold">{notifications.filter(n => !n.is_read).length} Belum Dibaca</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat notifikasi...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="font-bold text-lg text-gray-700">Tidak Ada Notifikasi</h3>
          <p className="text-gray-500 mt-2">Kamu akan mendapat notifikasi ketika QR Code helm dipindai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isLost = notif.helmets?.status === 'HILANG';
            return (
              <div 
                key={notif.id} 
                className={`bg-white p-4 rounded-xl shadow-md border-l-4 flex justify-between items-start transition hover:shadow-lg ${
                  notif.is_read ? 'border-gray-300 opacity-75' : (isLost ? 'border-lost' : 'border-safe')
                }`}
              >
                <div className="flex gap-3 flex-1">
                  <div className={`p-2 rounded-full h-fit ${isLost ? 'bg-red-100 text-lost' : 'bg-green-100 text-safe'}`}>
                    {isLost ? <AlertTriangle size={20} /> : <Shield size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${notif.is_read ? 'text-gray-700' : 'text-navy-900'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Helm: {notif.helmets?.nama_helm || 'Tidak Diketahui'} • {new Date(notif.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {!notif.is_read && (
                    <button 
                      onClick={() => markAsRead(notif.id)} 
                      className="text-gray-400 hover:text-safe" 
                      title="Tandai sudah dibaca"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notif.id)} 
                    className="text-gray-400 hover:text-lost" 
                    title="Hapus"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}