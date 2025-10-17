// Vercel uyumlu veritabanı - JSON dosyası tabanlı
import fs from 'fs';
import path from 'path';

// Her zaman data klasörünü kullan (Vercel'de de kalıcı olması için)
const DATA_DIR = path.join(process.cwd(), 'data');
const URUNLER_FILE = path.join(DATA_DIR, 'urunler.json');
const KOLILER_FILE = path.join(DATA_DIR, 'koliler.json');
const AKTIVITELER_FILE = path.join(DATA_DIR, 'aktiviteler.json');
const TRANSFER_FILE = path.join(DATA_DIR, 'transfer.json');
const TOPLAMA_FILE = path.join(DATA_DIR, 'toplama.json');
const KULLANICILAR_FILE = path.join(DATA_DIR, 'kullanicilar.json');

// Data klasörünü oluştur
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Data klasörü oluşturuldu:', DATA_DIR);
  } catch (error) {
    console.log('Data klasörü oluşturulamadı:', error.message);
  }
}

// Başlangıç verilerini dosyaya yaz (eğer dosyalar yoksa)
try {
  if (!fs.existsSync(KULLANICILAR_FILE)) {
    writeFile(KULLANICILAR_FILE, defaultKullanicilar);
    console.log('Default kullanıcılar dosyaya yazıldı');
  }
  // Ürün ve koli dosyaları için default veri yazma - mevcut veriler korunmalı
} catch (error) {
  console.log('Başlangıç verileri yazılırken hata:', error.message);
}

// Dosyaları oku
function readFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Dosya okuma hatası ${filePath}:`, error);
  }
  return defaultValue;
}

// Dosyaya yaz
function writeFile(filePath, data) {
  try {
    // Klasörün var olduğundan emin ol
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Dosya yazıldı: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Dosya yazma hatası ${filePath}:`, error);
    return false;
  }
}

// Başlangıç verileri
const defaultUrunler = [
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

const defaultKoliler = [
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

const defaultKullanicilar = [
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
];

// Veritabanı sınıfları
class UrunDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(URUNLER_FILE, []); // Default veriler yerine boş array
    this.nextId = Math.max(...this.data.map(u => u.id), 0) + 1;
    console.log('UrunDB constructor - Vercel:', process.env.VERCEL ? 'Evet' : 'Hayır', 'Data length:', this.data.length);
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(u => u.id === id);
  }

  add(urun) {
    const yeniUrun = {
      ...urun,
      id: this.nextId++,
      olusturma_tarihi: new Date().toISOString()
    };
    this.data.push(yeniUrun);
    this.save();
    return yeniUrun;
  }

  update(id, guncelUrun) {
    const index = this.data.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data[index] = {
        ...this.data[index],
        ...guncelUrun,
        id: id,
        guncelleme_tarihi: new Date().toISOString()
      };
      this.save();
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const index = this.data.findIndex(u => u.id === id);
    if (index !== -1) {
      const silinenUrun = this.data.splice(index, 1)[0];
      this.save();
      return silinenUrun;
    }
    return null;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(URUNLER_FILE, this.data);
  }
}

class KoliDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(KOLILER_FILE, []); // Default veriler yerine boş array
    this.nextId = Math.max(...this.data.map(k => k.id), 0) + 1;
    console.log('KoliDB constructor - Vercel:', process.env.VERCEL ? 'Evet' : 'Hayır', 'Data length:', this.data.length);
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(k => k.id === id);
  }

  add(koli) {
    const yeniKoli = {
      ...koli,
      id: this.nextId++,
      olusturma_tarihi: new Date().toISOString().split('T')[0],
      guncelleme_tarihi: new Date().toISOString().split('T')[0]
    };
    this.data.push(yeniKoli);
    this.save();
    return yeniKoli;
  }

  update(id, guncelKoli) {
    const index = this.data.findIndex(k => k.id === id);
    if (index !== -1) {
      this.data[index] = {
        ...this.data[index],
        ...guncelKoli,
        id: id,
        guncelleme_tarihi: new Date().toISOString().split('T')[0]
      };
      this.save();
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const index = this.data.findIndex(k => k.id === id);
    if (index !== -1) {
      const silinenKoli = this.data.splice(index, 1)[0];
      this.save();
      return silinenKoli;
    }
    return null;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(KOLILER_FILE, this.data);
  }
}

class AktiviteDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(AKTIVITELER_FILE, []);
    this.nextId = Math.max(...this.data.map(a => a.id), 0) + 1;
  }

  getAll() {
    return this.data;
  }

  add(aktivite) {
    const yeniAktivite = {
      ...aktivite,
      id: this.nextId++,
      tarih: new Date().toISOString()
    };
    this.data.push(yeniAktivite);
    this.save();
    return yeniAktivite;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(AKTIVITELER_FILE, this.data);
  }
}

class TransferDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(TRANSFER_FILE, []);
    this.nextId = Math.max(...this.data.map(t => t.id), 0) + 1;
  }

  getAll() {
    return this.data;
  }

  add(transfer) {
    const yeniTransfer = {
      ...transfer,
      id: this.nextId++,
      tarih: new Date().toISOString()
    };
    this.data.push(yeniTransfer);
    this.save();
    return yeniTransfer;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(TRANSFER_FILE, this.data);
  }
}

class ToplamaDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(TOPLAMA_FILE, []);
    this.nextId = Math.max(...this.data.map(t => t.id), 0) + 1;
  }

  getAll() {
    return this.data;
  }

  add(toplama) {
    const yeniToplama = {
      ...toplama,
      id: this.nextId++,
      tarih: new Date().toISOString()
    };
    this.data.push(yeniToplama);
    this.save();
    return yeniToplama;
  }

  delete(id) {
    const initialLength = this.data.length;
    this.data = this.data.filter(t => t.id !== id);
    if (this.data.length < initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(TOPLAMA_FILE, this.data);
  }
}

class KullaniciDB {
  constructor() {
    // Hem Vercel'de hem local'de file-based
    this.data = readFile(KULLANICILAR_FILE, []); // Default veriler yerine boş array
    this.nextId = Math.max(...this.data.map(k => k.id), 0) + 1;
    console.log('KullaniciDB constructor - Vercel:', process.env.VERCEL ? 'Evet' : 'Hayır', 'Data length:', this.data.length);
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(k => k.id === id);
  }

  getByUsername(username) {
    return this.data.find(k => k.kullanici_adi === username);
  }

  getByKullaniciAdi(kullanici_adi) {
    return this.data.find(k => k.kullanici_adi === kullanici_adi && k.aktif === true);
  }

  findByUsername(username) {
    return this.getByUsername(username);
  }

  findByEmail(email) {
    return this.data.find(k => k.email === email);
  }

  add(kullanici) {
    const yeniKullanici = {
      ...kullanici,
      id: this.nextId++,
      olusturma_tarihi: new Date().toISOString()
    };
    this.data.push(yeniKullanici);
    this.save();
    return yeniKullanici;
  }

  update(id, updatedKullanici) {
    const index = this.data.findIndex(k => k.id === id);
    if (index > -1) {
      this.data[index] = { ...this.data[index], ...updatedKullanici, guncelleme_tarihi: new Date().toISOString() };
      this.save();
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const initialLength = this.data.length;
    this.data = this.data.filter(k => k.id !== id);
    if (this.data.length < initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  save() {
    // Hem Vercel'de hem local'de dosya yaz
    writeFile(KULLANICILAR_FILE, this.data);
  }
}

// Veritabanı instance'ları
const urunDB = new UrunDB();
const koliDB = new KoliDB();
const aktiviteDB = new AktiviteDB();
const transferDB = new TransferDB();
const toplamaDB = new ToplamaDB();
const kullaniciDB = new KullaniciDB();

export {
  urunDB,
  koliDB,
  aktiviteDB,
  transferDB,
  toplamaDB,
  kullaniciDB
};
