import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Row, Col, ListGroup } from 'react-bootstrap';
import { BiPlus, BiEdit, BiTrash, BiKey, BiUser, BiShield, BiCheck, BiFile, BiRefresh, BiDownload, BiFilter } from 'react-icons/bi';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleInfoModal, setShowRoleInfoModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    kullanici_adi: '',
    email: '',
    sifre: '',
    ad_soyad: '',
    rol: 'kullanici'
  });

  // Log sistemi state'leri
  const [showLogModal, setShowLogModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [logFilter, setLogFilter] = useState({
    level: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Rol tanımları ve yetkileri
  const rolYetkileri = {
    admin: {
      ad: 'Sistem Yöneticisi',
      aciklama: 'Tüm sistem yetkileri',
      renk: 'danger',
      yetkiler: [
        'Kullanıcı yönetimi',
        'Sistem ayarları',
        'Tüm raporlar',
        'Veritabanı yönetimi',
        'Güvenlik ayarları'
      ]
    },
    operator: {
      ad: 'Depo Operatörü',
      aciklama: 'Depo işlemleri ve raporlar',
      renk: 'warning',
      yetkiler: [
        'Ürün giriş/çıkış',
        'Koli transfer',
        'Envanter sayımı',
        'Operasyonel raporlar',
        'Barkod okuma'
      ]
    },
    kullanici: {
      ad: 'Standart Kullanıcı',
      aciklama: 'Temel depo işlemleri',
      renk: 'primary',
      yetkiler: [
        'Ürün sorgulama',
        'Koli sorgulama',
        'Temel raporlar',
        'Barkod okuma'
      ]
    }
  };

  useEffect(() => {
    loadKullanicilar();
  }, []);

  // Log sistemi fonksiyonları
  const loadLogs = async () => {
    setLogLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (logFilter.level !== 'all') params.append('level', logFilter.level);
      if (logFilter.dateFrom) params.append('dateFrom', logFilter.dateFrom);
      if (logFilter.dateTo) params.append('dateTo', logFilter.dateTo);
      if (logFilter.search) params.append('search', logFilter.search);

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        toast.error('Loglar yüklenemedi');
      }
    } catch (error) {
      console.error('Log yükleme hatası:', error);
      toast.error('Log yükleme hatası');
    } finally {
      setLogLoading(false);
    }
  };

  const loadTerminalLogs = async () => {
    setTerminalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/terminal-logs?limit=300', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setTerminalLogs(data);
      }
    } catch (e) {
      console.error('Terminal log yükleme hatası:', e);
      toast.error('Terminal logları yüklenemedi');
    } finally {
      setTerminalLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Tarih', 'Seviye', 'Kullanıcı', 'İşlem', 'Detay', 'IP'],
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString('tr-TR'),
        log.level,
        log.user || 'Sistem',
        log.action,
        log.details,
        log.ip
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLogLevelBadge = (level) => {
    const variants = {
      error: 'danger',
      warn: 'warning',
      info: 'info',
      debug: 'secondary',
      success: 'success'
    };
    return <Badge bg={variants[level] || 'secondary'}>{level.toUpperCase()}</Badge>;
  };

  const loadKullanicilar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/kullanici', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setKullanicilar(data);
      } else {
        toast.error('Kullanıcılar yüklenemedi');
      }
    } catch (error) {
      console.error('Hata:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `/api/admin/kullanici/${editingUser.id}`
        : '/api/admin/kullanici';
      
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, sifre: undefined } // Şifre güncelleme ayrı endpoint
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'İşlem başarılı');
        setShowModal(false);
        setEditingUser(null);
        setFormData({ kullanici_adi: '', email: '', sifre: '', ad_soyad: '', rol: 'kullanici' });
        loadKullanicilar();
      } else {
        toast.error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Hata:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      kullanici_adi: user.kullanici_adi,
      email: user.email,
      sifre: '',
      ad_soyad: user.ad_soyad,
      rol: user.rol
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kullanici/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        loadKullanicilar();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Hata:', error);
      toast.error('Bağlantı hatası');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/kullanici/${selectedUserId}/sifre`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ yeni_sifre: formData.sifre })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setShowPasswordModal(false);
        setFormData({ ...formData, sifre: '' });
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Hata:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (rol) => {
    const rolInfo = rolYetkileri[rol];
    if (!rolInfo) return <Badge bg="secondary">{rol}</Badge>;
    
    return (
      <Badge bg={rolInfo.renk} className="d-flex align-items-center">
        <BiShield className="me-1" />
        {rolInfo.ad}
      </Badge>
    );
  };

  const getStatusBadge = (aktif) => {
    return <Badge bg={aktif ? 'success' : 'secondary'}>{aktif ? 'Aktif' : 'Pasif'}</Badge>;
  };

  return (
    <div className="container-fluid page-transition">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <BiShield className="me-2" />
                Kullanıcı Yönetimi
              </h5>
              <div>
                <Button 
                  variant="outline-warning" 
                  className="me-2"
                  onClick={() => {
                    setShowLogModal(true);
                    loadLogs();
                  }}
                >
                  <BiFile className="me-1" />
                  Sistem Logları
                </Button>
                <Button 
                  variant="outline-dark"
                  className="me-2"
                  onClick={() => { setShowTerminalModal(true); loadTerminalLogs(); }}
                >
                  Terminal Logu
                </Button>
                <Button 
                  variant="outline-info" 
                  className="me-2"
                  onClick={() => setShowRoleInfoModal(true)}
                >
                  <BiShield className="me-1" />
                  Rol Bilgileri
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setEditingUser(null);
                    setFormData({ kullanici_adi: '', email: '', sifre: '', ad_soyad: '', rol: 'kullanici' });
                    setShowModal(true);
                  }}
                >
                  <BiPlus className="me-1" />
                  Yeni Kullanıcı
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Kullanıcı Adı</th>
                      <th>Ad Soyad</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Durum</th>
                      <th>Son Giriş</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kullanicilar.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <BiUser className="me-1" />
                          {user.kullanici_adi}
                        </td>
                        <td>{user.ad_soyad}</td>
                        <td>{user.email}</td>
                        <td>
                          <div className="d-flex flex-column">
                            {getRoleBadge(user.rol)}
                            <small className="text-muted mt-1">
                              {rolYetkileri[user.rol]?.aciklama}
                            </small>
                          </div>
                        </td>
                        <td>{getStatusBadge(user.aktif)}</td>
                        <td>
                          {user.son_giris 
                            ? new Date(user.son_giris).toLocaleString('tr-TR')
                            : 'Hiç giriş yapmamış'
                          }
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEdit(user)}
                          >
                            <BiEdit />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-1"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setFormData({ ...formData, sifre: '' });
                              setShowPasswordModal(true);
                            }}
                          >
                            <BiKey />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Kullanıcı Ekleme/Düzenleme Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Adı</Form.Label>
                  <Form.Control
                    type="text"
                    name="kullanici_adi"
                    value={formData.kullanici_adi}
                    onChange={(e) => setFormData({ ...formData, kullanici_adi: e.target.value })}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    name="ad_soyad"
                    value={formData.ad_soyad}
                    onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Rolü</Form.Label>
                  <div className="border rounded p-3">
                    {Object.entries(rolYetkileri).map(([rolKey, rolInfo]) => (
                      <div key={rolKey} className="mb-3">
                        <Form.Check
                          type="radio"
                          id={`rol-${rolKey}`}
                          name="rol"
                          value={rolKey}
                          checked={formData.rol === rolKey}
                          onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                          disabled={loading}
                          label={
                            <div className="d-flex align-items-center">
                              <Badge bg={rolInfo.renk} className="me-2">
                                {rolInfo.ad}
                              </Badge>
                              <small className="text-muted">{rolInfo.aciklama}</small>
                            </div>
                          }
                        />
                        {formData.rol === rolKey && (
                          <div className="mt-2 ms-4">
                            <small className="text-muted fw-bold">Yetkiler:</small>
                            <ListGroup variant="flush" className="mt-1">
                              {rolInfo.yetkiler.map((yetki, index) => (
                                <ListGroup.Item key={index} className="py-1 px-2 border-0">
                                  <BiCheck className="text-success me-1" />
                                  <small>{yetki}</small>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            {!editingUser && (
              <Form.Group className="mb-3">
                <Form.Label>Şifre</Form.Label>
                <Form.Control
                  type="password"
                  name="sifre"
                  value={formData.sifre}
                  onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                  required={!editingUser}
                  disabled={loading}
                />
              </Form.Group>
            )}
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                İptal
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Oluştur')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Şifre Değiştirme Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Şifre Değiştir</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePasswordChange}>
            <Form.Group className="mb-3">
              <Form.Label>Yeni Şifre</Form.Label>
              <Form.Control
                type="password"
                name="sifre"
                value={formData.sifre}
                onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                required
                disabled={loading}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowPasswordModal(false)}>
                İptal
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Rol Bilgileri Modal */}
      <Modal show={showRoleInfoModal} onHide={() => setShowRoleInfoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BiShield className="me-2" />
            Kullanıcı Rolleri ve Yetkileri
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {Object.entries(rolYetkileri).map(([rolKey, rolInfo]) => (
              <Col md={4} key={rolKey} className="mb-4">
                <Card className="h-100">
                  <Card.Header className={`bg-${rolInfo.renk} text-white`}>
                    <h6 className="mb-0">
                      <BiShield className="me-1" />
                      {rolInfo.ad}
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted small mb-3">{rolInfo.aciklama}</p>
                    <h6 className="small fw-bold mb-2">Yetkiler:</h6>
                    <ListGroup variant="flush">
                      {rolInfo.yetkiler.map((yetki, index) => (
                        <ListGroup.Item key={index} className="py-1 px-0 border-0">
                          <BiCheck className="text-success me-1" />
                          <small>{yetki}</small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleInfoModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Log Modal */}
      <Modal 
        show={showLogModal} 
        onHide={() => setShowLogModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <BiFile className="me-2" />
            Sistem Logları
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Filtreler */}
          <Card className="mb-3">
            <Card.Header className="py-2">
              <h6 className="mb-0">
                <BiFilter className="me-1" />
                Filtreler
              </h6>
            </Card.Header>
            <Card.Body className="py-2">
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Seviye</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={logFilter.level}
                      onChange={(e) => setLogFilter({...logFilter, level: e.target.value})}
                    >
                      <option value="all">Tümü</option>
                      <option value="error">Hata</option>
                      <option value="warn">Uyarı</option>
                      <option value="info">Bilgi</option>
                      <option value="debug">Debug</option>
                      <option value="success">Başarı</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Başlangıç Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={logFilter.dateFrom}
                      onChange={(e) => setLogFilter({...logFilter, dateFrom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Bitiş Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={logFilter.dateTo}
                      onChange={(e) => setLogFilter({...logFilter, dateTo: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Arama</Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="Kullanıcı, işlem..."
                      value={logFilter.search}
                      onChange={(e) => setLogFilter({...logFilter, search: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={loadLogs}
                    disabled={logLoading}
                    className="me-2"
                  >
                    <BiRefresh className="me-1" />
                    {logLoading ? 'Yükleniyor...' : 'Filtrele'}
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={exportLogs}
                    disabled={logs.length === 0}
                  >
                    <BiDownload className="me-1" />
                    CSV İndir
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Log Tablosu */}
          <Card>
            <Card.Header className="py-2">
              <h6 className="mb-0">
                Log Kayıtları ({logs.length})
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              {logLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <BiFile size={48} className="mb-2" />
                  <p>Log kaydı bulunamadı</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped hover size="sm" className="mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th style={{ fontSize: '12px' }}>Tarih</th>
                        <th style={{ fontSize: '12px' }}>Seviye</th>
                        <th style={{ fontSize: '12px' }}>Kullanıcı</th>
                        <th style={{ fontSize: '12px' }}>İşlem</th>
                        <th style={{ fontSize: '12px' }}>Detay</th>
                        <th style={{ fontSize: '12px' }}>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={index}>
                          <td style={{ fontSize: '11px' }}>
                            {new Date(log.timestamp).toLocaleString('tr-TR')}
                          </td>
                          <td>{getLogLevelBadge(log.level)}</td>
                          <td style={{ fontSize: '11px' }}>
                            <Badge bg="info">{log.user || 'Sistem'}</Badge>
                          </td>
                          <td style={{ fontSize: '11px' }}>{log.action}</td>
                          <td style={{ fontSize: '11px', maxWidth: '200px' }}>
                            <div style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {log.details}
                            </div>
                          </td>
                          <td style={{ fontSize: '10px' }}>
                            <code>{log.ip}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Terminal Log Modal */}
      <Modal show={showTerminalModal} onHide={() => setShowTerminalModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Terminal Logları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {terminalLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', background: '#111', color: '#eee', padding: '10px', borderRadius: '6px' }}>
              {terminalLogs.length === 0 ? (
                <div className="text-muted">Log bulunamadı</div>
              ) : (
                terminalLogs.map((l, i) => (
                  <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    <span style={{ color: '#0dcaf0' }}>[{new Date(l.timestamp).toLocaleTimeString('tr-TR')}]</span>{' '}
                    <span style={{ color: l.level === 'error' ? '#dc3545' : l.level === 'warn' ? '#ffc107' : '#6c757d' }}>
                      {l.level.toUpperCase()}
                    </span>{' '}
                    <span style={{ color: '#fff' }}>{l.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTerminalModal(false)}>Kapat</Button>
          <Button variant="outline-primary" onClick={loadTerminalLogs}>Yenile</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminPanel;
