'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { BiUser, BiUserPlus, BiEdit, BiTrash, BiLogOut } from 'react-icons/bi';
import { toast } from 'react-toastify';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgilerini kontrol et
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/kullanici');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Kullanıcı listesi yüklenirken hata:', error);
      toast.error('Kullanıcı listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (user = null) => {
    setEditingUser(user);
    setFormData({
      username: user?.username || '',
      password: '',
      role: user?.role || 'user'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'user' });
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
        handleCloseModal();
        loadUsers();
      } else {
        const errorData = await response.json();
        toast.error('Hata: ' + (errorData.error || 'Bilinmeyen bir hata oluştu'));
      }
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error);
      toast.error('Kullanıcı kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kullanici/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kullanıcı silindi');
        loadUsers();
      } else {
        toast.error('Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <BiUser className="me-2" />
            Admin Panel - Kullanıcı Yönetimi
          </span>
          <div className="d-flex align-items-center">
            <Button variant="outline-light" size="sm" onClick={() => router.push('/dashboard')} className="me-2">
              Dashboard
            </Button>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <BiLogOut className="me-1" />
              Çıkış
            </Button>
          </div>
        </div>
      </nav>

      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Kullanıcı Yönetimi</h2>
                <p className="text-muted">Sistem kullanıcılarını yönetin</p>
              </div>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <BiUserPlus className="me-2" />
                Yeni Kullanıcı Ekle
              </Button>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Kullanıcı Listesi</h5>
              </Card.Header>
              <Card.Body>
                {users.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <BiUser className="me-2" />
                    Henüz kullanıcı bulunmuyor. Yeni bir kullanıcı ekleyerek başlayabilirsiniz.
                  </Alert>
                ) : (
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Kullanıcı Adı</th>
                        <th>Rol</th>
                        <th>Oluşturma Tarihi</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'N/A'}</td>
                          <td>
                            <Button variant="primary" size="sm" className="me-2" onClick={() => handleShowModal(user)}>
                              <BiEdit />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
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
      </Container>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Kullanıcı Adı</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Şifre</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                placeholder={editingUser ? 'Değiştirmek için yeni şifre girin' : 'Şifre girin'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Ekle')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
