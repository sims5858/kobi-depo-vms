'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { BiClipboard, BiCamera, BiSave, BiTrash, BiBox } from 'react-icons/bi';
import { toast } from 'react-toastify';

const Sayim = () => {
  const [sayimListesi, setSayimListesi] = useState([]);
  const [currentKoliNo, setCurrentKoliNo] = useState('');
  const [currentBarkod] = useState('');
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

    if (existingItem) {
      setSayimListesi(sayimListesi.map(item => 
        item.koli_no === currentKoliNo && item.urun_barkod === urun.urun_barkod
          ? { ...item, fiziksel_adet: currentFizikselAdet }
          : item
      ));
    } else {
      setSayimListesi([...sayimListesi, {
        koli_no: currentKoliNo,
        urun_barkod: urun.urun_barkod,
        urun_adi: urun.urun_adi,
        sistem_adet: urun.adet,
        fiziksel_adet: currentFizikselAdet,
        fark: currentFizikselAdet - urun.adet,
        tarih: new Date().toLocaleString('tr-TR')
      }]);
    }

    setCurrentFizikselAdet(0);
    toast.success(`${urun.urun_adi} sayımı kaydedildi`);
  };

  const handleSayimTamamla = async () => {
    if (sayimListesi.length === 0) {
      toast.warning('Sayım yapılan ürün bulunmuyor');
      return;
    }

    try {
      const response = await fetch('/api/sayim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sayim_listesi: sayimListesi
        }),
      });

      if (response.ok) {
        toast.success('Sayım başarıyla tamamlandı');
        setSayimListesi([]);
        setCurrentKoliNo('');
        setShowModal(false);
        setSelectedKoli(null);
      } else {
        toast.error('Sayım sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Sayım hatası:', error);
      toast.error('Sayım sırasında hata oluştu');
    }
  };

  const handleSayimUrunSil = (index) => {
    setSayimListesi(sayimListesi.filter((_, i) => i !== index));
    toast.success('Ürün sayım listesinden kaldırıldı');
  };

  const toplamFark = sayimListesi.reduce((sum, item) => sum + item.fark, 0);

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiClipboard size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Envanter Sayımı</h1>
            <p className="text-muted mb-0">Koli ve ürün sayım işlemleri</p>
          </div>
        </div>
        <Badge bg="info" className="fs-6">
          <BiClipboard className="me-1" />
          Fiziksel Sayım
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Envanter Sayımı:</strong> Fiziksel sayım yaparak sistem kayıtları ile karşılaştırın 
        ve farkları tespit edin.
      </Alert>

      <Row>
        {/* Sol Taraf - Koli Seçimi */}
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

              <Alert variant="warning" className="small">
                <strong>Dikkat:</strong> Sayım yapılan ürünler otomatik olarak kaydedilir.
              </Alert>

              <Button 
                variant="success" 
                className="w-100"
                onClick={handleSayimTamamla}
                disabled={sayimListesi.length === 0}
              >
                <BiSave className="me-1" />
                Sayımı Tamamla
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Orta - Sayım Listesi */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                Sayım Listesi
                {sayimListesi.length > 0 && (
                  <Badge bg="info" className="ms-2">
                    {sayimListesi.length} ürün
                  </Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {sayimListesi.length > 0 ? (
                <Table responsive size="sm">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th>Koli</th>
                      <th>Barkod</th>
                      <th>Ürün</th>
                      <th>Sistem</th>
                      <th>Fiziksel</th>
                      <th>Fark</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sayimListesi.map((item, index) => (
                      <tr key={index}>
                        <td><Badge bg="primary">{item.koli_no}</Badge></td>
                        <td><code>{item.urun_barkod}</code></td>
                        <td>{item.urun_adi}</td>
                        <td><Badge bg="info">{item.sistem_adet}</Badge></td>
                        <td><Badge bg="success">{item.fiziksel_adet}</Badge></td>
                        <td>
                          <Badge bg={item.fark === 0 ? 'success' : item.fark > 0 ? 'warning' : 'danger'}>
                            {item.fark > 0 ? '+' : ''}{item.fark}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleSayimUrunSil(index)}
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
                  <BiClipboard size={48} className="mb-3" />
                  <p>Henüz sayım yapılan ürün yok</p>
                  <p className="small">Koli seçerek sayım işlemini başlatın</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Koli Sayım Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Koli Sayımı - {selectedKoli?.koli_no}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedKoli && (
            <div>
              <Form.Group className="mb-3">
                <Form.Label>Fiziksel Adet</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={currentFizikselAdet}
                  onChange={(e) => setCurrentFizikselAdet(parseInt(e.target.value) || 0)}
                />
              </Form.Group>

              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>Barkod</th>
                    <th>Ürün</th>
                    <th>Sistem Adet</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKoli.urunler.map((urun, index) => (
                    <tr key={index}>
                      <td><code>{urun.urun_barkod}</code></td>
                      <td>{urun.urun_adi}</td>
                      <td><Badge bg="info">{urun.adet}</Badge></td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleUrunSayim(urun)}
                          disabled={currentFizikselAdet < 0}
                        >
                          Sayım Kaydet
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
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

export default Sayim;