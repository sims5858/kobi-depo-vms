import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal, ProgressBar } from 'react-bootstrap';
import { BiTag, BiPlus, BiEdit, BiTrash, BiSave, BiX } from 'react-icons/bi';
import { toast } from 'react-toastify';

const UrunYonetimi = () => {
  const [urunListesi, setUrunListesi] = useState([]);
  const [seciliBarkodlar, setSeciliBarkodlar] = useState([]);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUrun, setEditingUrun] = useState(null);
  const [formData, setFormData] = useState({
    barkod: '',
    urun_adi: '',
    aciklama: '',
    birim: 'adet',
    beden: '',
    koli_no: ''
  });
  const [excelUploading, setExcelUploading] = useState(false);
  const [showLocateModal, setShowLocateModal] = useState(false);
  const [locateQuery, setLocateQuery] = useState('');
  const [locateResults, setLocateResults] = useState([]);
  const [locating, setLocating] = useState(false);
  const [sortBy, setSortBy] = useState(''); // 'adet_asc', 'adet_desc', 'urun_adi_asc', 'urun_adi_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getSortedUrunler = () => {
    let sorted = [...urunListesi];
    
    switch (sortBy) {
      case 'adet_asc':
        sorted.sort((a, b) => (a.toplam_adet || 0) - (b.toplam_adet || 0));
        break;
      case 'adet_desc':
        sorted.sort((a, b) => (b.toplam_adet || 0) - (a.toplam_adet || 0));
        break;
      case 'urun_adi_asc':
        sorted.sort((a, b) => (a.urun_adi || '').localeCompare(b.urun_adi || ''));
        break;
      case 'urun_adi_desc':
        sorted.sort((a, b) => (b.urun_adi || '').localeCompare(a.urun_adi || ''));
        break;
      default:
        // Varsayılan sıralama (değişmez)
        break;
    }
    
    return sorted;
  };

  // Pagination logic
  const getPaginatedUrunler = () => {
    const sorted = getSortedUrunler();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(urunListesi.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Sort değiştiğinde ilk sayfaya dön
  };

  const runLocate = async () => {
    const q = (locateQuery || '').trim();
    if (!q) {
      toast.warning('Lütfen barkod veya ürün adı girin');
      return;
    }
    try {
      setLocating(true);
      setLocateResults([]);
      const res = await fetch(`/api/urun/konum?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Sorgu başarısız');
      const data = await res.json();
      setLocateResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        toast.info('Kayıt bulunamadı');
      } else {
        toast.success(`${data.length} kayıt bulundu`);
      }
    } catch (e) {
      console.error('Hata:', e);
      toast.error('Konum sorgusu sırasında hata oluştu: ' + e.message);
    } finally {
      setLocating(false);
    }
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUrunListesi();
  }, []);

  const loadUrunListesi = async () => {
    setLoading(true);
    setCurrentPage(1); // Yeni arama yapıldığında ilk sayfaya dön
    try {
      const params = new URLSearchParams();
      if (query && query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/urun?${params}`);
      const data = await response.json();
      setUrunListesi(data);
      setSeciliBarkodlar([]);
    } catch (error) {
      console.error('Ürün listesi yüklenirken hata:', error);
      toast.error('Ürün listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (barkod, checked) => {
    setSeciliBarkodlar((prev) => {
      if (checked) return [...new Set([...prev, barkod])];
      return prev.filter((b) => b !== barkod);
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) setSeciliBarkodlar(urunListesi.map(u => u.barkod));
    else setSeciliBarkodlar([]);
  };

  const handleDeleteOne = async (barkod) => {
    if (!window.confirm(`${barkod} barkodlu ürünü silmek istiyor musunuz?`)) return;
    try {
      const res = await fetch(`/api/urun/${barkod}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme hatası');
      toast.success('Ürün silindi');
      setQuery(''); // Arama sorgusunu temizle
      loadUrunListesi();
    } catch (e) {
      console.error(e);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  const handleDeleteBulk = async () => {
    if (seciliBarkodlar.length === 0) return;
    if (!window.confirm(`${seciliBarkodlar.length} ürün silinsin mi?`)) return;
    try {
      const res = await fetch('/api/urun/delete-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barkodlar: seciliBarkodlar })
      });
      if (!res.ok) throw new Error('Toplu silme hatası');
      toast.success('Toplu silme tamamlandı');
      setQuery(''); // Arama sorgusunu temizle
      loadUrunListesi();
    } catch (e) {
      console.error(e);
      toast.error('Toplu silme sırasında hata');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.barkod.trim()) {
      toast.warning('Barkod gereklidir');
      return;
    }

    try {
      const response = await fetch('/api/urun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Ürün başarıyla kaydedildi');
        setShowModal(false);
        setFormData({ barkod: '', urun_adi: '', aciklama: '', birim: 'adet' });
        loadUrunListesi();
      } else {
        toast.error('Ürün kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error);
      toast.error('Ürün kaydedilirken hata oluştu');
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    setExcelUploading(true);
    try {
      const res = await fetch('/api/urun/import-excel', {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('Yükleme hatası');
      
      const result = await res.json();
      
      // Detaylı sonuç mesajı
      let message = `Excel içe aktarma tamamlandı! `;
      if (result.yeniUrunler > 0) {
        message += `${result.yeniUrunler} yeni ürün eklendi. `;
      }
      if (result.guncellenenUrunler > 0) {
        message += `${result.guncellenenUrunler} ürün güncellendi. `;
      }
      message += `Toplam ${result.successCount} işlem başarılı.`;
      
      toast.success(message, { autoClose: 5000 });
      
      // Console'da detaylı bilgi
      if (result.detay) {
        console.log('Excel Import Detayları:', {
          yeniBarkodlar: result.detay.yeniBarkodlar,
          guncellenenBarkodlar: result.detay.guncellenenBarkodlar
        });
      }
      
      loadUrunListesi();
    } catch (err) {
      console.error(err);
      toast.error('Excel içe aktarma başarısız');
    } finally {
      setExcelUploading(false);
      e.target.value = '';
    }
  };

  const handleEdit = (urun) => {
    setEditingUrun(urun);
    setFormData({
      barkod: urun.barkod,
      urun_adi: urun.urun_adi,
      aciklama: urun.aciklama || '',
      birim: urun.birim || 'adet'
    });
    setShowModal(true);
  };


  const handleModalClose = () => {
    setShowModal(false);
    setEditingUrun(null);
    setFormData({ barkod: '', urun_adi: '', aciklama: '', birim: 'adet' });
  };

  const handleBarkodGenerate = () => {
    // Basit barkod üretici (gerçek uygulamada daha karmaşık olabilir)
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData({...formData, barkod: `BRK${timestamp}${random}`});
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4 anim-fade-in">
        <h1 className="h3 mb-0">Ürün Yönetimi</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
        >
          <BiPlus className="me-1" />
          Yeni Ürün
        </Button>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Ürün Yönetimi:</strong> Depo ürünlerini tanımlayın, düzenleyin ve barkodlarını yönetin.
      </Alert>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
              <h5 className="mb-0">Ürün Listesi</h5>
              <Badge bg="primary" className="fs-6">
                {loading ? 'Yükleniyor...' : `${urunListesi.length} Ürün`}
              </Badge>
            </div>
            <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
              <Form.Control
                placeholder="Barkod veya ürün adı ile ara..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1); // Arama değiştiğinde ilk sayfaya dön
                }}
                onKeyDown={(e)=> e.key==='Enter' && loadUrunListesi()}
                style={{ width: 320 }}
              />
              <Button variant="outline-primary" onClick={loadUrunListesi}>Ara</Button>
              {sortBy && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setSortBy('')}
                  title="Sıralamayı Sıfırla"
                >
                  Sıfırla
                </Button>
              )}
              <Button variant="secondary" onClick={()=> { setShowLocateModal(true); setLocateQuery(query); setLocateResults([]); }}>Konum & Koli Sorgula</Button>
              <Button variant="outline-danger" disabled={seciliBarkodlar.length===0} onClick={handleDeleteBulk}>
                Seçili Sil ({seciliBarkodlar.length})
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
          ) : (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={seciliBarkodlar.length>0 && seciliBarkodlar.length===urunListesi.length}
                      onChange={(e)=>handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Barkod</th>
                  <th>
                    <div className="d-flex align-items-center">
                      Ürün Adı
                      <div className="ms-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="p-1"
                          onClick={() => handleSortChange(sortBy === 'urun_adi_asc' ? 'urun_adi_desc' : 'urun_adi_asc')}
                          title={sortBy === 'urun_adi_asc' ? 'A-Z' : sortBy === 'urun_adi_desc' ? 'Z-A' : 'Sırala'}
                        >
                          {sortBy === 'urun_adi_asc' ? '↑' : sortBy === 'urun_adi_desc' ? '↓' : '↕'}
                        </Button>
                      </div>
                    </div>
                  </th>
                  <th>Beden</th>
                  <th>Ana Blok</th>
                  <th>Koliler</th>
                  <th>
                    <div className="d-flex align-items-center">
                      Toplam Adet
                      <div className="ms-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="p-1"
                          onClick={() => handleSortChange(sortBy === 'adet_asc' ? 'adet_desc' : 'adet_asc')}
                          title={sortBy === 'adet_asc' ? 'Az→Çok' : sortBy === 'adet_desc' ? 'Çok→Az' : 'Sırala'}
                        >
                          {sortBy === 'adet_asc' ? '↑' : sortBy === 'adet_desc' ? '↓' : '↕'}
                        </Button>
                      </div>
                    </div>
                  </th>
                  <th>Oluşturma Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedUrunler().length > 0 ? (
                  getPaginatedUrunler().map((urun, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={seciliBarkodlar.includes(urun.barkod)}
                          onChange={(e)=>handleToggleSelect(urun.barkod, e.target.checked)}
                        />
                      </td>
                      <td>
                        <Badge bg="primary" className="fs-6">{urun.barkod}</Badge>
                      </td>
                      <td className="fw-medium">{urun.urun_adi}</td>
                      <td>{urun.beden || '-'}</td>
                      <td>{urun.ana_blok || '-'}</td>
                      <td>{urun.koliler || '-'}</td>
                      <td>
                        <Badge bg={Number(urun.toplam_adet)>0 ? 'success' : 'secondary'}>
                          {Number(urun.toplam_adet) || 0}
                        </Badge>
                      </td>
                      <td>{new Date(urun.olusturma_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleEdit(urun)}
                        >
                          <BiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOne(urun.barkod)}
                        >
                          <BiTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      <BiTag size={48} className="mb-2" />
                      <p>Henüz ürün tanımlanmamış</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

            {/* Pagination */}
            {urunListesi.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-3 p-3 bg-light rounded">
                <div className="text-muted">
                  <strong>Toplam {urunListesi.length} ürün</strong> bulundu.
                  <br />
                  <Badge bg="info" className="me-2">Sayfa {currentPage} / {totalPages}</Badge>
                  <span className="small">({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, urunListesi.length)} arası gösteriliyor)</span>
                </div>
                <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                  >
                    ⏮ İlk
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ◀ Önceki
                  </Button>
                  
                  <div className="btn-group">
                    {totalPages <= 10 ? (
                      // 10 veya daha az sayfa varsa hepsini göster
                      [...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })
                    ) : (
                      // 10'dan fazla sayfa varsa akıllı göster
                      [...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        // İlk 2, son 2 ve mevcut sayfa etrafındaki 2 sayfayı göster
                        if (
                          pageNumber <= 2 ||
                          pageNumber > totalPages - 2 ||
                          (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? 'primary' : 'outline-primary'}
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === currentPage - 3 ||
                          pageNumber === currentPage + 3
                        ) {
                          return <Button key={pageNumber} variant="outline-secondary" size="sm" disabled>...</Button>;
                        }
                        return null;
                      })
                    )}
                  </div>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Sonraki ▶
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Son ⏭
                  </Button>
                </div>
              </div>
            )}
        </Card.Body>
      </Card>

      {/* Ürün Ekleme/Düzenleme Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUrun ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Barkod *</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={formData.barkod}
                      onChange={(e) => setFormData({...formData, barkod: e.target.value})}
                      placeholder="Ürün barkodunu girin"
                      required
                      disabled={editingUrun} // Düzenleme sırasında barkod değiştirilemez
                    />
                    {!editingUrun && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleBarkodGenerate}
                      >
                        Üret
                      </Button>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Birim</Form.Label>
                  <Form.Select
                    value={formData.birim}
                    onChange={(e) => setFormData({...formData, birim: e.target.value})}
                  >
                    <option value="adet">Adet</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="lt">Litre</option>
                    <option value="ml">Mililitre</option>
                    <option value="m">Metre</option>
                    <option value="cm">Santimetre</option>
                    <option value="paket">Paket</option>
                    <option value="kutu">Kutu</option>
                    <option value="palet">Palet</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Ürün Adı</Form.Label>
              <Form.Control
                type="text"
                value={formData.urun_adi}
                onChange={(e) => setFormData({...formData, urun_adi: e.target.value})}
                placeholder="Ürün adını girin (opsiyonel)"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Beden</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.beden}
                    onChange={(e) => setFormData({...formData, beden: e.target.value})}
                    placeholder="Örn: STD / S / 42"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Koli Numarası</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={formData.koli_no}
                      onChange={(e) => setFormData({...formData, koli_no: e.target.value})}
                      placeholder="Örn: D2-0110"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        const randomKoli = `D${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
                        setFormData({...formData, koli_no: randomKoli});
                      }}
                      className="ms-2"
                    >
                      Üret
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.aciklama}
                onChange={(e) => setFormData({...formData, aciklama: e.target.value})}
                placeholder="Ürün açıklaması, özellikler vb."
              />
            </Form.Group>

            <Alert variant="light" className="small">
              <strong>Not:</strong> Barkod benzersiz olmalıdır ve ürün tanımlaması için kullanılır. 
              Ürün ekledikten sonra mal girişi ve transfer işlemlerinde bu barkod kullanılacaktır.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              <BiX className="me-1" />
              İptal
            </Button>
            <Button variant="primary" type="submit">
              <BiSave className="me-1" />
              {editingUrun ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    {/* Excel İçe Aktarma */}
    <Card className="mt-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Excel ile Ürün İçe Aktarma</h5>
          <div>
            <small className="text-muted">Beklenen sütunlar: ÜRÜN BARKODU, ÜRÜN İSMİ, ÜRÜN BEDENİ, ÜRÜNÜN BULUNAN ANA BLOĞU, ÜRÜNÜN KOLİSİ, ADET</small>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="d-flex align-items-center">
          <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={excelUploading} />
          {excelUploading && <div className="ms-3" style={{ minWidth: 140 }}><ProgressBar animated now={70} /></div>}
        </div>
      </Card.Body>
    </Card>

    {/* Konum Sorgu Modal */}
    <Modal show={showLocateModal} onHide={()=> setShowLocateModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ürün Konum & Koli Sorgu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex mb-3" style={{ gap: '0.5rem' }}>
          <Form.Control
            placeholder="Barkod okutun veya ürün adı yazın"
            value={locateQuery}
            onChange={(e)=> setLocateQuery(e.target.value)}
            onKeyDown={async (e)=> { if (e.key==='Enter') { e.preventDefault(); runLocate(); } }}
          />
          <Button onClick={runLocate} disabled={locating}>{locating ? 'Sorgulanıyor...' : 'Sorgula'}</Button>
        </div>

        {locateResults.length>0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th>Barkod</th>
                <th>Ürün Adı</th>
                <th>Beden</th>
                <th>Ana Blok</th>
                <th>Koli No</th>
                <th>Lokasyon</th>
                <th>Adet</th>
              </tr>
            </thead>
            <tbody>
              {locateResults.map((r, idx)=> (
                <tr key={idx}>
                  <td><Badge bg="primary">{r.barkod}</Badge></td>
                  <td>{r.urun_adi}</td>
                  <td>{r.beden || '-'}</td>
                  <td>{r.ana_blok || '-'}</td>
                  <td>
                    {r.koli_no ? (
                      <Badge 
                        bg="info" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          navigator.clipboard.writeText(r.koli_no);
                          toast.success(`Koli numarası kopyalandı: ${r.koli_no}`);
                        }}
                        title="Koli numarasını kopyalamak için tıklayın"
                      >
                        {r.koli_no}
                      </Badge>
                    ) : '-'}
                  </td>
                  <td>{r.lokasyon || '-'}</td>
                  <td><Badge bg={Number(r.adet)>0 ? 'success' : 'secondary'}>{Number(r.adet)||0}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="light">Sorgu sonucunu görmek için barkod okutun veya arama yapın.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={()=> setShowLocateModal(false)}>Kapat</Button>
      </Modal.Footer>
    </Modal>

    </div>
  );
};

export default UrunYonetimi;
