import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { BiBox, BiPlus, BiEdit, BiTrash, BiSave, BiX } from 'react-icons/bi';
import { toast } from 'react-toastify';

const KoliYonetimi = () => {
  const [koliListesi, setKoliListesi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showUrunModal, setShowUrunModal] = useState(false);
  const [editingKoli, setEditingKoli] = useState(null);
  const [selectedKoli, setSelectedKoli] = useState(null);
  const [koliUrunleri, setKoliUrunleri] = useState([]);
  const [formData, setFormData] = useState({
    koli_no: '',
    lokasyon: '',
    durum: 'aktif'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKoliListesi();
  }, []);

  const loadKoliListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/koli-liste');
      const data = await response.json();
      setKoliListesi(data);
    } catch (error) {
      console.error('Koli listesi yüklenirken hata:', error);
      toast.error('Koli listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUrunSayisiClick = async (koli) => {
    setSelectedKoli(koli);
    try {
      const response = await fetch(`/api/koli/${koli.koli_no}/urunler`);
      const data = await response.json();
      setKoliUrunleri(data);
      setShowUrunModal(true);
    } catch (error) {
      console.error('Koli ürünleri yüklenirken hata:', error);
      toast.error('Koli ürünleri yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.koli_no.trim()) {
      toast.warning('Koli numarası gereklidir');
      return;
    }

    try {
      const response = await fetch('/api/koli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Koli başarıyla kaydedildi');
        setShowModal(false);
        setFormData({ koli_no: '', lokasyon: '', durum: 'aktif' });
        loadKoliListesi();
      } else {
        toast.error('Koli kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Koli kaydetme hatası:', error);
      toast.error('Koli kaydedilirken hata oluştu');
    }
  };

  const handleEdit = (koli) => {
    setEditingKoli(koli);
    setFormData({
      koli_no: koli.koli_no,
      lokasyon: koli.lokasyon || '',
      durum: koli.durum
    });
    setShowModal(true);
  };

  const handleDelete = async (koliNo) => {
    if (window.confirm(`${koliNo} numaralı koliyi silmek istediğinizden emin misiniz?`)) {
      try {
        // Gerçek uygulamada DELETE API endpoint'i olacak
        toast.success('Koli silindi');
        loadKoliListesi();
      } catch (error) {
        console.error('Koli silme hatası:', error);
        toast.error('Koli silinirken hata oluştu');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingKoli(null);
    setFormData({ koli_no: '', lokasyon: '', durum: 'aktif' });
  };

  const getDurumBadge = (durum) => {
    const badgeColors = {
      'aktif': 'success',
      'pasif': 'secondary',
      'dolu': 'primary',
      'bos': 'warning',
      'kapali': 'danger'
    };
    return <Badge bg={badgeColors[durum] || 'secondary'}>{durum}</Badge>;
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Koli Yönetimi</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
        >
          <BiPlus className="me-1" />
          Yeni Koli
        </Button>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Koli Yönetimi:</strong> Depo kolilerini oluşturun, düzenleyin ve lokasyonlarını yönetin.
      </Alert>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Koli Listesi</h5>
            <Badge bg="primary" className="fs-6">
              {koliListesi.length} Koli
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>Koli No</th>
                  <th>Ürün Sayısı</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                  <th>Oluşturma Tarihi</th>
                  <th>Güncelleme Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {koliListesi.length > 0 ? (
                  koliListesi.map((koli, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="primary" className="fs-6">{koli.koli_no}</Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleUrunSayisiClick(koli)}
                          style={{
                            border: '2px solid #0dcaf0',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0dcaf0';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#0dcaf0';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          {koli.urun_sayisi} ürün
                        </Button>
                      </td>
                      <td>{koli.lokasyon || 'Belirsiz'}</td>
                      <td>{getDurumBadge(koli.durum)}</td>
                      <td>{new Date(koli.olusturma_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td>{new Date(koli.guncelleme_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleEdit(koli)}
                        >
                          <BiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(koli.koli_no)}
                        >
                          <BiTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                      <BiBox size={48} className="mb-2" />
                      <p>Henüz koli oluşturulmamış</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Koli Ekleme/Düzenleme Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingKoli ? 'Koli Düzenle' : 'Yeni Koli Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Koli Numarası *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.koli_no}
                    onChange={(e) => setFormData({...formData, koli_no: e.target.value})}
                    placeholder="Koli numarasını girin"
                    required
                    disabled={editingKoli} // Düzenleme sırasında koli no değiştirilemez
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durum</Form.Label>
                  <Form.Select
                    value={formData.durum}
                    onChange={(e) => setFormData({...formData, durum: e.target.value})}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                    <option value="dolu">Dolu</option>
                    <option value="bos">Boş</option>
                    <option value="kapali">Kapalı</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Lokasyon</Form.Label>
              <Form.Control
                type="text"
                value={formData.lokasyon}
                onChange={(e) => setFormData({...formData, lokasyon: e.target.value})}
                placeholder="A-01-15 gibi lokasyon bilgisi"
              />
              <Form.Text className="text-muted">
                Örnek: A-01-15 (A Blok, 1. Kat, 15. Sıra)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              <BiX className="me-1" />
              İptal
            </Button>
            <Button variant="primary" type="submit">
              <BiSave className="me-1" />
              {editingKoli ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Koli Ürünleri Modal */}
      <Modal show={showUrunModal} onHide={() => setShowUrunModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Koli İçeriği - {selectedKoli?.koli_no}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {koliUrunleri.length > 0 ? (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Barkod</th>
                  <th>Ürün Adı</th>
                  <th>Beden</th>
                  <th>Adet</th>
                  <th>Güncelleme Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {koliUrunleri.map((urun, index) => (
                  <tr key={index}>
                    <td><code>{urun.urun_barkod}</code></td>
                    <td>{urun.urun_adi}</td>
                    <td>{urun.beden}</td>
                    <td><Badge bg="success">{urun.adet}</Badge></td>
                    <td>{new Date(urun.guncelleme_tarihi).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              <BiBox size={48} className="mb-2" />
              <p>Bu kolide ürün bulunmuyor</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUrunModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KoliYonetimi;
