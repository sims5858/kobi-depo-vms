// Hybrid veri yönetimi sistemi - Local'de file, Vercel'de memory
// Local development için file-based, production için memory-based

import fs from 'fs';
import path from 'path';

// Data file path
const DATA_FILE = path.join(process.cwd(), 'data', 'vms-data.json');

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

// Environment kontrolü
const isVercel = process.env.VERCEL === '1';
const isLocal = !isVercel;

// Veriyi yükle - Hybrid (Local: File, Vercel: Memory)
export function loadData() {
  if (isLocal) {
    // Local development - File-based
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(fileData);
        console.log('✅ Veri dosyadan yüklendi:', Object.keys(data).length, 'kategori');
        return data;
      } else {
        // Data klasörü yoksa oluştur
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        // Varsayılan veriyi kaydet
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        console.log('✅ Varsayılan veri dosyaya kaydedildi');
        return defaultData;
      }
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      return defaultData;
    }
  } else {
    // Vercel production - Memory-based
    if (!memoryData) {
      memoryData = { ...defaultData };
      console.log('✅ Varsayılan veri yüklendi (memory):', Object.keys(memoryData).length, 'kategori');
    }
    return memoryData;
  }
}

// Veriyi kaydet - Hybrid (Local: File, Vercel: Memory)
export function saveData(data) {
  if (isLocal) {
    // Local development - File-based
    try {
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      console.log('✅ Veri dosyaya kaydedildi:', Object.keys(data).length, 'kategori');
    } catch (error) {
      console.error('❌ Veri kaydetme hatası:', error);
    }
  } else {
    // Vercel production - Memory-based
    memoryData = { ...data };
    console.log('✅ Veri kaydedildi (memory):', Object.keys(memoryData).length, 'kategori');
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