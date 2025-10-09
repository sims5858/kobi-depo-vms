import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import KoliTransfer from './pages/KoliTransfer';
import UrunToplama from './pages/UrunToplama';
import Sayim from './pages/Sayim';
import Raporlar from './pages/Raporlar';
import KoliYonetimi from './pages/KoliYonetimi';
import UrunYonetimi from './pages/UrunYonetimi';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Router>
      <div className="App">
        <Navbar onToggleSidebar={toggleSidebar} />
        <div className="d-flex">
          <Sidebar collapsed={sidebarCollapsed} />
          <div
            className="main-content flex-grow-1"
            style={{
              marginLeft: sidebarCollapsed ? 60 : 250,
              transition: 'margin-left 0.3s'
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/koli-transfer" element={<KoliTransfer />} />
              <Route path="/urun-toplama" element={<UrunToplama />} />
              <Route path="/sayim" element={<Sayim />} />
              <Route path="/raporlar" element={<Raporlar />} />
              <Route path="/koli-yonetimi" element={<KoliYonetimi />} />
              <Route path="/urun-yonetimi" element={<UrunYonetimi />} />
            </Routes>
          </div>
        </div>
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
