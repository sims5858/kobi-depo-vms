'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal, Pagination } from 'react-bootstrap';
import { BiTag, BiPlus, BiEdit, BiTrash, BiSave, BiX, BiSearch, BiUpload, BiFile, BiMapPin, BiBox, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const UrunYonetimi = () => {
  const [urunListesi, setUrunListesi] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelPreview, setExcelPreview] = useState([]);
  const [selectedUrunler, setSelectedUrunler] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedUrunLocation, setSelectedUrunLocation] = useState(null);

  useEffect(() => {
    loadUrunListesi();
  }, []);

  const loadUrunListesi = async () => {
    setLoading(true);
    try {
      console.log('Ürün listesi yükleniyor...');
      const response = await fetch('/api/urun');
      const data = await response.json();
      console.log('Ürün listesi yüklendi:', data.length, 'ürün');
      setUrunListesi(data);
    } catch (error) {
      console.error('Ürün listesi yüklenirken hata:', error);
      toast.error('Ürün listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingUrun ? `/api/urun/${editingUrun.barkod}` : '/api/urun';
      const method = editingUrun ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingUrun ? 'Ürün güncellendi' : 'Ürün eklendi');
        setShowModal(false);
        setFormData({ barkod: '', urun_adi: '', aciklama: '', birim: 'adet', beden: '', koli_no: '' });
        setEditingUrun(null);
        loadUrunListesi();
      } else {
        toast.error('Ürün kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error);
      toast.error('Ürün kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (urun) => {
    setEditingUrun(urun);
    setFormData({
      barkod: urun.barkod,
      urun_adi: urun.urun_adi,
      aciklama: urun.aciklama || '',
      birim: urun.birim || 'adet',
      beden: urun.beden || '',
      koli_no: urun.koli_no || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (barkod) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/urun/${barkod}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Ürün silindi');
        loadUrunListesi();
      } else {
        toast.error('Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Ürün silme hatası:', error);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ barkod: '', urun_adi: '', aciklama: '', birim: 'adet', beden: '', koli_no: '' });
    setEditingUrun(null);
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.warning('Lütfen bir Excel dosyası seçin');
      return;
    }

    console.log('Selected file:', file.name, file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('File read successfully');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log('Excel data:', jsonData);

        // İlk satır başlık olduğu için atla
        const dataRows = jsonData.slice(1);
        
        const processedData = dataRows
          .filter(row => row.length >= 6 && row[0] && row[1]) // En az 6 sütun ve ilk 2 sütun dolu olmalı
          .map((row, index) => ({
            id: index + 1,
            barkod: row[0]?.toString() || '',
            urun_adi: row[1]?.toString() || '',
            beden: row[2]?.toString() || '',
            ana_blok: row[3]?.toString() || '',
            koli_no: row[4]?.toString() || '',
            adet: parseInt(row[5]) || 1
          }));

        console.log('Processed data:', processedData);

        if (processedData.length === 0) {
          toast.warning('Excel dosyasında geçerli veri bulunamadı');
          return;
        }

        setExcelData(processedData);
        setExcelPreview(processedData.slice(0, 10)); // İlk 10 satırı önizleme için
        setShowExcelModal(true);
        
        toast.success(`${processedData.length} ürün Excel dosyasından okundu`);
      } catch (error) {
        console.error('Excel okuma hatası:', error);
        toast.error('Excel dosyası okunurken hata oluştu: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      console.error('File read error');
      toast.error('Dosya okunurken hata oluştu');
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleExcelImport = async () => {
    if (excelData.length === 0) {
      toast.warning('İçe aktarılacak veri bulunamadı');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/urun/excel-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urunler: excelData }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Excel import sonucu:', result);
        toast.success(`${result.eklenen} ürün başarıyla eklendi, ${result.guncellenen} ürün güncellendi`);
        setShowExcelModal(false);
        setExcelData([]);
        setExcelPreview([]);
        console.log('Ürün listesi yenileniyor...');
        await loadUrunListesi();
      } else {
        const error = await response.json();
        console.error('Excel import hatası:', error);
        toast.error(error.error || 'Ürünler içe aktarılırken hata oluştu');
      }
    } catch (error) {
      console.error('Excel import hatası:', error);
      toast.error('Ürünler içe aktarılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Toplu seçim fonksiyonları
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUrunler(currentUrunler.map(urun => urun.barkod));
    } else {
      setSelectedUrunler([]);
    }
  };

  // Tüm sayfalardaki ürünleri seç/seçme
  const handleSelectAllPages = () => {
    if (selectedUrunler.length === filteredUrunler.length) {
      // Tümü seçiliyse, hepsini kaldır
      setSelectedUrunler([]);
      setSelectAll(false);
      toast.info('Tüm seçimler kaldırıldı');
    } else {
      // Tümünü seç
      setSelectedUrunler(filteredUrunler.map(urun => urun.barkod));
      setSelectAll(true);
      toast.success(`${filteredUrunler.length} ürün seçildi`);
    }
  };

  const handleSelectUrun = (barkod, checked) => {
    if (checked) {
      setSelectedUrunler([...selectedUrunler, barkod]);
    } else {
      setSelectedUrunler(selectedUrunler.filter(b => b !== barkod));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUrunler.length === 0) {
      toast.warning('Silinecek ürün seçiniz');
      return;
    }

    if (!window.confirm(`${selectedUrunler.length} ürünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/urun/delete-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barkodlar: selectedUrunler }),
      });

      if (response.ok) {
        toast.success(`${selectedUrunler.length} ürün başarıyla silindi`);
        setSelectedUrunler([]);
        setSelectAll(false);
        await loadUrunListesi();
      } else {
        toast.error('Ürünler silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Ürünler silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredUrunler = urunListesi.filter(urun =>
    urun.barkod.toLowerCase().includes(query.toLowerCase()) ||
    urun.urun_adi.toLowerCase().includes(query.toLowerCase())
  );

  // Arama yapıldığında sayfa 1'e dön
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUrunler([]);
    setSelectAll(false);
  }, [query]);

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(filteredUrunler.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUrunler = filteredUrunler.slice(startIndex, endIndex);

  // Sayfa değiştirme fonksiyonları
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedUrunler([]);
    setSelectAll(false);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedUrunler([]);
    setSelectAll(false);
  };

  // Sayfa numaralarını oluştur
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Lokasyon detay popup'ını aç
  const handleLocationClick = (urun) => {
    if (!urun.lokasyon) {
      toast.warning('Bu ürün için lokasyon bilgisi bulunmuyor');
      return;
    }
    
    setSelectedUrunLocation(urun);
    setShowLocationModal(true);
  };

  // Lokasyon bilgisini parse et
  const parseLocationInfo = (urun) => {
    if (!urun) return [];
    
    // Eğer koli_detaylari varsa onu kullan
    if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
      return Object.entries(urun.koli_detaylari).map(([koli_no, adet]) => ({
        koli_no,
        adet: parseInt(adet)
      }));
    }
    
    // Eski format için fallback
    if (!urun.lokasyon) return [];
    
    const locations = urun.lokasyon.split(',').map(loc => ({
      koli_no: loc.trim(),
      adet: 1 // Eski format için varsayılan miktar
    }));
    
    return locations;
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Ürün Yönetimi</h1>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Ürün Yönetimi:</strong> Ürün ekleme, düzenleme ve silme işlemlerini yapabilirsiniz. 
        Excel dosyası ile toplu ürün yükleme özelliği mevcuttur.
      </Alert>

      {/* Arama */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Arama</Form.Label>
            <div className="input-group">
              <Form.Control
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Barkod, ürün adı veya kategori ile arayın"
              />
              <Button variant="outline-secondary">
                <BiSearch />
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h5 className="mb-0 me-3">
                Ürün Listesi
                {filteredUrunler.length > 0 && (
                  <Badge bg="info" className="ms-2">
                    {filteredUrunler.length} ürün
                  </Badge>
                )}
              </h5>
              <div className="d-flex align-items-center">
                <Form.Label className="me-2 mb-0">Sayfa başına:</Form.Label>
                <Form.Select
                  size="sm"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  style={{ width: '80px' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </div>
            </div>
            <div className="d-flex gap-1">
              {filteredUrunler.length > 0 && (
                <Button 
                  variant={selectedUrunler.length === filteredUrunler.length ? "outline-secondary" : "outline-primary"}
                  size="sm"
                  onClick={handleSelectAllPages}
                  className="d-flex align-items-center"
                  title={selectedUrunler.length === filteredUrunler.length ? "Tüm seçimleri kaldır" : "Tüm ürünleri seç"}
                >
                  <BiCheck className="me-1" />
                  {selectedUrunler.length === filteredUrunler.length ? "Seçimi Kaldır" : "Hepsini Seç"}
                </Button>
              )}
              {selectedUrunler.length > 0 && (
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className="d-flex align-items-center"
                  title="Seçili ürünleri sil"
                >
                  <BiTrash className="me-1" />
                  Sil ({selectedUrunler.length})
                </Button>
              )}
              <div className="position-relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                  id="excel-upload"
                />
                <Button 
                  variant="success" 
                  size="sm"
                  as="label" 
                  htmlFor="excel-upload"
                  className="d-flex align-items-center"
                  title="Excel ile ürün yükle"
                >
                  <BiUpload className="me-1" />
                  Excel
                </Button>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center"
                title="Yeni ürün ekle"
              >
                <BiPlus className="me-1" />
                Yeni
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
          ) : currentUrunler.length > 0 ? (
            <>
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
                  <th>Barkod</th>
                  <th>Ürün Adı</th>
                  <th>Beden</th>
                  <th>Stok Adet</th>
                  <th>Lokasyon</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {currentUrunler.map((urun, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedUrunler.includes(urun.barkod)}
                        onChange={(e) => handleSelectUrun(urun.barkod, e.target.checked)}
                      />
                    </td>
                    <td><code>{urun.barkod}</code></td>
                    <td>{urun.urun_adi}</td>
                           <td><Badge bg="info">{urun.beden || '-'}</Badge></td>
                           <td><Badge bg="success">{urun.stok_adet || 0}</Badge></td>
                           <td>
                             {urun.lokasyon ? (
                               <Badge 
                                 bg="primary" 
                                 style={{ cursor: 'pointer' }}
                                 onClick={() => handleLocationClick(urun)}
                                 title="Lokasyon detaylarını görüntüle"
                               >
                                 {urun.lokasyon}
                               </Badge>
                             ) : (
                               <Badge bg="secondary">Belirtilmemiş</Badge>
                             )}
                           </td>
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
                        onClick={() => handleDelete(urun.barkod)}
                      >
                        <BiTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  {startIndex + 1}-{Math.min(endIndex, filteredUrunler.length)} / {filteredUrunler.length} ürün gösteriliyor
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        İlk
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Önceki
                      </button>
                    </li>
                    
                    {getPageNumbers().map(page => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Sonraki
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Son
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-5">
              <BiTag size={48} className="text-muted mb-3" />
              <p className="text-muted">
                {query ? 'Arama kriterlerinize uygun ürün bulunamadı' : 'Henüz ürün bulunmuyor'}
              </p>
              {!query && (
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <BiPlus className="me-1" />
                  İlk Ürünü Ekle
                </Button>
              )}
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barkod</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.barkod}
                    onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                    placeholder="Ürün barkodunu girin"
                    required
                    disabled={editingUrun}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ürün Adı</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.urun_adi}
                    onChange={(e) => setFormData({ ...formData, urun_adi: e.target.value })}
                    placeholder="Ürün adını girin"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    placeholder="Kategori"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Beden</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.beden}
                    onChange={(e) => setFormData({ ...formData, beden: e.target.value })}
                    placeholder="Beden"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Birim</Form.Label>
                  <Form.Select
                    value={formData.birim}
                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                  >
                    <option value="adet">Adet</option>
                    <option value="kg">Kilogram</option>
                    <option value="lt">Litre</option>
                    <option value="m">Metre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Koli Numarası</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.koli_no}
                    onChange={(e) => setFormData({ ...formData, koli_no: e.target.value })}
                    placeholder="Koli numarası"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              <BiX className="me-1" />
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <BiSave className="me-1" />
              {editingUrun ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Excel Önizleme Modal */}
      <Modal show={showExcelModal} onHide={() => setShowExcelModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <BiFile className="me-2" />
            Excel Dosyası Önizleme
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <strong>Excel Formatı:</strong><br />
            A Kolonu: Ürün Barkodu | B Kolonu: Ürün İsmi | C Kolonu: Ürün Bedeni<br />
            D Kolonu: Ana Blok (opsiyonel) | E Kolonu: Koli Numarası | F Kolonu: Ürün Adedi
          </Alert>
          
          <div className="mb-3">
            <strong>Toplam Ürün Sayısı:</strong> {excelData.length}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table responsive striped hover size="sm">
              <thead className="sticky-top bg-light">
                <tr>
                  <th>Barkod</th>
                  <th>Ürün İsmi</th>
                  <th>Beden</th>
                  <th>Ana Blok</th>
                  <th>Koli No</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                {excelPreview.map((urun, index) => (
                  <tr key={index}>
                    <td><code>{urun.barkod}</code></td>
                    <td>{urun.urun_adi}</td>
                    <td><Badge bg="info">{urun.beden}</Badge></td>
                    <td>{urun.ana_blok || '-'}</td>
                    <td><Badge bg="primary">{urun.koli_no}</Badge></td>
                    <td><Badge bg="success">{urun.adet}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {excelData.length > 10 && (
            <Alert variant="warning" className="mt-3">
              Sadece ilk 10 satır gösteriliyor. Toplam {excelData.length} ürün var.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExcelModal(false)}>
            <BiX className="me-1" />
            İptal
          </Button>
          <Button variant="success" onClick={handleExcelImport} disabled={loading}>
            <BiUpload className="me-1" />
            {loading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
             </Modal.Footer>
           </Modal>

           {/* Lokasyon Detay Modal */}
           <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} size="lg">
             <Modal.Header closeButton>
               <Modal.Title>
                 <BiMapPin className="me-2" />
                 Lokasyon Detayları
               </Modal.Title>
             </Modal.Header>
             <Modal.Body>
               {selectedUrunLocation && (
                 <>
                   <div className="mb-4">
                     <h5 className="mb-2">
                       <BiTag className="me-2" />
                       {selectedUrunLocation.urun_adi}
                     </h5>
                     <p className="text-muted mb-0">
                       <strong>Barkod:</strong> <code>{selectedUrunLocation.barkod}</code>
                     </p>
                     <p className="text-muted mb-0">
                       <strong>Toplam Stok:</strong> <Badge bg="success">{selectedUrunLocation.stok_adet || 0} adet</Badge>
                     </p>
                   </div>

                   <div className="mb-3">
                     <h6 className="mb-3">
                       <BiBox className="me-2" />
                       Koli Dağılımı
                     </h6>
                     
                     {parseLocationInfo(selectedUrunLocation).length > 0 ? (
                       <div className="row">
                         {parseLocationInfo(selectedUrunLocation).map((location, index) => (
                           <div key={index} className="col-md-6 col-lg-4 mb-3">
                             <Card className="h-100 border-primary">
                               <Card.Body className="text-center">
                                 <BiBox size={32} className="text-primary mb-2" />
                                 <h6 className="card-title mb-1">{location.koli_no}</h6>
                                 <Badge bg="info" className="mb-2">
                                   {location.adet} adet
                                 </Badge>
                                 <div className="mt-2">
                                   <small className="text-muted">
                                     {((location.adet / (selectedUrunLocation.stok_adet || 1)) * 100).toFixed(1)}% 
                                     toplam stoktan
                                   </small>
                                 </div>
                               </Card.Body>
                             </Card>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <Alert variant="warning">
                         <BiMapPin className="me-2" />
                         Lokasyon bilgisi bulunamadı
                       </Alert>
                     )}
                   </div>

                   <Alert variant="info" className="mb-0">
                     <strong>Bilgi:</strong> Bu ürün {parseLocationInfo(selectedUrunLocation).length} farklı kolide bulunmaktadır.
                     {parseLocationInfo(selectedUrunLocation).length > 1 && (
                       <span> En yüksek miktar <strong>{Math.max(...parseLocationInfo(selectedUrunLocation).map(l => l.adet))} adet</strong> ile <strong>{parseLocationInfo(selectedUrunLocation).find(l => l.adet === Math.max(...parseLocationInfo(selectedUrunLocation).map(l => l.adet)))?.koli_no}</strong> kolisinde bulunmaktadır.</span>
                     )}
                   </Alert>
                 </>
               )}
             </Modal.Body>
             <Modal.Footer>
               <Button variant="secondary" onClick={() => setShowLocationModal(false)}>
                 <BiX className="me-1" />
                 Kapat
               </Button>
             </Modal.Footer>
           </Modal>
         </div>
       );
     };

export default UrunYonetimi;