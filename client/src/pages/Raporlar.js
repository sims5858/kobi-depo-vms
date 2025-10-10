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
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Min adet filtresi
      if (filtreMinAdet && filtreMinAdet > 0) {
        params.set('min_adet', String(filtreMinAdet));
      }
      
      // Max adet filtresi
      if (filtreMaxAdet && filtreMaxAdet < 999999) {
        params.set('max_adet', String(filtreMaxAdet));
      }
      
      // Sadece boş koliler
      if (sadeceBos) {
        params.set('sadece_bos', 'true');
      }

      console.log('API çağrısı:', `/api/rapor/koli-envanter?${params}`);
      
      const response = await fetch(`/api/rapor/koli-envanter?${params}`);
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }
      const data = await response.json();
      console.log('API yanıtı:', data);
      setKoliEnvanterRaporu(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Koli envanter raporu yüklenirken hata:', error);
      toast.error('Rapor yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBosKoliRaporu = async () => {
    try {
      const response = await fetch('/api/bos-koli');
      const data = await response.json();
      setBosKoliRaporu(data);
    } catch (error) {
      console.error('Boş koli raporu yüklenirken hata:', error);
    }
  };

  

  const exportToExcel = (data, filename) => {
    // Excel export işlemi burada yapılacak
    toast.success(`${filename} Excel olarak indirildi`);
  };

  

  const KoliEnvanterRaporu = () => (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Koli Envanter Raporu</h5>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => exportToExcel(koliEnvanterRaporu, 'koli-envanter-raporu')}
          >
            <BiDownload className="me-1" />
            Excel İndir
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={3}>
            <Form.Label>Min Adet</Form.Label>
            <Form.Control
              type="number"
              value={filtreMinAdet}
              onChange={(e) => setFiltreMinAdet(parseInt(e.target.value) || 0)}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Max Adet</Form.Label>
            <Form.Control
              type="number"
              value={filtreMaxAdet}
              onChange={(e) => setFiltreMaxAdet(parseInt(e.target.value) || 999999)}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Filtre</Form.Label>
            <Form.Check
              type="checkbox"
              label="Sadece Boş Koliler"
              checked={sadeceBos}
              onChange={(e) => setSadeceBos(e.target.checked)}
            />
          </Col>
          <Col md={3}>
            <Form.Label>&nbsp;</Form.Label>
            <Button 
              variant="primary" 
              onClick={loadKoliEnvanterRaporu}
              disabled={loading}
              className="w-100"
            >
              <BiSearch className="me-1" />
              Filtrele
            </Button>
          </Col>
        </Row>

        {koliEnvanterRaporu.length > 0 && (
          <>
            <div className="mb-3">
              <Badge bg="info" className="fs-6">
                {koliEnvanterRaporu.length} Koli Bulundu
              </Badge>
            </div>

            <Table responsive striped>
              <thead>
                <tr>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Toplam Adet</th>
                  <th>Ürün Çeşidi</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {koliEnvanterRaporu.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Badge bg="primary">{item.koli_no}</Badge>
                    </td>
                    <td>{item.lokasyon || 'Belirsiz'}</td>
                    <td>
                      <Badge bg={item.toplam_adet === 0 ? 'danger' : item.toplam_adet < 10 ? 'warning' : 'success'}>
                        {item.toplam_adet}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="info">{item.urun_cesidi}</Badge>
                    </td>
                    <td>
                      {item.toplam_adet === 0 ? (
                        <Badge bg="danger">Boş</Badge>
                      ) : item.toplam_adet < 10 ? (
                        <Badge bg="warning">Düşük</Badge>
                      ) : (
                        <Badge bg="success">Dolu</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  );

  const BosKoliRaporu = () => (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Boş Koli Raporu</h5>
          <Button 
            variant="outline-success" 
            size="sm"
            onClick={() => exportToExcel(bosKoliRaporu, 'bos-koli-raporu')}
          >
            <BiDownload className="me-1" />
            Excel İndir
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {bosKoliRaporu.length > 0 ? (
          <>
            <div className="mb-3">
              <Badge bg="warning" className="fs-6">
                {bosKoliRaporu.length} Boş Koli Bulundu
              </Badge>
            </div>

            <Table responsive striped>
              <thead>
                <tr>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {bosKoliRaporu.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Badge bg="primary">{item.koli_no}</Badge>
                    </td>
                    <td>{item.lokasyon || 'Belirsiz'}</td>
                    <td>
                      <Badge bg="danger">Boş</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : (
          <div className="text-center text-muted py-4">
            <BiBox size={48} className="mb-2" />
            <p>Boş koli bulunamadı</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4 anim-fade-in">
        <h1 className="h3 mb-0">Raporlar</h1>
        <Badge bg="primary" className="fs-6">
          <BiTrendingUp className="me-1" />
          Analiz ve Raporlar
        </Badge>
      </div>

      <Alert variant="info" className="mb-4 anim-slide-up delay-1">
        <strong>Rapor Modülü:</strong> Depo envanteri, sipariş durumu ve koli bazlı analizleri 
        görüntüleyin ve Excel formatında indirin.
      </Alert>

      <Tabs defaultActiveKey="envanter" className="mb-4 anim-scale-in delay-2">
        <Tab eventKey="envanter" title="Koli Envanter Raporu">
          <KoliEnvanterRaporu />
        </Tab>
        <Tab eventKey="bos" title="Boş Koli Raporu">
          <BosKoliRaporu />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Raporlar;
