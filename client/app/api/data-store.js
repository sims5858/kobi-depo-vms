// Memory-based veri yönetimi sistemi (Vercel uyumlu)
// Vercel'de file system yazma çalışmadığı için memory'de tutuyoruz

// Varsayılan veri
const defaultData = {
  urunler: [],
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

// Memory'de veri tutuyoruz
let memoryData = { ...defaultData };

// Veriyi yükle
export function loadData() {
  console.log('Veri yüklendi:', Object.keys(memoryData).length, 'kategori');
  return memoryData;
}

// Veriyi kaydet (memory'de)
export function saveData(data) {
  memoryData = { ...data };
  console.log('Veri kaydedildi (memory):', Object.keys(memoryData).length, 'kategori');
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