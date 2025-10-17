// Vercel KV tabanlı kalıcı veritabanı
import { kv } from '@vercel/kv';

// Veri anahtarları
const KEYS = {
  urunler: 'urunler',
  koliler: 'koliler',
  aktiviteler: 'aktiviteler',
  transfer: 'transfer',
  toplama: 'toplama',
  toplamaFisi: 'toplama_fisi',
  kullanicilar: 'kullanicilar'
};

// Başlangıç verileri
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

// KV Database sınıfları
class KVUrunDB {
  constructor() {
    this.key = KEYS.urunler;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV ürün listesi hatası:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const urunler = await this.getAll();
      return urunler.find(u => u.id === id);
    } catch (error) {
      console.error('KV ürün getById hatası:', error);
      return null;
    }
  }

  async add(urun) {
    try {
      const urunler = await this.getAll();
      const yeniUrun = {
        ...urun,
        id: Date.now(), // Basit ID oluşturma
        olusturma_tarihi: new Date().toISOString()
      };
      urunler.push(yeniUrun);
      await kv.set(this.key, urunler);
      return yeniUrun;
    } catch (error) {
      console.error('KV ürün ekleme hatası:', error);
      return null;
    }
  }

  async update(id, guncelUrun) {
    try {
      const urunler = await this.getAll();
      const index = urunler.findIndex(u => u.id === id);
      if (index !== -1) {
        urunler[index] = {
          ...urunler[index],
          ...guncelUrun,
          id: id,
          guncelleme_tarihi: new Date().toISOString()
        };
        await kv.set(this.key, urunler);
        return urunler[index];
      }
      return null;
    } catch (error) {
      console.error('KV ürün güncelleme hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const urunler = await this.getAll();
      const index = urunler.findIndex(u => u.id === id);
      if (index !== -1) {
        const silinenUrun = urunler.splice(index, 1)[0];
        await kv.set(this.key, urunler);
        return silinenUrun;
      }
      return null;
    } catch (error) {
      console.error('KV ürün silme hatası:', error);
      return null;
    }
  }
}

class KVKoliDB {
  constructor() {
    this.key = KEYS.koliler;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV koli listesi hatası:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const koliler = await this.getAll();
      return koliler.find(k => k.id === id);
    } catch (error) {
      console.error('KV koli getById hatası:', error);
      return null;
    }
  }

  async add(koli) {
    try {
      const koliler = await this.getAll();
      const yeniKoli = {
        ...koli,
        id: Date.now(),
        olusturma_tarihi: new Date().toISOString().split('T')[0],
        guncelleme_tarihi: new Date().toISOString().split('T')[0]
      };
      koliler.push(yeniKoli);
      await kv.set(this.key, koliler);
      return yeniKoli;
    } catch (error) {
      console.error('KV koli ekleme hatası:', error);
      return null;
    }
  }

  async update(id, guncelKoli) {
    try {
      const koliler = await this.getAll();
      const index = koliler.findIndex(k => k.id === id);
      if (index !== -1) {
        koliler[index] = {
          ...koliler[index],
          ...guncelKoli,
          id: id,
          guncelleme_tarihi: new Date().toISOString().split('T')[0]
        };
        await kv.set(this.key, koliler);
        return koliler[index];
      }
      return null;
    } catch (error) {
      console.error('KV koli güncelleme hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const koliler = await this.getAll();
      const index = koliler.findIndex(k => k.id === id);
      if (index !== -1) {
        const silinenKoli = koliler.splice(index, 1)[0];
        await kv.set(this.key, koliler);
        return silinenKoli;
      }
      return null;
    } catch (error) {
      console.error('KV koli silme hatası:', error);
      return null;
    }
  }
}

class KVAktiviteDB {
  constructor() {
    this.key = KEYS.aktiviteler;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV aktivite listesi hatası:', error);
      return [];
    }
  }

  async add(aktivite) {
    try {
      const aktiviteler = await this.getAll();
      const yeniAktivite = {
        ...aktivite,
        id: Date.now(),
        tarih: new Date().toISOString()
      };
      aktiviteler.unshift(yeniAktivite); // En yeni başa ekle
      await kv.set(this.key, aktiviteler);
      return yeniAktivite;
    } catch (error) {
      console.error('KV aktivite ekleme hatası:', error);
      return null;
    }
  }
}

class KVTransferDB {
  constructor() {
    this.key = KEYS.transfer;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV transfer listesi hatası:', error);
      return [];
    }
  }

  async add(transfer) {
    try {
      const transferler = await this.getAll();
      const yeniTransfer = {
        ...transfer,
        id: Date.now(),
        tarih: new Date().toISOString()
      };
      transferler.unshift(yeniTransfer);
      await kv.set(this.key, transferler);
      return yeniTransfer;
    } catch (error) {
      console.error('KV transfer ekleme hatası:', error);
      return null;
    }
  }
}

class KVToplamaDB {
  constructor() {
    this.key = KEYS.toplama;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV toplama listesi hatası:', error);
      return [];
    }
  }

  async add(toplama) {
    try {
      const toplamalar = await this.getAll();
      const yeniToplama = {
        ...toplama,
        id: Date.now(),
        tarih: new Date().toISOString()
      };
      toplamalar.unshift(yeniToplama);
      await kv.set(this.key, toplamalar);
      return yeniToplama;
    } catch (error) {
      console.error('KV toplama ekleme hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const toplamalar = await this.getAll();
      const filtered = toplamalar.filter(t => t.id !== id);
      await kv.set(this.key, filtered);
      return true;
    } catch (error) {
      console.error('KV toplama silme hatası:', error);
      return false;
    }
  }
}

class KVToplamaFisiDB {
  constructor() {
    this.key = KEYS.toplamaFisi;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || [];
    } catch (error) {
      console.error('KV toplama fişi listesi hatası:', error);
      return [];
    }
  }

  async add(fis) {
    try {
      const fisler = await this.getAll();
      const yeniFis = {
        ...fis,
        id: Date.now(),
        tarih: new Date().toISOString()
      };
      fisler.unshift(yeniFis);
      await kv.set(this.key, fisler);
      return yeniFis;
    } catch (error) {
      console.error('KV toplama fişi ekleme hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const fisler = await this.getAll();
      const filtered = fisler.filter(f => f.id !== id);
      await kv.set(this.key, filtered);
      return true;
    } catch (error) {
      console.error('KV toplama fişi silme hatası:', error);
      return false;
    }
  }
}

class KVKullaniciDB {
  constructor() {
    this.key = KEYS.kullanicilar;
  }

  async getAll() {
    try {
      const data = await kv.get(this.key);
      return data || defaultKullanicilar;
    } catch (error) {
      console.error('KV kullanıcı listesi hatası:', error);
      return defaultKullanicilar;
    }
  }

  async getByKullaniciAdi(kullaniciAdi) {
    try {
      const kullanicilar = await this.getAll();
      return kullanicilar.find(k => k.kullanici_adi === kullaniciAdi && k.aktif !== false);
    } catch (error) {
      console.error('KV kullanıcı getByKullaniciAdi hatası:', error);
      return null;
    }
  }

  async getByUsername(username) {
    try {
      const kullanicilar = await this.getAll();
      return kullanicilar.find(k => k.kullanici_adi === username && k.aktif !== false);
    } catch (error) {
      console.error('KV kullanıcı getByUsername hatası:', error);
      return null;
    }
  }
}

// Database instance'ları
export const urunDB = new KVUrunDB();
export const koliDB = new KVKoliDB();
export const aktiviteDB = new KVAktiviteDB();
export const transferDB = new KVTransferDB();
export const toplamaDB = new KVToplamaDB();
export const toplamaFisiDB = new KVToplamaFisiDB();
export const kullaniciDB = new KVKullaniciDB();

// KV bağlantısını test et
export async function testKVConnection() {
  try {
    await kv.set('test', 'KV çalışıyor');
    const testValue = await kv.get('test');
    await kv.del('test');
    console.log('KV bağlantısı başarılı:', testValue);
    return true;
  } catch (error) {
    console.error('KV bağlantı hatası:', error);
    return false;
  }
}
