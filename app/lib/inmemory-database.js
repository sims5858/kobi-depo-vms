// In-memory veritabanı - Vercel için optimize edilmiş
// Dosya yazma işlemleri yok, sadece memory'de çalışır

// Başlangıç verileri
let urunler = [
  {
    id: 1,
    barkod: '1234567890123',
    urun_adi: 'Örnek Ürün 1',
    birim: 'TEST001',
    stok_miktari: 50,
    birim_fiyat: 25.50,
    aciklama: 'Test ürünü',
    olusturma_tarihi: new Date().toISOString()
  },
  {
    id: 2,
    barkod: '1234567890124',
    urun_adi: 'Örnek Ürün 2',
    birim: 'TEST001',
    stok_miktari: 30,
    birim_fiyat: 15.75,
    aciklama: 'Test ürünü 2',
    olusturma_tarihi: new Date().toISOString()
  }
];

let koliler = [
  { 
    id: 1, 
    koli_no: 'TEST001', 
    lokasyon: '', 
    kapasite: 100, 
    dolu_miktar: 0, 
    urun_sayisi: 0, 
    aciklama: 'Test koli', 
    doluluk_orani: 0, 
    olusturma_tarihi: new Date().toISOString().split('T')[0], 
    guncelleme_tarihi: new Date().toISOString().split('T')[0] 
  }
];

let aktiviteler = [];
let transferHistory = [];
let toplamaFisiListesi = [];
let kullanicilar = [
  {
    id: 1,
    kullanici_adi: 'admin',
    sifre: 'admin123', // Gerçek uygulamada hash'lenmiş olmalı
    ad_soyad: 'Admin Kullanıcı',
    email: 'admin@example.com',
    rol: 'admin',
    aktif: true,
    olusturma_tarihi: new Date().toISOString()
  }
];

// ID sayaçları
let nextUrunId = 3;
let nextKoliId = 2;
let nextAktiviteId = 1;
let nextTransferId = 1;
let nextToplamaFisiId = 1;
let nextKullaniciId = 2;

// Koli istatistiklerini güncelle (dosya yazma yok)
function updateKoliStats() {
  koliler.forEach(koli => {
    const koliUrunleri = urunler.filter(urun => urun.birim === koli.koli_no);
    koli.urun_sayisi = koliUrunleri.length;
    koli.dolu_miktar = koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0);
    koli.toplam_adet = koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0);
    koli.doluluk_orani = koli.kapasite > 0 ? Math.round((koli.dolu_miktar / koli.kapasite) * 100) : 0;
    koli.guncelleme_tarihi = new Date().toISOString().split('T')[0];
  });
}

// Ürün veritabanı işlemleri
const urunDB = {
  getAll: () => urunler,
  getById: (id) => urunler.find(u => u.id === id),
  add: (urun) => {
    const yeniUrun = { 
      id: nextUrunId++, 
      ...urun, 
      olusturma_tarihi: new Date().toISOString() 
    };
    urunler.push(yeniUrun);
    updateKoliStats(); // Sadece memory'de güncelle
    return yeniUrun;
  },
  update: (id, guncelUrun) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      urunler[index] = { 
        ...urunler[index], 
        ...guncelUrun, 
        guncelleme_tarihi: new Date().toISOString() 
      };
      updateKoliStats(); // Sadece memory'de güncelle
      return urunler[index];
    }
    return null;
  },
  delete: (id) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      urunler.splice(index, 1);
      updateKoliStats(); // Sadece memory'de güncelle
      return true;
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
    const yeniKoli = { 
      id: nextKoliId++, 
      ...koli, 
      olusturma_tarihi: new Date().toISOString().split('T')[0],
      guncelleme_tarihi: new Date().toISOString().split('T')[0]
    };
    koliler.push(yeniKoli);
    updateKoliStats();
    return yeniKoli;
  },
  update: (id, guncelKoli) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      koliler[index] = { 
        ...koliler[index], 
        ...guncelKoli, 
        guncelleme_tarihi: new Date().toISOString().split('T')[0] 
      };
      updateKoliStats();
      return koliler[index];
    }
    return null;
  },
  delete: (id) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      koliler.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Aktivite veritabanı işlemleri
const aktiviteDB = {
  getAll: () => aktiviteler,
  add: (aktivite) => {
    const yeniAktivite = { 
      id: nextAktiviteId++, 
      ...aktivite, 
      tarih: new Date().toISOString() 
    };
    aktiviteler.push(yeniAktivite);
    return yeniAktivite;
  }
};

// Transfer veritabanı işlemleri
const transferDB = {
  getAll: () => transferHistory,
  add: (transfer) => {
    const yeniTransfer = { 
      id: nextTransferId++, 
      ...transfer, 
      tarih: new Date().toISOString() 
    };
    transferHistory.push(yeniTransfer);
    return yeniTransfer;
  }
};

// Toplama fişi veritabanı işlemleri
const toplamaFisiDB = {
  getAll: () => toplamaFisiListesi,
  add: (fis) => {
    const yeniFis = { 
      id: nextToplamaFisiId++, 
      ...fis, 
      tarih: new Date().toISOString() 
    };
    toplamaFisiListesi.push(yeniFis);
    return yeniFis;
  }
};

// Kullanıcı veritabanı işlemleri
const kullaniciDB = {
  getAll: () => kullanicilar,
  getById: (id) => kullanicilar.find(k => k.id === id),
  getByKullaniciAdi: (kullaniciAdi) => kullanicilar.find(k => k.kullanici_adi === kullaniciAdi),
  add: (kullanici) => {
    const yeniKullanici = { 
      id: nextKullaniciId++, 
      ...kullanici, 
      olusturma_tarihi: new Date().toISOString() 
    };
    kullanicilar.push(yeniKullanici);
    return yeniKullanici;
  },
  update: (id, guncelKullanici) => {
    const index = kullanicilar.findIndex(k => k.id === id);
    if (index !== -1) {
      kullanicilar[index] = { 
        ...kullanicilar[index], 
        ...guncelKullanici, 
        guncelleme_tarihi: new Date().toISOString() 
      };
      return kullanicilar[index];
    }
    return null;
  },
  delete: (id) => {
    const index = kullanicilar.findIndex(k => k.id === id);
    if (index !== -1) {
      kullanicilar.splice(index, 1);
      return true;
    }
    return false;
  }
};

module.exports = {
  urunDB,
  koliDB,
  aktiviteDB,
  transferDB,
  toplamaFisiDB,
  kullaniciDB
};
