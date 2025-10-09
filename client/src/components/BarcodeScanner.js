import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Badge } from 'react-bootstrap';
import { BiScan, BiCamera, BiCheckCircle } from 'react-icons/bi';

const BarcodeScanner = ({ onScan, disabled = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Component unmount olduğunda kamera stream'ini kapat
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraPermission('requesting');
      
      // Kamera erişimi iste
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Arka kamera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsScanning(true);
      setCameraPermission('granted');
      
      // Barkod tarama başlat
      startBarcodeDetection();
      
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      setCameraPermission('denied');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startBarcodeDetection = () => {
    const scanFrame = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Basit barkod tespiti (gerçek uygulamada ZXing veya benzeri kütüphane kullanılmalı)
        // Bu örnek sadece demo amaçlıdır
        const detectedCode = detectBarcode(imageData);
        
        if (detectedCode && detectedCode !== lastScannedCode) {
          setLastScannedCode(detectedCode);
          setScanHistory(prev => [detectedCode, ...prev.slice(0, 4)]);
          onScan(detectedCode);
        }
      }

      requestAnimationFrame(scanFrame);
    };

    scanFrame();
  };

  const detectBarcode = (imageData) => {
    // Bu basit bir demo implementasyonu
    // Gerçek uygulamada QuaggaJS, ZXing veya benzeri kütüphane kullanılmalı
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Basit pattern tespiti (demo amaçlı)
    // Gerçek barkod tespiti çok daha karmaşık algoritmalar gerektirir
    
    // Demo için rastgele barkod üret (gerçek uygulamada bu kısım kaldırılacak)
    if (Math.random() > 0.98) { // %2 şansla barkod tespit et
      return `BRK${Date.now().toString().slice(-8)}`;
    }
    
    return null;
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const code = e.target.value.trim();
      setLastScannedCode(code);
      setScanHistory(prev => [code, ...prev.slice(0, 4)]);
      onScan(code);
      e.target.value = '';
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <BiScan className="me-2" />
            Barkod Tarayıcı
          </h5>
          {isScanning && (
            <Badge bg="success" className="pulse">
              <BiCamera className="me-1" />
              Tarama Aktif
            </Badge>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {/* Kamera Görüntüsü */}
        {isScanning && (
          <div className="position-relative mb-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-100 rounded"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
            />
            <canvas
              ref={canvasRef}
              className="d-none"
            />
            
            {/* Tarama Alanı Overlay */}
            <div className="position-absolute top-50 start-50 translate-middle">
              <div 
                style={{
                  width: '200px',
                  height: '100px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(40, 167, 69, 0.1)'
                }}
              />
            </div>
          </div>
        )}

        {/* Kamera Kontrolleri */}
        <div className="text-center mb-3">
          {!isScanning ? (
            <Button
              variant="success"
              size="lg"
              onClick={startScanning}
              disabled={disabled || cameraPermission === 'denied'}
              className="me-2"
            >
              <BiCamera className="me-2" />
              Taramayı Başlat
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              onClick={stopScanning}
              className="me-2"
            >
              <BiCheckCircle className="me-2" />
              Taramayı Durdur
            </Button>
          )}
        </div>

        {/* Manuel Giriş */}
        <div className="mb-3">
          <label className="form-label">Manuel Barkod Girişi</label>
          <input
            type="text"
            className="form-control"
            placeholder="Barkodu manuel olarak girin ve Enter'a basın"
            onKeyPress={handleManualInput}
            disabled={disabled}
          />
        </div>

        {/* Kamera İzin Durumu */}
        {cameraPermission === 'denied' && (
          <Alert variant="warning">
            <strong>Kamera Erişimi Reddedildi!</strong><br />
            Barkod tarama için kamera iznine ihtiyaç vardır. 
            Tarayıcı ayarlarından kamera iznini etkinleştirin.
          </Alert>
        )}

        {cameraPermission === 'requesting' && (
          <Alert variant="info">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              Kamera erişimi isteniyor...
            </div>
          </Alert>
        )}

        {/* Son Tarama Geçmişi */}
        {scanHistory.length > 0 && (
          <div>
            <label className="form-label">Son Taramalar</label>
            <div className="d-flex flex-wrap gap-2">
              {scanHistory.map((code, index) => (
                <Badge
                  key={index}
                  bg={index === 0 ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => onScan(code)}
                >
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Son Taranan Kod */}
        {lastScannedCode && (
          <Alert variant="success" className="mt-3">
            <BiCheckCircle className="me-2" />
            <strong>Son Taranan:</strong> {lastScannedCode}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default BarcodeScanner;
