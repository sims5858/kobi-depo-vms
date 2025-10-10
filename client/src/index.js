import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Sayfa yüklendiğinde yumuşak animasyonları etkinleştir
document.addEventListener('DOMContentLoaded', () => {
  // Ana container'a animasyon ekle
  const app = document.querySelector('.App');
  if (app) {
    app.classList.add('anim-fade-in');
  }
  
  // Navbar'a animasyon ekle
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.classList.add('anim-slide-up', 'delay-1');
  }
  
  // Sidebar'a animasyon ekle
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.add('anim-scale-in', 'delay-2');
  }
});