'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, InputGroup } from 'react-bootstrap';
import { BiRightArrow, BiBox, BiSearch, BiCheck, BiCamera, BiX, BiTrash } from 'react-icons/bi';
import { toast } from 'react-toastify';

const KoliTransfer = () => {
  const [cikanKoliNo, setCikanKoliNo] = useState('');
  const [girenKoliNo, setGirenKoliNo] = useState('');
  const [cikanKoliUrunleri, setCikanKoliUrunleri] = useState([]);
  const [girenKoliUrunleri, setGirenKoliUrunleri] = useState([]);
  const [transferListesi, setTransferListesi] = useState([]);
  const [barkodInput, setBarkodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Koli seçimi, 2: Ürün transferi
  const [barkodBuffer, setBarkodBuffer] = useState('');
  const [lastInputTime, setLastInputTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const [cikanKoliLastInputTime, setCikanKoliLastInputTime] = useState(0);
  const [girenKoliLastInputTime, setGirenKoliLastInputTime] = useState(0);
  const [isCikanKoliScanning, setIsCikanKoliScanning] = useState(false);
  const [isGirenKoliScanning, setIsGirenKoliScanning] = useState(false);
  
  // Çoklu koli transfer sistemi
  const [transferMode, setTransferMode] = useState('single'); // 'single' veya 'multiple'
  const [multipleCikanKoliler, setMultipleCikanKoliler] = useState([]);
  const [multipleGirenKoli, setMultipleGirenKoli] = useState('');
  const [multipleGirenKoliUrunleri, setMultipleGirenKoliUrunleri] = useState([]);
  const [multipleTransferListesi, setMultipleTransferListesi] = useState([]);
  
  // Input değerleri için ek state'ler
  const [cikanKoliInput, setCikanKoliInput] = useState('');
  const [girenKoliInput, setGirenKoliInput] = useState('');
  const [multipleCikanKoliInput, setMultipleCikanKoliInput] = useState('');
  const [multipleGirenKoliInput, setMultipleGirenKoliInput] = useState('');
  
  // Ref'ler otomatik algılama için
  const cikanKoliTimeoutRef = useRef(null);
  const girenKoliTimeoutRef = useRef(null);
  const barkodTimeoutRef = useRef(null);

  // Transfer geçmişini yükle
  useEffect(() => {
    const loadTransferHistory = async () => {
      try {
        const response = await fetch('/api/koli-transfer');
        if (response.ok) {
          const history = await response.json();
          // Son 10 günlük verileri filtrele
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          
          const recentHistory = history.filter(transfer => 
            new Date(transfer.timestamp) >= tenDaysAgo
          );
          setTransferHistory(recentHistory);
        }
      } catch (error) {
        console.error('Transfer geçmişi yüklenirken hata:', error);
      }
    };

    loadTransferHistory();
  }, []);

  // Cleanup timeout'lar
  useEffect(() => {
    return () => {
      if (cikanKoliTimeoutRef.current) {
        clearTimeout(cikanKoliTimeoutRef.current);
      }
      if (girenKoliTimeoutRef.current) {
        clearTimeout(girenKoliTimeoutRef.current);
      }
      if (barkodTimeoutRef.current) {
        clearTimeout(barkodTimeoutRef.current);
      }
    };
  }, []);

  // Çıkan koli numarası otomatik algılama
  const handleCikanKoliInput = (e) => {
    const value = e.target.value || '';
    const currentTime = Date.now();
    const timeDiff = currentTime - cikanKoliLastInputTime;
    
    setCikanKoliInput(value);
    setCikanKoliNo(value);
    
    // Hızlı giriş algılama (barkod okuyucu)
    if (timeDiff < 50 && value.length > 0) {
      setIsCikanKoliScanning(true);
    } else if (timeDiff > 200) {
      setIsCikanKoliScanning(false);
    }
    
    setCikanKoliLastInputTime(currentTime);
    
    // Önceki timeout'u temizle
    if (cikanKoliTimeoutRef.current) {
      clearTimeout(cikanKoliTimeoutRef.current);
    }
    
    // Koli numarası algılama: 3+ karakter
    if (value.length >= 3) {
      cikanKoliTimeoutRef.current = setTimeout(() => {
        console.log('Çıkan koli otomatik algılandı:', value);
        handleCikanKoliOkut();
      }, 500); // 500ms bekle
    }
  };

  // Giren koli numarası otomatik algılama
  const handleGirenKoliInput = (e) => {
    const value = e.target.value || '';
    const currentTime = Date.now();
    const timeDiff = currentTime - girenKoliLastInputTime;
    
    setGirenKoliInput(value);
    setGirenKoliNo(value);
    
    // Hızlı giriş algılama (barkod okuyucu)
    if (timeDiff < 50 && value.length > 0) {
      setIsGirenKoliScanning(true);
    } else if (timeDiff > 200) {
      setIsGirenKoliScanning(false);
    }
    
    setGirenKoliLastInputTime(currentTime);
    
    // Önceki timeout'u temizle
    if (girenKoliTimeoutRef.current) {
      clearTimeout(girenKoliTimeoutRef.current);
    }
    
    // Koli numarası algılama: 3+ karakter
    if (value.length >= 3) {
      girenKoliTimeoutRef.current = setTimeout(() => {
        console.log('Giren koli otomatik algılandı:', value);
        handleGirenKoliOkut();
      }, 500); // 500ms bekle
    }
  };

  // Çıkan koli numarası okutulduğunda
  const handleCikanKoliOkut = async () => {
    if (!cikanKoliNo.trim()) {
      toast.warning('Çıkan koli numarasını girin');
      return;
    }

    try {
      // Önce koli-liste API'sini kullanarak koli bilgilerini al
      const koliResponse = await fetch('/api/koli-liste');
      if (koliResponse.ok) {
        const koliler = await koliResponse.json();
        const koli = koliler.find(k => k.koli_no === cikanKoliNo);
        
        if (!koli) {
          toast.warning(`Koli ${cikanKoliNo} bulunamadı`);
          return;
        }
        
        console.log('Bulunan koli:', koli);
        
        // Şimdi ürün API'sini kullanarak bu koliye ait ürünleri al
        const urunResponse = await fetch('/api/urun');
        if (urunResponse.ok) {
          const urunler = await urunResponse.json();
          console.log('Tüm ürünler:', urunler);
          console.log('Aranan koli numarası:', cikanKoliNo);
          
          // Sadece stoklu ürünleri yükle (stok_miktari > 0)
          const koliUrunleri = urunler.filter(urun => 
            urun.birim === cikanKoliNo && urun.stok_miktari > 0
          );
          console.log('Bulunan stoklu koli ürünleri:', koliUrunleri);
          
          if (koliUrunleri.length === 0) {
            toast.warning(`Koli ${cikanKoliNo} bulunamadı veya stoklu ürün yok`);
            return;
          }

          setCikanKoliUrunleri(koliUrunleri);
          toast.success(`Koli ${cikanKoliNo} yüklendi - ${koliUrunleri.length} stoklu ürün bulundu`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    } catch (error) {
      console.error('Çıkan koli yüklenirken hata:', error);
      toast.error('Çıkan koli yüklenirken hata oluştu');
    }
  };

  // Giren koli numarası okutulduğunda
  const handleGirenKoliOkut = async () => {
    if (!girenKoliNo.trim()) {
      toast.warning('Giren koli numarasını girin');
      return;
    }

    if (girenKoliNo === cikanKoliNo) {
      toast.warning('Çıkan ve giren koli aynı olamaz');
      return;
    }

    try {
      // Önce koli-liste API'sini kullanarak koli bilgilerini al
      const koliResponse = await fetch('/api/koli-liste');
      if (koliResponse.ok) {
        const koliler = await koliResponse.json();
        const koli = koliler.find(k => k.koli_no === girenKoliNo);
        
        if (!koli) {
          toast.warning(`Koli ${girenKoliNo} bulunamadı`);
          return;
        }
        
        console.log('Bulunan giren koli:', koli);
        
        // Şimdi ürün API'sini kullanarak bu koliye ait ürünleri al
        const urunResponse = await fetch('/api/urun');
        if (urunResponse.ok) {
          const urunler = await urunResponse.json();
          // Sadece stoklu ürünleri yükle (stok_miktari > 0)
          const koliUrunleri = urunler.filter(urun => 
            urun.birim === girenKoliNo && urun.stok_miktari > 0
          );
          
          console.log('=== GİREN KOLİ ÜRÜNLERİ YÜKLENDİ ===');
          console.log('Giren Koli:', girenKoliNo);
          console.log('Toplam ürün sayısı:', koliUrunleri.length);
          console.log('İlk 3 ürün:', koliUrunleri.slice(0, 3).map(u => ({ adi: u.urun_adi, stok: u.stok_miktari, barkod: u.barkod })));
          
          setGirenKoliUrunleri(koliUrunleri);
          setStep(2);
          toast.success(`Koli ${girenKoliNo} yüklendi - ${koliUrunleri.length} stoklu ürün bulundu`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    } catch (error) {
      console.error('Giren koli yüklenirken hata:', error);
      toast.error('Giren koli yüklenirken hata oluştu');
    }
  };

  // Otomatik barkod algılama
  const handleBarkodInput = (e) => {
    const value = e.target.value || '';
    const currentTime = Date.now();
    const timeDiff = currentTime - lastInputTime;
    
    setBarkodInput(value);
    
    // Hızlı giriş algılama (barkod okuyucu)
    if (timeDiff < 50 && value.length > 0) {
      setIsScanning(true);
    } else if (timeDiff > 200) {
      setIsScanning(false);
    }
    
    setLastInputTime(currentTime);
    
    // Önceki timeout'u temizle
    if (barkodTimeoutRef.current) {
      clearTimeout(barkodTimeoutRef.current);
    }
    
    // Otomatik algılama: 8+ karakter girildiğinde (her durumda)
    if (value.length >= 8) {
      // 100ms sonra otomatik olarak transfer et
      barkodTimeoutRef.current = setTimeout(() => {
        console.log('Otomatik barkod algılandı:', value);
        handleBarkodOkut(value);
      }, 100);
    }
  };

  // Enter tuşu ile manuel arama
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarkodOkut();
    }
  };

  // Ürün barkodu okutulduğunda
  const handleBarkodOkut = async (barkodValue = null) => {
    // Barkod değerini string'e çevir
    let barkod = barkodValue || barkodInput.trim();
    
    console.log('=== BARKOD DÖNÜŞÜM DEBUG ===');
    console.log('Orijinal barkod:', barkod);
    console.log('Barkod tipi:', typeof barkod);
    
    // Eğer barkod bir React event ise, input değerini al
    if (barkod && typeof barkod === 'object' && (barkod.target || barkod._reactName)) {
      console.log('React event tespit edildi, input değeri alınıyor...');
      // React event ise, barkodInput state'ini kullan
      barkod = barkodInput.trim();
    }
    
    // Eğer barkod bir obje ise, string'e çevir
    if (typeof barkod === 'object' && barkod !== null) {
      console.log('Obje tespit edildi, string\'e çevriliyor...');
      // Circular structure hatası önlemek için sadece string'e çevir
      barkod = String(barkod);
    }
    
    // String'e çevir ve trim yap
    barkod = String(barkod).trim();
    
    console.log('Dönüştürülmüş barkod:', barkod);
    console.log('Dönüştürülmüş tip:', typeof barkod);
    console.log('=============================');
    
    if (!barkod || barkod === 'null' || barkod === 'undefined') {
      toast.warning('Ürün barkodunu girin');
      return;
    }

    console.log('Aranan barkod:', barkod);
    console.log('Barkod tipi:', typeof barkod);
    console.log('Transfer modu:', transferMode);
    
    // Transfer moduna göre ürün listesini belirle
    let urunListesi = [];
    let hedefKoliNo = '';
    
    if (transferMode === 'single') {
      urunListesi = cikanKoliUrunleri;
      hedefKoliNo = girenKoliNo;
      console.log('Tekli transfer modu - Çıkan koli ürünleri:', cikanKoliUrunleri);
      console.log('Çıkan koli numarası:', cikanKoliNo);
    } else {
      // Çoklu transfer modu - tüm çıkan kolilerin ürünlerini birleştir
      urunListesi = multipleCikanKoliler.flatMap(koli => koli.urunler);
      hedefKoliNo = multipleGirenKoli;
      console.log('Çoklu transfer modu - Toplam ürün sayısı:', urunListesi.length);
      console.log('Çıkan koli sayısı:', multipleCikanKoliler.length);
    }

    // Barkod karşılaştırmasını daha esnek yap
    console.log('=== BARKOD KARŞILAŞTIRMA DEBUG ===');
    console.log('Aranan barkod:', barkod);
    console.log('Ürün listesi sayısı:', urunListesi.length);
    console.log('İlk 3 ürünün barkodları:', urunListesi.slice(0, 3).map(u => u.barkod));
    
    const urun = urunListesi.find(u => {
      const dbBarkod = u.barkod?.toString().trim();
      const inputBarkod = barkod?.toString().trim();
      
      console.log(`Karşılaştırma: "${dbBarkod}" === "${inputBarkod}"`);
      
      // Tam eşleşme
      if (dbBarkod === inputBarkod) {
        console.log('✅ Tam eşleşme bulundu!');
        return true;
      }
      
      // Sadece sayısal karakterlerle karşılaştır
      const dbNumeric = dbBarkod?.replace(/\D/g, '');
      const inputNumeric = inputBarkod?.replace(/\D/g, '');
      if (dbNumeric === inputNumeric && dbNumeric) {
        console.log('✅ Sayısal eşleşme bulundu!');
        return true;
      }
      
      // Büyük/küçük harf duyarsız karşılaştırma
      if (dbBarkod?.toLowerCase() === inputBarkod?.toLowerCase()) {
        console.log('✅ Büyük/küçük harf eşleşme bulundu!');
        return true;
      }
      
      return false;
    });
    
    console.log('Bulunan ürün:', urun);
    console.log('================================');
    
    if (!urun) {
      // Daha detaylı hata mesajı
      const availableBarkods = urunListesi.map(u => u.barkod);
      console.log('=== BARKOD BULUNAMADI DEBUG ===');
      console.log('Aranan barkod:', barkod);
      console.log('Aranan barkod (trimmed):', barkod?.toString().trim());
      console.log('Aranan barkod (numeric):', barkod?.toString().replace(/\D/g, ''));
      console.log('Mevcut barkodlar:', availableBarkods);
      console.log('Mevcut barkodlar (trimmed):', availableBarkods.map(b => b?.toString().trim()));
      console.log('Mevcut barkodlar (numeric):', availableBarkods.map(b => b?.toString().replace(/\D/g, '')));
      console.log('Ürün listesi detay:', urunListesi.map(u => ({
        barkod: u.barkod,
        urun_adi: u.urun_adi,
        stok_miktari: u.stok_miktari
      })));
      console.log('================================');
      
      const koliInfo = transferMode === 'single' ? cikanKoliNo : `${multipleCikanKoliler.length} koli`;
      toast.warning(`Bu barkod (${barkod}) çıkan kolide (${koliInfo}) bulunamadı. Mevcut barkodlar: ${availableBarkods.slice(0, 5).join(', ')}${availableBarkods.length > 5 ? '...' : ''}`);
      setBarkodInput('');
      setBarkodBuffer('');
      return;
    }

    // Transfer listesine ekle
    const transferItem = {
      id: Date.now(),
      urun_barkod: urun.barkod, // API'nin beklediği alan adı
      barkod: urun.barkod,
      urun_adi: urun.urun_adi,
      adet: 1, // API'nin beklediği alan - SADECE 1 ADET
      stok_miktari: urun.stok_miktari,
      koli_no: hedefKoliNo
    };

    if (transferMode === 'single') {
      // Tekli transfer modu
      setTransferListesi([...transferListesi, transferItem]);
      
      // Çıkan koli listesinde stok miktarını 1 azalt ve stok 0 olanları filtrele
      setCikanKoliUrunleri(cikanKoliUrunleri.map(u => 
        u.barkod === barkod 
          ? { ...u, stok_miktari: Math.max(0, u.stok_miktari - 1) }
          : u
      ).filter(u => u.stok_miktari > 0)); // Stok 0 olan ürünleri kaldır
      
      // Giren koli listesine 1 adet ekle
      const existingGirenUrun = girenKoliUrunleri.find(u => u.barkod === barkod);
      if (existingGirenUrun) {
        // Eğer giren kolide bu ürün varsa, stok miktarını 1 artır
        setGirenKoliUrunleri(girenKoliUrunleri.map(u => 
          u.barkod === barkod 
            ? { ...u, stok_miktari: u.stok_miktari + 1 }
            : u
        ));
      } else {
        // Eğer giren kolide bu ürün yoksa, 1 adet ekle
        setGirenKoliUrunleri([...girenKoliUrunleri, { ...urun, birim: girenKoliNo, stok_miktari: 1 }]);
      }
      
      // Anında gerçek transfer gerçekleştir
      performInstantTransfer([transferItem], cikanKoliNo, girenKoliNo, 'single');
    } else {
      // Çoklu transfer modu
      setMultipleTransferListesi([...multipleTransferListesi, transferItem]);
      
      // Çıkan koli listesinde stok miktarını 1 azalt ve stok 0 olanları filtrele
      setMultipleCikanKoliler(prev => 
        prev.map(koli => {
          const updatedUrunler = koli.urunler.map(u => 
            u.barkod === barkod 
              ? { ...u, stok_miktari: Math.max(0, u.stok_miktari - 1) }
              : u
          ).filter(u => u.stok_miktari > 0); // Stok 0 olan ürünleri kaldır
          
          return {
            ...koli,
            urunler: updatedUrunler,
            urunSayisi: updatedUrunler.length,
            toplamAdet: updatedUrunler.reduce((toplam, u) => toplam + (u.stok_miktari || 0), 0)
          };
        })
      );
      
      // Giren koli listesine 1 adet ekle
      const existingGirenUrun = multipleGirenKoliUrunleri.find(u => u.barkod === barkod);
      if (existingGirenUrun) {
        // Eğer giren kolide bu ürün varsa, stok miktarını 1 artır
        setMultipleGirenKoliUrunleri(multipleGirenKoliUrunleri.map(u => 
          u.barkod === barkod 
            ? { ...u, stok_miktari: u.stok_miktari + 1 }
            : u
        ));
      } else {
        // Eğer giren kolide bu ürün yoksa, 1 adet ekle
        setMultipleGirenKoliUrunleri([...multipleGirenKoliUrunleri, { ...urun, birim: multipleGirenKoli, stok_miktari: 1 }]);
      }
      
      // Çoklu transfer modunda anında transfer yapma, sadece listeye ekle
      // Gerçek transfer "4 koli 1 transfer" butonu ile yapılacak
    }
    
    setBarkodInput('');
    setBarkodBuffer('');
    if (transferMode === 'single') {
      toast.success(`${urun.urun_adi} transfer edildi ve listeye eklendi`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.success(`${urun.urun_adi} transfer listesine eklendi`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Anında transfer gerçekleştir
  const performInstantTransfer = async (transferItems, cikanKoli, girenKoli, mode) => {
    try {
      console.log('=== PERFORM INSTANT TRANSFER DEBUG ===');
      console.log('Transfer Items:', transferItems);
      console.log('Çıkan Koli:', cikanKoli);
      console.log('Giren Koli:', girenKoli);
      console.log('Mode:', mode);
      
      const requestData = {
        cikan_koli: cikanKoli,
        giren_koli: girenKoli,
        transfer_listesi: transferItems,
        transfer_mode: mode
      };
      
      console.log('Request Data:', requestData);
      
      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        console.log('Anında transfer başarılı:', transferItems);
        // Transfer geçmişini yenile
        const historyResponse = await fetch('/api/koli-transfer');
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          const recentHistory = history.filter(transfer => 
            new Date(transfer.timestamp) >= tenDaysAgo
          );
          setTransferHistory(recentHistory);
        }
      } else {
        console.error('Anında transfer hatası:', response.statusText);
        toast.error('Transfer sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Anında transfer hatası:', error);
      toast.error('Transfer sırasında hata oluştu');
    }
  };

  // Transfer listesinden ürün sil
  const handleTransferItemSil = (itemId) => {
    const silinecekItem = transferListesi.find(item => item.id === itemId);
    if (!silinecekItem) return;

    // Transfer listesinden çıkar
    setTransferListesi(transferListesi.filter(item => item.id !== itemId));
    
    // Çıkan koli listesinde stok miktarını 1 artır (geri yükle)
    const existingCikanUrun = cikanKoliUrunleri.find(u => u.barkod === silinecekItem.barkod);
    if (existingCikanUrun) {
      // Eğer çıkan kolide bu ürün varsa, stok miktarını 1 artır
      setCikanKoliUrunleri(cikanKoliUrunleri.map(u => 
        u.barkod === silinecekItem.barkod 
          ? { ...u, stok_miktari: u.stok_miktari + 1 }
          : u
      ));
    } else {
      // Eğer çıkan kolide bu ürün yoksa, 1 adet ekle
      setCikanKoliUrunleri([...cikanKoliUrunleri, {
        barkod: silinecekItem.barkod,
        urun_adi: silinecekItem.urun_adi,
        stok_miktari: 1, // Sadece 1 adet geri yükle
        birim: cikanKoliNo
      }]);
    }
    
    // Giren koli listesinde stok miktarını 1 azalt
    const existingGirenUrun = girenKoliUrunleri.find(u => u.barkod === silinecekItem.barkod);
    if (existingGirenUrun) {
      if (existingGirenUrun.stok_miktari > 1) {
        // Eğer giren kolide 1'den fazla stok varsa, 1 azalt
        setGirenKoliUrunleri(girenKoliUrunleri.map(u => 
          u.barkod === silinecekItem.barkod 
            ? { ...u, stok_miktari: u.stok_miktari - 1 }
            : u
        ));
      } else {
        // Eğer giren kolide 1 stok varsa, ürünü tamamen çıkar
        setGirenKoliUrunleri(girenKoliUrunleri.filter(u => u.barkod !== silinecekItem.barkod));
      }
    }
    
    toast.success(`${silinecekItem.urun_adi} transfer listesinden çıkarıldı ve çıkan koliye geri yüklendi`);
  };

  // Transferi tamamla
  const handleTransferTamamla = async () => {
    if (transferListesi.length === 0) {
      toast.warning('Transfer edilecek ürün bulunamadı');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        cikan_koli: cikanKoliNo,
        giren_koli: girenKoliNo,
        transfer_listesi: transferListesi
      };
      
      console.log('=== TRANSFER REQUEST DEBUG ===');
      console.log('Çıkan koli:', cikanKoliNo);
      console.log('Giren koli:', girenKoliNo);
      console.log('Transfer listesi:', transferListesi);
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success(`${transferListesi.length} ürün başarıyla transfer edildi`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Transfer geçmişini yeniden yükle
        const historyResponse = await fetch('/api/koli-transfer');
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          
          const recentHistory = history.filter(transfer => 
            new Date(transfer.timestamp) >= tenDaysAgo
          );
          setTransferHistory(recentHistory);
        }

        // Koli bilgilerini yenile (stok güncellemeleri için)
        console.log('Koli bilgileri yenileniyor...');
        // Çıkan koli ürünlerini yenile
        if (cikanKoliNo) {
          await handleCikanKoliOkut();
        }
        // Giren koli ürünlerini yenile
        if (girenKoliNo) {
          await handleGirenKoliOkut();
        }
        
        // Sistemi sıfırla
        setCikanKoliNo('');
        setGirenKoliNo('');
        setCikanKoliInput('');
        setGirenKoliInput('');
        setCikanKoliUrunleri([]);
        setGirenKoliUrunleri([]);
        setTransferListesi([]);
        setStep(1);
      } else {
        const errorData = await response.json();
        console.error('Transfer hatası:', errorData);
        toast.error(`Transfer sırasında hata oluştu: ${errorData.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Transfer hatası:', error);
      toast.error('Transfer sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Transferi iptal et
  const handleTransferIptal = () => {
    setCikanKoliNo('');
    setGirenKoliNo('');
    setCikanKoliInput('');
    setGirenKoliInput('');
    setCikanKoliUrunleri([]);
    setGirenKoliUrunleri([]);
    setTransferListesi([]);
    setStep(1);
    toast.info('Transfer iptal edildi');
  };

  // Çoklu koli transfer fonksiyonları
  const handleMultipleCikanKoliEkle = async (koliNo) => {
    if (!koliNo.trim()) return;
    
    // Zaten ekli mi kontrol et
    if (multipleCikanKoliler.some(koli => koli.koliNo === koliNo)) {
      toast.warning('Bu koli zaten ekli');
      return;
    }

    try {
      // Koli bilgilerini al
      const koliResponse = await fetch('/api/koli-liste');
      if (koliResponse.ok) {
        const koliler = await koliResponse.json();
        const koli = koliler.find(k => k.koli_no === koliNo);
        
        if (!koli) {
          toast.error('Koli bulunamadı');
          return;
        }

        // Koli ürünlerini al
        const urunResponse = await fetch('/api/urun');
        if (urunResponse.ok) {
          const urunler = await urunResponse.json();
          const koliUrunleri = urunler.filter(urun => urun.birim === koliNo);
          
          const yeniKoli = {
            koliNo: koliNo,
            koliAdi: koli.koli_adi || koliNo,
            urunler: koliUrunleri,
            urunSayisi: koliUrunleri.length,
            toplamAdet: koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)
          };
          
          setMultipleCikanKoliler(prev => [...prev, yeniKoli]);
          toast.success(`Koli ${koliNo} eklendi`);
        }
      }
    } catch (error) {
      console.error('Koli ekleme hatası:', error);
      toast.error('Koli eklenirken hata oluştu');
    }
  };

  const handleMultipleCikanKoliCikar = (koliNo) => {
    setMultipleCikanKoliler(prev => prev.filter(koli => koli.koliNo !== koliNo));
    toast.info(`Koli ${koliNo} çıkarıldı`);
  };

  const handleMultipleGirenKoliOkut = async (koliNo) => {
    if (!koliNo.trim()) return;
    
    setMultipleGirenKoli(koliNo);
    
    try {
      // Koli bilgilerini al
      const koliResponse = await fetch('/api/koli-liste');
      if (koliResponse.ok) {
        const koliler = await koliResponse.json();
        const koli = koliler.find(k => k.koli_no === koliNo);
        
        if (!koli) {
          toast.error('Koli bulunamadı');
          return;
        }

        // Koli ürünlerini al
        const urunResponse = await fetch('/api/urun');
        if (urunResponse.ok) {
          const urunler = await urunResponse.json();
          // Sadece stoklu ürünleri yükle (stok_miktari > 0)
          const koliUrunleri = urunler.filter(urun => 
            urun.birim === koliNo && urun.stok_miktari > 0
          );
          
          setMultipleGirenKoliUrunleri(koliUrunleri);
          toast.success(`Koli ${koliNo} yüklendi - ${koliUrunleri.length} stoklu ürün bulundu`);
        }
      }
    } catch (error) {
      console.error('Koli yükleme hatası:', error);
      toast.error('Koli yüklenirken hata oluştu');
    }
  };

  const handleMultipleTransferTamamla = async () => {
    if (multipleTransferListesi.length === 0) {
      toast.warning('Transfer edilecek ürün bulunamadı');
      return;
    }

    if (multipleCikanKoliler.length === 0) {
      toast.warning('Çıkan koli seçilmedi');
      return;
    }

    if (!multipleGirenKoli) {
      toast.warning('Giren koli seçilmedi');
      return;
    }

    setLoading(true);
    try {
      // Transfer listesini API'nin beklediği formata çevir
      const apiTransferListesi = multipleTransferListesi.map(item => ({
        urun_barkod: item.urun_barkod || item.barkod,
        adet: item.adet || 1
      }));

      console.log('=== ÇOKLU TRANSFER DEBUG ===');
      console.log('Çıkan koliler:', multipleCikanKoliler.map(koli => koli.koliNo));
      console.log('Giren koli:', multipleGirenKoli);
      console.log('Transfer listesi:', apiTransferListesi);

      const response = await fetch('/api/koli-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cikan_koli: multipleCikanKoliler.map(koli => koli.koliNo),
          giren_koli: multipleGirenKoli,
          transfer_listesi: apiTransferListesi,
          transfer_mode: 'multiple'
        }),
      });

      if (response.ok) {
        toast.success('Çoklu koli transferi başarıyla tamamlandı');
        
        // Transfer geçmişini yenile
        const historyResponse = await fetch('/api/koli-transfer');
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          const recentHistory = history.filter(transfer => 
            new Date(transfer.timestamp) >= tenDaysAgo
          );
          setTransferHistory(recentHistory);
        }
        
        // Formu temizle
        setMultipleCikanKoliler([]);
        setMultipleGirenKoli('');
        setMultipleGirenKoliInput('');
        setMultipleCikanKoliInput('');
        setMultipleGirenKoliUrunleri([]);
        setMultipleTransferListesi([]);
        setTransferMode('single');
      } else {
        const errorData = await response.json();
        console.error('Transfer hatası:', errorData);
        toast.error(`Transfer sırasında hata: ${errorData.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Transfer hatası:', error);
      toast.error('Transfer sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded p-2 me-3">
            <BiRightArrow size={24} />
          </div>
          <div>
            <h1 className="h3 mb-0 text-primary">Koli Transfer</h1>
            <p className="text-muted mb-0">Koliler arası ürün transferi</p>
          </div>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={handleTransferIptal}
          className="d-flex align-items-center"
        >
          <BiX className="me-1" />
          İptal
        </Button>
      </div>

      {/* Bilgi Banner */}
      <Alert variant="info" className="mb-4">
        <strong>Koli Transfer İşlemi:</strong> Düşük stoklu kolilerdeki ürünleri birleştirerek boş koli sayısını artırın ve depo verimliliğini artırın.
      </Alert>

      <Row>
        {/* Transfer Ayarları */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiBox className="me-2" />
                  Transfer Ayarları
                </h5>
                <div className="text-end">
                  {cikanKoliNo && (
                    <Badge bg="danger" className="me-1">
                      Çıkan: {cikanKoliNo}
                    </Badge>
                  )}
                  {girenKoliNo && (
                    <Badge bg="success">
                      Giren: {girenKoliNo}
                    </Badge>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Transfer Modu Seçimi */}
              <Form.Group className="mb-3">
                <Form.Label>Transfer Modu</Form.Label>
                <div className="d-flex gap-2">
                  <Button
                    variant={transferMode === 'single' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setTransferMode('single')}
                    className="flex-fill"
                  >
                    Tekli Transfer
                  </Button>
                  <Button
                    variant={transferMode === 'multiple' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setTransferMode('multiple')}
                    className="flex-fill"
                  >
                    Çoklu Transfer
                  </Button>
                </div>
              </Form.Group>

              {transferMode === 'single' ? (
                <>
                  {/* Çıkan Koli */}
                  <Form.Group className="mb-3">
                <Form.Label>Çıkan Koli Numarası</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Koli numarasını girin"
                    value={cikanKoliInput}
                    onChange={handleCikanKoliInput}
                    onKeyPress={(e) => e.key === 'Enter' && handleCikanKoliOkut()}
                    style={{
                      borderColor: isCikanKoliScanning ? '#28a745' : undefined,
                      boxShadow: isCikanKoliScanning ? '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' : undefined
                    }}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={handleCikanKoliOkut}
                  >
                    <BiCamera />
                  </Button>
                </InputGroup>
                <small className="text-muted mt-1 d-block">
                  {isCikanKoliScanning ? (
                    <Badge bg="success" className="me-2">Tarama Modu</Badge>
                  ) : null}
                  Koli numarasını okutun (otomatik algılanır) veya manuel girin
                </small>
              </Form.Group>

              {/* Giren Koli */}
              <Form.Group className="mb-3">
                <Form.Label>Giren Koli Numarası</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Hedef koli numarasını girin"
                    value={girenKoliInput}
                    onChange={handleGirenKoliInput}
                    onKeyPress={(e) => e.key === 'Enter' && handleGirenKoliOkut()}
                    style={{
                      borderColor: isGirenKoliScanning ? '#28a745' : undefined,
                      boxShadow: isGirenKoliScanning ? '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' : undefined
                    }}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={handleGirenKoliOkut}
                  >
                    <BiCamera />
                  </Button>
                </InputGroup>
                <small className="text-muted mt-1 d-block">
                  {isGirenKoliScanning ? (
                    <Badge bg="success" className="me-2">Tarama Modu</Badge>
                  ) : null}
                  Hedef koli numarasını okutun (otomatik algılanır) veya manuel girin
                </small>
              </Form.Group>

              {/* Dikkat Uyarısı */}
              <Alert variant="warning" className="mb-3">
                <strong>Dikkat:</strong> Çıkan koli boşalacak, giren koli dolacaktır.
              </Alert>

              {/* Test Butonu */}
              <Button 
                variant="outline-info" 
                size="sm" 
                className="mb-3"
                onClick={async () => {
                  console.log('=== TEST DEBUG ===');
                  console.log('Çıkan koli numarası:', cikanKoliNo);
                  console.log('Çıkan koli ürünleri:', cikanKoliUrunleri);
                  console.log('Giren koli numarası:', girenKoliNo);
                  console.log('Giren koli ürünleri:', girenKoliUrunleri);
                  console.log('Transfer listesi:', transferListesi);
                  
                  // API'den tüm ürünleri çek
                  try {
                    const response = await fetch('/api/urun');
                    if (response.ok) {
                      const allUrunler = await response.json();
                      console.log('API\'den gelen tüm ürünler:', allUrunler);
                      
                      // Çıkan koli numarası ile filtrele
                      const apiKoliUrunleri = allUrunler.filter(urun => urun.birim === cikanKoliNo);
                      console.log('API\'den çıkan koli ürünleri:', apiKoliUrunleri);
                      
                      // Karşılaştır
                      console.log('Frontend vs API karşılaştırması:');
                      console.log('Frontend ürün sayısı:', cikanKoliUrunleri.length);
                      console.log('API ürün sayısı:', apiKoliUrunleri.length);
                    }
                  } catch (error) {
                    console.error('API test hatası:', error);
                  }
                  
                  console.log('==================');
                }}
              >
                Debug Bilgilerini Göster
              </Button>

              {/* Transferi Tamamla Butonu */}
              {step === 2 && (
                <Button
                  variant="success"
                  size="lg"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={handleTransferTamamla}
                  disabled={loading || transferListesi.length === 0}
                >
                  <BiCheck className="me-2" />
                  {loading ? 'Transfer Ediliyor...' : 'Transferi Tamamla'}
                </Button>
              )}
                </>
              ) : (
                <>
                  {/* Çoklu Transfer - Çıkan Koliler */}
                  <Form.Group className="mb-3">
                    <Form.Label>Çıkan Koli Numaraları</Form.Label>
                    <InputGroup className="mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Koli numarasını girin"
                        value={multipleCikanKoliInput}
                        onChange={(e) => setMultipleCikanKoliInput(e.target.value || '')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleMultipleCikanKoliEkle(multipleCikanKoliInput);
                            setMultipleCikanKoliInput('');
                          }
                        }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          if (multipleCikanKoliInput.trim()) {
                            handleMultipleCikanKoliEkle(multipleCikanKoliInput);
                            setMultipleCikanKoliInput('');
                          }
                        }}
                      >
                        <BiCamera />
                      </Button>
                    </InputGroup>
                    <small className="text-muted">
                      Koli numarasını girin ve Enter tuşuna basın veya kamera butonuna tıklayın
                    </small>
                  </Form.Group>

                  {/* Seçili Çıkan Koliler */}
                  {multipleCikanKoliler.length > 0 && (
                    <div className="mb-3">
                      <Form.Label>Seçili Çıkan Koliler ({multipleCikanKoliler.length})</Form.Label>
                      <div className="d-flex flex-wrap gap-1">
                        {multipleCikanKoliler.map((koli, index) => (
                          <Badge
                            key={index}
                            bg="danger"
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMultipleCikanKoliCikar(koli.koliNo)}
                          >
                            {koli.koliNo} ({koli.urunSayisi} ürün)
                            <BiX size={12} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Çoklu Transfer - Giren Koli */}
                  <Form.Group className="mb-3">
                    <Form.Label>Giren Koli Numarası</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Hedef koli numarasını girin"
                        value={multipleGirenKoliInput}
                        onChange={(e) => setMultipleGirenKoliInput(e.target.value || '')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setMultipleGirenKoli(multipleGirenKoliInput);
                            handleMultipleGirenKoliOkut(multipleGirenKoliInput);
                          }
                        }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setMultipleGirenKoli(multipleGirenKoliInput);
                          handleMultipleGirenKoliOkut(multipleGirenKoliInput);
                        }}
                      >
                        <BiCamera />
                      </Button>
                    </InputGroup>
                    <small className="text-muted">
                      Hedef koli numarasını girin ve Enter tuşuna basın
                    </small>
                  </Form.Group>

                  {/* Çoklu Transfer Tamamla Butonu */}
                  {multipleCikanKoliler.length > 0 && multipleGirenKoli && (
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 d-flex align-items-center justify-content-center"
                      onClick={handleMultipleTransferTamamla}
                      disabled={loading || multipleTransferListesi.length === 0}
                    >
                      <BiCheck className="me-2" />
                      {loading ? 'Transfer Ediliyor...' : `${multipleCikanKoliler.length} Koli → 1 Koli Transfer`}
                    </Button>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Çıkan Koli Ürünleri - Transfer Ayarlarının Yanında */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiBox className="me-2" />
                  {transferMode === 'single' ? 'Çıkan Koli Ürünleri' : 'Çoklu Çıkan Koliler'}
                </h5>
                <div className="text-end">
                  {transferMode === 'single' ? (
                    <>
                      <Badge bg="info" className="me-1">
                        {cikanKoliUrunleri.length} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {cikanKoliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)} Adet
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge bg="info" className="me-1">
                        {multipleCikanKoliler.reduce((toplam, koli) => toplam + koli.urunSayisi, 0)} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {multipleCikanKoliler.reduce((toplam, koli) => toplam + koli.toplamAdet, 0)} Adet
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {transferMode === 'single' ? (
                // Tekli transfer modu
                cikanKoliUrunleri.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Barkod</th>
                          <th>Ürün</th>
                          <th>Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cikanKoliUrunleri.map((urun, index) => (
                          <tr key={index}>
                            <td><code>{urun.barkod}</code></td>
                            <td>{urun.urun_adi}</td>
                            <td>
                              <Badge bg="info">{urun.stok_miktari}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <BiBox size={48} className="text-muted mb-3" />
                    <p className="text-muted">Koli seçilmedi veya ürün bulunamadı</p>
                  </div>
                )
              ) : (
                // Çoklu transfer modu
                multipleCikanKoliler.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {multipleCikanKoliler.map((koli, koliIndex) => (
                      <div key={koliIndex} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">
                            <Badge bg="danger" className="me-2">{koli.koliNo}</Badge>
                            {koli.koliAdi}
                          </h6>
                          <small className="text-muted">
                            {koli.urunSayisi} ürün, {koli.toplamAdet} adet
                          </small>
                        </div>
                        <Table striped hover size="sm" className="mb-3">
                          <thead>
                            <tr>
                              <th>Barkod</th>
                              <th>Ürün</th>
                              <th>Adet</th>
                            </tr>
                          </thead>
                          <tbody>
                            {koli.urunler.slice(0, 5).map((urun, urunIndex) => (
                              <tr key={urunIndex}>
                                <td><code>{urun.barkod}</code></td>
                                <td>{urun.urun_adi}</td>
                                <td>
                                  <Badge bg="info">{urun.stok_miktari}</Badge>
                                </td>
                              </tr>
                            ))}
                            {koli.urunler.length > 5 && (
                              <tr>
                                <td colSpan="3" className="text-center text-muted">
                                  <small>... ve {koli.urunler.length - 5} ürün daha</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <BiBox size={48} className="text-muted mb-3" />
                    <p className="text-muted">Çıkan koli seçilmedi</p>
                  </div>
                )
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Giren Koli Ürünleri - Transfer Ayarlarının Yanında */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiBox className="me-2" />
                  Giren Koli Ürünleri
                </h5>
                <div className="text-end">
                  {transferMode === 'single' ? (
                    <>
                      <Badge bg="success" className="me-1">
                        {girenKoliUrunleri.length} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {girenKoliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)} Adet
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge bg="success" className="me-1">
                        {multipleGirenKoliUrunleri.length} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {multipleGirenKoliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)} Adet
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {transferMode === 'single' ? (
                // Tekli transfer modu
                girenKoliUrunleri.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Barkod</th>
                          <th>Ürün</th>
                          <th>Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {girenKoliUrunleri.map((urun, index) => (
                          <tr key={index}>
                            <td><code>{urun.barkod}</code></td>
                            <td>{urun.urun_adi}</td>
                            <td>
                              <Badge bg="success">{urun.stok_miktari}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <BiBox size={48} className="text-muted mb-3" />
                    <p className="text-muted">Koli seçilmedi veya koli boş</p>
                  </div>
                )
              ) : (
                // Çoklu transfer modu
                multipleGirenKoliUrunleri.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="mb-2">
                      <h6 className="mb-0">
                        <Badge bg="success" className="me-2">{multipleGirenKoli}</Badge>
                        Hedef Koli
                      </h6>
                      <small className="text-muted">
                        {multipleGirenKoliUrunleri.length} ürün, {multipleGirenKoliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0)} adet
                      </small>
                    </div>
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Barkod</th>
                          <th>Ürün</th>
                          <th>Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {multipleGirenKoliUrunleri.slice(0, 10).map((urun, index) => (
                          <tr key={index}>
                            <td><code>{urun.barkod}</code></td>
                            <td>{urun.urun_adi}</td>
                            <td>
                              <Badge bg="success">{urun.stok_miktari}</Badge>
                            </td>
                          </tr>
                        ))}
                        {multipleGirenKoliUrunleri.length > 10 && (
                          <tr>
                            <td colSpan="3" className="text-center text-muted">
                              <small>... ve {multipleGirenKoliUrunleri.length - 10} ürün daha</small>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <BiBox size={48} className="text-muted mb-3" />
                    <p className="text-muted">Giren koli seçilmedi</p>
                  </div>
                )
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ürün Barkodu Girişi */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <BiCamera className="me-2" />
                Ürün Barkodu Girişi
              </h5>
            </Card.Header>
            <Card.Body>
              <InputGroup size="lg">
                <Form.Control
                  type="text"
                  placeholder="Ürün barkodunu okutun veya girin"
                  value={barkodInput}
                  onChange={handleBarkodInput}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  style={{
                    borderColor: isScanning ? '#28a745' : undefined,
                    boxShadow: isScanning ? '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' : undefined
                  }}
                />
              </InputGroup>
              <small className="text-muted mt-2 d-block">
                {isScanning ? (
                  <Badge bg="success" className="me-2">Tarama Modu</Badge>
                ) : null}
                Barkodu okutun (otomatik algılanır) veya manuel girin, Enter tuşuna basın
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Anlık Transfer Listesi */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <BiRightArrow className="me-2" />
                  Anlık Transfer Listesi
                </h5>
                <div className="text-end">
                  {transferMode === 'single' ? (
                    <>
                      <Badge bg="warning" className="me-1">
                        {transferListesi.length} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {transferListesi.reduce((toplam, item) => toplam + (item.adet || 0), 0)} Adet
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge bg="warning" className="me-1">
                        {multipleTransferListesi.length} Ürün
                      </Badge>
                      <Badge bg="secondary">
                        {multipleTransferListesi.reduce((toplam, item) => toplam + (item.adet || 0), 0)} Adet
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </Card.Header>
              <Card.Body>
                {transferMode === 'single' ? (
                  // Tekli transfer modu
                  transferListesi.length > 0 ? (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <Table striped hover size="sm">
                        <thead>
                          <tr>
                            <th>Barkod</th>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>Hedef Koli</th>
                            <th width="80">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transferListesi.map((item) => (
                            <tr key={item.id}>
                              <td><code>{item.barkod}</code></td>
                              <td>{item.urun_adi}</td>
                              <td>
                                <Badge bg="warning">{item.adet}</Badge>
                              </td>
                              <td>
                                <Badge bg="success">{item.koli_no}</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleTransferItemSil(item.id)}
                                  title="Transfer listesinden çıkar"
                                >
                                  <BiTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <BiRightArrow size={32} className="text-muted mb-2" />
                      <p className="text-muted">Henüz transfer edilecek ürün yok</p>
                    </div>
                  )
                ) : (
                  // Çoklu transfer modu
                  multipleTransferListesi.length > 0 ? (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <Table striped hover size="sm">
                        <thead>
                          <tr>
                            <th>Barkod</th>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>Hedef Koli</th>
                            <th width="80">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {multipleTransferListesi.map((item) => (
                            <tr key={item.id}>
                              <td><code>{item.barkod}</code></td>
                              <td>{item.urun_adi}</td>
                              <td>
                                <Badge bg="warning">{item.adet}</Badge>
                              </td>
                              <td>
                                <Badge bg="success">{item.koli_no}</Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    // Çoklu transfer modunda ürünü geri ekle
                                    setMultipleTransferListesi(prev => prev.filter(i => i.id !== item.id));
                                    
                                    // Çıkan koli listesinde stok miktarını 1 artır (geri yükle)
                                    setMultipleCikanKoliler(prev => 
                                      prev.map(koli => {
                                        const existingUrun = koli.urunler.find(u => u.barkod === item.barkod);
                                        if (existingUrun) {
                                          // Eğer çıkan kolide bu ürün varsa, stok miktarını 1 artır
                                          return {
                                            ...koli,
                                            urunler: koli.urunler.map(u => 
                                              u.barkod === item.barkod 
                                                ? { ...u, stok_miktari: u.stok_miktari + 1 }
                                                : u
                                            ),
                                            urunSayisi: koli.urunler.filter(u => u.stok_miktari > 0).length,
                                            toplamAdet: koli.urunler.reduce((toplam, u) => toplam + (u.stok_miktari || 0), 0)
                                          };
                                        } else {
                                          // Eğer çıkan kolide bu ürün yoksa, 1 adet ekle
                                          return {
                                            ...koli,
                                            urunler: [...koli.urunler, {
                                              barkod: item.barkod,
                                              urun_adi: item.urun_adi,
                                              stok_miktari: 1 // Sadece 1 adet geri yükle
                                            }],
                                            urunSayisi: koli.urunler.filter(u => u.stok_miktari > 0).length + 1,
                                            toplamAdet: koli.urunler.reduce((toplam, u) => toplam + (u.stok_miktari || 0), 0) + 1
                                          };
                                        }
                                      })
                                    );
                                    
                                    // Giren koli listesinde stok miktarını 1 azalt
                                    setMultipleGirenKoliUrunleri(prev => {
                                      const existingGirenUrun = prev.find(u => u.barkod === item.barkod);
                                      if (existingGirenUrun) {
                                        if (existingGirenUrun.stok_miktari > 1) {
                                          // Eğer giren kolide 1'den fazla stok varsa, 1 azalt
                                          return prev.map(u => 
                                            u.barkod === item.barkod 
                                              ? { ...u, stok_miktari: u.stok_miktari - 1 }
                                              : u
                                          );
                                        } else {
                                          // Eğer giren kolide 1 stok varsa, ürünü tamamen çıkar
                                          return prev.filter(u => u.barkod !== item.barkod);
                                        }
                                      }
                                      return prev;
                                    });
                                    
                                    toast.info(`${item.urun_adi} transfer listesinden çıkarıldı ve çıkan koliye geri yüklendi`);
                                  }}
                                  title="Transfer listesinden çıkar"
                                >
                                  <BiTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <BiRightArrow size={32} className="text-muted mb-2" />
                      <p className="text-muted">Henüz transfer edilecek ürün yok</p>
                    </div>
                  )
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
    </div>
  );
};

export default KoliTransfer;
