'use client'

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { BiLogIn, BiUser, BiLock } from 'react-icons/bi';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [formData, setFormData] = useState({
    kullanici_adi: '',
    sifre: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sayfa yüklendiğinde eski kullanıcı bilgilerini temizle
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Form data:', formData);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok && data.success) {
        // Eski kullanıcı bilgilerini temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Yeni kullanıcı bilgilerini kaydet
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Debug logs removed for production
        
        toast.success(`Hoş geldiniz, ${data.user.ad_soyad}!`);
        
        // Rol bazlı yönlendirme - sayfa yenileme ile
        setTimeout(() => {
          if (data.user.rol === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        }, 1000);
      } else {
        console.log('Login failed:', data);
        toast.error(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      toast.error('Bağlantı hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 page-transition">
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="shadow anim-scale-in">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">
                <BiLogIn className="me-2" />
                VMS Giriş
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <BiUser className="me-1" />
                    Kullanıcı Adı
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="kullanici_adi"
                    value={formData.kullanici_adi}
                    onChange={handleChange}
                    placeholder="Kullanıcı adınızı girin"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <BiLock className="me-1" />
                    Şifre
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="sifre"
                    value={formData.sifre}
                    onChange={handleChange}
                    placeholder="Şifrenizi girin"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <BiLogIn className="me-2" />
                      Giriş Yap
                    </>
                  )}
                </Button>
              </Form>

              <Alert variant="info" className="mt-3 mb-0">
                <strong>VMS Sistemi:</strong><br />
                Depo yönetim sistemi için giriş yapın.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
