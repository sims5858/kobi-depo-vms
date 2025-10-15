'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Table, Modal, Alert, Spinner, Pagination, InputGroup, Card, Badge } from 'react-bootstrap';
import { BiPlus, BiEdit, BiTrash, BiSearch, BiDownload, BiUpload, BiPackage, BiRefresh, BiCheck, BiX } from 'react-icons/bi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import axios from 'axios';

const UrunYonetimi = () => {
  const [urunListesi, setUrunListesi] = useState([]);
  const [filteredUrunListesi, setFilteredUrunListesi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUrun, setCurrentUrun] = useState({
    id: null,
    barkod: '',
    urun_adi: '',
    kategori: '',
    birim: '',
    stok_miktari: '',
    raf_omru: '',
    tedarikci: '',
    aciklama: '',
    lokasyon: '',
    koli: '',
    olusturma_tarihi: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [file, setFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrunler, setPreviewUrunler] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const fetchUrunler = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/urun');
      setUrunListesi(response.data);
      setFilteredUrunListesi(response.data);
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
      toast.error('Ürünler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrunler();
  }, [fetchUrunler]);

  useEffect(() => {
    const results = urunListesi.filter(urun =>
      urun.urun_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      urun.barkod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      urun.kategori.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUrunListesi(results);
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
  }, [searchTerm, urunListesi]);

  // Sayfa başına ürün sayısı değiştiğinde ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleShowAddModal = () => {
    setIsEditing(false);
    setCurrentUrun({
      id: null,
      barkod: '',
      urun_adi: '',
      kategori: '',
      birim: '',
      stok_miktari: '',
      raf_omru: '',
      tedarikci: '',
      aciklama: '',
      olusturma_tarihi: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleShowEditModal = (urun) => {
    setIsEditing(true);
    setCurrentUrun({
      id: urun.id,
      barkod: urun.barkod,
      urun_adi: urun.urun_adi,
      kategori: urun.kategori,
      birim: urun.birim,
      stok_miktari: urun.stok_miktari,
      raf_omru: urun.raf_omru,
      tedarikci: urun.tedarikci,
      aciklama: urun.aciklama,
      olusturma_tarihi: urun.olusturma_tarihi
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentUrun({
      id: null,
      barkod: '',
      urun_adi: '',
      kategori: '',
      birim: '',
      stok_miktari: '',
      raf_omru: '',
      tedarikci: '',
      aciklama: '',
      lokasyon: '',
      koli: '',
      olusturma_tarihi: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentUrun(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/urun/${currentUrun.id}`, currentUrun);
        toast.success('Ürün başarıyla güncellendi!');
      } else {
        await axios.post('/api/urun', currentUrun);
        toast.success('Ürün başarıyla eklendi!');
      }
      fetchUrunler();
      handleCloseModal();
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
      toast.error('Ürün kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await axios.delete(`/api/urun/${id}`);
      toast.success('Ürün başarıyla silindi!');
      fetchUrunler();
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error);
      toast.error('Ürün silinirken hata oluştu.');
    }
  };

  const handleExportExcel = () => {
    let exportData = [];
    let fileName = '';

    if (urunListesi.length > 0) {
      exportData = urunListesi.map(urun => ({
        'Barkod': urun.barkod,
        'Ürün Adı': urun.urun_adi,
        'Kategori': urun.kategori,
        'Birim': urun.birim,
        'Stok Miktarı': urun.stok_miktari,
        'Raf Ömrü (Gün)': urun.raf_omru,
        'Tedarikçi': urun.tedarikci,
        'Açıklama': urun.aciklama,
        'Oluşturma Tarihi': urun.olusturma_tarihi ? 
          new Date(urun.olusturma_tarihi).toLocaleDateString('tr-TR') : ''
      }));
      fileName = `urun-listesi-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`;
    } else {
      // Örnek format oluştur - hem yeni hem eski formatları destekle
      exportData = [
        {
          'Barkod': 'ÖRNEK-001',
          'Ürün Adı': 'Örnek Ürün 1',
          'Kategori': 'Elektronik',
          'Birim': 'Adet',
          'Stok Miktarı': 100,
          'Raf Ömrü (Gün)': 365,
          'Tedarikçi': 'Tedarikçi A',
          'Açıklama': 'Bu bir örnek üründür.',
          'Oluşturma Tarihi': typeof window !== 'undefined' ? new Date().toLocaleDateString('tr-TR') : ''
        },
        {
          'Barkod': 'ÖRNEK-002',
          'Ürün Adı': 'Örnek Ürün 2',
          'Kategori': 'Gıda',
          'Birim': 'Koli',
          'Stok Miktarı': 50,
          'Raf Ömrü (Gün)': 90,
          'Tedarikçi': 'Tedarikçi B',
          'Açıklama': 'Bu da başka bir örnek üründür.',
          'Oluşturma Tarihi': typeof window !== 'undefined' ? new Date().toLocaleDateString('tr-TR') : ''
        }
      ];
      fileName = `urun-format-ornegi-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, fileName);
    toast.info('Ürün listesi Excel olarak dışa aktarıldı.');
  };

  const handleFileChange = (e) => {
    console.log('Dosya seçildi:', e.target.files);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('Seçilen dosya:', selectedFile.name);
      setFile(selectedFile);
      // Dosya seçildiğinde otomatik olarak import işlemini başlat
      setTimeout(() => {
        handleImportExcel(selectedFile);
      }, 100);
    }
  };

  const handleImportExcel = async (selectedFile = null) => {
    console.log('handleImportExcel çağrıldı:', selectedFile);
    const fileToUse = selectedFile || file;
    if (!fileToUse) {
      toast.error('Lütfen bir Excel dosyası seçin.');
      return;
    }

    console.log('Import işlemi başlıyor:', fileToUse.name);
    const formData = new FormData();
    formData.append('file', fileToUse);

    try {
      // Önce Excel dosyasını parse et
      const importResponse = await axios.post('/api/urun/excel-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (importResponse.data.success) {
        const urunler = importResponse.data.urunler;
        
        // Önce preview modal'ı göster
        setPreviewUrunler(urunler);
        setShowPreviewModal(true);
        
        setFile(null); // Dosyayı sıfırla
        // Input'u temizle
        if (typeof window !== 'undefined') {
          document.getElementById('excelFileInput').value = '';
        }
      }
    } catch (error) {
      console.error('Excel içe aktarılırken hata oluştu:', error);
      toast.error('Excel içe aktarılırken hata oluştu: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleConfirmImport = async () => {
    if (previewUrunler.length === 0) {
      toast.error('İçe aktarılacak ürün bulunamadı.');
      return;
    }

    setLoading(true);
    setShowPreviewModal(false);
    setImportProgress({ current: 0, total: previewUrunler.length });

    try {
      // Toplu ekleme için batch işlemi
      const batchSize = 100; // Çok daha büyük batch boyutu
      const totalBatches = Math.ceil(previewUrunler.length / batchSize);
      let totalSuccessCount = 0;
      let totalErrorCount = 0;
      const koliNumaralari = new Set(); // Benzersiz koli numaralarını topla
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, previewUrunler.length);
        const batch = previewUrunler.slice(startIndex, endIndex);
        
        console.log(`Batch ${batchIndex + 1}/${totalBatches} işleniyor (${startIndex + 1}-${endIndex})`);
        
        try {
          // Toplu ekleme API'sini kullan
          const response = await axios.post('/api/urun/bulk-import', {
            urunler: batch
          });
          
          if (response.data.success) {
            totalSuccessCount += response.data.eklenen;
            totalErrorCount += response.data.hatali;
            
            // Koli numaralarını topla
            batch.forEach(urun => {
              if (urun.koli && urun.koli.trim() !== '') {
                koliNumaralari.add(urun.koli.trim());
              }
            });
          }
        } catch (error) {
          console.error('Batch eklenirken hata:', error);
          totalErrorCount += batch.length;
        }
        
        // Progress güncelle
        setImportProgress(prev => ({ ...prev, current: endIndex }));
        
        // Her batch'ten sonra kısa bir bekleme
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const successCount = totalSuccessCount;
      const errorCount = totalErrorCount;
      
      // Koli numaralarını koli yönetimine ekle (toplu)
      if (koliNumaralari.size > 0) {
        console.log(`${koliNumaralari.size} koli numarası ekleniyor...`);
        try {
          const response = await axios.post('/api/koli/bulk-import', {
            koliNumaralari: Array.from(koliNumaralari)
          });
          
          if (response.data.success) {
            console.log(`${response.data.eklenen} koli başarıyla eklendi`);
          }
        } catch (error) {
          console.error('Koli eklenirken hata:', error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} ürün başarıyla eklendi!`);
        if (koliNumaralari.size > 0) {
          toast.info(`${koliNumaralari.size} koli numarası koli yönetimine eklendi.`);
        }
        fetchUrunler();
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} ürün eklenirken hata oluştu (muhtemelen barkod çakışması)`);
      }
      
      setPreviewUrunler([]);
    } catch (error) {
      console.error('Ürünler eklenirken hata oluştu:', error);
      toast.error('Ürünler eklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUrunListesi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUrunListesi.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="page-transition" style={{ 
      height: '100vh', 
      overflow: 'hidden', 
      width: '100%',
      maxWidth: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Sabit Header */}
      <div className="bg-white border-bottom" style={{ 
        zIndex: 1000, 
        position: 'sticky', 
        top: 0,
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        <div className="d-flex justify-content-between align-items-center py-3 px-3">
          <div className="d-flex align-items-center">
            <div className="bg-primary text-white rounded p-2 me-3">
              <BiPackage size={24} />
            </div>
            <div>
              <h1 className="h3 mb-0 text-primary">Ürün Yönetimi</h1>
              <p className="text-muted mb-0">Ürün ekleme, düzenleme ve silme işlemleri</p>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><BiSearch /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Button variant="success" onClick={handleShowAddModal} className="d-flex align-items-center">
              <BiPlus className="me-1" /> Yeni Ürün Ekle
            </Button>
              <Button variant="info" onClick={handleExportExcel} className="d-flex align-items-center">
                <BiDownload className="me-1" /> Excel İndir
              </Button>
            <Button variant="warning" as="label" htmlFor="excelFileInput" className="d-flex align-items-center">
              <BiUpload className="me-1" /> Excel İçe Aktar
            </Button>
            <Button variant="secondary" onClick={fetchUrunler} className="d-flex align-items-center">
              <BiRefresh className="me-1" /> Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* File input */}
      <input
        type="file"
        id="excelFileInput"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Card className="anim-fade-in delay-1" style={{ 
        height: 'calc(100vh - 250px)', 
        overflow: 'hidden', 
        width: '100%',
        maxWidth: '100vw',
        margin: '0 1rem'
      }}>
        <Card.Body style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '0.75rem',
          overflow: 'hidden'
        }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="card-title mb-0">Ürün Listesi ({filteredUrunListesi.length} ürün)</h6>
          </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </Spinner>
                  <p className="mt-3 text-muted">
                    {importProgress.total > 0 
                      ? `Ürünler ekleniyor... ${importProgress.current}/${importProgress.total}`
                      : 'Ürünler yükleniyor, lütfen bekleyin...'
                    }
                  </p>
                  {importProgress.total > 0 && (
                    <div className="progress mt-3" style={{ width: '300px', margin: '0 auto' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        aria-valuenow={importProgress.current} 
                        aria-valuemin="0" 
                        aria-valuemax={importProgress.total}
                      >
                        {Math.round((importProgress.current / importProgress.total) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
          ) : filteredUrunListesi.length === 0 ? (
            <Alert variant="warning" className="text-center">
              <BiPackage className="me-2" />
              Henüz hiç ürün bulunamadı. Yeni bir ürün ekleyerek başlayabilirsiniz.
            </Alert>
          ) : (
            <>
              <div className="flex-grow-1" style={{ 
                overflow: 'auto', 
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                backgroundColor: '#fff',
                width: '100%',
                maxWidth: '100%',
                position: 'relative'
              }}>
                <Table striped hover className="mb-0 table-sm" style={{ 
                  minWidth: '1000px',
                  tableLayout: 'fixed',
                  width: '100%'
                }}>
                  <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ minWidth: '120px', width: '120px' }}>Barkod</th>
                      <th style={{ minWidth: '150px', width: '150px' }}>Ürün Adı</th>
                      <th style={{ minWidth: '100px', width: '100px' }}>Kategori</th>
                      <th style={{ minWidth: '60px', width: '60px' }}>Birim</th>
                      <th style={{ minWidth: '80px', width: '80px' }}>Stok</th>
                      <th style={{ minWidth: '120px', width: '120px' }}>Lokasyon</th>
                      <th style={{ minWidth: '100px', width: '100px' }}>Koli</th>
                      <th style={{ minWidth: '80px', width: '80px' }}>Raf Ömrü</th>
                      <th style={{ minWidth: '120px', width: '120px' }}>Tedarikçi</th>
                      <th style={{ minWidth: '100px', width: '100px' }}>Tarih</th>
                      <th style={{ minWidth: '100px', width: '100px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((urun) => (
                      <tr key={urun.id}>
                        <td style={{ minWidth: '120px', width: '120px' }}><code>{urun.barkod}</code></td>
                        <td style={{ minWidth: '150px', width: '150px' }}>{urun.urun_adi}</td>
                        <td style={{ minWidth: '100px', width: '100px' }}>{urun.kategori}</td>
                        <td style={{ minWidth: '60px', width: '60px' }}>{urun.birim}</td>
                        <td style={{ minWidth: '80px', width: '80px' }}>{urun.stok_miktari}</td>
                        <td style={{ minWidth: '120px', width: '120px' }}>{urun.lokasyon || 'N/A'}</td>
                        <td style={{ minWidth: '100px', width: '100px' }}>{urun.koli || 'N/A'}</td>
                        <td style={{ minWidth: '80px', width: '80px' }}>{urun.raf_omru} Gün</td>
                        <td style={{ minWidth: '120px', width: '120px' }}>{urun.tedarikci}</td>
                        <td style={{ minWidth: '100px', width: '100px' }}>{urun.olusturma_tarihi ? new Date(urun.olusturma_tarihi).toLocaleDateString('tr-TR') : 'N/A'}</td>
                        <td style={{ minWidth: '100px', width: '100px' }}>
                          <Button variant="primary" size="sm" className="me-2" onClick={() => handleShowEditModal(urun)}>
                            <BiEdit />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(urun.id)}>
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-auto pt-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted">Sayfa başına:</span>
                    <Form.Select 
                      value={itemsPerPage} 
                      onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                      style={{ width: '80px' }}
                      size="sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Form.Select>
                    <span className="text-muted">
                      {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUrunListesi.length)} / {filteredUrunListesi.length} ürün
                    </span>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Önceki
                    </Button>
                    
                    <span className="mx-2">
                      Sayfa {currentPage} / {totalPages}
                    </span>
                    
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Barkod</Form.Label>
              <Form.Control
                type="text"
                name="barkod"
                value={currentUrun.barkod}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ürün Adı</Form.Label>
              <Form.Control
                type="text"
                name="urun_adi"
                value={currentUrun.urun_adi}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                type="text"
                name="kategori"
                value={currentUrun.kategori}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Birim</Form.Label>
              <Form.Control
                type="text"
                name="birim"
                value={currentUrun.birim}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stok Miktarı</Form.Label>
              <Form.Control
                type="number"
                name="stok_miktari"
                value={currentUrun.stok_miktari}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Raf Ömrü (Gün)</Form.Label>
              <Form.Control
                type="number"
                name="raf_omru"
                value={currentUrun.raf_omru}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tedarikçi</Form.Label>
              <Form.Control
                type="text"
                name="tedarikci"
                value={currentUrun.tedarikci}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                name="aciklama"
                value={currentUrun.aciklama}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lokasyon</Form.Label>
              <Form.Control
                type="text"
                name="lokasyon"
                value={currentUrun.lokasyon}
                onChange={handleChange}
                placeholder="Ürünün bulunduğu lokasyon"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Koli Numarası</Form.Label>
              <Form.Control
                type="text"
                name="koli"
                value={currentUrun.koli}
                onChange={handleChange}
                placeholder="Ürünün bulunduğu koli numarası"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {isEditing ? 'Kaydet' : 'Ekle'}
            </Button>
          </Form>
        </Modal.Body>
          </Modal>

          {/* Preview Modal */}
          <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl" centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <BiCheck className="me-2" />
                Algılanan Ürünler ({previewUrunler.length} adet)
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert variant="info" className="mb-3">
                <strong>Excel dosyasından {previewUrunler.length} ürün algılandı.</strong><br/>
                Aşağıdaki ürünleri sisteme eklemek istediğinizden emin misiniz?
              </Alert>
              
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Kategori/Beden</th>
                      <th>Stok</th>
                      <th>Lokasyon</th>
                      <th>Koli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewUrunler.map((urun, index) => (
                      <tr key={index}>
                        <td><code>{urun.barkod}</code></td>
                        <td>{urun.urun_adi}</td>
                        <td>
                          <Badge bg="secondary">{urun.kategori}</Badge>
                        </td>
                        <td>
                          <Badge bg="info">{urun.stok_miktari}</Badge>
                        </td>
                        <td>{urun.lokasyon || 'N/A'}</td>
                        <td>{urun.koli || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                <BiX className="me-1" /> İptal
              </Button>
              <Button variant="success" onClick={handleConfirmImport} disabled={loading}>
                <BiCheck className="me-1" /> 
                {loading ? 'Ekleniyor...' : `${previewUrunler.length} Ürünü Ekle`}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    };

    export default UrunYonetimi;