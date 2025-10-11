// Kalıcı veri yönetimi sistemi
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'vms-data.json');

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

// Veriyi yükle
export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error);
  }
  
  // Varsayılan veriyi döndür ve kaydet
  saveData(defaultData);
  return defaultData;
}

// Veriyi kaydet
export function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Veri kaydedildi:', Object.keys(data).length, 'kategori');
  } catch (error) {
    console.error('Veri kaydetme hatası:', error);
  }
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