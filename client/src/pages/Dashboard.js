import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { 
  BiBox, 
  BiPackage, 
  BiCheckCircle, 
  BiErrorCircle,
  BiTrendingUp,
  BiTrendingDown,
  BiPulse,
  BiTime,
  BiBarChart,
  BiRefresh
} from 'react-icons/bi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    toplamKoli: 0,
    doluKoli: 0,
    bosKoli: 0,
    toplamUrun: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' veya 'desc'

  useEffect(() => {
    // Dashboard verilerini yükle
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Koli listesini yükle
      const koliResponse = await fetch('/api/koli-liste');
      const koliData = await koliResponse.json();
      
      // Ürün listesini yükle
      const urunResponse = await fetch('/api/urun');
      await urunResponse.json();
      
      const toplamKoli = koliData.length;
      const doluKoli = koliData.filter(koli => koli.urun_sayisi > 0).length;
      const bosKoli = koliData.filter(koli => koli.urun_sayisi === 0).length;
      const toplamUrun = koliData.reduce((sum, koli) => sum + (koli.toplam_adet || 0), 0);

      setStats({
        toplamKoli,
        doluKoli,
        bosKoli,
        toplamUrun
      });

      // Tüm kolileri yükle (doluluk oranına göre sıralanacak)
      const allKoliItems = koliData.filter(koli => koli.doluluk_orani >= 0);
      setLowStockItems(allKoliItems);

      // Son aktiviteleri yükle
      const activitiesResponse = await fetch('/api/dashboard/activities');
      const activitiesData = await activitiesResponse.json();
      setRecentActivities(activitiesData);

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    }
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortedItems = () => {
    const sorted = [...lowStockItems].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.doluluk_orani - b.doluluk_orani;
      } else {
        return b.doluluk_orani - a.doluluk_orani;
      }
    });
    return sorted; // Tüm kolileri göster (scroll ile)
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-3">
              <div className={`p-2 rounded me-3 bg-${color} bg-opacity-10`}>
                <Icon size={20} className={`text-${color}`} />
              </div>
              <div>
                <p className="mb-0 text-muted small fw-medium">{title}</p>
                {subtitle && <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{subtitle}</p>}
              </div>
            </div>
            <div className="d-flex align-items-baseline">
              <h3 className="mb-0 fw-bold text-dark me-2" style={{ fontSize: '1.75rem' }}>{value.toLocaleString('tr-TR')}</h3>
              {trend && (
                <span className={`badge ${trend > 0 ? 'bg-success' : 'bg-danger'} d-flex align-items-center`} style={{ fontSize: '10px' }}>
                  {trend > 0 ? <BiTrendingUp className="me-1" size={10} /> : <BiTrendingDown className="me-1" size={10} />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="page-transition" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="bg-white border-bottom px-4 py-3 anim-fade-in" style={{ borderColor: '#e9ecef' }}>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="h3 mb-1 fw-bold text-dark">Dashboard</h1>
            <p className="text-muted small mb-0">Depo yönetim sistemi genel bakış</p>
          </div>
          <div className="d-flex align-items-center">
            <div className="text-end me-3">
              <p className="small fw-medium text-dark mb-0">{new Date().toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p className="text-muted" style={{ fontSize: '11px' }}>{new Date().toLocaleTimeString('tr-TR')}</p>
            </div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={loadDashboardData}
              className="d-flex align-items-center"
            >
              <BiRefresh className="me-1" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* İstatistik Kartları */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <div className="anim-fade-in">
              <StatCard
                title="Toplam Koli"
                value={stats.toplamKoli}
                icon={BiBox}
                color="primary"
                trend={5.2}
                subtitle="Tüm koliler"
              />
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="anim-fade-in delay-1">
              <StatCard
                title="Dolu Koli"
                value={stats.doluKoli}
                icon={BiPackage}
                color="success"
                trend={2.1}
                subtitle="Ürün içeren"
              />
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="anim-fade-in delay-2">
              <StatCard
                title="Boş Koli"
                value={stats.bosKoli}
                icon={BiErrorCircle}
                color="warning"
                trend={-1.8}
                subtitle="Kullanılabilir"
              />
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="anim-fade-in delay-3">
              <StatCard
                title="Toplam Ürün"
                value={stats.toplamUrun}
                icon={BiCheckCircle}
                color="info"
                trend={3.5}
                subtitle="Stoktaki ürünler"
              />
            </div>
          </Col>
        </Row>

        {/* Ana İçerik Grid */}
        <Row>
          {/* Koli Doluluk Durumu */}
          <Col lg={6} className="mb-4">
            <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Header className="bg-white border-bottom" style={{ borderColor: '#e9ecef', borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="p-2 rounded me-3 bg-primary bg-opacity-10">
                      <BiBarChart size={20} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-semibold text-dark">Koli Doluluk Durumu</h5>
                      <p className="text-muted small mb-0">{getSortedItems().length} koli</p>
                    </div>
                  </div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleSortToggle}
                    className="text-xs"
                  >
                    {sortOrder === 'asc' ? '↑ Düşük → Yüksek' : '↓ Yüksek → Düşük'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {getSortedItems().length > 0 ? (
                    getSortedItems().map((item, index) => (
                      <div key={index} className="d-flex align-items-center justify-content-between p-3 mb-3 bg-light rounded" style={{ borderRadius: '8px' }}>
                        <div className="d-flex align-items-center">
                          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                            <span className="small fw-semibold text-primary">{item.koli_no}</span>
                          </div>
                          <div>
                            <p className="mb-0 small fw-medium text-dark">{item.lokasyon || 'Belirtilmemiş'}</p>
                            <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Koli #{item.koli_no}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="me-3" style={{ width: '80px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="text-muted" style={{ fontSize: '10px' }}>Doluluk</span>
                              <span className="small fw-medium text-dark" style={{ fontSize: '10px' }}>{item.doluluk_orani.toFixed(1)}%</span>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className={`progress-bar ${
                                  item.doluluk_orani > 80 ? 'bg-danger' :
                                  item.doluluk_orani > 50 ? 'bg-warning' :
                                  item.doluluk_orani > 0 ? 'bg-success' : 'bg-secondary'
                                }`}
                                style={{ width: `${item.doluluk_orani}%` }}
                              ></div>
                            </div>
                          </div>
                          <Badge 
                            bg={
                              item.doluluk_orani > 80 ? 'danger' :
                              item.doluluk_orani > 50 ? 'warning' :
                              item.doluluk_orani > 0 ? 'success' : 'secondary'
                            }
                            className="px-2 py-1"
                            style={{ fontSize: '10px' }}
                          >
                            {item.doluluk_orani > 80 ? 'Dolu' : 
                             item.doluluk_orani > 50 ? 'Orta' : 
                             item.doluluk_orani > 0 ? 'Az' : 'Boş'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <BiBox size={48} className="text-muted mb-3" />
                      <p className="text-muted">Henüz koli verisi bulunmuyor</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Son Aktiviteler */}
          <Col lg={6} className="mb-4">
            <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Header className="bg-white border-bottom" style={{ borderColor: '#e9ecef', borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex align-items-center">
                  <div className="p-2 rounded me-3 bg-success bg-opacity-10">
                    <BiPulse size={20} className="text-success" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-semibold text-dark">Son Aktiviteler</h5>
                    <p className="text-muted small mb-0">Sistem aktiviteleri</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="d-flex align-items-start p-3 mb-3 bg-light rounded" style={{ borderRadius: '8px' }}>
                        <div className="flex-shrink-0 me-3">
                          <div className="w-8 h-8 bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            <div className="w-2 h-2 bg-success rounded-circle"></div>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <p className="mb-0 small fw-medium text-dark">{activity.action}</p>
                            <div className="d-flex align-items-center text-muted" style={{ fontSize: '10px' }}>
                              <BiTime size={10} className="me-1" />
                              <span>{activity.time}</span>
                            </div>
                          </div>
                          <p className="mb-0 small text-muted">{activity.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <BiPulse size={48} className="text-muted mb-3" />
                      <p className="text-muted mb-2">Henüz aktivite bulunmuyor</p>
                      <p className="text-muted small">Ürün çıkışı veya transfer işlemi yapıldığında burada görünecek</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;
