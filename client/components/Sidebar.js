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
      className={`sidebar position-fixed ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'show' : ''}`}
      style={{
        width: collapsed ? '60px' : '250px',
        transition: 'width 0.3s, transform 0.3s',
        top: 56, // navbar yüksekliği
        bottom: 0,
        overflowY: 'auto',
        zIndex: 1040 // içeriğin üstünde kalsın
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
            >
              <i className={`${item.icon} me-2`}></i>
              {!collapsed && (
                <div>
                  <div>{item.label}</div>
                  <small className="text-muted">{item.description}</small>
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
