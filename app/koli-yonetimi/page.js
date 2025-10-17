'use client'

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Row, Col, ProgressBar, Pagination } from 'react-bootstrap';
import { BiPlus, BiEdit, BiTrash, BiBox, BiSearch, BiDownload, BiX, BiPackage } from 'react-icons/bi';
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
  const [filters, setFilters] = useState({
    dolulukOrani: 'all', // all, dolu, yari, bos
    urunSayisi: 'all'   // all, var, yok
  });
  const [showKoliUrunModal, setShowKoliUrunModal] = useState(false);
  const [selectedKoliUrunleri, setSelectedKoliUrunleri] = useState([]);
  const [selectedKoliNo, setSelectedKoliNo] = useState('');
  const [showKoliUrunPage, setShowKoliUrunPage] = useState(false);
  const [koliUrunCurrentPage, setKoliUrunCurrentPage] = useState(1);
  const [koliUrunItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    koli_no: '',
    lokasyon: '',
    kapasite: '',
    aciklama: ''
  });

  useEffect(() => {
    loadKoliListesi();
  }, []);

  // Sayfa odaklandığında verileri yenile
  useEffect(() => {
    const handleFocus = () => {
      console.log('Koli yönetimi sayfası odaklandı, veriler yenileniyor...');
      loadKoliListesi();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Koli yönetimi sayfası görünür hale geldi, veriler yenileniyor...');
        loadKoliListesi();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadKoliListesi = async () => {
    setLoading(true);
    try {
      console.log('=== KOLI LISTESI YUKLENIYOR ===');
      // Cache'i bypass etmek için timestamp ve random ekle
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const url = `/api/koli?t=${timestamp}&r=${random}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        setKoliListesi(data);
        console.log('Koli listesi yenilendi:', data.length, 'koli');
        console.log('Tüm koliler:', data);
        
        // İlk 3 koliyi detaylı logla
        if (data.length > 0) {
          console.log('İlk 3 koli detayı:', data.slice(0, 3));
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
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

  const handleSyncFromProducts = async () => {
    setLoading(true);
    try {
      console.log('=== URUNLERDEN KOLI OLUSTURMA BASLIYOR ===');
      
      const response = await fetch('/api/koli/sync-from-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sync response:', result);
        
        if (result.success) {
          toast.success(`${result.eklenen} koli ürünlerden oluşturuldu!`);
          if (result.zaten_var > 0) {
            toast.info(`${result.zaten_var} koli zaten mevcuttu.`);
          }
          loadKoliListesi();
        } else {
          toast.error('Koli oluşturma başarısız: ' + result.error);
        }
      } else {
        const errorData = await response.json();
        toast.error('Koli oluşturma hatası: ' + (errorData.error || 'Bilinmeyen bir hata oluştu.'));
      }
    } catch (error) {
      console.error('Ürünlerden koli oluşturma hatası:', error);
      toast.error('Ürünlerden koli oluşturma sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ koli_no: '', lokasyon: '', kapasite: '', aciklama: '' });
    setEditingKoli(null);
  };

  const handleKoliClick = async (koliNo) => {
    try {
      // Bu koli numarasına sahip ürünleri getir
      const response = await fetch('/api/urun');
      if (response.ok) {
        const urunler = await response.json();
        // Sadece stoklu ürünleri göster (stok_miktari > 0)
        const koliUrunleri = urunler.filter(urun => 
          urun.birim === koliNo && urun.stok_miktari > 0
        );
        
        setSelectedKoliNo(koliNo);
        setSelectedKoliUrunleri(koliUrunleri);
        setKoliUrunCurrentPage(1); // Sayfa numarasını sıfırla
        setShowKoliUrunModal(true);
        
        console.log(`${koliNo} kolisinde ${koliUrunleri.length} stoklu ürün bulundu`);
      }
    } catch (error) {
      console.error('Koli ürünleri yüklenirken hata:', error);
      toast.error('Koli ürünleri yüklenirken hata oluştu');
    }
  };

  const handleCloseKoliUrunModal = () => {
    setShowKoliUrunModal(false);
    setSelectedKoliUrunleri([]);
    setSelectedKoliNo('');
  };

  const handleCloseKoliUrunPage = () => {
    setShowKoliUrunPage(false);
    setSelectedKoliUrunleri([]);
    setSelectedKoliNo('');
  };

  const handleExportExcel = () => {
    const exportData = koliListesi.map(koli => ({
      'Koli No': koli.koli_no,
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

  // Filtreleme ve sıralama
  const filteredAndSortedKoliler = koliListesi
    .filter(koli => {
      // Arama terimi filtresi (sadece koli numarası)
      const matchesSearch = koli.koli_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Doluluk oranı filtresi
      const matchesDoluluk = filters.dolulukOrani === 'all' ||
                            (filters.dolulukOrani === 'dolu' && koli.doluluk_orani > 80) ||
                            (filters.dolulukOrani === 'yari' && koli.doluluk_orani > 0 && koli.doluluk_orani <= 80) ||
                            (filters.dolulukOrani === 'bos' && koli.doluluk_orani === 0);
      
      // Ürün sayısı filtresi
      const matchesUrunSayisi = filters.urunSayisi === 'all' ||
                               (filters.urunSayisi === 'var' && koli.urun_sayisi > 0) ||
                               (filters.urunSayisi === 'yok' && koli.urun_sayisi === 0);
      
      return matchesSearch && matchesDoluluk && matchesUrunSayisi;
    })
    .sort((a, b) => {
      // Önce ürün sayısına göre azalan sıralama (en çok ürün olan üstte)
      if (b.urun_sayisi !== a.urun_sayisi) {
        return b.urun_sayisi - a.urun_sayisi;
      }
      // Ürün sayısı aynıysa toplam adete göre azalan sıralama
      if (b.toplam_adet !== a.toplam_adet) {
        return b.toplam_adet - a.toplam_adet;
      }
      // Her ikisi de aynıysa koli numarasına göre alfabetik sıralama
      return a.koli_no.localeCompare(b.koli_no);
    });

  const filteredKoliler = filteredAndSortedKoliler;

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

  // Koli ürünleri için sayfalama mantığı
  const getKoliUrunCurrentItems = () => {
    const startIndex = (koliUrunCurrentPage - 1) * koliUrunItemsPerPage;
    const endIndex = startIndex + koliUrunItemsPerPage;
    return selectedKoliUrunleri.slice(startIndex, endIndex);
  };

  const getKoliUrunTotalPages = () => {
    return Math.ceil(selectedKoliUrunleri.length / koliUrunItemsPerPage);
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
          <Button variant="outline-primary" onClick={loadKoliListesi} disabled={loading}>
            <BiSearch className="me-1" />
            {loading ? 'Yenileniyor...' : 'Yenile'}
          </Button>
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
          <Button variant="success" onClick={handleSyncFromProducts} disabled={loading}>
            <BiPackage className="me-1" />
            Ürünlerden Koli Oluştur
          </Button>
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

      {/* Arama ve Filtreler */}
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            {/* Arama */}
            <div className="col-md-4">
              <label className="form-label">Arama</label>
              <div className="input-group">
                <span className="input-group-text">
                  <BiSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Koli numarası ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Doluluk Oranı Filtresi */}
            <div className="col-md-2">
              <label className="form-label">Doluluk Durumu</label>
              <select 
                className="form-select"
                value={filters.dolulukOrani}
                onChange={(e) => setFilters({...filters, dolulukOrani: e.target.value})}
              >
                <option value="all">Tümü</option>
                <option value="dolu">Dolu (80%+)</option>
                <option value="yari">Yarı Dolu (1-80%)</option>
                <option value="bos">Boş (0%)</option>
              </select>
            </div>

            {/* Ürün Sayısı Filtresi */}
            <div className="col-md-3">
              <label className="form-label">Ürün Durumu</label>
              <select 
                className="form-select"
                value={filters.urunSayisi}
                onChange={(e) => setFilters({...filters, urunSayisi: e.target.value})}
              >
                <option value="all">Tümü</option>
                <option value="var">Ürün Var</option>
                <option value="yok">Ürün Yok</option>
              </select>
            </div>

            {/* Filtreleri Temizle */}
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <div>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      dolulukOrani: 'all',
                      urunSayisi: 'all'
                    });
                  }}
                  className="w-100"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <BiBox className="me-2" />
              Koli Listesi ({filteredKoliler.length} koli)
            </h5>
            <small className="text-muted">
              Sıralama: En çok ürün olan koli üstte, boş koliler altta
            </small>
          </div>
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
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleKoliClick(koli.koli_no)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          fontWeight: '500',
                          border: '1px solid #0d6efd',
                          borderRadius: '0.375rem',
                          backgroundColor: 'transparent',
                          color: '#0d6efd',
                          transition: 'all 0.15s ease-in-out',
                          minWidth: '80px',
                          maxWidth: '120px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-all'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#0d6efd';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#0d6efd';
                        }}
                        title={`Koli içeriğini görüntülemek için tıklayın: ${koli.koli_no}`}
                      >
                        {koli.koli_no}
                      </Button>
                    </td>
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

      {/* Koli Ürünleri Popup Modal */}
      <Modal show={showKoliUrunModal} onHide={handleCloseKoliUrunModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BiBox className="me-2" />
            Koli {selectedKoliNo} - İçerik Detayları
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedKoliUrunleri.length > 0 ? (
            <div>
              <div className="mb-3">
                <h6>Koli İçeriği ({selectedKoliUrunleri.length} ürün)</h6>
                <p className="text-muted">
                  Toplam Adet: <strong>{selectedKoliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)}</strong>
                </p>
              </div>
              
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Barkod</th>
                    <th>Ürün Adı</th>
                    <th>Stok Miktarı</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {getKoliUrunCurrentItems().map((urun, index) => (
                    <tr key={index}>
                      <td><code style={{ 
                        backgroundColor: '#e3f2fd',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        color: '#1976d2',
                        fontWeight: '500'
                      }}>{urun.barkod}</code></td>
                      <td>{urun.urun_adi}</td>
                      <td>
                        <Badge bg="success">{urun.stok_miktari} Adet</Badge>
                      </td>
                      <td>
                        {urun.aciklama ? (
                          <span>{urun.aciklama}</span>
                        ) : (
                          <span className="text-muted fst-italic">Açıklama yok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Sayfalama */}
              {getKoliUrunTotalPages() > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    {((koliUrunCurrentPage - 1) * koliUrunItemsPerPage) + 1}-{Math.min(koliUrunCurrentPage * koliUrunItemsPerPage, selectedKoliUrunleri.length)} / {selectedKoliUrunleri.length} ürün
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.Prev 
                      onClick={() => setKoliUrunCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={koliUrunCurrentPage === 1}
                    />
                    {Array.from({ length: Math.min(5, getKoliUrunTotalPages()) }, (_, i) => {
                      let pageNum;
                      if (getKoliUrunTotalPages() <= 5) {
                        pageNum = i + 1;
                      } else if (koliUrunCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (koliUrunCurrentPage >= getKoliUrunTotalPages() - 2) {
                        pageNum = getKoliUrunTotalPages() - 4 + i;
                      } else {
                        pageNum = koliUrunCurrentPage - 2 + i;
                      }
                      
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === koliUrunCurrentPage}
                          onClick={() => setKoliUrunCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next 
                      onClick={() => setKoliUrunCurrentPage(prev => Math.min(prev + 1, getKoliUrunTotalPages()))}
                      disabled={koliUrunCurrentPage === getKoliUrunTotalPages()}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <BiBox size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Bu koli boş</h5>
              <p className="text-muted">Koli {selectedKoliNo} içerisinde henüz ürün bulunmuyor.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseKoliUrunModal}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default KoliYonetimi;