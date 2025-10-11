// Veri saklama sistemi - Kalıcı veri yönetimi
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'vms-data.json');

// Veri klasörünü oluştur
const ensureDataDir = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Varsayılan veri yapısı
const defaultData = {
  urunler: [],
  cikisGecmisi: [],
  toplamaFisleri: [],
  lastUpdated: new Date().toISOString()
};

// Veriyi dosyadan oku
export const loadData = () => {
  try {
    ensureDataDir();
    
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      console.log(`Veri yüklendi: ${data.urunler.length} ürün, ${data.cikisGecmisi.length} çıkış kaydı`);
      return data;
    } else {
      console.log('Veri dosyası bulunamadı, varsayılan veri oluşturuluyor');
      saveData(defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error);
    return defaultData;
  }
};

// Veriyi dosyaya kaydet
export const saveData = (data) => {
  try {
    ensureDataDir();
    
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log(`Veri kaydedildi: ${data.urunler.length} ürün, ${data.cikisGecmisi.length} çıkış kaydı`);
    return true;
  } catch (error) {
    console.error('Veri kaydetme hatası:', error);
    return false;
  }
};

// Ürün ekleme/güncelleme
export const updateUrunler = (yeniUrunler) => {
  const data = loadData();
  data.urunler = yeniUrunler;
  saveData(data);
  return data.urunler;
};

// Çıkış kaydı ekleme
export const addCikisKaydi = (koli_no, urun_barkod, urun_adi, adet) => {
  const data = loadData();
  
  const yeniKayit = {
    id: Date.now(),
    koli_no: koli_no,
    urun_barkod: urun_barkod,
    urun_adi: urun_adi,
    adet: adet,
    tarih: new Date().toISOString().split('T')[0],
    saat: new Date().toTimeString().split(' ')[0]
  };
  
  data.cikisGecmisi.unshift(yeniKayit);
  
  // Son 1000 kaydı tut
  if (data.cikisGecmisi.length > 1000) {
    data.cikisGecmisi = data.cikisGecmisi.slice(0, 1000);
  }
  
  saveData(data);
  console.log('Çıkış kaydı eklendi:', yeniKayit);
  return yeniKayit;
};

// Toplama fişi ekleme
export const addToplamaFisi = (urunler) => {
  const data = loadData();
  
  const fisiNo = `TF${Date.now()}`;
  const toplamAdet = urunler.reduce((sum, urun) => sum + urun.adet, 0);
  const tarih = new Date().toISOString().split('T')[0];

  const yeniFis = {
    fisi_no: fisiNo,
    tarih: tarih,
    toplam_urun: urunler.length,
    toplam_adet: toplamAdet,
    durum: 'tamamlandi',
    urunler: urunler,
    olusturma_tarihi: new Date().toISOString()
  };

  data.toplamaFisleri.unshift(yeniFis);
  saveData(data);
  console.log('Toplama fişi eklendi:', fisiNo);
  return yeniFis;
};

// Fiş detayları alma
export const getFisiDetaylari = (fisiNo) => {
  const data = loadData();
  const fis = data.toplamaFisleri.find(f => f.fisi_no === fisiNo);
  return fis ? fis.urunler || [] : [];
};

// Veri durumu
export const getDataStatus = () => {
  const data = loadData();
  return {
    urunSayisi: data.urunler.length,
    cikisKayitSayisi: data.cikisGecmisi.length,
    fisSayisi: data.toplamaFisleri.length,
    lastUpdated: data.lastUpdated
  };
};
