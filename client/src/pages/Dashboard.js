import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  BiBox, 
  BiPackage, 
  BiCheckCircle, 
  BiErrorCircle,
  BiTrendingUp,
  BiTrendingDown
} from 'react-icons/bi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    toplamKoli: 0,
    doluKoli: 0,
    bosKoli: 0,
    toplamUrun: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' veya 'desc'
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

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
      const urunData = await urunResponse.json();
      
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

      // Akıllı önerileri yükle
      const suggestionsResponse = await fetch('/api/dashboard/smart-suggestions');
      const suggestionsData = await suggestionsResponse.json();
      
      // Önerileri detaylandır
      const detailedSuggestions = suggestionsData.map((suggestion, index) => ({
        ...suggestion,
        id: index + 1,
        steps: getSuggestionSteps(suggestion),
        benefits: getSuggestionBenefits(suggestion),
        estimatedTime: getEstimatedTime(suggestion)
      }));
      
      setSmartSuggestions(detailedSuggestions);

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    }
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSuggestionSteps = (suggestion) => {
    if (suggestion.type === 'consolidation') {
      return [
        '1. Kaynak kolileri (düşük doluluk) belirleyin',
        '2. Hedef kolileri (yüksek doluluk) seçin',
        '3. Koli Transfer sayfasına gidin',
        '4. Transfer fişi oluşturun',
        '5. Ürünleri kaynak kolilerden hedef kolilere taşıyın',
        '6. Transfer işlemini tamamlayın'
      ];
    }
    return ['Adım detayları bulunmuyor'];
  };

  const getSuggestionBenefits = (suggestion) => {
    if (suggestion.type === 'consolidation') {
      return [
        'Depo alanı optimizasyonu',
        'Daha az koli kullanımı',
        'Ürün erişim kolaylığı',
        'Envanter yönetim verimliliği'
      ];
    }
    return ['Genel verimlilik artışı'];
  };

  const getEstimatedTime = (suggestion) => {
    if (suggestion.type === 'consolidation') {
      return '15-30 dakika';
    }
    return '10-20 dakika';
  };

  const handleGoToTransfer = () => {
    setShowSuggestionsModal(false);
    navigate('/koli-transfer');
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

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
          <Icon size={24} className={`text-${color}`} />
        </div>
        <div className="flex-grow-1">
          <h3 className="mb-1 fw-bold">{value.toLocaleString('tr-TR')}</h3>
          <p className="mb-0 text-muted">{title}</p>
          {trend && (
            <small className={`d-flex align-items-center ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? <BiTrendingUp className="me-1" /> : <BiTrendingDown className="me-1" />}
              %{Math.abs(trend)}
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Dashboard</h1>
        <Badge bg="primary" className="fs-6">
          {new Date().toLocaleDateString('tr-TR')}
        </Badge>
      </div>

      {/* İstatistik Kartları */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <StatCard
            title="Toplam Koli"
            value={stats.toplamKoli}
            icon={BiBox}
            color="primary"
            trend={5.2}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Dolu Koli"
            value={stats.doluKoli}
            icon={BiPackage}
            color="success"
            trend={2.1}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Boş Koli"
            value={stats.bosKoli}
            icon={BiErrorCircle}
            color="warning"
            trend={-1.8}
          />
        </Col>
        <Col md={3} className="mb-3">
          <StatCard
            title="Toplam Ürün"
            value={stats.toplamUrun}
            icon={BiCheckCircle}
            color="info"
            trend={3.5}
          />
        </Col>
      </Row>

      <Row>
        {/* Koli Doluluk Durumu */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <BiErrorCircle className="text-warning me-2" />
                <h5 className="mb-0">Koli Doluluk Durumu ({getSortedItems().length} koli)</h5>
              </div>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleSortToggle}
                className="d-flex align-items-center"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <BiTrendingUp className="me-1" />
                    En Düşük
                  </>
                ) : (
                  <>
                    <BiTrendingDown className="me-1" />
                    En Yüksek
                  </>
                )}
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table responsive className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Koli No</th>
                      <th>Lokasyon</th>
                      <th>Doluluk</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedItems().length > 0 ? (
                      getSortedItems().map((item, index) => {
                        const getColor = (oran) => {
                          if (oran >= 80) return 'success';
                          if (oran >= 50) return 'warning';
                          if (oran >= 20) return 'info';
                          return 'danger';
                        };
                        
                        return (
                          <tr key={index}>
                            <td className="fw-medium">{item.koli_no}</td>
                            <td>{item.lokasyon || 'Belirsiz'}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                  <div 
                                    className={`progress-bar bg-${getColor(item.doluluk_orani)}`}
                                    style={{ width: `${Math.min(item.doluluk_orani, 100)}%` }}
                                  ></div>
                                </div>
                                <Badge bg={getColor(item.doluluk_orani)}>
                                  %{item.doluluk_orani}
                                </Badge>
                              </div>
                            </td>
                            <td>
                              {item.doluluk_orani === 0 ? (
                                <Badge bg="danger">Boş</Badge>
                              ) : item.doluluk_orani < 20 ? (
                                <Badge bg="danger">Düşük</Badge>
                              ) : item.doluluk_orani < 50 ? (
                                <Badge bg="info">Orta</Badge>
                              ) : item.doluluk_orani < 80 ? (
                                <Badge bg="warning">Yüksek</Badge>
                              ) : (
                                <Badge bg="success">Dolu</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">
                          Koli bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Son Aktiviteler */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex align-items-center">
              <BiTrendingUp className="text-primary me-2" />
              <h5 className="mb-0">Son Aktiviteler</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{activity.action}</h6>
                            <p className="mb-0 text-muted small">{activity.detail}</p>
                          </div>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-3">
                    <p className="mb-0">Henüz aktivite bulunmuyor</p>
                    <small>Ürün çıkışı veya transfer işlemi yapıldığında burada görünecek</small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Akıllı Öneriler Butonu */}
      {smartSuggestions.length > 0 && (
        <Row>
          <Col lg={12} className="mb-4">
            <Card>
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                    <BiTrendingUp size={32} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="mb-1">🤖 Akıllı Öneriler</h5>
                    <p className="text-muted mb-0">{smartSuggestions.length} öneri mevcut</p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => setShowSuggestionsModal(true)}
                  className="px-4"
                >
                  <BiTrendingUp className="me-2" />
                  Önerileri Görüntüle
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Akıllı Öneriler Modal */}
      <Modal 
        show={showSuggestionsModal} 
        onHide={() => setShowSuggestionsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BiTrendingUp className="text-primary me-2" />
            🤖 Akıllı Öneriler
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {smartSuggestions.map((suggestion, index) => (
            <Card key={index} className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <Badge bg="primary" className="me-2">{suggestion.id}</Badge>
                    {suggestion.title}
                  </h6>
                  <Badge bg={suggestion.priority === 'high' ? 'danger' : 'warning'}>
                    {suggestion.priority === 'high' ? 'Yüksek Öncelik' : 'Orta Öncelik'}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">{suggestion.description}</p>
                
                {suggestion.type === 'consolidation' && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Kaynak Koliler:</strong>
                      <div className="mt-1">
                        {suggestion.from.map((koli, i) => (
                          <Badge key={i} bg="danger" className="me-1">{koli}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <strong>Hedef Koliler:</strong>
                      <div className="mt-1">
                        {suggestion.to.map((koli, i) => (
                          <Badge key={i} bg="success" className="me-1">{koli}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary">📋 Adımlar:</h6>
                    <ul className="list-unstyled">
                      {suggestion.steps.map((step, i) => (
                        <li key={i} className="mb-1">
                          <small className="text-muted">{step}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-success">✅ Faydalar:</h6>
                    <ul className="list-unstyled">
                      {suggestion.benefits.map((benefit, i) => (
                        <li key={i} className="mb-1">
                          <small className="text-success">• {benefit}</small>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2">
                      <Badge bg="info">
                        ⏱️ Tahmini Süre: {suggestion.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuggestionsModal(false)}>
            Kapat
          </Button>
          <Button variant="primary" onClick={handleGoToTransfer}>
            <BiTrendingUp className="me-1" />
            Koli Transfer'e Git
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;
