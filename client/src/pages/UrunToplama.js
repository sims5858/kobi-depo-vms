import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge } from 'react-bootstrap';
import { BiPackage, BiCamera, BiBox, BiTrash } from 'react-icons/bi';
import { toast } from 'react-toastify';

const UrunToplama = () => {
  const [toplamaListesi, setToplamaListesi] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentAdet, setCurrentAdet] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeKoli, setActiveKoli] = useState(null);
  const [koliUrunleri, setKoliUrunleri] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [toplamaFisleri, setToplamaFisleri] = useState([]);
  const [selectedFisi, setSelectedFisi] = useState(null);
  const [fisiDetaylari, setFisiDetaylari] = useState([]);
  const [cikisGecmisi, setCikisGecmisi] = useState([]);
  const [seciliKoliGecmisi, setSeciliKoliGecmisi] = useState(null);
  

  // Toplama fişlerini yükle
  const loadToplamaFisleri = async (tarih = selectedDate) => {
    try {
      console.log('Toplama fişleri yükleniyor, tarih:', tarih);
      const response = await fetch(`/api/toplama-fisi?tarih=${tarih}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Toplama fişleri yüklendi:', data);
        setToplamaFisleri(data);
        // İlk fiş detayını otomatik yükle
        if (data && data.length > 0) {
          await loadFisiDetaylari(data[0].fisi_no);
        } else {
          setSelectedFisi(null);
          setFisiDetaylari([]);
        }
      } else {
        console.error('Toplama fişleri yüklenemedi:', response.status);
      }
    } catch (error) {
      console.error('Toplama fişleri yüklenirken hata:', error);
    }
  };

  // Toplama fişi detaylarını yükle
  const loadFisiDetaylari = async (fisiNo) => {
    try {
      console.log('Fiş detayları yükleniyor, fiş no:', fisiNo);
      const response = await fetch(`/api/toplama-fisi/${fisiNo}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fiş detayları yüklendi:', data);
        setFisiDetaylari(data);
        setSelectedFisi(fisiNo);
      } else {
        console.error('Fiş detayları yüklenemedi:', response.status);
      }
    } catch (error) {
      console.error('Fiş detayları yüklenirken hata:', error);
    }
  };

  // Sayfa yüklendiğinde ve tarih değiştiğinde toplama fişlerini yükle
  useEffect(() => {
    loadToplamaFisleri(selectedDate);
    // Fişsiz çıkış geçmişi (koli bazlı)
    (async () => {
      try {
        const resp = await fetch(`/api/cikis-gecmisi?tarih=${selectedDate}`);
        if (resp.ok) {
          const data = await resp.json();
          setCikisGecmisi(data);
          const firstKoli = data.length > 0 ? data[0].koli_no : null;
          setSeciliKoliGecmisi(firstKoli);
        }
      } catch (e) {
        console.error('Çıkış geçmişi yüklenemedi', e);
      }
    })();
  }, [selectedDate]);

  // Toplama fişine kaydet (backend beklenen şema: { urunler: [{ barkod, koli_no, adet }] })
  const saveToToplamaFisi = async (urun) => {
    try {
      const payload = {
        urunler: [
          {
            barkod: urun.urun_barkod || urun.barkod,
            koli_no: urun.koli_no,
            adet: urun.adet
          }
        ]
      };

      const response = await fetch('/api/toplama-fisi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Seçili tarihe göre yeniden yükle
        await loadToplamaFisleri(selectedDate);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Toplama fişi kaydı başarısız:', err);
      }
    } catch (error) {
      console.error('Toplama fişine kaydetme hatası:', error);
    }
  };

  // Koli veya barkod okutma - akıllı algılama
  const handleInput = async (input = currentInput) => {
    if (!input.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Önce koli numarası olup olmadığını kontrol et
      const koliResponse = await fetch('/api/koli-envanter');
      if (!koliResponse.ok) {
        throw new Error('Koli envanter API hatası');
      }
      const koliData = await koliResponse.json();
      const koliBulundu = koliData.find(item => item.koli_no === input && item.adet > 0);
      
      if (koliBulundu) {
        // Koli numarası bulundu - belirli koli için detaylı veri al
        const koliDetayResponse = await fetch(`/api/koli-envanter?koli_no=${input}`);
        if (koliDetayResponse.ok) {
          const koliUrunleri = await koliDetayResponse.json();
          setActiveKoli(input);
          setKoliUrunleri(koliUrunleri);
          toast.success(`📦 ${input} koli aktif edildi. ${koliUrunleri.length} ürün bulundu.`);
        } else {
          // Fallback: genel veriden filtrele
          const koliUrunleri = koliData.filter(item => item.koli_no === input && item.adet > 0);
          setActiveKoli(input);
          setKoliUrunleri(koliUrunleri);
          toast.success(`📦 ${input} koli aktif edildi. ${koliUrunleri.length} ürün bulundu.`);
        }
        setCurrentInput('');
        setLoading(false);
        return;
      }

      // Koli bulunamadı, barkod olarak dene
      if (!activeKoli) {
        toast.warning('Önce koli numarasını okutun');
        setCurrentInput(''); // Input'u temizle
        setLoading(false);
        return;
      }

      // Barkod olarak işle - aktif koliden ürün ara
      const bulunanUrunler = koliUrunleri.filter(u => u.urun_barkod === input);
      if (bulunanUrunler.length === 0) {
        toast.warning(`${input} barkodlu ürün bu kolide bulunamadı`);
        setCurrentInput(''); // Input'u temizle
        setLoading(false);
        return;
      }

      const urun = bulunanUrunler[0];
      if (urun.adet < currentAdet) {
        toast.warning(`${input} barkodlu ürün için yeterli stok yok. Mevcut: ${urun.adet}`);
        setCurrentInput(''); // Input'u temizle
        setLoading(false);
        return;
      }

      // Ürün çıkışını yap
      const response = await fetch('/api/urun/cikis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          koli_no: activeKoli,
          barkod: input,
          adet: currentAdet
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`✅ ${input} - ${currentAdet} adet çıkış yapıldı (Koli: ${activeKoli})`);
        
        // Toplama listesine ekle
        const yeniUrun = {
          koli_no: activeKoli,
          urun_barkod: input,
          urun_adi: urun.urun_adi,
          adet: currentAdet,
          tarih: new Date().toLocaleString('tr-TR')
        };
        
        setToplamaListesi(prev => [...prev, yeniUrun]);
        
        // Toplama fişine kaydet
        await saveToToplamaFisi(yeniUrun);

        // Koli ürünlerini güncelle
        setKoliUrunleri(prev => prev.map(u => 
          u.urun_barkod === input 
            ? { ...u, adet: result.kalan_adet }
            : u
        ).filter(u => u.adet > 0));

        setCurrentInput('');
        setCurrentAdet(1);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ürün çıkışı başarısız');
        setCurrentInput(''); // Hata durumunda input'u temizle
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
      toast.error('İşlem sırasında hata oluştu');
      setCurrentInput(''); // Hata durumunda input'u temizle
    }
    setLoading(false);
  };


  // Input değişikliğini izle ve otomatik işle
  useEffect(() => {
    if (currentInput.trim() && !loading) {
      // Input tamamlandığında otomatik işle
      if (currentInput.length >= 3) {
        const timer = setTimeout(() => {
          handleInput(currentInput);
        }, 200); // 200ms bekle, input tamamlanmış olabilir
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentInput, loading]);

  const handleUrunSil = (index) => {
    setToplamaListesi(toplamaListesi.filter((_, i) => i !== index));
    toast.success('Ürün toplama listesinden kaldırıldı');
  };

  const toplamUrun = toplamaListesi.reduce((sum, item) => sum + item.adet, 0);

  // Tarihe göre gruplandır
  const gruplandirilmisListe = toplamaListesi.reduce((gruplar, item) => {
    const tarih = item.tarih.split(' ')[0]; // Sadece tarih kısmını al
    if (!gruplar[tarih]) {
      gruplar[tarih] = [];
    }
    gruplar[tarih].push(item);
    return gruplar;
  }, {});

  // Tarihleri sırala (en yeni önce)
  const tarihler = Object.keys(gruplandirilmisListe).sort((a, b) => new Date(b) - new Date(a));

  

  return (
    <div className="container-fluid page-transition">
      <div className="row">
        {/* Sol taraf - Barkod okutma */}
        <Col md={6}>
          <Card className="anim-fade-in">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <BiPackage className="me-2" />
                Ürün Çıkışı
              </h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <strong>Akıllı Okutma:</strong> Koli numarası veya ürün barkodu okutun. Sistem otomatik algılar.
              </Alert>

              {activeKoli && (
                <Alert variant="success">
                  <strong>📦 Aktif Koli:</strong> {activeKoli} 
                  <Badge bg="light" text="dark" className="ms-2">
                    {koliUrunleri.length} ürün
                  </Badge>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => {
                      setActiveKoli(null);
                      setKoliUrunleri([]);
                    }}
                  >
                    Koli Değiştir
                  </Button>
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label>
                  {activeKoli ? 'Ürün Barkodu' : 'Koli Numarası / Ürün Barkodu'}
                </Form.Label>
                <Form.Control
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={activeKoli ? "Ürün barkodu okutun" : "Koli numarası veya barkod okutun"}
                  autoFocus
                  disabled={loading}
                  style={{
                    fontSize: '20px',
                    padding: '15px',
                    border: loading ? '2px solid #ffc107' : '2px solid #28a745',
                    borderRadius: '8px',
                    backgroundColor: loading ? '#fff3cd' : 'white'
                  }}
                />
                <Form.Text className="text-success">
                  <strong>Otomatik:</strong> {activeKoli ? 'Barkod okutulduğu anda işlenir' : 'Koli/barkod okutulduğu anda işlenir'}
                  {loading && <span className="text-warning ms-2">⏳ İşleniyor...</span>}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Çıkış Adeti</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={currentAdet}
                  onChange={(e) => setCurrentAdet(parseInt(e.target.value) || 1)}
                  disabled={loading}
                  style={{
                    fontSize: '18px',
                    padding: '10px'
                  }}
                />
              </Form.Group>

              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setCurrentInput('');
                  setCurrentAdet(1);
                }}
                disabled={loading}
                className="w-100"
                size="lg"
              >
                Temizle
              </Button>

              {koliUrunleri.length > 0 && (
                <Card className="mt-4">
                  <Card.Header>
                    <h6 className="mb-0">📦 Koli İçeriği - {activeKoli}</h6>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Barkod</th>
                          <th>Ürün</th>
                          <th>Beden</th>
                          <th>Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {koliUrunleri.map((urun, index) => (
                          <tr key={index}>
                            <td><code>{urun.urun_barkod}</code></td>
                            <td>{urun.urun_adi}</td>
                            <td>{urun.beden}</td>
                            <td><Badge bg="info">{urun.adet}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sağ taraf - Çıkış yapılan ürünler */}
        <Col md={6}>
          {toplamaListesi.length > 0 ? (
            <Card>
              <Card.Header className="bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">✅ Çıkış Yapılan Ürünler</h5>
                  <Badge bg="light" text="dark" className="fs-6">
                    Toplam: {toplamUrun} adet
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {tarihler.map((tarih, tarihIndex) => {
                  const gununUrunleri = gruplandirilmisListe[tarih];
                  const gununToplami = gununUrunleri.reduce((sum, item) => sum + item.adet, 0);
                  
                  return (
                    <div key={tarih} className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 text-primary">
                          📅 {tarih}
                        </h6>
                        <Badge bg="secondary">
                          {gununUrunleri.length} ürün, {gununToplami} adet
                        </Badge>
                      </div>
                      
                      <Table striped hover size="sm">
                        <thead>
                          <tr>
                            <th>Koli</th>
                            <th>Barkod</th>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>Saat</th>
                            <th>İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gununUrunleri.map((item, index) => {
                            const orijinalIndex = toplamaListesi.findIndex(original => 
                              original === item
                            );
                            return (
                              <tr key={index}>
                                <td><Badge bg="primary">{item.koli_no}</Badge></td>
                                <td><code>{item.urun_barkod}</code></td>
                                <td>{item.urun_adi}</td>
                                <td><Badge bg="success">{item.adet}</Badge></td>
                                <td><small>{item.tarih.split(' ')[1]}</small></td>
                                <td>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleUrunSil(orijinalIndex)}
                                  >
                                    <BiTrash />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <BiPackage size={64} className="text-muted mb-3" />
                <h5 className="text-muted">Henüz çıkış yapılan ürün yok</h5>
                <p className="text-muted">Barkod okutarak ürün çıkışı yapın</p>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sağ taraf - Çıkış Geçmişi (fişsiz görünüm) */}
        <Col md={6}>
          <Card className="anim-slide-up delay-1">
            <Card.Header className="py-2 d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📊 Çıkış Geçmişi</h6>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="date"
                  size="sm"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedFisi(null);
                    setFisiDetaylari([]);
                  }}
                />
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    loadToplamaFisleri(selectedDate);
                    fetch(`/api/cikis-gecmisi?tarih=${selectedDate}`)
                      .then(r => r.ok ? r.json() : [])
                      .then(data => {
                        setCikisGecmisi(data || []);
                        setSeciliKoliGecmisi(data && data.length ? data[0].koli_no : null);
                      })
                      .catch(() => {});
                  }}
                  className="ms-2"
                >
                  Yenile
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="py-2">
              <Row>
                <Col md={6}>
                  <h6 className="mb-2" style={{ fontSize: '16px' }}>Koliler</h6>
                  <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    {cikisGecmisi.length > 0 ? (
                      [...new Set(cikisGecmisi.map(x => x.koli_no))].map((k, idx) => (
                        <div
                          key={idx}
                          className={`p-2 mb-1 border rounded ${seciliKoliGecmisi === k ? 'bg-primary text-white' : 'bg-light'}`}
                          style={{ cursor: 'pointer', fontSize: '13px' }}
                          onClick={() => setSeciliKoliGecmisi(k)}
                        >
                          <div className="d-flex justify-content-between">
                            <strong>{k}</strong>
                            <span>
                              {cikisGecmisi.filter(x => x.koli_no === k).reduce((s, x) => s + x.adet, 0)} adet
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted" style={{ fontSize: '14px' }}>Bu tarihte çıkış yapılmamış</p>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="mb-2" style={{ fontSize: '16px' }}>Ürün Detayları</h6>
                  <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    {seciliKoliGecmisi ? (
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th style={{ fontSize: '12px' }}>Barkod</th>
                            <th style={{ fontSize: '12px' }}>Ürün</th>
                            <th style={{ fontSize: '12px' }}>Adet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cikisGecmisi
                            .filter(x => x.koli_no === seciliKoliGecmisi)
                            .map((detay, i) => (
                              <tr key={i} style={{ fontSize: '12px' }}>
                                <td><code style={{ fontSize: '10px' }}>{detay.urun_barkod}</code></td>
                                <td style={{ fontSize: '11px' }}>{detay.urun_adi}</td>
                                <td><Badge bg="success" style={{ fontSize: '10px' }}>{detay.adet}</Badge></td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '14px' }}>Koli seçin</p>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </div>

      
    </div>
  );
};

export default UrunToplama;