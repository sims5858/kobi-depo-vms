import React from 'react';
import { Navbar as BSNavbar, Nav } from 'react-bootstrap';
import { BiMenu } from 'react-icons/bi';

const Navbar = ({ onToggleSidebar }) => {
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
        <BSNavbar.Brand href="/" className="fw-bold">
          <i className="bi bi-box-seam me-2"></i>
          KOBİ Depo V3 VMS
        </BSNavbar.Brand>
      </div>
      
      <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BSNavbar.Collapse id="basic-navbar-nav">
        <Nav className="ms-auto">
          <Nav.Link href="#" className="text-light">
            <i className="bi bi-person-circle me-1"></i>
            Depo Operatörü
          </Nav.Link>
          <Nav.Link href="#" className="text-light">
            <i className="bi bi-box-arrow-right me-1"></i>
            Çıkış
          </Nav.Link>
        </Nav>
      </BSNavbar.Collapse>
    </BSNavbar>
  );
};

export default Navbar;
