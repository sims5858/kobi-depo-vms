'use client'

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, InputGroup } from 'react-bootstrap';
import { BiPackage, BiSearch, BiPlus, BiTrash, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const UrunToplama = () => {
  const [urunListesi, setUrunListesi] = useState([]);
  const [toplamaListesi, setToplamaListesi] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [input, setInput] = useState('');
  const [currentAdet, setCurrentAdet] = useState(1);
  const [activeKoli, setActiveKoli] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUrunListesi();
    loadToplamaListesi();
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

  const loadToplamaListesi = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedList = localStorage.getItem('urunToplamaListesi');
        if (savedList) {
          const parsedList = JSON.parse(savedList);
          setToplamaListesi(parsedList);
          console.log('Toplama listesi localStorage\'dan yüklendi:', parsedList.length, 'ürün');
        }
      } catch (error) {
        console.error('Toplama listesi yüklenirken hata:', error);
      }
    }
  };

  const saveToplamaListesi = (list) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('urunToplamaListesi', JSON.stringify(list));
        console.log('Toplama listesi localStorage\'a kaydedildi:', list.length, 'ürün');
      } catch (error) {
        console.error('Toplama listesi kaydedilirken hata:', error);
      }
    }
  };

  const handleBarkodArama = () => {
    if (!input.trim()) {
      toast.error('Barkod girin');
      return;
    }

    const urun = urunListesi.find(u => u.barkod === input.trim());
    if (urun) {
      const yeniUrun = {
        koli_no: activeKoli,
        urun_barkod: input,
        urun_adi: urun.urun_adi,
        adet: currentAdet,
        tarih: typeof window !== 'undefined' ? new Date().toLocaleString('tr-TR') : ''
      };

      setToplamaListesi(prevList => {
        const newList = [...prevList, yeniUrun];
        saveToplamaListesi(newList);
        return newList;
      });

      toast.success(`${urun.urun_adi} toplama listesine eklendi`);
      setInput('');
      setCurrentAdet(1);
    } else {
      toast.error('Ürün bulunamadı');
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

  const handleToplamaTamamla = async () => {
    if (toplamaListesi.length === 0) {
      toast.error('Toplama listesi boş');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/toplama-fisi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urunler: toplamaListesi,
          toplam_urun: toplamaListesi.length
        }),
      });

      if (response.ok) {
        toast.success('Toplama işlemi tamamlandı');
        setToplamaListesi([]);
        saveToplamaListesi([]);
      } else {
        toast.error('Toplama işlemi sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Toplama hatası:', error);
      toast.error('Toplama işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
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
            <BiPackage size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Ürün Toplama</h1>
            <p className="text-muted mb-0">Ürün toplama ve çıkış işlemleri</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={handleToplamaTamamla}
            disabled={loading || toplamaListesi.length === 0}
          >
            <BiCheck className="me-1" />
            {loading ? 'İşleniyor...' : 'Toplamayı Tamamla'}
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
                <Form.Label>Barkod</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Barkod girin veya tarayın"
                    onKeyPress={(e) => e.key === 'Enter' && handleBarkodArama()}
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

              <Alert variant="info" className="small">
                <strong>Kullanım:</strong><br />
                1. Koli numarasını girin<br />
                2. Barkodu tarayın veya girin<br />
                3. Adeti ayarlayın<br />
                4. Arama butonuna basın
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* Toplama Listesi */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiPackage className="me-2" />
                  Toplama Listesi ({toplamaListesi.length} ürün)
                </h5>
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
                  <p className="text-muted">Henüz toplama listesi boş</p>
                  <p className="text-muted small">Barkod okuyarak ürün ekleyin</p>
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

export default UrunToplama;