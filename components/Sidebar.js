'use client'

import React from 'react';
import { Nav } from 'react-bootstrap';
import { usePathname, useRouter } from 'next/navigation';

const Sidebar = ({ collapsed, user, mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      path: '/dashboard',
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      description: 'Ana Sayfa'
    },
    {
      path: '/koli-transfer',
      icon: 'bi-arrow-left-right',
      label: 'Koli Transfer',
      description: 'Yuvalama İşlemi'
    },
    {
      path: '/urun-toplama',
      icon: 'bi-collection',
      label: 'Ürün Toplama',
      description: 'Toplama Fişi'
    },
    {
      path: '/sayim',
      icon: 'bi-clipboard-check',
      label: 'Sayım',
      description: 'Envanter Sayımı'
    },
    {
      path: '/raporlar',
      icon: 'bi-graph-up',
      label: 'Raporlar',
      description: 'Analiz ve Raporlar'
    },
    {
      path: '/koli-yonetimi',
      icon: 'bi-boxes',
      label: 'Koli Yönetimi',
      description: 'Koli İşlemleri'
    },
    {
      path: '/urun-yonetimi',
      icon: 'bi-tags',
      label: 'Ürün Yönetimi',
      description: 'Ürün İşlemleri'
    }
  ];

  // Admin menüsü
  if (user?.rol === 'admin') {
    menuItems.push({
      path: '/admin',
      icon: 'bi-shield-check',
      label: 'Admin Panel',
      description: 'Kullanıcı Yönetimi'
    });
  }

  return (
    <div
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'show' : ''}`}
      style={{
        width: collapsed ? '60px' : '250px',
        transition: 'width 0.3s, transform 0.3s'
      }}
    >
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link
              href="#"
              className={`nav-link ${pathname === item.path ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.path);
                // Mobilde menüyü kapat
                if (onMobileClose) {
                  onMobileClose();
                }
              }}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: pathname === item.path ? '#ffffff' : '#6c757d',
                backgroundColor: pathname === item.path ? '#1976d2' : 'transparent',
                border: 'none',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                fontWeight: pathname === item.path ? '500' : '400'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.path) {
                  e.target.style.backgroundColor = '#e3f2fd';
                  e.target.style.color = '#1976d2';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }
              }}
            >
              <i 
                className={`${item.icon} me-2`}
                style={{
                  fontSize: '18px',
                  color: 'inherit'
                }}
              ></i>
              {!collapsed && (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'inherit' }}>{item.label}</div>
                  <small style={{ 
                    color: pathname === item.path ? 'rgba(255,255,255,0.8)' : '#6c757d',
                    fontSize: '12px'
                  }}>{item.description}</small>
                </div>
              )}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;
