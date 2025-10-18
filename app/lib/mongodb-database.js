// MongoDB Atlas veritabanı - Kalıcı veri depolama
import { MongoClient } from 'mongodb';

// MongoDB bağlantı URL'si
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/';
const DB_NAME = 'kobi_depo_vms';

let client = null;
let db = null;

// MongoDB bağlantısı
async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('MongoDB Atlas bağlantısı başarılı');
    return { client, db };
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
}

// Ürün veritabanı sınıfı
export class MongoDBUrunDB {
  constructor() {
    this.collectionName = 'urunler';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const urunler = await collection.find({}).toArray();
      console.log('MongoDB UrunDB getAll - Veri sayısı:', urunler.length);
      return urunler;
    } catch (error) {
      console.error('MongoDB UrunDB getAll hatası:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      return await collection.findOne({ id: parseInt(id) });
    } catch (error) {
      console.error('MongoDB UrunDB getById hatası:', error);
      return null;
    }
  }

  async add(urun) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniUrun = {
        ...urun,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniUrun);
      console.log('MongoDB UrunDB add - Yeni ürün eklendi:', yeniUrun.id);
      return yeniUrun;
    } catch (error) {
      console.error('MongoDB UrunDB add hatası:', error);
      return null;
    }
  }

  async update(id, guncelUrun) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      const guncellenenUrun = {
        ...guncelUrun,
        id: parseInt(id),
        updated_at: new Date().toISOString()
      };
      
      const result = await collection.replaceOne(
        { id: parseInt(id) },
        guncellenenUrun
      );
      
      if (result.modifiedCount > 0) {
        console.log('MongoDB UrunDB update - Ürün güncellendi:', id);
        return guncellenenUrun;
      }
      return null;
    } catch (error) {
      console.error('MongoDB UrunDB update hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.deleteOne({ id: parseInt(id) });
      
      if (result.deletedCount > 0) {
        console.log('MongoDB UrunDB delete - Ürün silindi:', id);
        return { id: parseInt(id) };
      }
      return null;
    } catch (error) {
      console.error('MongoDB UrunDB delete hatası:', error);
      return null;
    }
  }
}

// Koli veritabanı sınıfı
export class MongoDBKoliDB {
  constructor() {
    this.collectionName = 'koliler';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const koliler = await collection.find({}).toArray();
      console.log('MongoDB KoliDB getAll - Veri sayısı:', koliler.length);
      return koliler;
    } catch (error) {
      console.error('MongoDB KoliDB getAll hatası:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      return await collection.findOne({ id: parseInt(id) });
    } catch (error) {
      console.error('MongoDB KoliDB getById hatası:', error);
      return null;
    }
  }

  async add(koli) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniKoli = {
        ...koli,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniKoli);
      console.log('MongoDB KoliDB add - Yeni koli eklendi:', yeniKoli.id);
      return yeniKoli;
    } catch (error) {
      console.error('MongoDB KoliDB add hatası:', error);
      return null;
    }
  }

  async update(id, guncelKoli) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      const guncellenenKoli = {
        ...guncelKoli,
        id: parseInt(id),
        updated_at: new Date().toISOString()
      };
      
      const result = await collection.replaceOne(
        { id: parseInt(id) },
        guncellenenKoli
      );
      
      if (result.modifiedCount > 0) {
        console.log('MongoDB KoliDB update - Koli güncellendi:', id);
        return guncellenenKoli;
      }
      return null;
    } catch (error) {
      console.error('MongoDB KoliDB update hatası:', error);
      return null;
    }
  }

  async delete(id) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.deleteOne({ id: parseInt(id) });
      
      if (result.deletedCount > 0) {
        console.log('MongoDB KoliDB delete - Koli silindi:', id);
        return { id: parseInt(id) };
      }
      return null;
    } catch (error) {
      console.error('MongoDB KoliDB delete hatası:', error);
      return null;
    }
  }
}

// Kullanıcı veritabanı sınıfı
export class MongoDBKullaniciDB {
  constructor() {
    this.collectionName = 'kullanicilar';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const kullanicilar = await collection.find({}).toArray();
      console.log('MongoDB KullaniciDB getAll - Veri sayısı:', kullanicilar.length);
      return kullanicilar;
    } catch (error) {
      console.error('MongoDB KullaniciDB getAll hatası:', error);
      return [];
    }
  }

  async getByKullaniciAdi(kullaniciAdi) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      return await collection.findOne({ 
        kullanici_adi: kullaniciAdi,
        aktif: true 
      });
    } catch (error) {
      console.error('MongoDB KullaniciDB getByKullaniciAdi hatası:', error);
      return null;
    }
  }

  async getByUsername(username) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      return await collection.findOne({ 
        kullanici_adi: username,
        aktif: true 
      });
    } catch (error) {
      console.error('MongoDB KullaniciDB getByUsername hatası:', error);
      return null;
    }
  }

  async add(kullanici) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniKullanici = {
        ...kullanici,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniKullanici);
      console.log('MongoDB KullaniciDB add - Yeni kullanıcı eklendi:', yeniKullanici.id);
      return yeniKullanici;
    } catch (error) {
      console.error('MongoDB KullaniciDB add hatası:', error);
      return null;
    }
  }
}

// Aktivite veritabanı sınıfı
export class MongoDBAktiviteDB {
  constructor() {
    this.collectionName = 'aktiviteler';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const aktiviteler = await collection.find({}).sort({ tarih: -1 }).toArray();
      console.log('MongoDB AktiviteDB getAll - Veri sayısı:', aktiviteler.length);
      return aktiviteler;
    } catch (error) {
      console.error('MongoDB AktiviteDB getAll hatası:', error);
      return [];
    }
  }

  async add(aktivite) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniAktivite = {
        ...aktivite,
        id: newId,
        tarih: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniAktivite);
      console.log('MongoDB AktiviteDB add - Yeni aktivite eklendi:', yeniAktivite.id);
      return yeniAktivite;
    } catch (error) {
      console.error('MongoDB AktiviteDB add hatası:', error);
      return null;
    }
  }
}

// Toplama veritabanı sınıfı
export class MongoDBToplamaDB {
  constructor() {
    this.collectionName = 'toplama';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const toplamalar = await collection.find({}).sort({ tarih: -1 }).toArray();
      console.log('MongoDB ToplamaDB getAll - Veri sayısı:', toplamalar.length);
      return toplamalar;
    } catch (error) {
      console.error('MongoDB ToplamaDB getAll hatası:', error);
      return [];
    }
  }

  async add(toplama) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniToplama = {
        ...toplama,
        id: newId,
        tarih: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniToplama);
      console.log('MongoDB ToplamaDB add - Yeni toplama eklendi:', yeniToplama.id);
      return yeniToplama;
    } catch (error) {
      console.error('MongoDB ToplamaDB add hatası:', error);
      return null;
    }
  }

  async delete(fisNo) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.deleteOne({ fis_no: fisNo });
      
      if (result.deletedCount > 0) {
        console.log('MongoDB ToplamaDB delete - Toplama silindi:', fisNo);
        return { fis_no: fisNo };
      }
      return null;
    } catch (error) {
      console.error('MongoDB ToplamaDB delete hatası:', error);
      return null;
    }
  }
}

// Transfer veritabanı sınıfı
export class MongoDBTransferDB {
  constructor() {
    this.collectionName = 'transfer';
  }

  async getAll() {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      const transferler = await collection.find({}).sort({ tarih: -1 }).toArray();
      console.log('MongoDB TransferDB getAll - Veri sayısı:', transferler.length);
      return transferler;
    } catch (error) {
      console.error('MongoDB TransferDB getAll hatası:', error);
      return [];
    }
  }

  async add(transfer) {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection(this.collectionName);
      
      // Yeni ID oluştur
      const maxId = await collection.findOne({}, { sort: { id: -1 } });
      const newId = maxId ? maxId.id + 1 : 1;
      
      const yeniTransfer = {
        ...transfer,
        id: newId,
        tarih: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      await collection.insertOne(yeniTransfer);
      console.log('MongoDB TransferDB add - Yeni transfer eklendi:', yeniTransfer.id);
      return yeniTransfer;
    } catch (error) {
      console.error('MongoDB TransferDB add hatası:', error);
      return null;
    }
  }
}

// MongoDB veritabanı instance'ları
export const urunDB = new MongoDBUrunDB();
export const koliDB = new MongoDBKoliDB();
export const kullaniciDB = new MongoDBKullaniciDB();
export const aktiviteDB = new MongoDBAktiviteDB();
export const toplamaDB = new MongoDBToplamaDB();
export const transferDB = new MongoDBTransferDB();

// Bağlantıyı kapat
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB bağlantısı kapatıldı');
  }
}
