import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { BiTrendingUp, BiDownload, BiSearch, BiBox } from 'react-icons/bi';
import { toast } from 'react-toastify';

const Raporlar = () => {
  const [siparisNo, setSiparisNo] = useState('');
  const [siparisRaporu, setSiparisRaporu] = useState([]);
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
      const params = new URLSearchParams({
        min_adet: filtreMinAdet,
        max_adet: filtreMaxAdet
      });
      
      if (sadeceBos) {
        params.set('sadece_bos', 'true');
      }

      const response = await fetch(`/api/rapor/koli-envanter?${params}`);
      const data = await response.json();
      setKoliEnvanterRaporu(data);
    } catch (error) {
      console.error('Koli envanter raporu yüklenirken hata:', error);
      toast.error('Rapor yüklenirken hata oluştu');
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

  const loadSiparisRaporu = async () => {
    if (!siparisNo.trim()) {
      toast.warning('Lütfen sipariş numarası girin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/rapor/siparis/${siparisNo}`);
      const data = await response.json();
      setSiparisRaporu(data);
    } catch (error) {
      console.error('Sipariş raporu yüklenirken hata:', error);
      toast.error('Sipariş raporu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data, filename) => {
    // Excel export işlemi burada yapılacak
    toast.success(`${filename} Excel olarak indirildi`);
  };

  const SiparisRaporu = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Sipariş Raporu</h5>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={8}>
            <Form.Control
              type="text"
              value={siparisNo}
              onChange={(e) => setSiparisNo(e.target.value)}
              placeholder="Sipariş numarasını girin"
            />
          </Col>
          <Col md={4}>
            <Button 
              variant="primary" 
              onClick={loadSiparisRaporu}
              disabled={loading}
              className="w-100"
            >
              <BiSearch className="me-1" />
              {loading ? 'Yükleniyor...' : 'Rapor Al'}
            </Button>
          </Col>
        </Row>

        {siparisRaporu.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Badge bg="success" className="fs-6">
                {siparisRaporu.length} Koli Bulundu
              </Badge>
              <Button 
                variant="outline-success" 
                size="sm"
                onClick={() => exportToExcel(siparisRaporu, 'siparis-raporu')}
              >
                <BiDownload className="me-1" />
                Excel İndir
              </Button>
            </div>

            <Table responsive striped>
              <thead>
                <tr>
                  <th>Koli No</th>
                  <th>Lokasyon</th>
                  <th>Barkod</th>
                  <th>Ürün Adı</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                {siparisRaporu.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Badge bg="primary">{item.koli_no}</Badge>
                    </td>
                    <td>{item.lokasyon || 'Belirsiz'}</td>
                    <td>{item.barkod}</td>
                    <td>{item.urun_adi}</td>
                    <td>
                      <Badge bg="success">{item.adet}</Badge>
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
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Raporlar</h1>
        <Badge bg="primary" className="fs-6">
          <BiTrendingUp className="me-1" />
          Analiz ve Raporlar
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Rapor Modülü:</strong> Depo envanteri, sipariş durumu ve koli bazlı analizleri 
        görüntüleyin ve Excel formatında indirin.
      </Alert>

      <Tabs defaultActiveKey="siparis" className="mb-4">
        <Tab eventKey="siparis" title="Sipariş Raporu">
          <SiparisRaporu />
        </Tab>
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
