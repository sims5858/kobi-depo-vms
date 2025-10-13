'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { BiTrendingUp, BiDownload, BiSearch, BiBox } from 'react-icons/bi';
import { toast } from 'react-toastify';

const Raporlar = () => {
  
  const [koliEnvanterRaporu, setKoliEnvanterRaporu] = useState([]);
  const [bosKoliRaporu, setBosKoliRaporu] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtreMinAdet, setFiltreMinAdet] = useState(0);
  const [filtreMaxAdet, setFiltreMaxAdet] = useState(999999);
  const [sadeceBos, setSadeceBos] = useState(false);

  useEffect(() => {
    loadKoliEnvanterRaporu();
    loadBosKoliRaporu();
  }, []);

  const loadKoliEnvanterRaporu = async () => {
    await loadKoliEnvanterRaporuWithFilters(filtreMinAdet, filtreMaxAdet, sadeceBos);
  };

  const loadKoliEnvanterRaporuWithFilters = async (minAdet, maxAdet, bosFiltre) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Min adet filtresi
      if (minAdet && minAdet > 0) {
        params.set('min_adet', String(minAdet));
      }
      
      // Max adet filtresi
      if (maxAdet && maxAdet < 999999) {
        params.set('max_adet', String(maxAdet));
      }
      
      // Sadece boş koliler
      if (bosFiltre) {
        params.set('sadece_bos', 'true');
      }

      console.log('API çağrısı:', `/api/rapor/koli-envanter?${params}`);
      console.log('Filtre parametreleri:', { minAdet, maxAdet, bosFiltre });
      
      const response = await fetch(`/api/rapor/koli-envanter?${params}`);
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }
      const data = await response.json();
      console.log('API yanıtı:', data);
      setKoliEnvanterRaporu(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Koli envanter raporu yüklenirken hata:', error);
      toast.error('Rapor yüklenirken hata oluştu');
      setKoliEnvanterRaporu([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBosKoliRaporu = async () => {
    try {
      const response = await fetch('/api/bos-koli');
      if (response.ok) {
        const data = await response.json();
        setBosKoliRaporu(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Boş koli raporu yüklenirken hata:', error);
    }
  };

  const handleFiltreUygula = () => {
    loadKoliEnvanterRaporu();
  };

  const handleFiltreTemizle = () => {
    setFiltreMinAdet(0);
    setFiltreMaxAdet(999999);
    setSadeceBos(false);
    loadKoliEnvanterRaporu();
  };

  const handleExcelExport = () => {
    toast.info('Excel export özelliği yakında eklenecek');
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiTrendingUp size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Raporlar</h1>
            <p className="text-muted mb-0">Koli envanter ve boş koli raporları</p>
          </div>
        </div>
        <Badge bg="success" className="fs-6">
          <BiTrendingUp className="me-1" />
          Analiz ve Raporlar
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Raporlar:</strong> Depo durumu, koli envanteri ve boş koli raporlarını görüntüleyin.
      </Alert>

      <Tabs defaultActiveKey="koli-envanter" className="mb-4">
        <Tab eventKey="koli-envanter" title="Koli Envanter Raporu">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Koli Envanter Raporu</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-success" size="sm" onClick={handleExcelExport}>
                    <BiDownload className="me-1" />
                    Excel
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={loadKoliEnvanterRaporu}>
                    <BiSearch className="me-1" />
                    Yenile
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Filtreler */}
              <Row className="mb-4">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Min Adet</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={filtreMinAdet}
                      onChange={(e) => setFiltreMinAdet(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Max Adet</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={filtreMaxAdet}
                      onChange={(e) => setFiltreMaxAdet(parseInt(e.target.value) || 999999)}
                      placeholder="999999"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Hızlı Filtreler</Form.Label>
                    <Form.Select
                      onChange={async (e) => {
                        const value = e.target.value;
                        let newMinAdet, newMaxAdet, newSadeceBos;
                        
                        if (value === 'bos') {
                          newMinAdet = 0;
                          newMaxAdet = 0;
                          newSadeceBos = true;
                        } else if (value === 'az') {
                          newMinAdet = 1;
                          newMaxAdet = 10;
                          newSadeceBos = false;
                        } else if (value === 'orta') {
                          newMinAdet = 11;
                          newMaxAdet = 50;
                          newSadeceBos = false;
                        } else if (value === 'cok') {
                          newMinAdet = 51;
                          newMaxAdet = 999999;
                          newSadeceBos = false;
                        } else {
                          newMinAdet = 0;
                          newMaxAdet = 999999;
                          newSadeceBos = false;
                        }
                        
                        // State'i güncelle
                        setFiltreMinAdet(newMinAdet);
                        setFiltreMaxAdet(newMaxAdet);
                        setSadeceBos(newSadeceBos);
                        
                        // Hızlı filtre seçildiğinde otomatik uygula
                        await loadKoliEnvanterRaporuWithFilters(newMinAdet, newMaxAdet, newSadeceBos);
                      }}
                    >
                      <option value="">Tümü</option>
                      <option value="bos">Boş Koliler (0 adet)</option>
                      <option value="az">Az Dolu (1-10 adet)</option>
                      <option value="orta">Orta Dolu (11-50 adet)</option>
                      <option value="cok">Çok Dolu (51+ adet)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <div className="d-flex gap-1">
                      <Button variant="primary" size="sm" onClick={handleFiltreUygula}>
                        <BiSearch className="me-1" />
                        Filtrele
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={handleFiltreTemizle}>
                        Temizle
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <Form.Check
                      type="checkbox"
                      label="Sadece Boş Koliler"
                      checked={sadeceBos}
                      onChange={(e) => setSadeceBos(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <div className="text-muted small">
                      <strong>Toplam:</strong> {koliEnvanterRaporu.length} koli
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Rapor Tablosu */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : koliEnvanterRaporu.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Koli No</th>
                      <th>Lokasyon</th>
                      <th>Ürün Sayısı</th>
                      <th>Toplam Adet</th>
                      <th>Doluluk Oranı</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {koliEnvanterRaporu.map((item, index) => (
                      <tr key={index}>
                        <td><Badge bg="primary">{item.koli_no}</Badge></td>
                        <td>{item.lokasyon || 'Belirtilmemiş'}</td>
                        <td><Badge bg="info">{item.urun_sayisi || 0}</Badge></td>
                        <td><Badge bg="success">{item.toplam_adet || 0}</Badge></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                              <div 
                                className={`progress-bar ${
                                  item.doluluk_orani > 80 ? 'bg-danger' :
                                  item.doluluk_orani > 50 ? 'bg-warning' :
                                  item.doluluk_orani > 0 ? 'bg-success' : 'bg-secondary'
                                }`}
                                style={{ width: `${item.doluluk_orani || 0}%` }}
                              ></div>
                            </div>
                            <small>{item.doluluk_orani || 0}%</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={
                            item.doluluk_orani > 80 ? 'danger' :
                            item.doluluk_orani > 50 ? 'warning' :
                            item.doluluk_orani > 0 ? 'success' : 'secondary'
                          }>
                            {item.doluluk_orani > 80 ? 'Dolu' : 
                             item.doluluk_orani > 50 ? 'Orta' : 
                             item.doluluk_orani > 0 ? 'Az' : 'Boş'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              // Bu kolideki ürünleri göster
                              toast.info(`${item.koli_no} kolisi detayları yakında eklenecek`);
                            }}
                            title="Koli detaylarını görüntüle"
                          >
                            <BiBox className="me-1" />
                            Detay
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <BiBox size={48} className="text-muted mb-3" />
                  <p className="text-muted">Rapor verisi bulunamadı</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="bos-koli" title="Boş Koli Raporu">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Boş Koli Raporu</h5>
                <Button variant="outline-primary" size="sm" onClick={loadBosKoliRaporu}>
                  <BiSearch className="me-1" />
                  Yenile
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {bosKoliRaporu.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Koli No</th>
                      <th>Lokasyon</th>
                      <th>Kapasite</th>
                      <th>Durum</th>
                      <th>Oluşturma Tarihi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bosKoliRaporu.map((item, index) => (
                      <tr key={index}>
                        <td><Badge bg="secondary">{item.koli_no}</Badge></td>
                        <td>{item.lokasyon || 'Belirtilmemiş'}</td>
                        <td><Badge bg="info">{item.kapasite || 100}</Badge></td>
                        <td><Badge bg="secondary">Boş</Badge></td>
                        <td>{item.olusturma_tarihi ? new Date(item.olusturma_tarihi).toLocaleDateString('tr-TR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <BiBox size={48} className="text-muted mb-3" />
                  <p className="text-muted">Boş koli bulunamadı</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Raporlar;