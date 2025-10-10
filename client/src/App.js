import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KoliTransfer from './pages/KoliTransfer';
import UrunToplama from './pages/UrunToplama';
import Sayim from './pages/Sayim';
import Raporlar from './pages/Raporlar';
import KoliYonetimi from './pages/KoliYonetimi';
import UrunYonetimi from './pages/UrunYonetimi';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini al
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  // Korumalı route component'i
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (!user || !token) {
      return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && user.rol !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <Navbar onToggleSidebar={toggleSidebar} user={user} onLogout={handleLogout} />
            <div className="d-flex">
              <Sidebar collapsed={sidebarCollapsed} user={user} />
              <div
                className="main-content flex-grow-1"
                style={{
                  marginLeft: sidebarCollapsed ? 60 : 250,
                  transition: 'margin-left 0.3s ease'
                }}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/koli-transfer" element={
                    <ProtectedRoute>
                      <KoliTransfer />
                    </ProtectedRoute>
                  } />
                  <Route path="/urun-toplama" element={
                    <ProtectedRoute>
                      <UrunToplama />
                    </ProtectedRoute>
                  } />
                  <Route path="/sayim" element={
                    <ProtectedRoute>
                      <Sayim />
                    </ProtectedRoute>
                  } />
                  <Route path="/raporlar" element={
                    <ProtectedRoute>
                      <Raporlar />
                    </ProtectedRoute>
                  } />
                  <Route path="/koli-yonetimi" element={
                    <ProtectedRoute>
                      <KoliYonetimi />
                    </ProtectedRoute>
                  } />
                  <Route path="/urun-yonetimi" element={
                    <ProtectedRoute>
                      <UrunYonetimi />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
