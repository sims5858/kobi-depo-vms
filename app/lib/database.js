// Persistent veritabanı yönetimi - JSON dosya tabanlı
const fs = require('fs');
const path = require('path');

// Veri dosyalarının yolları
const DATA_DIR = path.join(process.cwd(), 'data');
const URUNLER_FILE = path.join(DATA_DIR, 'urunler.json');
const KOLILER_FILE = path.join(DATA_DIR, 'koliler.json');
const AKTIVITELER_FILE = path.join(DATA_DIR, 'aktiviteler.json');
const TRANSFER_FILE = path.join(DATA_DIR, 'transfer.json');
const TOPLAMA_FISI_FILE = path.join(DATA_DIR, 'toplama-fisi.json');
const KULLANICILAR_FILE = path.join(DATA_DIR, 'kullanicilar.json');

// Data klasörünü oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Dosyadan veri okuma
function readFromFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Dosya okuma hatası (${filePath}):`, error);
  }
  return defaultValue;
}

// Dosyaya veri yazma
function writeToFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Dosya yazma hatası (${filePath}):`, error);
    return false;
  }
}

// Başlangıç verilerini yükle
let urunler = readFromFile(URUNLER_FILE, []);
let koliler = readFromFile(KOLILER_FILE, [
  { id: 1, koli_no: 'TEST001', lokasyon: '', kapasite: 100, dolu_miktar: 0, urun_sayisi: 0, aciklama: 'Test koli', doluluk_orani: 0, olusturma_tarihi: new Date().toISOString().split('T')[0], guncelleme_tarihi: new Date().toISOString().split('T')[0] }
]);
let aktiviteler = readFromFile(AKTIVITELER_FILE, []);
let transferHistory = readFromFile(TRANSFER_FILE, []);
let toplamaFisiListesi = readFromFile(TOPLAMA_FISI_FILE, []);

// Kullanıcı verilerini yükle (varsayılan admin kullanıcısı ile)
let kullanicilar = readFromFile(KULLANICILAR_FILE, [
  {
    id: 1,
    kullanici_adi: 'admin',
    sifre: 'admin123',
    ad_soyad: 'Admin Kullanıcı',
    email: 'admin@example.com',
    rol: 'admin',
    aktif: true,
    olusturma_tarihi: new Date().toISOString()
  }
]);

let nextUrunId = Math.max(0, ...urunler.map(u => u.id || 0)) + 1;
let nextKoliId = Math.max(0, ...koliler.map(k => k.id || 0)) + 1;
let nextAktiviteId = Math.max(0, ...aktiviteler.map(a => a.id || 0)) + 1;
let nextTransferId = Math.max(0, ...transferHistory.map(t => t.id || 0)) + 1;
let nextToplamaFisiId = Math.max(0, ...toplamaFisiListesi.map(t => t.id || 0)) + 1;
let nextKullaniciId = Math.max(0, ...kullanicilar.map(k => k.id || 0)) + 1;

// Koli listesini ürünlerden güncelle
function updateKoliStats() {
  // Her koli için ürün sayısını ve dolu miktarını hesapla
  koliler.forEach(koli => {
    const koliUrunleri = urunler.filter(urun => urun.birim === koli.koli_no);
    koli.urun_sayisi = koliUrunleri.length;
    koli.dolu_miktar = koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0);
    koli.toplam_adet = koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0); // Toplam adet = dolu miktar
    koli.doluluk_orani = koli.kapasite > 0 ? Math.round((koli.dolu_miktar / koli.kapasite) * 100) : 0;
    koli.guncelleme_tarihi = new Date().toISOString().split('T')[0];
  });
  
  // Koli listesini dosyaya kaydet
  writeToFile(KOLILER_FILE, koliler);
}

// Başlangıçta koli istatistiklerini güncelle
updateKoliStats();

// Ürün veritabanı işlemleri
const urunDB = {
  getAll: () => urunler,
  getById: (id) => urunler.find(u => u.id === id),
  add: (urun) => {
    const yeniUrun = { id: nextUrunId++, ...urun, olusturma_tarihi: new Date().toISOString() };
    urunler.push(yeniUrun);
    writeToFile(URUNLER_FILE, urunler);
    updateKoliStats(); // Koli istatistiklerini güncelle
    return yeniUrun;
  },
  update: (id, guncelUrun) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      urunler[index] = { ...urunler[index], ...guncelUrun, guncelleme_tarihi: new Date().toISOString() };
      writeToFile(URUNLER_FILE, urunler);
      updateKoliStats(); // Koli istatistiklerini güncelle
      return urunler[index];
    }
    return null;
  },
  delete: (id) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      urunler.splice(index, 1);
      
      // Sadece ürünler dosyasını yaz, koli stats'i async olarak güncelle
      try {
        writeToFile(URUNLER_FILE, urunler);
        
        // Koli stats'i async olarak güncelle (hata olursa da silme başarılı olsun)
        setTimeout(() => {
          try {
            updateKoliStats();
          } catch (error) {
            console.warn('Koli stats güncellenemedi:', error);
          }
        }, 0);
        
        return true;
      } catch (error) {
        console.error('Ürün dosyası yazılamadı:', error);
        return false;
      }
    }
    return false;
  }
};

// Koli veritabanı işlemleri
const koliDB = {
  getAll: () => koliler,
  getById: (id) => koliler.find(k => k.id === id),
  getByKoliNo: (koliNo) => koliler.find(k => k.koli_no === koliNo),
  add: (koli) => {
    const yeniKoli = { id: nextKoliId++, ...koli, olusturma_tarihi: new Date().toISOString().split('T')[0], guncelleme_tarihi: new Date().toISOString().split('T')[0] };
    koliler.push(yeniKoli);
    writeToFile(KOLILER_FILE, koliler);
    return yeniKoli;
  },
  update: (id, guncelKoli) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      koliler[index] = { ...koliler[index], ...guncelKoli, guncelleme_tarihi: new Date().toISOString().split('T')[0] };
      writeToFile(KOLILER_FILE, koliler);
      return koliler[index];
    }
    return null;
  },
  delete: (id) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      koliler.splice(index, 1);
      writeToFile(KOLILER_FILE, koliler);
      return true;
    }
    return false;
  }
};

// Aktivite veritabanı işlemleri
const aktiviteDB = {
  getAll: () => aktiviteler,
  add: (aktivite) => {
    const yeniAktivite = { id: nextAktiviteId++, ...aktivite, tarih: new Date().toISOString() };
    aktiviteler.push(yeniAktivite);
    writeToFile(AKTIVITELER_FILE, aktiviteler);
    return yeniAktivite;
  }
};

// Transfer veritabanı işlemleri
const transferDB = {
  getAll: () => transferHistory,
  add: (transfer) => {
    const yeniTransfer = { id: nextTransferId++, ...transfer, tarih: new Date().toISOString() };
    transferHistory.push(yeniTransfer);
    writeToFile(TRANSFER_FILE, transferHistory);
    return yeniTransfer;
  }
};

// Toplama fişi veritabanı işlemleri
const toplamaFisiDB = {
  getAll: () => toplamaFisiListesi,
  getById: (id) => toplamaFisiListesi.find(t => t.id === id),
  add: (toplamaFisi) => {
    const yeniToplamaFisi = { id: nextToplamaFisiId++, ...toplamaFisi, tarih: new Date().toISOString() };
    toplamaFisiListesi.push(yeniToplamaFisi);
    writeToFile(TOPLAMA_FISI_FILE, toplamaFisiListesi);
    return yeniToplamaFisi;
  }
};

// Kullanıcı veritabanı işlemleri
const kullaniciDB = {
  getAll: () => kullanicilar,
  getById: (id) => kullanicilar.find(k => k.id === id),
  add: (kullanici) => {
    const yeniKullanici = { id: nextKullaniciId++, ...kullanici, olusturma_tarihi: new Date().toISOString() };
    kullanicilar.push(yeniKullanici);
    writeToFile(KULLANICILAR_FILE, kullanicilar);
    return yeniKullanici;
  },
  update: (id, guncelKullanici) => {
    const index = kullanicilar.findIndex(k => k.id === id);
    if (index !== -1) {
      kullanicilar[index] = { ...kullanicilar[index], ...guncelKullanici };
      writeToFile(KULLANICILAR_FILE, kullanicilar);
      return kullanicilar[index];
    }
    return null;
  },
  delete: (id) => {
    const index = kullanicilar.findIndex(k => k.id === id);
    if (index !== -1) {
      kullanicilar.splice(index, 1);
      writeToFile(KULLANICILAR_FILE, kullanicilar);
      return true;
    }
    return false;
  },
  findByUsername: (kullanici_adi) => {
    return kullanicilar.find(k => k.kullanici_adi === kullanici_adi && k.aktif === true);
  },
  findByEmail: (email) => {
    return kullanicilar.find(k => k.email === email && k.aktif === true);
  }
};

// CommonJS export
module.exports = {
  urunDB,
  koliDB,
  aktiviteDB,
  transferDB,
  toplamaFisiDB,
  kullaniciDB
};
