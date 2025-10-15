'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { BiPackage, BiBox, BiUser, BiBarChart, BiLogOut, BiMenu } from 'react-icons/bi';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUrunler: 0,
    totalKoliler: 0,
    totalKullanicilar: 0,
    recentActivities: []
  });
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgilerini kontrol et
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Paralel olarak tüm verileri yükle
      const [urunResponse, koliResponse, activitiesResponse] = await Promise.all([
        fetch('/api/urun'),
        fetch('/api/koli'),
        fetch('/api/dashboard/activities')
      ]);

      const [urunData, koliData, activitiesData] = await Promise.all([
        urunResponse.json(),
        koliResponse.json(),
        activitiesResponse.json()
      ]);

      setStats({
        totalUrunler: urunData.length || 0,
        totalKoliler: koliData.length || 0,
        totalKullanicilar: 1, // Demo için sabit
        recentActivities: activitiesData.activities || []
      });
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      toast.error('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <BiMenu className="me-2" />
            CoreTrack V3 - Dashboard
          </span>
          <div className="d-flex align-items-center">
            <span className="text-light me-3">
              Hoş geldiniz, {user?.username || 'Admin'}
            </span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <BiLogOut className="me-1" />
              Çıkış
            </Button>
          </div>
        </div>
      </nav>

      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h2>Dashboard</h2>
            <p className="text-muted">Depo yönetim sistemine hoş geldiniz</p>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="h-100">
              <Card.Body className="text-center">
                <BiPackage size={40} className="text-primary mb-2" />
                <h4>{stats.totalUrunler}</h4>
                <p className="text-muted mb-0">Toplam Ürün</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100">
              <Card.Body className="text-center">
                <BiBox size={40} className="text-success mb-2" />
                <h4>{stats.totalKoliler}</h4>
                <p className="text-muted mb-0">Toplam Koli</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100">
              <Card.Body className="text-center">
                <BiUser size={40} className="text-warning mb-2" />
                <h4>{stats.totalKullanicilar}</h4>
                <p className="text-muted mb-0">Kullanıcı</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="h-100">
              <Card.Body className="text-center">
                <BiBarChart size={40} className="text-info mb-2" />
                <h4>100%</h4>
                <p className="text-muted mb-0">Sistem Durumu</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Hızlı İşlemler</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => router.push('/urun-yonetimi')}
                    >
                      <BiPackage className="me-2" />
                      Ürün Yönetimi
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="success" 
                      className="w-100"
                      onClick={() => router.push('/koli-yonetimi')}
                    >
                      <BiBox className="me-2" />
                      Koli Yönetimi
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="info" 
                      className="w-100"
                      onClick={() => router.push('/raporlar')}
                    >
                      <BiBarChart className="me-2" />
                      Raporlar
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="secondary" 
                      className="w-100"
                      onClick={() => router.push('/admin')}
                    >
                      <BiUser className="me-2" />
                      Admin Panel
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activities */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Son Aktiviteler</h5>
              </Card.Header>
              <Card.Body>
                {stats.recentActivities.length > 0 ? (
                  <div>
                    {stats.recentActivities.map((activity, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <strong>{activity.action}</strong>
                          <p className="text-muted mb-0">{activity.description}</p>
                        </div>
                        <small className="text-muted">{activity.timestamp}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info">
                    Henüz aktivite bulunmuyor.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
