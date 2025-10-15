'use client'

import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Table, Badge, Form, Alert } from 'react-bootstrap';
import { BiBarChart, BiDownload, BiRefresh, BiFile, BiTrendingUp } from 'react-icons/bi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const Raporlar = () => {
  const [koliListesi, setKoliListesi] = useState([]);
  const [urunListesi, setUrunListesi] = useState([]);
  const [raporTuru, setRaporTuru] = useState('koli-envanter');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [koliResponse, urunResponse] = await Promise.all([
        fetch('/api/koli-liste'),
        fetch('/api/urun')
      ]);

      if (koliResponse.ok) {
        const koliData = await koliResponse.json();
        setKoliListesi(koliData);
      }

      if (urunResponse.ok) {
        const urunData = await urunResponse.json();
        setUrunListesi(urunData);
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      toast.error('Veri yüklenirken hata oluştu');
    }
  };

  const handleRaporOlustur = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rapor/${raporTuru}`);
      if (response.ok) {
        const data = await response.json();
        toast.success('Rapor oluşturuldu');
        return data;
      } else {
        toast.error('Rapor oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Rapor hatası:', error);
      toast.error('Rapor oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    let exportData = [];
    let fileName = '';

    switch (raporTuru) {
      case 'koli-envanter':
        exportData = koliListesi.map(koli => ({
          'Koli No': koli.koli_no,
          'Lokasyon': koli.lokasyon,
          'Ürün Sayısı': koli.urun_sayisi,
          'Toplam Adet': koli.toplam_adet,
          'Doluluk Oranı': `${koli.doluluk_orani.toFixed(1)}%`,
          'Son Güncelleme': koli.son_guncelleme
        }));
        fileName = `koli-envanter-raporu-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`;
        break;

      case 'urun-listesi':
        exportData = urunListesi.map(urun => ({
          'Barkod': urun.urun_barkod,
          'Ürün Adı': urun.urun_adi,
          'Adet': urun.adet,
          'Koli No': urun.koli_no,
          'Lokasyon': urun.lokasyon,
          'Oluşturma Tarihi': urun.olusturma_tarihi
        }));
        fileName = `urun-listesi-raporu-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`;
        break;

      case 'doluluk-raporu':
        exportData = koliListesi.map(koli => ({
          'Koli No': koli.koli_no,
          'Lokasyon': koli.lokasyon,
          'Doluluk Oranı': `${koli.doluluk_orani.toFixed(1)}%`,
          'Durum': koli.doluluk_orani > 80 ? 'Dolu' : 
                   koli.doluluk_orani > 50 ? 'Orta' : 
                   koli.doluluk_orani > 0 ? 'Az' : 'Boş',
          'Ürün Sayısı': koli.urun_sayisi,
          'Toplam Adet': koli.toplam_adet
        }));
        fileName = `doluluk-raporu-${typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : 'export'}.xlsx`;
        break;

      default:
        toast.error('Geçersiz rapor türü');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    XLSX.writeFile(wb, fileName);
    
    toast.success('Excel raporu indirildi');
  };

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

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiBarChart size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Raporlar</h1>
            <p className="text-muted mb-0">Sistem raporları ve analizler</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={loadData}>
            <BiRefresh className="me-1" />
            Yenile
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <BiBarChart size={32} className="text-primary mb-2" />
              <h3 className="text-primary">{koliListesi.length}</h3>
              <p className="mb-0">Toplam Koli</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <BiTrendingUp size={32} className="text-success mb-2" />
              <h3 className="text-success">{koliListesi.filter(k => k.doluluk_orani > 0).length}</h3>
              <p className="mb-0">Dolu Koli</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <BiFile size={32} className="text-info mb-2" />
              <h3 className="text-info">{urunListesi.length}</h3>
              <p className="mb-0">Toplam Ürün</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <BiBarChart size={32} className="text-warning mb-2" />
              <h3 className="text-warning">
                {koliListesi.length > 0 ? 
                  (koliListesi.reduce((sum, k) => sum + k.doluluk_orani, 0) / koliListesi.length).toFixed(1) : 0}%
              </h3>
              <p className="mb-0">Ortalama Doluluk</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rapor Seçimi */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiFile className="me-2" />
                Rapor Türü Seçimi
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Rapor Türü</Form.Label>
                <Form.Select
                  value={raporTuru}
                  onChange={(e) => setRaporTuru(e.target.value)}
                >
                  <option value="koli-envanter">Koli Envanter Raporu</option>
                  <option value="urun-listesi">Ürün Listesi Raporu</option>
                  <option value="doluluk-raporu">Doluluk Raporu</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleRaporOlustur}
                  disabled={loading}
                >
                  <BiBarChart className="me-1" />
                  {loading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleExcelExport}
                >
                  <BiDownload className="me-1" />
                  Excel İndir
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiTrendingUp className="me-2" />
                Hızlı İstatistikler
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-success mb-1">
                      {koliListesi.filter(k => k.doluluk_orani > 80).length}
                    </h4>
                    <small className="text-muted">Dolu Koli</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <h4 className="text-warning mb-1">
                      {koliListesi.filter(k => k.doluluk_orani > 50 && k.doluluk_orani <= 80).length}
                    </h4>
                    <small className="text-muted">Orta Doluluk</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h4 className="text-info mb-1">
                      {koliListesi.filter(k => k.doluluk_orani > 0 && k.doluluk_orani <= 50).length}
                    </h4>
                    <small className="text-muted">Az Doluluk</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h4 className="text-secondary mb-1">
                      {koliListesi.filter(k => k.doluluk_orani === 0).length}
                    </h4>
                    <small className="text-muted">Boş Koli</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Koli Envanter Tablosu */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <BiBarChart className="me-2" />
            Koli Envanter Durumu
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Ürün Sayısı</th>
                  <th>Toplam Adet</th>
                  <th>Doluluk</th>
                  <th>Durum</th>
                  <th>Son Güncelleme</th>
                </tr>
              </thead>
              <tbody>
                {koliListesi.map((koli, index) => (
                  <tr key={index}>
                    <td><code>{koli.koli_no}</code></td>
                    <td>{koli.lokasyon}</td>
                    <td>
                      <Badge bg="info">{koli.urun_sayisi}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{koli.toplam_adet}</Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1 me-2">
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar bg-${getDolulukBadge(koli.doluluk_orani)}`}
                              style={{ width: `${koli.doluluk_orani}%` }}
                            ></div>
                          </div>
                        </div>
                        <small className="text-muted">{koli.doluluk_orani.toFixed(1)}%</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getDolulukBadge(koli.doluluk_orani)}>
                        {getDolulukText(koli.doluluk_orani)}
                      </Badge>
                    </td>
                    <td className="small text-muted">{koli.son_guncelleme}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Raporlar;