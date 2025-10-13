'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { BiBox, BiPlus, BiEdit, BiTrash, BiSave, BiX, BiSearch, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const KoliYonetimi = () => {
  const [koliListesi, setKoliListesi] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingKoli, setEditingKoli] = useState(null);
  const [formData, setFormData] = useState({
    koli_no: '',
    lokasyon: '',
    durum: 'aktif'
  });
  const [loading, setLoading] = useState(false);
  const [selectedKoliler, setSelectedKoliler] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadKoliListesi();
  }, []);

  const loadKoliListesi = async (searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      
      const response = await fetch(`/api/koli-liste?${params}`);
      const data = await response.json();
      setKoliListesi(data);
    } catch (error) {
      console.error('Koli listesi yüklenirken hata:', error);
      toast.error('Koli listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingKoli ? `/api/koli/${editingKoli.koli_no}` : '/api/koli-liste';
      const method = editingKoli ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingKoli ? 'Koli güncellendi' : 'Koli eklendi');
        setShowModal(false);
        setFormData({ koli_no: '', lokasyon: '', durum: 'aktif' });
        setEditingKoli(null);
        loadKoliListesi(searchQuery);
      } else {
        const errorData = await response.json();
        console.error('Koli kaydetme API hatası:', errorData);
        toast.error(errorData.error || 'Koli kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Koli kaydetme hatası:', error);
      toast.error('Koli kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (koli) => {
    setEditingKoli(koli);
    setFormData({
      koli_no: koli.koli_no,
      lokasyon: koli.lokasyon || '',
      durum: koli.durum || 'aktif'
    });
    setShowModal(true);
  };

  const handleDelete = async (koliId) => {
    if (!window.confirm('Bu koliyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/koli/${koliId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Koli silindi');
        loadKoliListesi(searchQuery);
      } else {
        toast.error('Koli silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Koli silme hatası:', error);
      toast.error('Koli silinirken hata oluştu');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ koli_no: '', lokasyon: '', durum: 'aktif' });
    setEditingKoli(null);
  };

  // Toplu seçim fonksiyonları
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedKoliler(koliListesi.map(koli => koli.id));
    } else {
      setSelectedKoliler([]);
    }
  };

  const handleSelectKoli = (koliId, checked) => {
    if (checked) {
      setSelectedKoliler([...selectedKoliler, koliId]);
    } else {
      setSelectedKoliler(selectedKoliler.filter(id => id !== koliId));
    }
  };

  // Tüm kolileri seç/seçme
  const handleSelectAllPages = () => {
    if (selectedKoliler.length === koliListesi.length) {
      // Tümü seçiliyse, hepsini kaldır
      setSelectedKoliler([]);
      setSelectAll(false);
      toast.info('Tüm seçimler kaldırıldı');
    } else {
      // Tümünü seç
      setSelectedKoliler(koliListesi.map(koli => koli.id));
      setSelectAll(true);
      toast.success(`${koliListesi.length} koli seçildi`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedKoliler.length === 0) {
      toast.warning('Silinecek koli seçiniz');
      return;
    }

    if (!window.confirm(`${selectedKoliler.length} koliyi silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/koli/delete-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ koli_ids: selectedKoliler }),
      });

      if (response.ok) {
        toast.success(`${selectedKoliler.length} koli başarıyla silindi`);
        setSelectedKoliler([]);
        setSelectAll(false);
        await loadKoliListesi(searchQuery);
      } else {
        toast.error('Koliler silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Koliler silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadKoliListesi(searchQuery);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    loadKoliListesi('');
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiBox size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Koli Yönetimi</h1>
            <p className="text-muted mb-0">Koli ekleme, düzenleme ve silme işlemleri</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <BiPlus className="me-1" />
          Yeni Koli
        </Button>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Koli Yönetimi:</strong> Koli ekleme, düzenleme ve silme işlemlerini yapabilirsiniz.
      </Alert>

      {/* Arama */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Koli Arama</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Koli numarası veya lokasyon ile arayın"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <Button variant="outline-primary" onClick={handleSearch}>
                    <BiSearch />
                  </Button>
                  <Button variant="outline-secondary" onClick={handleSearchClear}>
                    <BiX />
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSearch}>
                    <BiSearch className="me-1" />
                    Ara
                  </Button>
                  <Button variant="outline-secondary" onClick={handleSearchClear}>
                    <BiX className="me-1" />
                    Temizle
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Koli Listesi
              {koliListesi.length > 0 && (
                <Badge bg="info" className="ms-2">
                  {koliListesi.length} koli
                </Badge>
              )}
            </h5>
            <div className="d-flex gap-1">
              {koliListesi.length > 0 && (
                <Button 
                  variant={selectedKoliler.length === koliListesi.length ? "outline-secondary" : "outline-primary"}
                  size="sm"
                  onClick={handleSelectAllPages}
                  className="d-flex align-items-center"
                  title={selectedKoliler.length === koliListesi.length ? "Tüm seçimleri kaldır" : "Tüm kolileri seç"}
                >
                  <BiCheck className="me-1" />
                  {selectedKoliler.length === koliListesi.length ? "Seçimi Kaldır" : "Hepsini Seç"}
                </Button>
              )}
              {selectedKoliler.length > 0 && (
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className="d-flex align-items-center"
                  title="Seçili kolileri sil"
                >
                  <BiTrash className="me-1" />
                  Sil ({selectedKoliler.length})
                </Button>
              )}
              <Button variant="outline-primary" size="sm" onClick={() => loadKoliListesi(searchQuery)}>
                <BiSearch className="me-1" />
                Yenile
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
              ) : koliListesi.length > 0 ? (
                <>
                  {searchQuery && (
                    <Alert variant="info" className="mb-3">
                      <BiSearch className="me-2" />
                      <strong>Arama Sonucu:</strong> "{searchQuery}" için {koliListesi.length} koli bulundu.
                    </Alert>
                  )}
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      title="Tümünü seç/seçme"
                    />
                  </th>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                  <th>Ürün Sayısı</th>
                  <th>Toplam Adet</th>
                  <th>Doluluk Oranı</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {koliListesi.map((koli, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedKoliler.includes(koli.id || index)}
                        onChange={(e) => handleSelectKoli(koli.id || index, e.target.checked)}
                      />
                    </td>
                    <td><Badge bg="primary">{koli.koli_no}</Badge></td>
                    <td>{koli.lokasyon || 'Belirtilmemiş'}</td>
                    <td>
                      <Badge bg={koli.durum === 'aktif' ? 'success' : 'secondary'}>
                        {koli.durum || 'aktif'}
                      </Badge>
                    </td>
                    <td><Badge bg="info">{koli.urun_sayisi || 0}</Badge></td>
                    <td><Badge bg="success">{koli.toplam_adet || 0}</Badge></td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                          <div 
                            className={`progress-bar ${
                              koli.doluluk_orani > 80 ? 'bg-danger' :
                              koli.doluluk_orani > 50 ? 'bg-warning' :
                              koli.doluluk_orani > 0 ? 'bg-success' : 'bg-secondary'
                            }`}
                            style={{ width: `${koli.doluluk_orani || 0}%` }}
                          ></div>
                        </div>
                        <small>{koli.doluluk_orani || 0}%</small>
                      </div>
                    </td>
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
                        onClick={() => handleDelete(koli.id || index)}
                      >
                        <BiTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
                </>
              ) : (
            <div className="text-center py-5">
              <BiBox size={48} className="text-muted mb-3" />
              <p className="text-muted">
                {searchQuery ? `"${searchQuery}" araması için koli bulunamadı` : 'Henüz koli bulunmuyor'}
              </p>
              {searchQuery ? (
                <Button variant="outline-secondary" onClick={handleSearchClear}>
                  <BiX className="me-1" />
                  Aramayı Temizle
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <BiPlus className="me-1" />
                  İlk Koliyi Ekle
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Koli Ekleme/Düzenleme Modal */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingKoli ? 'Koli Düzenle' : 'Yeni Koli Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Koli Numarası</Form.Label>
              <Form.Control
                type="text"
                value={formData.koli_no}
                onChange={(e) => setFormData({ ...formData, koli_no: e.target.value })}
                placeholder="Koli numarasını girin"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Lokasyon</Form.Label>
              <Form.Control
                type="text"
                value={formData.lokasyon}
                onChange={(e) => setFormData({ ...formData, lokasyon: e.target.value })}
                placeholder="Lokasyon bilgisi"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Durum</Form.Label>
              <Form.Select
                value={formData.durum}
                onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
              >
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              <BiX className="me-1" />
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <BiSave className="me-1" />
              {editingKoli ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default KoliYonetimi;