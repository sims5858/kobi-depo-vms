'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { BiDownload, BiUpload, BiTrash, BiSave, BiRefresh, BiCalendar, BiFile, BiShield } from 'react-icons/bi';
import { toast } from 'react-toastify';

const YedekYonetimi = () => {
  const [yedekler, setYedekler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedYedek, setSelectedYedek] = useState(null);
  const [restorePassword, setRestorePassword] = useState('');

  useEffect(() => {
    loadYedekler();
  }, []);

  const loadYedekler = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/yedek');
      const data = await response.json();
      setYedekler(data);
    } catch (error) {
      console.error('Yedekler yüklenirken hata:', error);
      toast.error('Yedekler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleYedekAl = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/yedek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aciklama: `Manuel yedek - ${new Date().toLocaleString('tr-TR')}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Yedek başarıyla alındı: ${result.yedek_adi}`);
        loadYedekler();
      } else {
        toast.error('Yedek alınırken hata oluştu');
      }
    } catch (error) {
      console.error('Yedek alma hatası:', error);
      toast.error('Yedek alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleYedekIndir = async (yedek) => {
    try {
      const response = await fetch(`/api/admin/yedek/${yedek.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = yedek.dosya_adi;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Yedek dosyası indirildi');
      } else {
        toast.error('Yedek indirilirken hata oluştu');
      }
    } catch (error) {
      console.error('Yedek indirme hatası:', error);
      toast.error('Yedek indirilirken hata oluştu');
    }
  };

  const handleGeriYukle = async () => {
    if (!restorePassword.trim()) {
      toast.warning('Lütfen onay şifresini girin');
      return;
    }

    if (restorePassword !== 'GERIYUKLE') {
      toast.error('Onay şifresi yanlış');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/yedek/${selectedYedek.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onay: true
        }),
      });

      if (response.ok) {
        toast.success('Veriler başarıyla geri yüklendi');
        setShowRestoreModal(false);
        setSelectedYedek(null);
        setRestorePassword('');
      } else {
        toast.error('Geri yükleme sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Geri yükleme hatası:', error);
      toast.error('Geri yükleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleYedekSil = async (yedek) => {
    if (!window.confirm(`"${yedek.aciklama}" yedeğini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/yedek/${yedek.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Yedek silindi');
        loadYedekler();
      } else {
        toast.error('Yedek silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Yedek silme hatası:', error);
      toast.error('Yedek silinirken hata oluştu');
    }
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const formatBoyut = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Yedek Yönetimi</h1>
        <Badge bg="success" className="fs-6">
          <BiShield className="me-1" />
          Veri Güvenliği
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Yedek Yönetimi:</strong> Verilerinizi güvenli bir şekilde yedekleyin ve gerektiğinde geri yükleyin. 
        Düzenli yedek almayı unutmayın!
      </Alert>

      <Row>
        <Col lg={12}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Yedek İşlemleri</h5>
                <Button 
                  variant="success" 
                  onClick={handleYedekAl}
                  disabled={loading}
                  className="d-flex align-items-center"
                >
                  <BiSave className="me-1" />
                  Yeni Yedek Al
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={loadYedekler}
                  disabled={loading}
                  className="d-flex align-items-center"
                >
                  <BiRefresh className="me-1" />
                  Yenile
                </Button>
              </div>

              {yedekler.length > 0 ? (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Yedek Adı</th>
                      <th>Açıklama</th>
                      <th>Tarih</th>
                      <th>Boyut</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yedekler.map((yedek) => (
                      <tr key={yedek.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <BiFile className="me-2 text-primary" />
                            {yedek.dosya_adi}
                          </div>
                        </td>
                        <td>{yedek.aciklama}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <BiCalendar className="me-1 text-muted" />
                            {formatTarih(yedek.olusturma_tarihi)}
                          </div>
                        </td>
                        <td>{formatBoyut(yedek.boyut)}</td>
                        <td>
                          <Badge bg={yedek.durum === 'aktif' ? 'success' : 'secondary'}>
                            {yedek.durum}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleYedekIndir(yedek)}
                              title="Yedeği İndir"
                            >
                              <BiDownload />
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => {
                                setSelectedYedek(yedek);
                                setShowRestoreModal(true);
                              }}
                              title="Geri Yükle"
                            >
                              <BiUpload />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleYedekSil(yedek)}
                              title="Yedeği Sil"
                            >
                              <BiTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4">
                  <BiFile size={48} className="mb-2" />
                  <p>Henüz yedek bulunmuyor</p>
                  <Button variant="primary" onClick={handleYedekAl}>
                    İlk Yedeğinizi Alın
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Geri Yükleme Modal */}
      <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yedek Geri Yükleme</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedYedek && (
            <>
              <Alert variant="warning">
                <strong>Dikkat!</strong> Bu işlem mevcut tüm verileri silecek ve seçilen yedek ile değiştirecektir.
                Bu işlem geri alınamaz!
              </Alert>
              
              <div className="mb-3">
                <strong>Geri Yüklenecek Yedek:</strong><br />
                <small className="text-muted">{selectedYedek.dosya_adi}</small><br />
                <small className="text-muted">{formatTarih(selectedYedek.olusturma_tarihi)}</small>
              </div>

              <Form.Group>
                <Form.Label>Onay Şifresi</Form.Label>
                <Form.Control
                  type="password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  placeholder="GERIYUKLE yazın"
                />
                <Form.Text className="text-muted">
                  Onaylamak için "GERIYUKLE" yazın
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleGeriYukle}
            disabled={loading || restorePassword !== 'GERIYUKLE'}
          >
            {loading ? 'Geri Yükleniyor...' : 'Geri Yükle'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default YedekYonetimi;
