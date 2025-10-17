'use client'

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, InputGroup, Modal } from 'react-bootstrap';
import { BiPackage, BiSearch, BiPlus, BiTrash, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const UrunToplama = () => {
  const [urunListesi, setUrunListesi] = useState([]);
  const [toplamaListesi, setToplamaListesi] = useState([]);
  const [input, setInput] = useState('');
  const [currentAdet, setCurrentAdet] = useState(1);
  const [activeKoli, setActiveKoli] = useState('');
  const [loading, setLoading] = useState(false);
  const [barkodBuffer, setBarkodBuffer] = useState('');
  const [lastInputTime, setLastInputTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [fisSorgulama, setFisSorgulama] = useState('');
  const [fisGecmisi, setFisGecmisi] = useState([]);
  const [currentSiparisBTI, setCurrentSiparisBTI] = useState('');
  const [selectedFis, setSelectedFis] = useState(null);
  const [showFisModal, setShowFisModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [fisToDelete, setFisToDelete] = useState(null);
  const [koliListesi, setKoliListesi] = useState([]);

  useEffect(() => {
    loadUrunListesi();
    loadKoliListesi();
    loadToplamaListesi();
    loadFisGecmisi();
    // Yeni sipariş için BTI numarası oluştur
    if (!currentSiparisBTI) {
      setCurrentSiparisBTI(generateFisNumarasi());
    }
  }, []);

  const loadUrunListesi = async () => {
    try {
      const response = await fetch('/api/urun');
      if (response.ok) {
        const data = await response.json();
        setUrunListesi(data);
        console.log('Ürün listesi güncellendi:', data.length, 'ürün');
      }
    } catch (error) {
      console.error('Ürün listesi yüklenirken hata:', error);
    }
  };

  const loadKoliListesi = async () => {
    try {
      const response = await fetch('/api/koli');
      if (response.ok) {
        const data = await response.json();
        setKoliListesi(data);
        console.log('Koli listesi güncellendi:', data.length, 'koli');
      }
    } catch (error) {
      console.error('Koli listesi yüklenirken hata:', error);
    }
  };

  const loadToplamaListesi = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedList = localStorage.getItem('urunToplamaListesi');
        if (savedList) {
          const parsedList = JSON.parse(savedList);
          setToplamaListesi(parsedList);
          console.log('Toplama listesi localStorage\'dan yüklendi:', parsedList.length + ' ürün');
        }
      } catch (error) {
        console.error('Toplama listesi yüklenirken hata:', error);
      }
    }
  };

  // Fiş geçmişini veritabanından yükle
  const loadFisGecmisi = async () => {
    try {
      console.log('=== FİŞ GEÇMİŞİ YÜKLEME DEBUG ===');
      const response = await fetch('/api/toplama-fisi');
      if (response.ok) {
        const data = await response.json();
        console.log('Veritabanından alınan fişler:', data);
        
        // Veritabanındaki fişleri frontend formatına çevir
        const formattedFisler = data.map(fis => ({
          fisi_no: fis.fis_no, // Frontend'de fisi_no kullanılıyor
          fis_no: fis.fis_no,  // API'de fis_no aranıyor
          urun_sayisi: fis.urunler ? fis.urunler.length : 0,
          toplam_adet: fis.urunler ? fis.urunler.reduce((sum, u) => sum + u.adet, 0) : 0,
          tarih: fis.tarih ? new Date(fis.tarih).toLocaleString('tr-TR') : '',
          urunler: fis.urunler || []
        }));
        
        console.log('Formatlanmış fişler:', formattedFisler);
        setFisGecmisi(formattedFisler);
      } else {
        console.error('Fiş geçmişi yüklenirken hata:', response.status);
      }
    } catch (error) {
      console.error('Fiş geçmişi yüklenirken hata:', error);
    }
  };

  // Fiş geçmişini localStorage'a kaydet
  const saveFisGecmisi = (gecmis) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fisGecmisi', JSON.stringify(gecmis));
    }
  };

  // Fiş detaylarını göster
  const handleFisDetaylari = (fis) => {
    setSelectedFis(fis);
    setShowFisModal(true);
  };

  const saveToplamaListesi = (list) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('urunToplamaListesi', JSON.stringify(list));
        console.log('Toplama listesi localStorage\'a kaydedildi:', list.length + ' ürün');
      } catch (error) {
        console.error('Toplama listesi kaydedilirken hata:', error);
      }
    }
  };

  // BTI ile başlayan fiş numarası oluştur
  const generateFisNumarasi = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8); // Son 8 hanesi
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BTI${timestamp}${random}`;
  };

  // Fiş numarası sorgulama
  const handleFisSorgulama = async () => {
    if (!fisSorgulama.trim()) {
      toast.error('Fiş numarası girin');
      return;
    }

    try {
      const response = await fetch(`/api/toplama-fisi?fis_no=${fisSorgulama}`);
      if (response.ok) {
        const data = await response.json();
        setFisGecmisi(data);
        if (data.length === 0) {
          toast.info('Bu fiş numarasına ait kayıt bulunamadı');
        } else {
          toast.success(`${data.length} kayıt bulundu`);
        }
      } else {
        toast.error('Fiş sorgulama sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Fiş sorgulama hatası:', error);
      toast.error('Fiş sorgulama sırasında hata oluştu');
    }
  };

  // Otomatik barkod algılama
  const handleBarkodInput = (e) => {
    const value = e.target.value;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastInputTime;
    
    setInput(value);
    
    // Hızlı giriş algılama (barkod okuyucu)
    if (timeDiff < 50 && value.length > 0) {
      setIsScanning(true);
    } else if (timeDiff > 200) {
      setIsScanning(false);
    }
    
    setLastInputTime(currentTime);
    
    // Barkod okuyucu algılama: 8+ karakter ve hızlı giriş
    if (value.length >= 8) {
      // 100ms sonra kontrol et - eğer input değişmemişse barkod okuyucu olabilir
      setTimeout(() => {
        if (value.length >= 8) {
          console.log('Otomatik barkod algılandı:', value);
          handleBarkodArama(value);
        }
      }, 100);
    }
  };

  // Enter tuşu ile manuel arama
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarkodArama();
    }
  };

  const handleBarkodArama = (barkodValue = null) => {
    const barkod = barkodValue || input.trim();
    
    console.log('=== TOPLAMA BARKOD ARAMA DEBUG ===');
    console.log('Aranan barkod:', barkod);
    console.log('Ürün listesi uzunluğu:', urunListesi.length);
    console.log('İlk 3 ürünün barkodları:', urunListesi.slice(0, 3).map(u => u.barkod));
    
    if (!barkod) {
      toast.error('Barkod girin');
      return;
    }

    // Barkod arama - daha esnek karşılaştırma
    const urun = urunListesi.find(u => {
      const urunBarkod = String(u.barkod).trim();
      const arananBarkod = String(barkod).trim();
      return urunBarkod === arananBarkod;
    });
    
    console.log('Bulunan ürün:', urun);
    
    if (urun) {
      // Stok kontrolü
      if (urun.stok_miktari < currentAdet) {
        toast.error(`${urun.urun_adi} için yeterli stok yok! Mevcut stok: ${urun.stok_miktari}, İstenen: ${currentAdet}`);
        return;
      }

      // Aynı ürünün aynı koliden daha önce çıkışı yapılmış mı kontrol et
      const mevcutCikisAdet = toplamaListesi
        .filter(item => item.urun_barkod === barkod && item.koli_no === activeKoli)
        .reduce((sum, item) => sum + item.adet, 0);
      
      const toplamCikisAdet = mevcutCikisAdet + currentAdet;
      
      if (toplamCikisAdet > urun.stok_miktari) {
        toast.error(`${urun.urun_adi} için ${activeKoli} kolide toplam çıkış stoktan fazla! Mevcut stok: ${urun.stok_miktari}, Toplam çıkış: ${toplamCikisAdet}`);
        return;
      }

      const yeniUrun = {
        fis_no: currentSiparisBTI, // Mevcut sipariş BTI numarasını kullan
        koli_no: activeKoli,
        urun_barkod: barkod,
        urun_adi: urun.urun_adi,
        adet: currentAdet,
        tarih: typeof window !== 'undefined' ? new Date().toLocaleString('tr-TR') : ''
      };

      // Listeye ekle
      setToplamaListesi(prevList => {
        const newList = [...prevList, yeniUrun];
        saveToplamaListesi(newList);
        return newList;
      });

      // Anında toplama işlemini gerçekleştir
      performInstantToplama([yeniUrun]);

      toast.success(`${urun.urun_adi} toplama listesine eklendi ve işlem tamamlandı (Kalan stok: ${urun.stok_miktari - toplamCikisAdet})`);
      setInput('');
      setBarkodBuffer('');
      setCurrentAdet(1);
    } else {
      console.log('Ürün bulunamadı. Mevcut barkodlar:', urunListesi.map(u => u.barkod).slice(0, 10));
      toast.error(`Ürün bulunamadı: ${barkod}`);
    }
  };

  const handleUrunSil = (index) => {
    setToplamaListesi(prevList => {
      const newList = prevList.filter((_, i) => i !== index);
      saveToplamaListesi(newList);
      return newList;
    });
    toast.success('Ürün listeden kaldırıldı');
  };

  // Fiş silme fonksiyonu
  const handleFisSil = (fis) => {
    setFisToDelete(fis);
    setShowDeleteConfirmModal(true);
  };

  const confirmFisSil = async () => {
    if (!fisToDelete) return;

    try {
      console.log('Silinecek fiş:', fisToDelete);
      console.log('Fiş numarası:', fisToDelete.fisi_no);
      
      const response = await fetch(`/api/toplama-fisi/${fisToDelete.fisi_no}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Fiş başarıyla silindi ve stoklar geri yüklendi');
        // Fiş geçmişini yenile
        if (fisSorgulama.trim()) {
          handleFisSorgula();
        } else {
          await loadFisGecmisi();
        }
        // Ürün ve koli listelerini yenile (stok güncellemeleri için)
        loadUrunListesi();
        loadKoliListesi();
      } else {
        const errorData = await response.json();
        toast.error(`Fiş silinirken hata oluştu: ${errorData.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Fiş silme hatası:', error);
      toast.error('Fiş silinirken hata oluştu');
    } finally {
      setShowDeleteConfirmModal(false);
      setFisToDelete(null);
    }
  };

  // Siparişi bitir - yeni BTI numarası oluştur
  const handleSiparisBitir = async () => {
    if (toplamaListesi.length === 0) {
      toast.warning('Toplama listesi boş. Önce ürün ekleyin.');
      return;
    }

    try {
      // Mevcut siparişi tamamla - tüm ürünleri aynı BTI ile işaretle
      const tamamlananSiparis = toplamaListesi.map(urun => ({
        ...urun,
        fisi_no: currentSiparisBTI
      }));

      // API'ye siparişi gönder ve stok güncellemesi yap
      const response = await fetch('/api/toplama-fisi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fis_no: currentSiparisBTI, // API'ye fis_no gönder
          urunler: tamamlananSiparis,
          toplam_urun: tamamlananSiparis.length,
          siparis_tamamlandi: true // Sipariş tamamlandı işareti
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sipariş tamamlanırken hata oluştu');
      }

      // Fiş geçmişini veritabanından yeniden yükle
      console.log('=== FİŞ GEÇMİŞİ YENİLEME DEBUG ===');
      console.log('Tamamlanan sipariş:', tamamlananSiparis);
      await loadFisGecmisi();

      // Yeni sipariş için yeni BTI numarası oluştur
      const yeniBTI = generateFisNumarasi();
      setCurrentSiparisBTI(yeniBTI);
      
      // Toplama listesini temizle
      setToplamaListesi([]);
      saveToplamaListesi([]);
      
      // Ürün ve koli listelerini yenile (stok güncellemeleri için)
      await loadUrunListesi();
      await loadKoliListesi();
      
      toast.success(`Sipariş tamamlandı! (${tamamlananSiparis.length} ürün - ${currentSiparisBTI}) Stoklar güncellendi. Yeni sipariş başlatıldı: ${yeniBTI}`);
    } catch (error) {
      console.error('Sipariş tamamlama hatası:', error);
      toast.error(`Sipariş tamamlanırken hata: ${error.message}`);
    }
  };

  // Anında toplama işlemi
  const performInstantToplama = async (urunler) => {
    try {
      // Mevcut sipariş BTI numarasını kullan
      const urunlerWithBTI = urunler.map(urun => ({
        ...urun,
        fisi_no: currentSiparisBTI
      }));

      const response = await fetch('/api/toplama-fisi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urunler: urunlerWithBTI,
          toplam_urun: urunlerWithBTI.length
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Anında toplama işlemi sonucu:', result);
        
        // Stok güncellemelerini göster
        if (result.stok_guncellemeleri && result.stok_guncellemeleri.length > 0) {
          result.stok_guncellemeleri.forEach(guncelleme => {
            const mesaj = `${guncelleme.urun_adi}: ${guncelleme.eski_stok} → ${guncelleme.yeni_stok} (${guncelleme.cikan_adet} adet çıkış)`;
            toast.info(mesaj, {
              position: "top-right",
              autoClose: 2000,
            });
          });
        }
        
        // Ürün ve koli listelerini yenile (stok güncellemeleri için)
        await loadUrunListesi();
        await loadKoliListesi();
      } else {
        const errorData = await response.json();
        console.error('Anında toplama hatası:', errorData);
        
        // Stok hatası ise listeyi temizle
        if (errorData.error && errorData.error.includes('yeterli stok yok')) {
          // Son eklenen ürünü listeden kaldır
          setToplamaListesi(prevList => {
            const newList = prevList.slice(0, -1); // Son elemanı kaldır
            saveToplamaListesi(newList);
            return newList;
          });
        }
        
        toast.error(errorData.error || 'Toplama işlemi sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Anında toplama hatası:', error);
      toast.error('Toplama işlemi sırasında hata oluştu');
    }
  };



  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiPackage size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Ürün Toplama</h1>
            <p className="text-muted mb-0">Ürün toplama ve çıkış işlemleri</p>
            {currentSiparisBTI && (
              <p className="text-info mb-0 small">
                <strong>Mevcut Sipariş:</strong> {currentSiparisBTI}
              </p>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            size="sm"
            onClick={handleSiparisBitir}
            disabled={toplamaListesi.length === 0}
          >
            <BiCheck className="me-1" />
            Siparişleri Tamamla
          </Button>
        </div>
      </div>

      <Row>
        {/* Barkod Okuma */}
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiSearch className="me-2" />
                Barkod Okuma
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Koli No</Form.Label>
                <Form.Control
                  type="text"
                  value={activeKoli}
                  onChange={(e) => setActiveKoli(e.target.value)}
                  placeholder="Koli numarasını girin"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Barkod 
                  {isScanning && (
                    <Badge bg="success" className="ms-2">
                      Tarama Modu
                    </Badge>
                  )}
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={input}
                    onChange={handleBarkodInput}
                    onKeyPress={handleKeyPress}
                    placeholder="Barkod girin veya tarayın"
                    autoFocus
                    style={{
                      borderColor: isScanning ? '#28a745' : undefined,
                      boxShadow: isScanning ? '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' : undefined
                    }}
                  />
                  <Button variant="primary" onClick={handleBarkodArama}>
                    <BiSearch />
                  </Button>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Adet</Form.Label>
                <Form.Control
                  type="number"
                  value={currentAdet}
                  onChange={(e) => setCurrentAdet(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </Form.Group>

              <Alert variant="success" className="small">
                <strong>Anında İşlem:</strong><br />
                1. Koli numarasını girin<br />
                2. Barkodu tarayın (otomatik algılanır) veya manuel girin<br />
                3. Adeti ayarlayın<br />
                4. <strong>İşlem otomatik tamamlanır!</strong><br />
                <br />
                <strong>Otomatik Tarama:</strong><br />
                • Barkod okuyucu 8+ karakter girince otomatik algılanır<br />
                • "Tarama Modu" yazısı görünür<br />
                • Manuel giriş için Enter tuşuna basın<br />
                • <strong>Her barkod girişi anında işlenir</strong>
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Toplama Listesi */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    <BiPackage className="me-2" />
                    İşlem Geçmişi ({toplamaListesi.length} ürün)
                  </h5>
                  {currentSiparisBTI && (
                    <small className="text-muted">
                      Sipariş: <strong>{currentSiparisBTI}</strong>
                    </small>
                  )}
                </div>
                <Badge bg="primary">
                  {toplamaListesi.reduce((sum, item) => sum + item.adet, 0)} adet
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {toplamaListesi.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Fiş No</th>
                        <th>Koli No</th>
                        <th>Barkod</th>
                        <th>Ürün Adı</th>
                        <th>Adet</th>
                        <th>Tarih</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toplamaListesi.map((item, index) => (
                        <tr key={index}>
                          <td><code className="text-primary">{item.fis_no}</code></td>
                          <td><code>{item.koli_no}</code></td>
                          <td><code>{item.urun_barkod}</code></td>
                          <td>{item.urun_adi}</td>
                          <td>
                            <Badge bg="info">{item.adet}</Badge>
                          </td>
                          <td className="small text-muted">{item.tarih}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleUrunSil(index)}
                            >
                              <BiTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <BiPackage size={48} className="text-muted mb-3" />
                  <p className="text-muted">Henüz işlem geçmişi boş</p>
                  <p className="text-muted small">Barkod okuyarak ürün işlemi yapın</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Fiş Numarası Sorgulama */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiSearch className="me-2" />
                  Fiş Numarası Sorgulama
                </h5>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="BTI ile başlayan fiş numarası girin..."
                    value={fisSorgulama}
                    onChange={(e) => setFisSorgulama(e.target.value)}
                    style={{ width: '300px' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleFisSorgulama()}
                  />
                  <Button variant="primary" onClick={handleFisSorgulama}>
                    <BiSearch className="me-1" />
                    Sorgula
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {fisGecmisi.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Fiş No</th>
                        <th>Ürün Sayısı</th>
                        <th>Toplam Adet</th>
                        <th>Tarih</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fisGecmisi.map((fis, index) => (
                        <tr key={index}>
                          <td>
                            <code className="text-primary">{fis.fisi_no}</code>
                          </td>
                          <td>
                            <Badge bg="info">{fis.urun_sayisi} ürün</Badge>
                          </td>
                          <td>
                            <Badge bg="success">{fis.toplam_adet} adet</Badge>
                          </td>
                          <td className="small text-muted">{fis.tarih}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleFisDetaylari(fis)}
                              >
                                <BiSearch className="me-1" />
                                Detayları Gör
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleFisSil(fis)}
                                title="Fişi sil ve stokları geri yükle"
                              >
                                <BiTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <BiSearch size={48} className="text-muted mb-3" />
                  <p className="text-muted">Fiş numarası sorgulamak için yukarıdaki alanı kullanın</p>
                  <p className="text-muted small">BTI ile başlayan fiş numarasını girerek geçmiş çıkış bilgilerini görüntüleyebilirsiniz</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Fiş Detayları Modal */}
      <Modal show={showFisModal} onHide={() => setShowFisModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BiPackage className="me-2" />
            Fiş Detayları - {selectedFis?.fisi_no}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFis && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Fiş Numarası:</strong> <code className="text-primary">{selectedFis.fisi_no}</code>
                </Col>
                <Col md={6}>
                  <strong>Tarih:</strong> {selectedFis.tarih}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Ürün Sayısı:</strong> <Badge bg="info">{selectedFis.urun_sayisi} ürün</Badge>
                </Col>
                <Col md={6}>
                  <strong>Toplam Adet:</strong> <Badge bg="success">{selectedFis.toplam_adet} adet</Badge>
                </Col>
              </Row>
              
              <hr />
              
              <h6>Çıkan Ürünler:</h6>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Adet</th>
                      <th>Koli No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFis.urunler.map((urun, index) => (
                      <tr key={index}>
                        <td><code>{urun.urun_barkod}</code></td>
                        <td>{urun.urun_adi}</td>
                        <td>
                          <Badge bg="secondary">{urun.adet}</Badge>
                        </td>
                        <td><code>{urun.koli_no}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFisModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Fiş Silme Onay Modal */}
      <Modal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <BiTrash className="me-2" />
            Fiş Silme Onayı
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <strong>Dikkat!</strong> Bu işlem geri alınamaz.
          </Alert>
          
          {fisToDelete && (
            <div>
              <p><strong>Fiş Numarası:</strong> <code>{fisToDelete.fisi_no}</code></p>
              <p><strong>Ürün Sayısı:</strong> {fisToDelete.urun_sayisi} ürün</p>
              <p><strong>Toplam Adet:</strong> {fisToDelete.toplam_adet} adet</p>
              <p><strong>Tarih:</strong> {fisToDelete.tarih}</p>
              
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-success mb-2">✅ Bu işlem şunları yapacak:</h6>
                <ul className="mb-0 small">
                  <li>Fiş kaydını silecek</li>
                  <li>Çıkarılan ürünlerin stoklarını geri yükleyecek</li>
                  <li>Ürün yönetimindeki stok miktarları güncellenecek</li>
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={confirmFisSil}>
            <BiTrash className="me-1" />
            Evet, Fişi Sil
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UrunToplama;