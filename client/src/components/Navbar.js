import React from 'react';
import { Navbar as BSNavbar, Nav, Dropdown } from 'react-bootstrap';
import { BiMenu, BiUser, BiLogOut, BiShield } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, user, onLogout }) => {
  const navigate = useNavigate();
  const getRoleBadge = (rol) => {
    const rolInfo = {
      admin: { renk: 'danger', ad: 'Admin' },
      kullanici: { renk: 'primary', ad: 'Kullanıcı' },
      operator: { renk: 'warning', ad: 'Operatör' }
    };
    return rolInfo[rol] || { renk: 'secondary', ad: rol };
  };

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="navbar-expand-lg">
      <div className="d-flex align-items-center">
        <button
          className="btn btn-link text-light me-3"
          onClick={onToggleSidebar}
          style={{ border: 'none', background: 'none' }}
        >
          <BiMenu size={24} />
        </button>
        <BSNavbar.Brand
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          className="fw-bold"
        >
          <i className="bi bi-box-seam me-2"></i>
          KOBİ Depo V3 VMS
        </BSNavbar.Brand>
      </div>
      
      <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BSNavbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto">
          <Dropdown align="end" drop="down">
            <Dropdown.Toggle 
              variant="dark" 
              id="dropdown-basic" 
              className="d-flex align-items-center"
              style={{ position: 'relative', zIndex: 9999 }}
            >
              <BiUser className="me-1" />
              {user?.ad_soyad}
              <span className={`badge bg-${getRoleBadge(user?.rol).renk} ms-2`}>
                <BiShield className="me-1" />
                {getRoleBadge(user?.rol).ad}
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu
              renderOnMount
              popperConfig={{ 
                strategy: 'fixed',
                placement: 'bottom-end',
                modifiers: [
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: 'viewport',
                    },
                  },
                ],
              }}
              style={{ 
                zIndex: 9999,
                position: 'fixed',
                minWidth: '200px'
              }}
            >
              <Dropdown.Header>
                <div className="text-center">
                  <BiUser size={24} className="mb-2" />
                  <div>{user?.ad_soyad}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </Dropdown.Header>
              <Dropdown.Divider />
              {user?.rol === 'admin' && (
                <>
                  <Dropdown.Item onClick={() => navigate('/admin')}>
                    <BiShield className="me-2" />
                    Admin Panel
                  </Dropdown.Item>
                  <Dropdown.Divider />
                </>
              )}
              <Dropdown.Item onClick={onLogout}>
                <BiLogOut className="me-2" />
                Çıkış Yap
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </BSNavbar.Collapse>
    </BSNavbar>
  );
};

export default Navbar;
