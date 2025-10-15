'use client'

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, InputGroup } from 'react-bootstrap';
import { BiClipboard, BiSearch, BiPlus, BiTrash, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const Sayim = () => {
  const [urunListesi, setUrunListesi] = useState([]);
  const [sayimListesi, setSayimListesi] = useState([]);
  const [selectedKoli, setSelectedKoli] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [input, setInput] = useState('');
  const [currentFizikselAdet, setCurrentFizikselAdet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [barkodBuffer, setBarkodBuffer] = useState('');
  const [lastInputTime, setLastInputTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadUrunListesi();
  }, []);

  const loadUrunListesi = async () => {
    try {
      const response = await fetch('/api/urun');
      if (response.ok) {
        const data = await response.json();
        setUrunListesi(data);
      }
    } catch (error) {
      console.error('Ürün listesi yüklenirken hata:', error);
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
    if (value.length >= 8 && isScanning) {
      // 300ms sonra kontrol et - eğer input değişmemişse barkod okuyucu olabilir
      setTimeout(() => {
        if (input === value && value.length >= 8) {
          handleBarkodArama(value);
        }
      }, 300);
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
    
    if (!barkod) {
      toast.error('Barkod girin');
      return;
    }

    const urun = urunListesi.find(u => u.barkod === barkod);
    if (urun) {
      setSelectedKoli(urun);
      setCurrentFizikselAdet(urun.stok_miktari);
      toast.success(`${urun.urun_adi} bulundu`);
      setInput('');
      setBarkodBuffer('');
    } else {
      toast.error('Ürün bulunamadı');
    }
  };

  const handleUrunSayim = (urun) => {
    if (currentFizikselAdet < 0) {
      toast.error('Fiziksel adet negatif olamaz');
      return;
    }

    const sayimKaydi = {
      koli_no: urun.kategori,
      urun_barkod: urun.barkod,
      urun_adi: urun.urun_adi,
      sistem_adet: urun.stok_miktari,
      fiziksel_adet: currentFizikselAdet,
      fark: currentFizikselAdet - urun.stok_miktari,
      tarih: typeof window !== 'undefined' ? new Date().toLocaleString('tr-TR') : ''
    };

    setSayimListesi(prevList => [...prevList, sayimKaydi]);
    toast.success(`${urun.urun_adi} sayımı eklendi`);
    
    // Formu temizle
    setInput('');
    setSelectedKoli(null);
    setCurrentFizikselAdet(0);
  };

  const handleSayimSil = (index) => {
    setSayimListesi(prevList => prevList.filter((_, i) => i !== index));
    toast.success('Sayım kaydı kaldırıldı');
  };

  const handleSayimTamamla = async () => {
    if (sayimListesi.length === 0) {
      toast.error('Sayım listesi boş');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sayim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sayim_kayitlari: sayimListesi,
          toplam_urun: sayimListesi.length
        }),
      });

      if (response.ok) {
        toast.success('Sayım işlemi tamamlandı');
        setSayimListesi([]);
      } else {
        toast.error('Sayım işlemi sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Sayım hatası:', error);
      toast.error('Sayım işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getFarkBadge = (fark) => {
    if (fark > 0) return 'success';
    if (fark < 0) return 'danger';
    return 'secondary';
  };

  const getFarkText = (fark) => {
    if (fark > 0) return `+${fark}`;
    if (fark < 0) return fark.toString();
    return '0';
  };

  const filteredUrunler = urunListesi.filter(urun =>
    urun.urun_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    urun.barkod.includes(searchTerm)
  );

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiClipboard size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Sayım İşlemleri</h1>
            <p className="text-muted mb-0">Fiziksel sayım ve envanter kontrolü</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={handleSayimTamamla}
            disabled={loading || sayimListesi.length === 0}
          >
            <BiCheck className="me-1" />
            {loading ? 'İşleniyor...' : 'Sayımı Tamamla'}
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

              {selectedKoli && (
                <Alert variant="info">
                  <strong>Bulunan Ürün:</strong><br />
                  <code>{selectedKoli.urun_barkod}</code><br />
                  {selectedKoli.urun_adi}<br />
                  <small>Sistem Adeti: {selectedKoli.adet}</small>
                </Alert>
              )}

              {selectedKoli && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Fiziksel Adet</Form.Label>
                    <Form.Control
                      type="number"
                      value={currentFizikselAdet}
                      onChange={(e) => setCurrentFizikselAdet(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </Form.Group>

                  <Button 
                    variant="success" 
                    onClick={() => handleUrunSayim(selectedKoli)}
                    className="w-100"
                  >
                    <BiPlus className="me-1" />
                    Sayıma Ekle
                  </Button>
                </>
              )}

              <Alert variant="warning" className="small mt-3">
                <strong>Kullanım:</strong><br />
                1. Barkodu tarayın veya girin<br />
                2. Fiziksel adeti girin<br />
                3. "Sayıma Ekle" butonuna basın
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Sayım Listesi */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiClipboard className="me-2" />
                  Sayım Listesi ({sayimListesi.length} ürün)
                </h5>
                <div className="d-flex gap-2">
                  <Badge bg="info">
                    {sayimListesi.filter(s => s.fark === 0).length} Eşit
                  </Badge>
                  <Badge bg="success">
                    {sayimListesi.filter(s => s.fark > 0).length} Fazla
                  </Badge>
                  <Badge bg="danger">
                    {sayimListesi.filter(s => s.fark < 0).length} Eksik
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {sayimListesi.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Koli No</th>
                        <th>Barkod</th>
                        <th>Ürün Adı</th>
                        <th>Sistem</th>
                        <th>Fiziksel</th>
                        <th>Fark</th>
                        <th>Tarih</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sayimListesi.map((item, index) => (
                        <tr key={index}>
                          <td><code>{item.koli_no}</code></td>
                          <td><code>{item.urun_barkod}</code></td>
                          <td>{item.urun_adi}</td>
                          <td>
                            <Badge bg="secondary">{item.sistem_adet}</Badge>
                          </td>
                          <td>
                            <Badge bg="info">{item.fiziksel_adet}</Badge>
                          </td>
                          <td>
                            <Badge bg={getFarkBadge(item.fark)}>
                              {getFarkText(item.fark)}
                            </Badge>
                          </td>
                          <td className="small text-muted">{item.tarih}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleSayimSil(index)}
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
                  <BiClipboard size={48} className="text-muted mb-3" />
                  <p className="text-muted">Henüz sayım listesi boş</p>
                  <p className="text-muted small">Barkod okuyarak sayım ekleyin</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ürün Listesi */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiSearch className="me-2" />
                  Ürün Listesi
                </h5>
                <Form.Control
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '200px' }}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Stok</th>
                      <th>Kategori</th>
                      <th>Birim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUrunler.map((urun, index) => (
                      <tr key={index}>
                        <td><code>{urun.barkod}</code></td>
                        <td>{urun.urun_adi}</td>
                        <td>
                          <Badge bg="info">{urun.stok_miktari}</Badge>
                        </td>
                        <td><code>{urun.kategori}</code></td>
                        <td>{urun.birim}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Sayim;