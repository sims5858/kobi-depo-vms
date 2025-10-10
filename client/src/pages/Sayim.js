import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { BiClipboard, BiCamera, BiSave, BiTrash, BiBox, BiCheckCircle } from 'react-icons/bi';
import { toast } from 'react-toastify';

const Sayim = () => {
  const [sayimListesi, setSayimListesi] = useState([]);
  const [currentKoliNo, setCurrentKoliNo] = useState('');
  const [currentBarkod, setCurrentBarkod] = useState('');
  const [currentFizikselAdet, setCurrentFizikselAdet] = useState(0);
  const [koliEnvanter, setKoliEnvanter] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedKoli, setSelectedKoli] = useState(null);

  useEffect(() => {
    loadKoliEnvanter();
  }, []);

  const loadKoliEnvanter = async () => {
    try {
      const response = await fetch('/api/koli-envanter');
      const data = await response.json();
      setKoliEnvanter(data);
    } catch (error) {
      console.error('Koli envanteri yüklenirken hata:', error);
    }
  };

  const handleKoliSec = async () => {
    if (!currentKoliNo.trim()) {
      toast.warning('Lütfen koli numarası girin');
      return;
    }

    const koliUrunleri = koliEnvanter.filter(item => 
      item.koli_no === currentKoliNo
    );

    if (koliUrunleri.length === 0) {
      toast.warning(`${currentKoliNo} numaralı koli bulunamadı`);
      return;
    }

    setSelectedKoli({ koli_no: currentKoliNo, urunler: koliUrunleri });
    setShowModal(true);
  };

  const handleUrunSayim = (urun) => {
    const existingItem = sayimListesi.find(item => 
      item.koli_no === currentKoliNo && item.urun_barkod === urun.urun_barkod
    );

    const fizikselAdet = currentFizikselAdet;
    const teorikAdet = urun.adet || 0;
    const fark = fizikselAdet - teorikAdet;

    if (existingItem) {
      setSayimListesi(sayimListesi.map(item =>
        item.koli_no === currentKoliNo && item.urun_barkod === urun.urun_barkod
          ? { ...item, fiziksel_adet: fizikselAdet, fark: fark }
          : item
      ));
    } else {
      setSayimListesi([...sayimListesi, {
        koli_no: currentKoliNo,
        urun_barkod: urun.urun_barkod,
        urun_adi: urun.urun_adi,
        teorik_adet: teorikAdet,
        fiziksel_adet: fizikselAdet,
        fark: fark
      }]);
    }

    setCurrentFizikselAdet(0);
    toast.success('Ürün sayımı eklendi');
  };

  const handleSayimTamamla = async () => {
    if (sayimListesi.length === 0) {
      toast.warning('Sayım listesi boş');
      return;
    }

    // Koli bazlı grupla
    const koliGruplari = {};
    sayimListesi.forEach(item => {
      if (!koliGruplari[item.koli_no]) {
        koliGruplari[item.koli_no] = [];
      }
      koliGruplari[item.koli_no].push({
        barkod: item.urun_barkod,
        adet: item.fiziksel_adet
      });
    });

    const koliListesi = Object.keys(koliGruplari).map(koliNo => ({
      koli_no: koliNo,
      urunler: koliGruplari[koliNo]
    }));

    try {
      const response = await fetch('/api/sayim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          koli_listesi: koliListesi
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Sayım tamamlandı. Sayım No: ${result.sayim_no}`);
        setSayimListesi([]);
        setCurrentKoliNo('');
        loadKoliEnvanter(); // Envanteri güncelle
      } else {
        toast.error('Sayım kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Sayım hatası:', error);
      toast.error('Sayım kaydedilirken hata oluştu');
    }
  };

  const handleUrunSil = (index) => {
    setSayimListesi(sayimListesi.filter((_, i) => i !== index));
    toast.success('Ürün sayım listesinden kaldırıldı');
  };

  const toplamFark = sayimListesi.reduce((sum, item) => sum + Math.abs(item.fark), 0);
  const pozitifFark = sayimListesi.filter(item => item.fark > 0).length;
  const negatifFark = sayimListesi.filter(item => item.fark < 0).length;

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Sayım İşlemi</h1>
        <Badge bg="primary" className="fs-6">
          <BiClipboard className="me-1" />
          {sayimListesi.length} Ürün Sayıldı
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Sayım İşlemi:</strong> Fiziksel sayım yaparak teorik envanter ile karşılaştırın 
        ve farkları tespit edin.
      </Alert>

      {/* Sayım İstatistikleri */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{sayimListesi.length}</h3>
              <p className="mb-0">Toplam Ürün</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{pozitifFark}</h3>
              <p className="mb-0">Pozitif Fark</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{negatifFark}</h3>
              <p className="mb-0">Negatif Fark</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{toplamFark}</h3>
              <p className="mb-0">Toplam Fark</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Koli Seçimi */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Koli Seçimi</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Koli Numarası</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    value={currentKoliNo}
                    onChange={(e) => setCurrentKoliNo(e.target.value)}
                    placeholder="Koli numarasını girin"
                  />
                  <Button 
                    variant="outline-primary" 
                    onClick={handleKoliSec}
                    disabled={!currentKoliNo.trim()}
                  >
                    <BiCamera />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fiziksel Adet</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={currentFizikselAdet}
                  onChange={(e) => setCurrentFizikselAdet(parseInt(e.target.value) || 0)}
                  placeholder="Sayılan adeti girin"
                />
              </Form.Group>

              <Button 
                variant="success" 
                className="w-100 mb-2"
                onClick={handleSayimTamamla}
                disabled={sayimListesi.length === 0}
              >
                <BiSave className="me-1" />
                Sayımı Tamamla
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Koli Ürünleri Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Koli {selectedKoli?.koli_no} Sayımı</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedKoli && (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Barkod</th>
                    <th>Ürün Adı</th>
                    <th>Teorik Adet</th>
                    <th>Fiziksel Adet</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKoli.urunler.map((urun, index) => (
                    <tr key={index}>
                      <td>{urun.urun_barkod}</td>
                      <td>{urun.urun_adi}</td>
                      <td>
                        <Badge bg="info">{urun.adet || 0}</Badge>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="0"
                          value={currentFizikselAdet}
                          onChange={(e) => setCurrentFizikselAdet(parseInt(e.target.value) || 0)}
                          size="sm"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUrunSayim(urun)}
                        >
                          Say
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Kapat
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Sayım Listesi */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Sayım Listesi</h5>
            </Card.Header>
            <Card.Body>
              {sayimListesi.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Koli No</th>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Teorik</th>
                      <th>Fiziksel</th>
                      <th>Fark</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sayimListesi.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg="primary">{item.koli_no}</Badge>
                        </td>
                        <td>{item.urun_barkod}</td>
                        <td>{item.urun_adi}</td>
                        <td>
                          <Badge bg="info">{item.teorik_adet}</Badge>
                        </td>
                        <td>
                          <Badge bg="success">{item.fiziksel_adet}</Badge>
                        </td>
                        <td>
                          <Badge bg={item.fark === 0 ? 'secondary' : item.fark > 0 ? 'success' : 'danger'}>
                            {item.fark > 0 ? '+' : ''}{item.fark}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleUrunSil(index)}
                          >
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-5">
                  <BiBox size={64} className="mb-3" />
                  <h5>Henüz sayım yapılmadı</h5>
                  <p>Koli seçerek sayıma başlayın</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Sayim;
