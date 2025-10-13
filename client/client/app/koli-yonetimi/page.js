'use client'

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Row, Col, ProgressBar } from 'react-bootstrap';
import { BiPlus, BiEdit, BiTrash, BiBox, BiSearch, BiDownload } from 'react-icons/bi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const KoliYonetimi = () => {
  const [koliListesi, setKoliListesi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingKoli, setEditingKoli] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKoliler, setSelectedKoliler] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    koli_no: '',
    lokasyon: '',
    kapasite: '',
    aciklama: ''
  });

  useEffect(() => {
    loadKoliListesi();
  }, []);

  const loadKoliListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/koli');
      if (response.ok) {
        const data = await response.json();
        setKoliListesi(data);
      }
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
      const url = '/api/koli';
      const method = editingKoli ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingKoli ? { id: editingKoli.id, ...formData } : formData),
      });

      if (response.ok) {
        toast.success(editingKoli ? 'Koli güncellendi' : 'Koli eklendi');
        setShowModal(false);
        setFormData({ koli_no: '', lokasyon: '', kapasite: '', aciklama: '' });
        setEditingKoli(null);
        loadKoliListesi();
      } else {
        toast.error('Koli kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Koli kaydetme hatası:', error);
      toast.error('Koli kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (koli) => {
    setEditingKoli(koli);
    setFormData({
      koli_no: koli.koli_no,
      lokasyon: koli.lokasyon,
      kapasite: koli.kapasite || 100,
      aciklama: koli.aciklama || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (koliId) => {
    if (typeof window !== 'undefined' && !window.confirm('Bu koliyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/koli?id=${koliId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Koli silindi');
        loadKoliListesi();
      } else {
        toast.error('Koli silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Koli silme hatası:', error);
      toast.error('Koli silinirken hata oluştu');
    }
  };

  const handleSelectKoli = (id) => {
    setSelectedKoliler(prev => 
      prev.includes(id) 
        ? prev.filter(koliId => koliId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedKoliler.length === filteredKoliler.length) {
      setSelectedKoliler([]);
    } else {
      setSelectedKoliler(filteredKoliler.map(koli => koli.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedKoliler.length === 0) {
      toast.warning('Silinecek koli seçiniz');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/koli/delete-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedKoliler }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.silinen} koli başarıyla silindi`);
        if (result.hatali > 0) {
          toast.warning(`${result.hatali} koli silinemedi`);
        }
        setSelectedKoliler([]);
        setShowDeleteModal(false);
        loadKoliListesi();
      } else {
        const errorData = await response.json();
        toast.error('Toplu silme hatası: ' + (errorData.error || 'Bilinmeyen bir hata oluştu.'));
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Toplu silme sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ koli_no: '', lokasyon: '', kapasite: '', aciklama: '' });
    setEditingKoli(null);
  };

  const handleExportExcel = () => {
    const exportData = koliListesi.map(koli => ({
      'Koli No': koli.koli_no,
      'Lokasyon': koli.lokasyon,
      'Ürün Sayısı': koli.urun_sayisi,
      'Toplam Adet': koli.toplam_adet,
      'Doluluk Oranı': `${koli.doluluk_orani.toFixed(1)}%`,
      'Son Güncelleme': koli.son_guncelleme
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Koli Listesi');
    XLSX.writeFile(wb, `koli-listesi-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`);
    
    toast.success('Excel dosyası indirildi');
  };

  const filteredKoliler = koliListesi.filter(koli =>
    koli.koli_no.includes(searchTerm) ||
    koli.lokasyon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDolulukBadge = (doluluk) => {
    if (doluluk > 80) return 'danger';
    if (doluluk > 50) return 'warning';
    if (doluluk > 0) return 'success';
    return 'secondary';
  };

  const getDolulukText = (doluluk) => {
    if (doluluk > 80) return 'Dolu';
    if (doluluk > 50) return 'Orta';
    if (doluluk > 0) return 'Az';
    return 'Boş';
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
            <p className="text-muted mb-0">Koli ekleme, düzenleme ve yönetim işlemleri</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-success" onClick={handleExportExcel}>
            <BiDownload className="me-1" />
            Excel İndir
          </Button>
          {selectedKoliler.length > 0 && (
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteModal(true)}
              className="me-2"
            >
              <BiTrash className="me-1" />
              Seçilenleri Sil ({selectedKoliler.length})
            </Button>
          )}
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <BiPlus className="me-1" />
            Yeni Koli
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{koliListesi.length}</h3>
              <p className="mb-0">Toplam Koli</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{koliListesi.filter(k => k.doluluk_orani > 0).length}</h3>
              <p className="mb-0">Dolu Koli</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{koliListesi.filter(k => k.doluluk_orani === 0).length}</h3>
              <p className="mb-0">Boş Koli</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{koliListesi.reduce((sum, k) => sum + (k.toplam_adet || 0), 0)}</h3>
              <p className="mb-0">Toplam Ürün</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Arama */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex">
            <div className="input-group">
              <span className="input-group-text">
                <BiSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Koli no veya lokasyon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <BiBox className="me-2" />
            Koli Listesi ({filteredKoliler.length} koli)
          </h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : filteredKoliler.length > 0 ? (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedKoliler.length === filteredKoliler.length && filteredKoliler.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Ürün Sayısı</th>
                  <th>Toplam Adet</th>
                  <th>Doluluk</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredKoliler.map((koli, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedKoliler.includes(koli.id)}
                        onChange={() => handleSelectKoli(koli.id)}
                      />
                    </td>
                    <td><code>{koli.koli_no}</code></td>
                    <td>{koli.lokasyon}</td>
                    <td>
                      <Badge bg="info">{koli.urun_sayisi}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{koli.toplam_adet}</Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1 me-2">
                          <ProgressBar
                            variant={getDolulukBadge(koli.doluluk_orani || 0)}
                            now={koli.doluluk_orani || 0}
                            style={{ height: '8px' }}
                          />
                        </div>
                        <small className="text-muted">{(koli.doluluk_orani || 0).toFixed(1)}%</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getDolulukBadge(koli.doluluk_orani || 0)}>
                        {getDolulukText(koli.doluluk_orani || 0)}
                      </Badge>
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
                        onClick={() => handleDelete(koli.id)}
                      >
                        <BiTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <BiBox size={48} className="text-muted mb-3" />
              <p className="text-muted">Henüz koli bulunmuyor</p>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <BiPlus className="me-1" />
                İlk Koliyi Ekle
              </Button>
            </div>
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
                  <Form.Label>Koli No</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.koli_no}
                    onChange={(e) => setFormData({ ...formData, koli_no: e.target.value })}
                    placeholder="Koli numarasını girin"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lokasyon</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lokasyon}
                    onChange={(e) => setFormData({ ...formData, lokasyon: e.target.value })}
                    placeholder="Lokasyon girin (örn: A1-01)"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kapasite</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.kapasite}
                    onChange={(e) => setFormData({ ...formData, kapasite: e.target.value })}
                    placeholder="Maksimum kapasite"
                    min="1"
                    max="1000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Açıklama</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    placeholder="Koli açıklaması"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {editingKoli ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Toplu Silme Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Toplu Silme Onayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>{selectedKoliler.length}</strong> koliyi silmek istediğinizden emin misiniz?
          </p>
          <p className="text-muted">
            Bu işlem geri alınamaz!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={handleBulkDelete} disabled={loading}>
            {loading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KoliYonetimi;