'use client'

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Row, Col, Alert } from 'react-bootstrap';
import { BiPlus, BiEdit, BiTrash, BiKey, BiUser, BiShield, BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    kullanici_adi: '',
    email: '',
    sifre: '',
    ad_soyad: '',
    rol: 'kullanici'
  });

  useEffect(() => {
    loadKullanicilar();
  }, []);

  const loadKullanicilar = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/kullanici');
      if (response.ok) {
        const data = await response.json();
        setKullanicilar(data);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingUser ? `/api/admin/kullanici/${editingUser.id}` : '/api/admin/kullanici';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingUser ? 'Kullanıcı güncellendi' : 'Kullanıcı eklendi');
        setShowModal(false);
        setFormData({ kullanici_adi: '', email: '', sifre: '', ad_soyad: '', rol: 'kullanici' });
        setEditingUser(null);
        loadKullanicilar();
      } else {
        toast.error('Kullanıcı kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcı kaydetme hatası:', error);
      toast.error('Kullanıcı kaydedilirken hata oluştu');
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
      const response = await fetch(`/api/admin/kullanici/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kullanıcı silindi');
        loadKullanicilar();
      } else {
        toast.error('Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ kullanici_adi: '', email: '', sifre: '', ad_soyad: '', rol: 'kullanici' });
    setEditingUser(null);
  };

  const getRoleBadge = (rol) => {
    const rolInfo = {
      admin: { renk: 'danger', ad: 'Admin' },
      kullanici: { renk: 'primary', ad: 'Kullanıcı' },
      operator: { renk: 'warning', ad: 'Operatör' }
    };
    return rolInfo[rol] || { renk: 'secondary', ad: rol };
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Admin Panel</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <BiPlus className="me-1" />
          Yeni Kullanıcı
        </Button>
      </div>

      <Alert variant="warning" className="mb-4">
        <BiShield className="me-2" />
        <strong>Admin Panel:</strong> Bu sayfa sadece admin yetkisine sahip kullanıcılar tarafından görüntülenebilir.
      </Alert>

      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BiUser className="me-2" />
                Kullanıcı Yönetimi
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : kullanicilar.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Kullanıcı Adı</th>
                      <th>Ad Soyad</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kullanicilar.map((user, index) => (
                      <tr key={index}>
                        <td><code>{user.kullanici_adi}</code></td>
                        <td>{user.ad_soyad}</td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={getRoleBadge(user.rol).renk}>
                            {getRoleBadge(user.rol).ad}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={user.aktif ? 'success' : 'secondary'}>
                            {user.aktif ? 'Aktif' : 'Pasif'}
                          </Badge>
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
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={user.kullanici_adi === 'admin'}
                          >
                            <BiTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <BiUser size={48} className="text-muted mb-3" />
                  <p className="text-muted">Henüz kullanıcı bulunmuyor</p>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    <BiPlus className="me-1" />
                    İlk Kullanıcıyı Ekle
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Kullanıcı Ekleme/Düzenleme Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Adı</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.kullanici_adi}
                    onChange={(e) => setFormData({ ...formData, kullanici_adi: e.target.value })}
                    placeholder="Kullanıcı adını girin"
                    required
                    disabled={editingUser}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.ad_soyad}
                    onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                    placeholder="Ad soyad girin"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email adresini girin"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  >
                    <option value="kullanici">Kullanıcı</option>
                    <option value="operator">Operatör</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Şifre {editingUser && <small className="text-muted">(Boş bırakırsanız değişmez)</small>}
              </Form.Label>
              <Form.Control
                type="password"
                value={formData.sifre}
                onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                placeholder="Şifre girin"
                required={!editingUser}
              />
            </Form.Group>

            <Alert variant="info" className="small">
              <BiKey className="me-1" />
              <strong>Rol Açıklamaları:</strong><br />
              • <strong>Kullanıcı:</strong> Temel işlemleri yapabilir<br />
              • <strong>Operatör:</strong> Gelişmiş işlemleri yapabilir<br />
              • <strong>Admin:</strong> Tüm işlemleri yapabilir ve kullanıcı yönetimi
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <BiCheck className="me-1" />
              {editingUser ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;