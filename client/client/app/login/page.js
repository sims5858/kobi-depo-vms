'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { BiUser, BiLock, BiLogIn } from 'react-icons/bi';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Eğer zaten giriş yapmışsa dashboard'a yönlendir
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Giriş başarılı!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Giriş başarısız!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Sunucu hatası!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <BiLogIn size={30} />
                  </div>
                  <h3 className="text-primary">CoreTrack V3</h3>
                  <p className="text-muted">Depo Yönetim Sistemi</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kullanıcı Adı</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <BiUser />
                      </span>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Kullanıcı adınızı girin"
                        required
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Şifre</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <BiLock />
                      </span>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Şifrenizi girin"
                        required
                      />
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </Form>

                <Alert variant="info" className="mt-4">
                  <strong>Demo Giriş:</strong><br />
                  Kullanıcı: admin<br />
                  Şifre: admin123
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
