'use client'

import React, { useState } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { BiTransferAlt, BiCamera, BiSave, BiTrash, BiBox, BiPackage } from 'react-icons/bi';
import { toast } from 'react-toastify';

const KoliTransfer = () => {
  const [cikanKoli, setCikanKoli] = useState('');
  const [girenKoli, setGirenKoli] = useState('');
  const [cikanKoliUrunleri, setCikanKoliUrunleri] = useState([]);
  const [transferUrunleri, setTransferUrunleri] = useState([]);
  const [showUrunModal, setShowUrunModal] = useState(false);
  const [selectedUrun, setSelectedUrun] = useState(null);
  const [transferAdet, setTransferAdet] = useState(1);
  const [barkodInput, setBarkodInput] = useState('');
  const [girenKoliUrunleri, setGirenKoliUrunleri] = useState([]);
  
  // Çoklu koli transfer için yeni state'ler
  const [transferMode, setTransferMode] = useState('single'); // 'single' veya 'multiple'
  const [selectedKoliler, setSelectedKoliler] = useState([]);
  const [availableKoliler, setAvailableKoliler] = useState([]);
  const [cokluTransferUrunleri, setCokluTransferUrunleri] = useState([]);

  const loadKoliUrunleri = async (koliNo) => {
    try {
      const response = await fetch(`/api/koli-envanter`);
      const data = await response.json();
      
      // Belirtilen kolideki ürünleri filtrele
      const koliUrunleri = data.filter(item => 
        item.koli_no === koliNo && item.adet && item.adet > 0 && item.urun_barkod
      );
      
      return koliUrunleri;
    } catch (error) {
      console.error('Koli ürünleri yüklenirken hata:', error);
      return [];
    }
  };

  // Çoklu koli transfer için mevcut kolileri yükle
  const loadAvailableKoliler = async () => {
    try {
      const response = await fetch(`/api/koli-envanter`);
      const data = await response.json();
      
      // Ürünü olan kolileri al
      const koliler = [...new Set(data
        .filter(item => item.adet && item.adet > 0 && item.urun_barkod)
        .map(item => item.koli_no)
      )].sort();
      
      setAvailableKoliler(koliler);
      return koliler;
    } catch (error) {
      console.error('Koli listesi yüklenirken hata:', error);
      return [];
    }
  };

  // Çoklu koli seçimi için checkbox handler
  const handleKoliSec = (koliNo) => {
    setSelectedKoliler(prev => {
      if (prev.includes(koliNo)) {
        return prev.filter(k => k !== koliNo);
      } else {
        return [...prev, koliNo];
      }
    });
  };

  // Çoklu koli transfer için ürünleri yükle
  const loadCokluKoliUrunleri = async () => {
    if (selectedKoliler.length === 0) {
      toast.warning('Lütfen en az bir koli seçin');
      return;
    }

    try {
      const allUrunler = [];
      for (const koliNo of selectedKoliler) {
        const urunler = await loadKoliUrunleri(koliNo);
        allUrunler.push(...urunler.map(urun => ({ ...urun, kaynak_koli: koliNo })));
      }
      
      setCokluTransferUrunleri(allUrunler);
      toast.success(`${allUrunler.length} ürün bulundu (${selectedKoliler.length} koliden)`);
    } catch (error) {
      console.error('Çoklu koli ürünleri yüklenirken hata:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    }
  };

  const handleCikanKoliSec = async () => {
    if (!cikanKoli.trim()) {
      toast.warning('Lütfen çıkan koli numarasını girin');
      return;
    }

    const urunler = await loadKoliUrunleri(cikanKoli);
    if (urunler.length === 0) {
      toast.warning(`${cikanKoli} numaralı kolide ürün bulunamadı`);
      return;
    }

    setCikanKoliUrunleri(urunler);
    toast.success(`${urunler.length} ürün bulundu`);
  };

  const handleGirenKoliSec = async () => {
    if (!girenKoli.trim()) {
      toast.warning('Lütfen giren koli numarasını girin');
      return;
    }

    const urunler = await loadKoliUrunleri(girenKoli);
    setGirenKoliUrunleri(urunler);
    
    if (urunler.length === 0) {
      toast.info(`${girenKoli} numaralı koli boş`);
    } else {
      toast.success(`${urunler.length} ürün bulundu`);
    }
  };

  const handleUrunSec = (urun) => {
    setSelectedUrun(urun);
    setTransferAdet(1);
    setShowUrunModal(true);
  };

  const handleUrunTransfer = () => {
    if (!selectedUrun) return;

    const maxAdet = selectedUrun.adet;
    if (transferAdet > maxAdet) {
      toast.warning(`Maksimum ${maxAdet} adet transfer edilebilir`);
      return;
    }

    // Transfer listesine ekle
    const existingTransfer = transferUrunleri.find(u => u.barkod === selectedUrun.urun_barkod);
    
    if (existingTransfer) {
      const newTotal = existingTransfer.adet + transferAdet;
      if (newTotal > maxAdet) {
        toast.warning(`Toplam transfer adedi maksimum ${maxAdet} olabilir`);
        return;
      }
      setTransferUrunleri(transferUrunleri.map(u => 
        u.barkod === selectedUrun.urun_barkod 
          ? { ...u, adet: newTotal }
          : u
      ));
    } else {
      setTransferUrunleri([...transferUrunleri, {
        barkod: selectedUrun.urun_barkod,
        urun_adi: selectedUrun.urun_adi,
        adet: transferAdet
      }]);
    }

    // Çıkan koli ürünlerinden düş
    setCikanKoliUrunleri(cikanKoliUrunleri.map(u => 
      u.urun_barkod === selectedUrun.urun_barkod
        ? { ...u, adet: u.adet - transferAdet }
        : u
    ).filter(u => u.adet > 0));

    setShowUrunModal(false);
    setSelectedUrun(null);
    toast.success('Ürün transfer listesine eklendi');
  };

  const handleTransferTamamla = async () => {
    if (!girenKoli.trim()) {
      toast.warning('Lütfen giren koli numarasını girin');
      return;
    }

    if (transferUrunleri.length === 0) {
      toast.warning('Transfer edilecek ürün bulunmuyor');
      return;
    }

    try {
      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cikan_koli: cikanKoli,
          giren_koli: girenKoli,
          urunler: transferUrunleri
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Transfer başarıyla tamamlandı. Transfer No: ${result.transfer_no}`);
        
        // Formu temizle
        setCikanKoli('');
        setGirenKoli('');
        setCikanKoliUrunleri([]);
        setGirenKoliUrunleri([]);
        setTransferUrunleri([]);
      } else {
        toast.error('Transfer sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Transfer hatası:', error);
      toast.error('Transfer sırasında hata oluştu');
    }
  };

  // Çoklu koli transfer işlemi
  const handleCokluTransferTamamla = async () => {
    if (!girenKoli.trim()) {
      toast.warning('Lütfen hedef koli numarasını girin');
      return;
    }

    if (selectedKoliler.length === 0) {
      toast.warning('Lütfen en az bir kaynak koli seçin');
      return;
    }

    if (cokluTransferUrunleri.length === 0) {
      toast.warning('Transfer edilecek ürün bulunmuyor');
      return;
    }

    try {
      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cikan_koli: selectedKoliler, // Çoklu koli array'i
          giren_koli: girenKoli,
          urunler: cokluTransferUrunleri.map(urun => ({
            barkod: urun.urun_barkod,
            urun_adi: urun.urun_adi,
            adet: urun.adet,
            kaynak_koli: urun.kaynak_koli
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Çoklu transfer başarıyla tamamlandı. Transfer No: ${result.transfer_no}`);
        
        // Formu temizle
        setGirenKoli('');
        setSelectedKoliler([]);
        setCokluTransferUrunleri([]);
        setAvailableKoliler([]);
      } else {
        toast.error('Transfer sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Çoklu transfer hatası:', error);
      toast.error('Transfer sırasında hata oluştu');
    }
  };

  const handleTransferUrunSil = (index) => {
    const silinenUrun = transferUrunleri[index];
    
    // Çıkan koli ürünlerine geri ekle
    const existingUrun = cikanKoliUrunleri.find(u => u.urun_barkod === silinenUrun.barkod);
    
    if (existingUrun) {
      setCikanKoliUrunleri(cikanKoliUrunleri.map(u => 
        u.urun_barkod === silinenUrun.barkod
          ? { ...u, adet: u.adet + silinenUrun.adet }
          : u
      ));
    } else {
      // Eğer ürün çıkan koli listesinde yoksa yeniden ekle
      setCikanKoliUrunleri([...cikanKoliUrunleri, {
        urun_barkod: silinenUrun.barkod,
        urun_adi: silinenUrun.urun_adi,
        adet: silinenUrun.adet,
        koli_no: cikanKoli
      }]);
    }

    setTransferUrunleri(transferUrunleri.filter((_, i) => i !== index));
    toast.success('Ürün transfer listesinden kaldırıldı');
  };

  const handleBarkodGir = async () => {
    if (!barkodInput.trim()) {
      toast.warning('Lütfen ürün barkodunu girin');
      return;
    }

    if (!cikanKoli.trim()) {
      toast.warning('Önce çıkan koli numarasını girin');
      return;
    }

    // Çıkan koli ürünlerinde barkodu ara
    const bulunanUrun = cikanKoliUrunleri.find(u => u.urun_barkod === barkodInput.trim());
    
    if (!bulunanUrun) {
      toast.warning(`${barkodInput} barkodlu ürün bu kolide bulunamadı`);
      setBarkodInput('');
      return;
    }

    // Ürünü transfer listesine ekle
    const existingTransfer = transferUrunleri.find(u => u.barkod === bulunanUrun.urun_barkod);
    
    if (existingTransfer) {
      const newTotal = existingTransfer.adet + 1;
      if (newTotal > bulunanUrun.adet) {
        toast.warning(`Maksimum ${bulunanUrun.adet} adet transfer edilebilir`);
        setBarkodInput('');
        return;
      }
      setTransferUrunleri(transferUrunleri.map(u => 
        u.barkod === bulunanUrun.urun_barkod 
          ? { ...u, adet: newTotal }
          : u
      ));
    } else {
      setTransferUrunleri([...transferUrunleri, {
        barkod: bulunanUrun.urun_barkod,
        urun_adi: bulunanUrun.urun_adi,
        adet: 1
      }]);
    }

    // Çıkan koli ürünlerinden düş
    setCikanKoliUrunleri(cikanKoliUrunleri.map(u => 
      u.urun_barkod === bulunanUrun.urun_barkod
        ? { ...u, adet: u.adet - 1 }
        : u
    ).filter(u => u.adet > 0));

    setBarkodInput('');
    toast.success(`${bulunanUrun.urun_adi} transfer listesine eklendi`);
  };

  return (
    <div className="page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Koli Transfer</h1>
        <Badge bg="primary" className="fs-6">
          <BiTransferAlt className="me-1" />
          Yuvalama İşlemi
        </Badge>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Koli Transfer İşlemi:</strong> Düşük stoklu kolilerdeki ürünleri birleştirerek 
        boş koli sayısını artırın ve depo verimliliğini artırın.
      </Alert>

      {/* Transfer Modu Seçimi */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Transfer Modu Seçimi</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Check
                type="radio"
                id="single-transfer"
                name="transferMode"
                label="Tek Koli Transferi"
                checked={transferMode === 'single'}
                onChange={() => setTransferMode('single')}
                className="mb-2"
              />
              <small className="text-muted">Bir koliden diğer koliye transfer</small>
            </Col>
            <Col md={6}>
              <Form.Check
                type="radio"
                id="multiple-transfer"
                name="transferMode"
                label="Çoklu Koli Transferi"
                checked={transferMode === 'multiple'}
                onChange={() => {
                  setTransferMode('multiple');
                  loadAvailableKoliler();
                }}
                className="mb-2"
              />
              <small className="text-muted">Birden fazla koliden tek koliye transfer</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {/* Sol Taraf - Transfer Ayarları */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                Transfer Ayarları
                {transferMode === 'multiple' && (
                  <Badge bg="info" className="ms-2">Çoklu</Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {transferMode === 'single' ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Çıkan Koli Numarası</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        value={cikanKoli}
                        onChange={(e) => setCikanKoli(e.target.value)}
                        placeholder="Koli numarasını girin"
                      />
                      <Button 
                        variant="outline-primary" 
                        onClick={handleCikanKoliSec}
                        disabled={!cikanKoli.trim()}
                      >
                        <BiCamera />
                      </Button>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Giren Koli Numarası</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        value={girenKoli}
                        onChange={(e) => setGirenKoli(e.target.value)}
                        placeholder="Hedef koli numarasını girin"
                      />
                      <Button 
                        variant="outline-success" 
                        onClick={handleGirenKoliSec}
                        disabled={!girenKoli.trim()}
                      >
                        <BiCamera />
                      </Button>
                    </div>
                  </Form.Group>

                  <Alert variant="warning" className="small">
                    <strong>Dikkat:</strong> Çıkan koli boşalacak, giren koli dolacaktır.
                  </Alert>

                  <Button 
                    variant="success" 
                    className="w-100"
                    onClick={handleTransferTamamla}
                    disabled={!girenKoli || transferUrunleri.length === 0}
                  >
                    <BiSave className="me-1" />
                    Transferi Tamamla
                  </Button>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Kaynak Koliler (Çoklu Seçim)</Form.Label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px' }}>
                      {availableKoliler.length > 0 ? (
                        availableKoliler.map(koliNo => (
                          <Form.Check
                            key={koliNo}
                            type="checkbox"
                            id={`koli-${koliNo}`}
                            label={`Koli ${koliNo}`}
                            checked={selectedKoliler.includes(koliNo)}
                            onChange={() => handleKoliSec(koliNo)}
                            className="mb-2"
                          />
                        ))
                      ) : (
                        <div className="text-center text-muted py-2">
                          <small>Koli listesi yükleniyor...</small>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="w-100 mt-2"
                      onClick={loadCokluKoliUrunleri}
                      disabled={selectedKoliler.length === 0}
                    >
                      Ürünleri Yükle
                    </Button>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Hedef Koli Numarası</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        value={girenKoli}
                        onChange={(e) => setGirenKoli(e.target.value)}
                        placeholder="Hedef koli numarasını girin"
                      />
                      <Button 
                        variant="outline-success" 
                        onClick={handleGirenKoliSec}
                        disabled={!girenKoli.trim()}
                      >
                        <BiCamera />
                      </Button>
                    </div>
                  </Form.Group>

                  <Alert variant="info" className="small">
                    <strong>Çoklu Transfer:</strong> Seçilen kolilerden tüm ürünler hedef koliye taşınacak.
                  </Alert>

                  <Button 
                    variant="success" 
                    className="w-100"
                    onClick={handleCokluTransferTamamla}
                    disabled={!girenKoli || selectedKoliler.length === 0 || cokluTransferUrunleri.length === 0}
                  >
                    <BiSave className="me-1" />
                    Çoklu Transferi Tamamla
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Orta - Kaynak Koli Ürünleri */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                {transferMode === 'single' ? 'Çıkan Koli Ürünleri' : 'Kaynak Koli Ürünleri'}
                {transferMode === 'single' && cikanKoli && (
                  <Badge bg="danger" className="ms-2">{cikanKoli}</Badge>
                )}
                {transferMode === 'multiple' && selectedKoliler.length > 0 && (
                  <Badge bg="info" className="ms-2">{selectedKoliler.length} Koli</Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {transferMode === 'single' ? (
                cikanKoliUrunleri.length > 0 ? (
                  <Table responsive size="sm">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Ürün</th>
                        <th>Adet</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cikanKoliUrunleri.map((urun, index) => (
                        <tr key={index}>
                          <td>
                            <div>
                              <small className="text-muted">{urun.urun_barkod}</small><br />
                              {urun.urun_adi}
                            </div>
                          </td>
                          <td>
                            <Badge bg="warning">{urun.adet}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleUrunSec(urun)}
                            >
                              Transfer Et
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center text-muted py-4">
                    <BiBox size={48} className="mb-2" />
                    <p>Koli seçilmedi veya ürün bulunamadı</p>
                  </div>
                )
              ) : (
                cokluTransferUrunleri.length > 0 ? (
                  <Table responsive size="sm">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Ürün</th>
                        <th>Kaynak</th>
                        <th>Adet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cokluTransferUrunleri.map((urun, index) => (
                        <tr key={index}>
                          <td>
                            <div>
                              <small className="text-muted">{urun.urun_barkod}</small><br />
                              {urun.urun_adi}
                            </div>
                          </td>
                          <td>
                            <Badge bg="warning">{urun.kaynak_koli}</Badge>
                          </td>
                          <td>
                            <Badge bg="info">{urun.adet}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center text-muted py-4">
                    <BiBox size={48} className="mb-2" />
                    <p>Koli seçilmedi veya ürün bulunamadı</p>
                  </div>
                )
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sağ Taraf - Giren Koli Ürünleri */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                Giren Koli Ürünleri
                {girenKoli && (
                  <Badge bg="success" className="ms-2">{girenKoli}</Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {girenKoliUrunleri.length > 0 ? (
                <Table responsive size="sm">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {girenKoliUrunleri.map((urun, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <small className="text-muted">{urun.urun_barkod}</small><br />
                            {urun.urun_adi}
                          </div>
                        </td>
                        <td>
                          <Badge bg="success">{urun.adet}</Badge>
                        </td>
                        <td>
                          <Badge bg="info">Mevcut</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4">
                  <BiBox size={48} className="mb-2" />
                  <p>Koli seçilmedi veya koli boş</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Barkod Girişi ve Transfer Listesi */}
        <Col lg={12}>
          <Row>
            {/* Barkod Girişi */}
            <Col lg={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <BiCamera className="me-2" />
                    Ürün Barkodu Girişi
                    {transferMode === 'multiple' && (
                      <Badge bg="secondary" className="ms-2">Çoklu Mod</Badge>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {transferMode === 'single' ? (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Transfer Edilecek Ürün Barkodu</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type="text"
                            value={barkodInput}
                            onChange={(e) => setBarkodInput(e.target.value)}
                            placeholder="Barkodu okutun veya yazın"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleBarkodGir();
                              }
                            }}
                          />
                          <Button 
                            variant="primary" 
                            onClick={handleBarkodGir}
                            disabled={!barkodInput.trim() || !cikanKoli.trim()}
                          >
                            <BiCamera />
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Barkodu okutun veya manuel girin, Enter tuşuna basın
                        </Form.Text>
                      </Form.Group>

                      <Alert variant="info" className="small">
                        <strong>Nasıl Kullanılır:</strong><br />
                        1. Çıkan koli numarasını girin<br />
                        2. Bu alana ürün barkodunu okutun<br />
                        3. Ürün otomatik olarak transfer listesine eklenir
                      </Alert>
                    </>
                  ) : (
                    <Alert variant="info" className="small">
                      <strong>Çoklu Koli Transfer Modu:</strong><br />
                      Bu modda barkod girişi gerekmez. Seçilen kolilerdeki tüm ürünler otomatik olarak hedef koliye transfer edilir.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Transfer Listesi */}
            <Col lg={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    {transferMode === 'single' ? 'Transfer Listesi' : 'Çoklu Transfer Özeti'}
                    {girenKoli && (
                      <Badge bg="success" className="ms-2">{girenKoli}</Badge>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {transferMode === 'single' ? (
                    transferUrunleri.length > 0 ? (
                      <Table responsive size="sm">
                        <thead className="sticky-top bg-light">
                          <tr>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transferUrunleri.map((urun, index) => (
                            <tr key={index}>
                              <td>
                                <div>
                                  <small className="text-muted">{urun.barkod}</small><br />
                                  {urun.urun_adi}
                                </div>
                              </td>
                              <td>
                                <Badge bg="success">{urun.adet}</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleTransferUrunSil(index)}
                                >
                                  <BiTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <BiPackage size={48} className="mb-2" />
                        <p>Henüz transfer ürünü yok</p>
                      </div>
                    )
                  ) : (
                    cokluTransferUrunleri.length > 0 ? (
                      <div>
                        <div className="mb-3">
                          <h6>Transfer Özeti</h6>
                          <p className="mb-1">
                            <strong>Kaynak Koliler:</strong> {selectedKoliler.join(', ')}
                          </p>
                          <p className="mb-1">
                            <strong>Hedef Koli:</strong> {girenKoli}
                          </p>
                          <p className="mb-1">
                            <strong>Toplam Ürün:</strong> {cokluTransferUrunleri.length} çeşit
                          </p>
                          <p className="mb-0">
                            <strong>Toplam Adet:</strong> {cokluTransferUrunleri.reduce((sum, urun) => sum + urun.adet, 0)}
                          </p>
                        </div>
                        <Alert variant="success" className="small">
                          <strong>Hazır:</strong> Tüm ürünler hedef koliye transfer edilecek.
                        </Alert>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <BiPackage size={48} className="mb-2" />
                        <p>Koli seçilmedi veya ürün bulunamadı</p>
                      </div>
                    )
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Ürün Transfer Modal */}
      <Modal show={showUrunModal} onHide={() => setShowUrunModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ürün Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUrun && (
            <>
              <div className="mb-3">
                <strong>Ürün:</strong> {selectedUrun.urun_adi}<br />
                <small className="text-muted">Barkod: {selectedUrun.urun_barkod}</small><br />
                <small className="text-muted">Mevcut Adet: {selectedUrun.adet}</small>
              </div>
              
              <Form.Group>
                <Form.Label>Transfer Adedi</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={selectedUrun.adet}
                  value={transferAdet}
                  onChange={(e) => setTransferAdet(parseInt(e.target.value) || 1)}
                />
                <Form.Text className="text-muted">
                  Maksimum {selectedUrun.adet} adet transfer edilebilir
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUrunModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleUrunTransfer}>
            Transfer Et
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KoliTransfer;