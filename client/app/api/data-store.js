// Optimized Memory-based veri yönetimi sistemi (Vercel uyumlu)
// Vercel'de file system yazma çalışmadığı için memory'de tutuyoruz

// Varsayılan veri
const defaultData = {
  urunler: [],
  koliler: [
    {
      koli_no: 'D1-0001',
      lokasyon: 'Depo 1 - Raf A',
      kapasite: 100,
      durum: 'bos',
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D1-0002',
      lokasyon: 'Depo 1 - Raf B',
      kapasite: 100,
      durum: 'bos',
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0001',
      lokasyon: 'Depo 2 - Raf A',
      kapasite: 100,
      durum: 'bos',
      olusturma_tarihi: new Date().toISOString()
    }
  ],
  kullanicilar: [
    {
      id: 1,
      kullanici_adi: 'admin',
      ad_soyad: 'Admin User',
      email: 'admin@vms.com',
      sifre: 'admin123',
      rol: 'admin',
      aktif: true,
      olusturma_tarihi: new Date().toISOString()
    }
  ],
  cikisGecmisi: [],
  toplamaFisleri: [],
  activities: []
};

// Memory'de veri tutuyoruz - Singleton pattern
let memoryData = null;

// Veriyi yükle - Vercel Optimized
export function loadData() {
  // İlk yüklemede varsayılan veriyi kullan
  if (!memoryData) {
    memoryData = { ...defaultData };
    console.log('✅ Varsayılan veri yüklendi:', Object.keys(memoryData).length, 'kategori');
  }
  
  return memoryData;
}

// Veriyi kaydet - Vercel Optimized
export function saveData(data) {
  memoryData = { ...data };
  console.log('✅ Veri kaydedildi (memory):', Object.keys(memoryData).length, 'kategori');
}

// Ürünleri güncelle
export function updateUrunler(urunler) {
  const data = loadData();
  data.urunler = urunler;
  saveData(data);
}

// Kullanıcıları güncelle
export function updateKullanicilar(kullanicilar) {
  const data = loadData();
  data.kullanicilar = kullanicilar;
  saveData(data);
}

// Çıkış geçmişini güncelle
export function updateCikisGecmisi(cikisGecmisi) {
  const data = loadData();
  data.cikisGecmisi = cikisGecmisi;
  saveData(data);
}

// Toplama fişlerini güncelle
export function updateToplamaFisleri(toplamaFisleri) {
  const data = loadData();
  data.toplamaFisleri = toplamaFisleri;
  saveData(data);
}

// Aktiviteleri güncelle
export function updateActivities(activities) {
  const data = loadData();
  data.activities = activities;
  saveData(data);
}

// Toplama fişi ekle
export function addToplamaFisi(fisi) {
  const data = loadData();
  if (!data.toplamaFisleri) {
    data.toplamaFisleri = [];
  }
  data.toplamaFisleri.push(fisi);
  saveData(data);
  return fisi;
}

// Toplama fişi detaylarını al
export function getFisiDetaylari(fisiNo) {
  const data = loadData();
  if (!data.toplamaFisleri) {
    return [];
  }
  return data.toplamaFisleri.filter(fisi => fisi.fisi_no === fisiNo);
}

// Çıkış kaydı ekle
export function addCikisKaydi(kayit) {
  const data = loadData();
  if (!data.cikisGecmisi) {
    data.cikisGecmisi = [];
  }
  data.cikisGecmisi.push(kayit);
  saveData(data);
  return kayit;
}