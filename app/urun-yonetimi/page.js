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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [file, setFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrunler, setPreviewUrunler] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showKoliModal, setShowKoliModal] = useState(false);
  const [selectedUrun, setSelectedUrun] = useState(null);
  const [selectedUrunler, setSelectedUrunler] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupByBarcode, setGroupByBarcode] = useState(true); // Gruplandırma modu
  const [sortBy, setSortBy] = useState(''); // Sıralama türü: 'stok_asc', 'stok_desc', ''

  const fetchUrunler = useCallback(async () => {
    setLoading(true);
    try {
      console.log('=== FRONTEND ÜRÜN YÜKLEME ===');
      const response = await axios.get('/api/urun');
      console.log('API Response:', response.data);
      console.log('Ürün sayısı:', response.data.length);
      
      // İlk 3 ürünün ID'lerini kontrol et
      if (response.data.length > 0) {
        console.log('İlk 3 ürünün ID\'leri:', response.data.slice(0, 3).map(u => ({ id: u.id, barkod: u.barkod, urun_adi: u.urun_adi })));
      }
      
      setUrunListesi(response.data);
      setFilteredUrunListesi(response.data);
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
      toast.error('Ürünler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aynı barkodlu ürünleri gruplandır
  const groupProductsByBarcode = (products) => {
    const grouped = {};
    products.forEach(product => {
      if (!grouped[product.barkod]) {
        grouped[product.barkod] = {
          ...product,
          koliListesi: [],
          koliDetaylari: [], // Her koli için detay bilgisi
          toplamStok: 0
        };
      }
      
      // Koli numarası varsa ekle
      if (product.birim) {
        grouped[product.barkod].koliListesi.push(product.birim);
        grouped[product.barkod].koliDetaylari.push({
          koliNo: product.birim,
          stokMiktari: product.stok_miktari
        });
      }
      
      grouped[product.barkod].toplamStok += product.stok_miktari;
    });
    return Object.values(grouped);
  };

  useEffect(() => {
    fetchUrunler();
  }, [fetchUrunler]);

  useEffect(() => {
    console.log('=== FRONTEND FİLTRELEME ===');
    console.log('Ürün listesi:', urunListesi);
    console.log('Arama terimi:', searchTerm);
    
    const results = urunListesi.filter(urun =>
      urun.urun_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      urun.barkod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (urun.birim && urun.birim.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (urun.aciklama && urun.aciklama.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    console.log('Filtrelenmiş sonuçlar:', results);
    
    // Gruplandırma moduna göre sonuçları ayarla
    if (groupByBarcode) {
      // Aynı barkodlu ürünleri gruplandır
      const groupedResults = groupProductsByBarcode(results);
      console.log('Gruplandırılmış sonuçlar:', groupedResults);
      setFilteredUrunListesi(groupedResults);
    } else {
      // Tüm ürünleri ayrı ayrı göster
      setFilteredUrunListesi(results);
    }
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
  }, [searchTerm, urunListesi, groupByBarcode]);

  // Sıralama fonksiyonu
  const handleSort = (sortType) => {
    setSortBy(sortType);
    setCurrentPage(1); // Sıralama değiştiğinde ilk sayfaya dön
  };

  // Sıralama uygulama
  const applySorting = (data) => {
    if (!sortBy) return data;
    
    return [...data].sort((a, b) => {
      let aValue, bValue;
      
      if (groupByBarcode) {
        // Gruplandırılmış modda toplam stok kullan
        aValue = a.toplamStok || a.stok_miktari || 0;
        bValue = b.toplamStok || b.stok_miktari || 0;
      } else {
        // Normal modda stok miktarı kullan
        aValue = a.stok_miktari || 0;
        bValue = b.stok_miktari || 0;
      }
      
      if (sortBy === 'stok_asc') {
        return aValue - bValue;
      } else if (sortBy === 'stok_desc') {
        return bValue - aValue;
      }
      return 0;
    });
  };

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
        
        // Eğer koli numarası varsa, koli oluştur
        if (currentUrun.koli && currentUrun.koli.trim() !== '') {
          try {
            console.log('Koli oluşturuluyor:', currentUrun.koli);
            const koliResponse = await axios.post('/api/koli/bulk-import', {
              koliNumaralari: [currentUrun.koli.trim()]
            });
            
            if (koliResponse.data.success) {
              console.log('Koli başarıyla oluşturuldu:', koliResponse.data);
              toast.info(`Koli ${currentUrun.koli} koli yönetimine eklendi.`);
            }
          } catch (koliError) {
            console.error('Koli oluşturulurken hata:', koliError);
            // Koli oluşturma hatası kritik değil, sadece log'la
          }
        }
      }
      fetchUrunler();
      handleCloseModal();
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
      toast.error('Ürün kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id) => {
    console.log('Silinecek ürün ID:', id);
    console.log('ID tipi:', typeof id);
    
    // ID validasyonu
    if (!id || id === null || id === undefined || isNaN(id)) {
      console.error('Geçersiz ID:', id);
      toast.error('Ürün ID geçersiz. Lütfen sayfayı yenileyin.');
      return;
    }
    
    if (typeof window !== 'undefined' && !window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setLoading(true); // Loading state ekle
    
    try {
      console.log('Silme API çağrısı yapılıyor:', `/api/urun/${id}`);
      
      // Daha kısa timeout ve daha basit istek
      const response = await axios.delete(`/api/urun/${id}`, {
        timeout: 5000, // 5 saniye timeout (daha kısa)
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Silme API response:', response.data);
      toast.success('Ürün başarıyla silindi!');
      
      // Sadece mevcut sayfayı yenile, tüm listeyi değil
      const currentPageData = filteredUrunListesi.filter(urun => urun.id !== id);
      setUrunListesi(prev => prev.filter(urun => urun.id !== id));
      
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        toast.error('Sunucu kaynak yetersizliği. Sayfayı yenileyip tekrar deneyin.');
        // Hata durumunda sayfayı yenile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Ürün silinirken hata oluştu: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUrun = (id) => {
    setSelectedUrunler(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUrunler.length === filteredUrunListesi.length) {
      setSelectedUrunler([]);
    } else {
      setSelectedUrunler(filteredUrunListesi.map(urun => urun.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUrunler.length === 0) {
      toast.warning('Silinecek ürün seçiniz');
      return;
    }

    setLoading(true);
    try {
      // Daha küçük batch'ler halinde silme işlemi
      const batchSize = 5; // Aynı anda maksimum 5 ürün sil
      const totalBatches = Math.ceil(selectedUrunler.length / batchSize);
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, selectedUrunler.length);
        const batch = selectedUrunler.slice(startIndex, endIndex);
        
        console.log(`Batch ${i + 1}/${totalBatches} işleniyor (${batch.length} ürün)`);
        
        try {
          const deletePromises = batch.map(id => 
            axios.delete(`/api/urun/${id}`, {
              timeout: 5000 // 5 saniye timeout
            })
          );
          
          await Promise.all(deletePromises);
          successCount += batch.length;
          
          // Her batch'ten sonra kısa bekleme
          if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Batch ${i + 1} silme hatası:`, error);
          errorCount += batch.length;
        }
      }
      
      // Sonuçları göster
      if (successCount > 0) {
        toast.success(`${successCount} ürün başarıyla silindi`);
        // Sadece başarılı silinen ürünleri listeden çıkar
        setUrunListesi(prev => prev.filter(urun => !selectedUrunler.includes(urun.id)));
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} ürün silinirken hata oluştu`);
      }
      
      setSelectedUrunler([]);
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast.error('Ürünler silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // Yeni Excel formatına göre örnek format oluştur
    const exportData = [
      {
        'Barkod': '3515720019999',
        'Ürün Adı': 'MIV9336 7317',
        'Birim': 'D1-0217',
        'Stok Miktarı': 2,
        'Açıklama': ''
      },
      {
        'Barkod': '3515720135354',
        'Ürün Adı': 'MIV9336 0247',
        'Birim': 'D1-0217',
        'Stok Miktarı': 1,
        'Açıklama': ''
      },
      {
        'Barkod': '3515720416095',
        'Ürün Adı': 'MIV7739 7317',
        'Birim': 'D1-0217',
        'Stok Miktarı': 6,
        'Açıklama': ''
      },
      {
        'Barkod': '3515720170348',
        'Ürün Adı': 'MIV9706 8541',
        'Birim': 'D1-0218',
        'Stok Miktarı': 1,
        'Açıklama': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'urun_format_ornegi.xlsx');
    toast.info('Excel format örneği indirildi.');
  };

  const handleExportExistingProducts = () => {
    if (!urunListesi || urunListesi.length === 0) {
      toast.warning('Aktarılacak ürün bulunamadı!');
      return;
    }

    // Mevcut ürünleri yeni formata göre dışa aktar
    const exportData = urunListesi.map(urun => ({
      'Barkod': urun.barkod,
      'Ürün Adı': urun.urun_adi,
      'Birim': urun.birim || '',
      'Stok Miktarı': urun.stok_miktari || 0,
      'Açıklama': urun.aciklama || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mevcut Ürünler');
    
    const currentDate = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export';
    XLSX.writeFile(wb, `mevcut_urunler_${currentDate}.xlsx`);
    toast.info('Mevcut ürünler Excel olarak dışa aktarıldı.');
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

      console.log('API Response:', importResponse.data);

      if (importResponse.data.success) {
        const urunler = importResponse.data.urunler || [];
        console.log('Algılanan ürünler:', urunler);
        
        if (urunler.length === 0) {
          toast.warning('Excel dosyasında geçerli ürün bulunamadı. Lütfen dosya formatını kontrol edin.');
          return;
        }
        
        // Önce preview modal'ı göster
        setPreviewUrunler(urunler);
        setShowPreviewModal(true);
        
        setFile(null); // Dosyayı sıfırla
        // Input'u temizle
        if (typeof window !== 'undefined') {
          document.getElementById('excelFileInput').value = '';
        }
      } else {
        toast.error('Excel dosyası işlenirken hata oluştu: ' + (importResponse.data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Excel içe aktarılırken hata oluştu:', error);
      toast.error('Excel içe aktarılırken hata oluştu: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleConfirmImport = async () => {
    if (!previewUrunler || previewUrunler.length === 0) {
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
            totalSuccessCount += response.data.eklenen || response.data.importedCount || batch.length;
            // Hata sayısını batch boyutundan başarılı olanları çıkararak hesapla
            const batchErrorCount = batch.length - (response.data.eklenen || response.data.importedCount || batch.length);
            totalErrorCount += batchErrorCount;
            
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
      } else if (successCount > 0) {
        // Eğer hata yoksa ve başarılı ekleme varsa, sadece başarı mesajı göster
        console.log('Tüm ürünler başarıyla eklendi, hata yok');
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
  const sortedItems = applySorting(filteredUrunListesi);
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleShowKoliModal = (urun) => {
    setSelectedUrun(urun);
    setShowKoliModal(true);
  };

  const handleCloseKoliModal = () => {
    setShowKoliModal(false);
    setSelectedUrun(null);
  };


  return (
    <div className="page-transition" style={{ height: '100vh', overflow: 'hidden', width: '100%' }}>
      {/* Sabit Header */}
      <div className="sticky-top bg-white border-bottom mb-3" style={{ zIndex: 1000 }}>
        <div className="d-flex justify-content-between align-items-center py-3">
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
            <Button variant="success" onClick={handleShowAddModal} className="d-flex align-items-center">
              <BiPlus className="me-1" /> Yeni Ürün Ekle
            </Button>
            <Button variant="info" onClick={handleExportExcel} className="d-flex align-items-center">
              <BiDownload className="me-1" /> Excel Formatı
            </Button>
            <Button variant="primary" onClick={handleExportExistingProducts} className="d-flex align-items-center">
              <BiDownload className="me-1" /> Mevcut Ürünlerin Excel'ini Al
            </Button>
            <Button variant="warning" as="label" htmlFor="excelFileInput" className="d-flex align-items-center">
              <BiUpload className="me-1" /> Excel İçe Aktar
            </Button>
            {selectedUrunler.length > 0 && (
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteModal(true)} 
                className="d-flex align-items-center"
              >
                <BiTrash className="me-1" /> 
                Seçili Ürünleri Sil ({selectedUrunler.length})
              </Button>
            )}
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

      <Card className="anim-fade-in delay-1" style={{ height: 'calc(100vh - 200px)', overflow: 'hidden', width: '100%' }}>
        <Card.Body style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div className="d-flex flex-column gap-3 mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                Ürün Listesi ({filteredUrunListesi.length} ürün)
                {groupByBarcode && (
                  <small className="text-muted ms-2">
                    (Aynı barkodlu ürünler gruplandırılmış)
                  </small>
                )}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="groupByBarcode"
                  label="Barkod Gruplandır"
                  checked={groupByBarcode}
                  onChange={(e) => setGroupByBarcode(e.target.checked)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <InputGroup style={{ maxWidth: '500px', width: '100%' }}>
                <InputGroup.Text><BiSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Ürün ara... (Barkod, Ürün Adı, Koli Numarası veya Açıklama)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '1rem', padding: '12px' }}
                />
              </InputGroup>
            </div>
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
                boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
              }}>
                <Table striped hover className="mb-0 table-responsive" style={{ minWidth: '900px' }}>
                  <thead style={{ 
                    backgroundColor: '#f8f9fa', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 10,
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    <tr>
                      <th style={{ 
                        minWidth: '50px', 
                        width: '50px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none',
                        textAlign: 'center'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedUrunler.length === filteredUrunListesi.length && filteredUrunListesi.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th style={{ 
                        minWidth: '80px', 
                        width: '80px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none',
                        textAlign: 'center'
                      }}>ID</th>
                      <th style={{ 
                        minWidth: '150px', 
                        width: '150px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none'
                      }}>Barkod</th>
                      <th style={{ 
                        minWidth: '250px', 
                        width: '250px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none'
                      }}>Ürün Adı</th>
                      <th style={{ 
                        minWidth: '150px', 
                        width: '150px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none'
                      }}>Koli Numarası</th>
                      <th style={{ 
                        minWidth: '120px', 
                        width: '120px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none',
                        textAlign: 'center',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => {
                        if (sortBy === 'stok_asc') {
                          handleSort('stok_desc');
                        } else if (sortBy === 'stok_desc') {
                          handleSort('');
                        } else {
                          handleSort('stok_asc');
                        }
                      }}
                      title="Stok miktarına göre sırala (tıkla)"
                      className="hover-bg-light"
                      >
                        Stok Miktarı
                        {sortBy === 'stok_asc' && <span className="ms-1">↑</span>}
                        {sortBy === 'stok_desc' && <span className="ms-1">↓</span>}
                      </th>
                      <th style={{ 
                        minWidth: '200px', 
                        width: '200px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none'
                      }}>Açıklama</th>
                      <th style={{ 
                        minWidth: '130px', 
                        width: '130px',
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: 'none',
                        textAlign: 'center'
                      }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((urun, index) => (
                      <tr key={urun.id} style={{ 
                        borderBottom: index === currentItems.length - 1 ? 'none' : '1px solid #f1f3f4'
                      }}>
                        <td style={{ 
                          minWidth: '50px', 
                          width: '50px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          textAlign: 'center'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedUrunler.includes(urun.id)}
                            onChange={() => handleSelectUrun(urun.id)}
                          />
                        </td>
                        <td style={{ 
                          minWidth: '80px', 
                          width: '80px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontWeight: '500',
                          color: '#6c757d'
                        }}>
                          {urun.id || 'N/A'}
                        </td>
                        <td style={{ 
                          minWidth: '150px', 
                          width: '150px',
                          padding: '12px 8px',
                          verticalAlign: 'middle'
                        }}>
                          <code style={{ 
                            backgroundColor: '#e3f2fd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            color: '#1976d2',
                            fontWeight: '500'
                          }}>{urun.barkod}</code>
                        </td>
                        <td style={{ 
                          minWidth: '250px', 
                          width: '250px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          fontWeight: '500'
                        }}>{urun.urun_adi}</td>
                        <td style={{ 
                          minWidth: '150px', 
                          width: '150px',
                          padding: '12px 8px',
                          verticalAlign: 'middle'
                        }}>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleShowKoliModal(urun)}
                            className="w-100"
                            style={{ 
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              border: '1px solid #007bff',
                              borderRadius: '4px',
                              maxWidth: '150px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-all'
                            }}
                          >
                            {groupByBarcode ? (
                              urun.koliListesi && urun.koliListesi.length > 0 
                                ? urun.koliListesi.join(', ')
                                : 'Koli Yok'
                            ) : (
                              urun.birim || 'N/A'
                            )}
                          </Button>
                        </td>
                        <td style={{ 
                          minWidth: '120px', 
                          width: '120px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#28a745'
                        }}>
                          <Badge bg="success" style={{ fontSize: '0.8rem' }}>
                            {groupByBarcode ? (urun.toplamStok || urun.stok_miktari) : urun.stok_miktari}
                          </Badge>
                        </td>
                        <td style={{ 
                          minWidth: '200px', 
                          width: '200px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          color: '#6c757d',
                          fontSize: '0.9rem'
                        }}>
                          {urun.aciklama || <span style={{ fontStyle: 'italic' }}>Açıklama yok</span>}
                        </td>
                        <td style={{ 
                          minWidth: '130px', 
                          width: '130px',
                          padding: '12px 8px',
                          verticalAlign: 'middle',
                          textAlign: 'center'
                        }}>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="me-2" 
                            onClick={() => handleShowEditModal(urun)}
                            style={{ 
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            <BiEdit />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDelete(urun.id)}
                            style={{ 
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-auto pt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Sayfa başına:</span>
                    <Form.Select 
                      size="sm" 
                      style={{ width: '80px' }}
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Form.Select>
                    <span className="ms-2 text-muted">
                      {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUrunListesi.length)} / {filteredUrunListesi.length} ürün
                    </span>
                  </div>
                  
                  <Pagination className="mb-0">
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => paginate(currentPage - 1)}
                    />
                    {[...Array(Math.min(5, totalPages)).keys()].map(number => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = number + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = number + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + number;
                      } else {
                        pageNumber = currentPage - 2 + number;
                      }
                      
                      return (
                        <Pagination.Item 
                          key={pageNumber} 
                          active={pageNumber === currentPage} 
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next 
                      disabled={currentPage === totalPages}
                      onClick={() => paginate(currentPage + 1)}
                    />
                  </Pagination>
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
              <Form.Label>Koli Numarası</Form.Label>
              <Form.Control
                type="text"
                name="koli"
                value={currentUrun.koli}
                onChange={handleChange}
                placeholder="Örn: D1-0217"
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
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                name="aciklama"
                value={currentUrun.aciklama}
                onChange={handleChange}
                rows={3}
                placeholder="İsteğe bağlı açıklama"
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
                Algılanan Ürünler ({previewUrunler?.length || 0} adet)
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert variant="info" className="mb-3">
                <strong>Excel dosyasından {previewUrunler?.length || 0} ürün algılandı.</strong><br/>
                Aşağıdaki ürünleri sisteme eklemek istediğinizden emin misiniz?
              </Alert>
              
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Birim</th>
                      <th>Stok Miktarı</th>
                      <th>Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewUrunler || []).map((urun, index) => (
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
                          <Badge bg="secondary">{urun.birim || urun.koli || 'N/A'}</Badge>
                        </td>
                        <td>
                          <Badge bg="info">{urun.stok_miktari}</Badge>
                        </td>
                        <td>{urun.aciklama || 'N/A'}</td>
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
                {loading ? 'Ekleniyor...' : `${previewUrunler?.length || 0} Ürünü Ekle`}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Koli Detay Modal */}
          <Modal show={showKoliModal} onHide={handleCloseKoliModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                <BiPackage className="me-2" />
                Koli Detayları - {selectedUrun?.urun_adi}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedUrun && (
                <>
                  <div className="mb-4">
                    <h6>Ürün Bilgileri:</h6>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-2"><strong>Barkod:</strong> <code>{selectedUrun.barkod}</code></p>
                      <p className="mb-2"><strong>Ürün Adı:</strong> {selectedUrun.urun_adi}</p>
                      <p className="mb-2"><strong>Toplam Stok Miktarı:</strong> {selectedUrun.toplamStok || selectedUrun.stok_miktari}</p>
                      <p className="mb-0"><strong>Açıklama:</strong> {selectedUrun.aciklama || 'Açıklama yok'}</p>
                    </div>
                  </div>

                  <div>
                    <h6>Koli Detayları:</h6>
                    {selectedUrun.koliDetaylari && selectedUrun.koliDetaylari.length > 0 ? (
                      <div className="bg-light p-3 rounded">
                        <div className="row g-3">
                          {selectedUrun.koliDetaylari.map((koliDetay, index) => (
                            <div key={index} className="col-md-6 col-lg-4">
                              <div className="card border-primary h-100">
                                <div className="card-body text-center p-3">
                                  <h6 className="card-title text-primary mb-2">
                                    <BiPackage className="me-1" />
                                    {koliDetay.koliNo}
                                  </h6>
                                  <div className="d-flex justify-content-center align-items-center">
                                    <Badge bg="success" className="fs-6 px-3 py-2">
                                      {koliDetay.stokMiktari} Adet
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 bg-primary text-white rounded text-center">
                          <strong>Toplam: {selectedUrun.koliDetaylari.length} Koli - {selectedUrun.toplamStok || selectedUrun.stok_miktari} Adet</strong>
                        </div>
                      </div>
                    ) : selectedUrun.birim && selectedUrun.birim.trim() !== '' ? (
                      <div className="bg-light p-3 rounded">
                        <div className="row g-3">
                          <div className="col-md-6 col-lg-4">
                            <div className="card border-primary h-100">
                              <div className="card-body text-center p-3">
                                <h6 className="card-title text-primary mb-2">
                                  <BiPackage className="me-1" />
                                  {selectedUrun.birim}
                                </h6>
                                <div className="d-flex justify-content-center align-items-center">
                                  <Badge bg="success" className="fs-6 px-3 py-2">
                                    {selectedUrun.stok_miktari} Adet
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-primary text-white rounded text-center">
                          <strong>Toplam: 1 Koli - {selectedUrun.stok_miktari} Adet</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-3 rounded text-center">
                        <p className="text-muted mb-0">Bu ürün için henüz koli numarası tanımlanmamış.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseKoliModal}>
                Kapat
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Toplu Silme Modal */}
          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Toplu Silme Onayı</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                <strong>{selectedUrunler.length}</strong> ürünü silmek istediğinizden emin misiniz?
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

    export default UrunYonetimi;