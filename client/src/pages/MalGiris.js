import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Modal, Alert, Badge } from 'react-bootstrap';
import { BiPlus, BiCamera, BiSave, BiTrash, BiPackage } from 'react-icons/bi';
import { toast } from 'react-toastify';

const MalGiris = () => {
  const [irsaliyeNo, setIrsaliyeNo] = useState('');
  const [currentKoliNo, setCurrentKoliNo] = useState('');
  const [currentBarkod, setCurrentBarkod] = useState('');
  const [currentAdet, setCurrentAdet] = useState(1);
  const [koliListesi, setKoliListesi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedKoli, setSelectedKoli] = useState(null);
  const [urunler, setUrunler] = useState([]);

  useEffect(() => {
    // Sayfa yüklendiğinde boş koli listesini getir
    loadBosKoliListesi();
  }, []);

  const loadBosKoliListesi = async () => {
    try {
      const response = await fetch('/api/bos-koli');
      const data = await response.json();
      console.log('Boş koli listesi:', data);
    } catch (error) {
      console.error('Boş koli listesi yüklenirken hata:', error);
    }
  };

  const handleBarkodOkut = () => {
    if (!currentBarkod.trim()) {
      toast.warning('Lütfen barkod okutun');
      return;
    }

    // Mevcut ürünü kontrol et
    const existingProduct = urunler.find(u => u.barkod === currentBarkod);
    
    if (existingProduct) {
      // Mevcut ürünün adedini artır
      setUrunler(urunler.map(u => 
        u.barkod === currentBarkod 
          ? { ...u, adet: u.adet + currentAdet }
          : u
      ));
    } else {
      // Yeni ürün ekle
      setUrunler([...urunler, {
        barkod: currentBarkod,
        adet: currentAdet,
        urun_adi: `Ürün ${currentBarkod}` // Gerçek uygulamada API'den gelecek
      }]);
    }

    setCurrentBarkod('');
    setCurrentAdet(1);
    toast.success('Ürün eklendi');
  };

  const handleKoliTamamla = () => {
    if (!currentKoliNo.trim()) {
      toast.warning('Lütfen koli numarası girin');
      return;
    }

    if (urunler.length === 0) {
      toast.warning('Koliye en az bir ürün eklemelisiniz');
      return;
    }

    const yeniKoli = {
      koli_no: currentKoliNo,
      urunler: urunler,
      toplam_adet: urunler.reduce((sum, u) => sum + u.adet, 0)
    };

    setKoliListesi([...koliListesi, yeniKoli]);
    setCurrentKoliNo('');
    setUrunler([]);
    toast.success(`Koli ${currentKoliNo} tamamlandı`);
  };

  const handleIrsaliyeKaydet = async () => {
    if (!irsaliyeNo.trim()) {
      toast.warning('Lütfen irsaliye numarası girin');
      return;
    }

    if (koliListesi.length === 0) {
      toast.warning('En az bir koli eklemelisiniz');
      return;
    }

    try {
      const response = await fetch('/api/alis-irsaliyesi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          irsaliye_no: irsaliyeNo,
          koliler: koliListesi
        }),
      });

      if (response.ok) {
        toast.success('Alış irsaliyesi başarıyla kaydedildi');
        setIrsaliyeNo('');
        setKoliListesi([]);
        setUrunler([]);
        setCurrentKoliNo('');
      } else {
        toast.error('İrsaliye kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('İrsaliye kaydetme hatası:', error);
      toast.error('İrsaliye kaydedilirken hata oluştu');
    }
  };

  const handleKoliSil = (index) => {
    setKoliListesi(koliListesi.filter((_, i) => i !== index));
    toast.success('Koli silindi');
  };

  const handleKoliDetay = (koli) => {
    setSelectedKoli(koli);
    setShowModal(true);
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Mal Girişi</h1>
        <Badge bg="success" className="fs-6">
          <BiPackage className="me-1" />
          {koliListesi.length} Koli Hazır
        </Badge>
      </div>

      <Row>
        {/* İrsaliye Bilgileri */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">İrsaliye Bilgileri</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>İrsaliye Numarası</Form.Label>
                <Form.Control
                  type="text"
                  value={irsaliyeNo}
                  onChange={(e) => setIrsaliyeNo(e.target.value)}
                  placeholder="AI-2025-001"
                />
              </Form.Group>
              
              <Alert variant="info" className="small">
                <strong>İşlem Sırası:</strong><br />
                1. Koli numarasını okutun<br />
                2. Ürün barkodlarını okutun<br />
                3. Koli tamamlandı butonuna basın<br />
                4. İrsaliyeyi kaydedin
              </Alert>
            </Card.Body>
          </Card>

          {/* Koli ve Ürün Girişi */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Koli ve Ürün Girişi</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Koli Numarası</Form.Label>
                <Form.Control
                  type="text"
                  value={currentKoliNo}
                  onChange={(e) => setCurrentKoliNo(e.target.value)}
                  placeholder="Koli numarasını girin"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ürün Barkodu</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    value={currentBarkod}
                    onChange={(e) => setCurrentBarkod(e.target.value)}
                    placeholder="Barkod okutun"
                    onKeyPress={(e) => e.key === 'Enter' && handleBarkodOkut()}
                  />
                  <Button variant="outline-secondary" onClick={handleBarkodOkut}>
                    <BiCamera />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Adet</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={currentAdet}
                  onChange={(e) => setCurrentAdet(parseInt(e.target.value) || 1)}
                />
              </Form.Group>

              <Button 
                variant="success" 
                className="w-100 mb-2"
                onClick={handleKoliTamamla}
                disabled={!currentKoliNo || urunler.length === 0}
              >
                <BiSave className="me-1" />
                Koli Tamamla
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Mevcut Koli Ürünleri */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                Mevcut Koli Ürünleri
                {currentKoliNo && (
                  <Badge bg="primary" className="ms-2">{currentKoliNo}</Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {urunler.length > 0 ? (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urunler.map((urun, index) => (
                      <tr key={index}>
                        <td>{urun.barkod}</td>
                        <td>{urun.urun_adi}</td>
                        <td>{urun.adet}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setUrunler(urunler.filter((_, i) => i !== index))}
                          >
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4">
                  <BiPackage size={48} className="mb-2" />
                  <p>Henüz ürün eklenmedi</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Tamamlanan Koliler */}
        <Col lg={4}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Tamamlanan Koliler</h5>
              <Button
                variant="success"
                size="sm"
                onClick={handleIrsaliyeKaydet}
                disabled={!irsaliyeNo || koliListesi.length === 0}
              >
                İrsaliye Kaydet
              </Button>
            </Card.Header>
            <Card.Body>
              {koliListesi.length > 0 ? (
                <div className="list-group list-group-flush">
                  {koliListesi.map((koli, index) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">Koli {koli.koli_no}</h6>
                          <small className="text-muted">
                            {koli.urunler.length} ürün, {koli.toplam_adet} adet
                          </small>
                        </div>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleKoliDetay(koli)}
                          >
                            Detay
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleKoliSil(index)}
                          >
                            <BiTrash />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <BiPackage size={48} className="mb-2" />
                  <p>Henüz koli tamamlanmadı</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Koli Detay Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Koli {selectedKoli?.koli_no} Detayları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedKoli && (
            <Table responsive>
              <thead>
                <tr>
                  <th>Barkod</th>
                  <th>Ürün Adı</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                {selectedKoli.urunler.map((urun, index) => (
                  <tr key={index}>
                    <td>{urun.barkod}</td>
                    <td>{urun.urun_adi}</td>
                    <td>{urun.adet}</td>
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
    </div>
  );
};

export default MalGiris;
