'use client'

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge } from 'react-bootstrap';
import { BiRightArrow, BiBox, BiSearch, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const KoliTransfer = () => {
  const [koliListesi, setKoliListesi] = useState([]);
  const [selectedKoli, setSelectedKoli] = useState(null);
  const [transferData, setTransferData] = useState({
    kaynak_lokasyon: '',
    hedef_lokasyon: '',
    aciklama: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKoliListesi();
  }, []);

  const loadKoliListesi = async () => {
    try {
      const response = await fetch('/api/koli-liste');
      if (response.ok) {
        const data = await response.json();
        setKoliListesi(data);
      }
    } catch (error) {
      console.error('Koli listesi yüklenirken hata:', error);
      toast.error('Koli listesi yüklenirken hata oluştu');
    }
  };

  const handleKoliSelect = (koli) => {
    setSelectedKoli(koli);
    setTransferData({
      kaynak_lokasyon: koli.lokasyon,
      hedef_lokasyon: '',
      aciklama: ''
    });
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          koli_no: selectedKoli.koli_no,
          ...transferData
        }),
      });

      if (response.ok) {
        toast.success('Koli transferi başarıyla tamamlandı');
        setSelectedKoli(null);
        setTransferData({ kaynak_lokasyon: '', hedef_lokasyon: '', aciklama: '' });
        loadKoliListesi();
      } else {
        toast.error('Koli transferi sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Koli transfer hatası:', error);
      toast.error('Koli transferi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDolulukBadge = (doluluk) => {
    if (doluluk > 80) return 'danger';
    if (doluluk > 50) return 'warning';
    if (doluluk > 0) return 'success';
    return 'secondary';
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiRightArrow size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Koli Transfer</h1>
            <p className="text-muted mb-0">Koli transfer işlemleri</p>
          </div>
        </div>
      </div>

      <Row>
        {/* Koli Listesi */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiBox className="me-2" />
                Koli Listesi
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Koli No</th>
                      <th>Lokasyon</th>
                      <th>Durum</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {koliListesi.map((koli, index) => (
                      <tr key={index}>
                        <td><code>{koli.koli_no}</code></td>
                        <td>{koli.lokasyon}</td>
                        <td>
                          <Badge bg={getDolulukBadge(koli.doluluk_orani)}>
                            {koli.doluluk_orani > 80 ? 'Dolu' : 
                             koli.doluluk_orani > 50 ? 'Orta' : 
                             koli.doluluk_orani > 0 ? 'Az' : 'Boş'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleKoliSelect(koli)}
                          >
                            Seç
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Transfer Formu */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiRightArrow className="me-2" />
                Transfer İşlemi
              </h5>
            </Card.Header>
            <Card.Body>
              {selectedKoli ? (
                <>
                  <Alert variant="info" className="mb-3">
                    <strong>Seçilen Koli:</strong> {selectedKoli.koli_no} - {selectedKoli.lokasyon}
                  </Alert>

                  <Form onSubmit={handleTransfer}>
                    <Form.Group className="mb-3">
                      <Form.Label>Kaynak Lokasyon</Form.Label>
                      <Form.Control
                        type="text"
                        value={transferData.kaynak_lokasyon}
                        disabled
                        className="bg-light"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Hedef Lokasyon</Form.Label>
                      <Form.Control
                        type="text"
                        value={transferData.hedef_lokasyon}
                        onChange={(e) => setTransferData({ ...transferData, hedef_lokasyon: e.target.value })}
                        placeholder="Hedef lokasyonu girin (örn: B2-01)"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Açıklama</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={transferData.aciklama}
                        onChange={(e) => setTransferData({ ...transferData, aciklama: e.target.value })}
                        placeholder="Transfer açıklaması (opsiyonel)"
                      />
                    </Form.Group>

                    <div className="d-flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="d-flex align-items-center"
                      >
                        <BiCheck className="me-1" />
                        {loading ? 'Transfer Ediliyor...' : 'Transfer Et'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedKoli(null);
                          setTransferData({ kaynak_lokasyon: '', hedef_lokasyon: '', aciklama: '' });
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </Form>
                </>
              ) : (
                <div className="text-center py-5">
                  <BiBox size={48} className="text-muted mb-3" />
                  <p className="text-muted">Transfer etmek için bir koli seçin</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KoliTransfer;
