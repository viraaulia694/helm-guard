import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

// Import Halaman
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Helmets from './pages/Helmets';
import LostMode from './pages/LostMode';
import Location from './pages/Location';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Scan from './pages/Scan';

// PENTING: Ganti 'Sidebar' dengan 'Layout' jika nama file komponen kamu adalah Layout.jsx
import Sidebar from './components/Sidebar'; 

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Cek sesi login saat pertama kali buka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Dengarkan perubahan status login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
     <Router>
      <Routes>
        {/* Route Scan & Login (Full Screen, tanpa sidebar) */}
        <Route path="/scan/:helmetId" element={<Scan />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Route Utama (Dengan Sidebar/Bottom Nav) */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50">
            {/* Sidebar (Otomatis jadi Bottom Nav di HP) */}
            <Sidebar /> 
            
            {/* Konten Utama */}
            <main className="md:ml-64 p-4 pb-24 md:pb-8"> 
              {/* md:ml-64 = Geser kanan 64px di laptop */}
              {/* pb-24 = Kasih ruang di bawah biar tidak ketutup menu HP */}
              
              <Routes>
                <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/helmets" element={session ? <Helmets /> : <Navigate to="/login" />} />
                <Route path="/lost-mode" element={session ? <LostMode /> : <Navigate to="/login" />} />
                <Route path="/location" element={session ? <Location /> : <Navigate to="/login" />} />
                <Route path="/history" element={session ? <History /> : <Navigate to="/login" />} />
                <Route path="/notifications" element={session ? <Notifications /> : <Navigate to="/login" />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;