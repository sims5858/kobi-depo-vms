'use client'

import React, { useState } from 'react';
import { Navbar as BSNavbar, Nav } from 'react-bootstrap';
import { BiMenu, BiUser, BiLogOut, BiShield } from 'react-icons/bi';
import { useRouter } from 'next/navigation';

const Navbar = ({ onToggleSidebar, user, onLogout, onToggleMobileSidebar }) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const getRoleBadge = (rol) => {
    const rolInfo = {
      admin: { renk: 'danger', ad: 'Admin' },
      kullanici: { renk: 'primary', ad: 'Kullanıcı' },
      operator: { renk: 'warning', ad: 'Operatör' }
    };
    return rolInfo[rol] || { renk: 'secondary', ad: rol };
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  const handleAdminClick = () => {
    setShowDropdown(false);
    router.push('/admin');
  };

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="navbar-expand-lg">
      <div className="d-flex align-items-center">
        {/* Desktop sidebar toggle */}
        <button
          className="btn btn-link text-light me-3 d-none d-md-block"
          onClick={onToggleSidebar}
          style={{ border: 'none', background: 'none' }}
        >
          <BiMenu size={24} />
        </button>
        
        {/* Mobile sidebar toggle */}
        <button
          className="btn btn-link text-light me-3 d-md-none"
          onClick={onToggleMobileSidebar}
          style={{ border: 'none', background: 'none' }}
        >
          <BiMenu size={24} />
        </button>
        
        <BSNavbar.Brand
          href="#"
          onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}
          className="fw-bold"
        >
          <i className="bi bi-box-seam me-2"></i>
          <span className="d-none d-sm-inline">KOBİ Depo V3 VMS</span>
          <span className="d-sm-none">VMS</span>
        </BSNavbar.Brand>
      </div>
      
      <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BSNavbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto">
          <div className="position-relative">
            <button
              className="btn btn-dark d-flex align-items-center"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ border: 'none', background: 'none' }}
            >
              <BiUser className="me-1" />
              {user?.ad_soyad}
              <span className={`badge bg-${getRoleBadge(user?.rol).renk} ms-2`}>
                <BiShield className="me-1" />
                {getRoleBadge(user?.rol).ad}
              </span>
            </button>

            {showDropdown && (
              <div 
                className="dropdown-menu show position-absolute"
                style={{ 
                  right: 0, 
                  top: '100%', 
                  zIndex: 9999,
                  minWidth: '200px',
                  marginTop: '5px'
                }}
              >
                <div className="dropdown-header text-center">
                  <BiUser size={24} className="mb-2" />
                  <div>{user?.ad_soyad}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
                <div className="dropdown-divider"></div>
                {user?.rol === 'admin' && (
                  <>
                    <button 
                      className="dropdown-item" 
                      onClick={handleAdminClick}
                    >
                      <BiShield className="me-2" />
                      Admin Panel
                    </button>
                    <div className="dropdown-divider"></div>
                  </>
                )}
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                >
                  <BiLogOut className="me-2" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </Nav>
      </BSNavbar.Collapse>

      {/* Dropdown dışına tıklandığında kapat */}
      {showDropdown && (
        <div 
          className="position-fixed w-100 h-100"
          style={{ top: 0, left: 0, zIndex: 9998 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </BSNavbar>
  );
};

export default Navbar;
