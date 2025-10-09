const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client/build')));

// Veritabanı bağlantısı
// Render.com için memory database kullan, local için file database
const dbPath = process.env.NODE_ENV === 'production' ? ':memory:' : './vms_database.sqlite';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('Veritabanı bağlantısı başarılı');
    initializeDatabase();
  }
});

// Veritabanı tablolarını oluştur
function initializeDatabase() {
  // Koli tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    koli_no TEXT UNIQUE NOT NULL,
    lokasyon TEXT,
    durum TEXT DEFAULT 'aktif',
    kapasite INTEGER DEFAULT 100,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Kapasite kolonu ekle (eğer yoksa) - hata kontrolü ile
  db.run(`ALTER TABLE koli ADD COLUMN kapasite INTEGER DEFAULT 100`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Kapasite kolonu eklenirken hata:', err);
    }
  });

  // Ürün tablosu
  db.run(`CREATE TABLE IF NOT EXISTS urun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barkod TEXT UNIQUE NOT NULL,
    urun_adi TEXT NOT NULL,
    aciklama TEXT,
    birim TEXT DEFAULT 'adet',
    beden TEXT,
    ana_blok TEXT,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Mevcut tabloda eksik kolonlar varsa ekle (idempotent)
  db.run("ALTER TABLE urun ADD COLUMN beden TEXT", () => {});
  db.run("ALTER TABLE urun ADD COLUMN ana_blok TEXT", () => {});

  // Koli-Ürün ilişki tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli_urun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (koli_no) REFERENCES koli (koli_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun (barkod)
  )`);
  // Upsert için benzersiz indeks
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_koli_urun_unique ON koli_urun (koli_no, urun_barkod)`);
  
  // Performans için ek indeksler
  db.run(`CREATE INDEX IF NOT EXISTS idx_urun_barkod ON urun (barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_urun_barkod ON koli_urun (urun_barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_no ON koli (koli_no)`);

  // Alış irsaliyesi tablosu
  db.run(`CREATE TABLE IF NOT EXISTS alis_irsaliyesi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_no TEXT UNIQUE NOT NULL,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    durum TEXT DEFAULT 'beklemede',
    toplam_koli INTEGER DEFAULT 0,
    aciklama TEXT
  )`);

  // İrsaliye-Koli ilişki tablosu
  db.run(`CREATE TABLE IF NOT EXISTS irsaliye_koli (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    irsaliye_no TEXT NOT NULL,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER NOT NULL,
    FOREIGN KEY (irsaliye_no) REFERENCES alis_irsaliyesi (irsaliye_no),
    FOREIGN KEY (koli_no) REFERENCES koli (koli_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun (barkod)
  )`);

  // Koli transfer tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli_transfer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT UNIQUE NOT NULL,
    cikan_koli TEXT NOT NULL,
    giren_koli TEXT NOT NULL,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    durum TEXT DEFAULT 'tamamlandi',
    aciklama TEXT
  )`);

  // Transfer detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS transfer_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER NOT NULL,
    FOREIGN KEY (transfer_no) REFERENCES koli_transfer (transfer_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun (barkod)
  )`);

  // Toplama fişi tablosu
  db.run(`CREATE TABLE IF NOT EXISTS toplama_fisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fisi_no TEXT UNIQUE NOT NULL,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    durum TEXT DEFAULT 'toplanıyor',
    toplam_urun INTEGER DEFAULT 0,
    aciklama TEXT
  )`);

  // Toplama detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS toplama_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fisi_no TEXT NOT NULL,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER NOT NULL,
    FOREIGN KEY (fisi_no) REFERENCES toplama_fisi (fisi_no),
    FOREIGN KEY (koli_no) REFERENCES koli (koli_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun (barkod)
  )`);

  // Sayım tablosu
  db.run(`CREATE TABLE IF NOT EXISTS sayim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sayim_no TEXT UNIQUE NOT NULL,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    durum TEXT DEFAULT 'devam_ediyor',
    toplam_koli INTEGER DEFAULT 0,
    aciklama TEXT
  )`);

  // Sayım detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS sayim_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sayim_no TEXT NOT NULL,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    teorik_adet INTEGER DEFAULT 0,
    fiziksel_adet INTEGER DEFAULT 0,
    fark INTEGER DEFAULT 0,
    FOREIGN KEY (sayim_no) REFERENCES sayim (sayim_no),
    FOREIGN KEY (koli_no) REFERENCES koli (koli_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun (barkod)
  )`);
}

// API Routes

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Koli yönetimi
app.get('/api/koli', (req, res) => {
  db.all("SELECT * FROM koli ORDER BY koli_no", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/koli', (req, res) => {
  const { koli_no, lokasyon } = req.body;
  
  db.run("INSERT INTO koli (koli_no, lokasyon) VALUES (?, ?)", 
    [koli_no, lokasyon], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Koli başarıyla oluşturuldu' });
  });
});

// Ürün yönetimi
app.get('/api/urun', (req, res) => {
  const { q } = req.query;
  let sql = `
    SELECT 
      u.*, 
      COALESCE(SUM(ku.adet), 0) AS toplam_adet,
      GROUP_CONCAT(DISTINCT ku.koli_no) AS koliler
    FROM urun u
    LEFT JOIN koli_urun ku ON ku.urun_barkod = u.barkod
  `;
  const params = [];
  if (q && q.trim()) {
    sql += " WHERE u.barkod LIKE ? OR u.urun_adi LIKE ?";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " GROUP BY u.barkod ORDER BY u.urun_adi LIMIT 1000";

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Barkoda/ürün adına göre konum kırılımı (hangi kolilerde kaç adet var?)
app.get('/api/urun/konum', (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'q (barkod veya ürün adı) gereklidir' });
  }

  const sql = `
    SELECT 
      u.barkod,
      u.urun_adi,
      u.beden,
      u.ana_blok,
      ku.koli_no,
      k.lokasyon,
      COALESCE(ku.adet, 0) as adet
    FROM urun u
    LEFT JOIN koli_urun ku ON ku.urun_barkod = u.barkod
    LEFT JOIN koli k ON k.koli_no = ku.koli_no
    WHERE u.barkod = ? OR u.urun_adi LIKE ?
    ORDER BY u.barkod, ku.koli_no`;

  const params = [q.trim(), `%${q.trim()}%`];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json(rows);
  });
});

app.post('/api/urun', (req, res) => {
  const { barkod, urun_adi, aciklama, birim, beden, koli_no } = req.body;
  
  db.run("INSERT INTO urun (barkod, urun_adi, aciklama, birim, beden, ana_blok) VALUES (?, ?, ?, ?, ?, ?)", 
    [barkod, urun_adi || '', aciklama, birim, beden, koli_no], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Ürün başarıyla oluşturuldu' });
  });
});

// Barkoda göre koli sorgusu (hangi kolide?)
app.get('/api/urun/koli-sorgu', (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'q (barkod) gereklidir' });
  }

  const sql = `
    SELECT 
      u.barkod,
      u.urun_adi,
      u.beden,
      ku.koli_no,
      k.lokasyon,
      COALESCE(ku.adet, 0) as adet
    FROM urun u
    INNER JOIN koli_urun ku ON ku.urun_barkod = u.barkod
    INNER JOIN koli k ON k.koli_no = ku.koli_no
    WHERE u.barkod = ?
    ORDER BY ku.koli_no`;

  db.all(sql, [q.trim()], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json(rows);
  });
});

// Ürün tekil silme (barkod ile)
app.delete('/api/urun/:barkod', (req, res) => {
  const { barkod } = req.params;
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM koli_urun WHERE urun_barkod = ?', [barkod]);
    db.run('DELETE FROM urun WHERE barkod = ?', [barkod], function(err){
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      db.run('COMMIT', (e) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json({ deleted: this.changes > 0 });
      });
    });
  });
});

// Koli bazlı ürün çıkışı (barkod okuma ile)
app.post('/api/urun/cikis', (req, res) => {
  const { koli_no, urun_barkod, adet = 1 } = req.body;
  
  if (!koli_no || !urun_barkod) {
    return res.status(400).json({ error: 'koli_no ve urun_barkod gereklidir' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Mevcut stoku kontrol et
    db.get('SELECT adet FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?', 
      [koli_no, urun_barkod], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Ürün bu kolide bulunamadı' });
      }
      
      const mevcutAdet = row.adet;
      const cikisAdet = parseInt(adet) || 1;
      
      if (mevcutAdet < cikisAdet) {
        db.run('ROLLBACK');
        return res.status(400).json({ 
          error: `Yetersiz stok. Mevcut: ${mevcutAdet}, İstenen: ${cikisAdet}` 
        });
      }
      
      const yeniAdet = mevcutAdet - cikisAdet;
      
      if (yeniAdet === 0) {
        // Stok sıfırlanırsa kaydı sil
        db.run('DELETE FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?', 
          [koli_no, urun_barkod], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ 
              message: 'Ürün çıkışı tamamlandı', 
              cikan_adet: cikisAdet,
              kalan_adet: 0
            });
          });
        });
      } else {
        // Stok güncelle
        db.run('UPDATE koli_urun SET adet = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE koli_no = ? AND urun_barkod = ?', 
          [yeniAdet, koli_no, urun_barkod], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ 
              message: 'Ürün çıkışı tamamlandı', 
              cikan_adet: cikisAdet,
              kalan_adet: yeniAdet
            });
          });
        });
      }
    });
  });
});

// Ürün toplu silme
app.post('/api/urun/delete-bulk', (req, res) => {
  const { barkodlar } = req.body;
  if (!Array.isArray(barkodlar) || barkodlar.length === 0) {
    return res.status(400).json({ error: 'barkodlar[] gerekli' });
  }
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const placeholders = barkodlar.map(() => '?').join(',');
    db.run(`DELETE FROM koli_urun WHERE urun_barkod IN (${placeholders})`, barkodlar);
    db.run(`DELETE FROM urun WHERE barkod IN (${placeholders})`, barkodlar, function(err){
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      db.run('COMMIT', (e) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json({ deletedCount: this.changes });
      });
    });
  });
});

// EXCEL ile Ürün İçe Aktarma (ve koli atama)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/urun/import-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası gerekli (form alanı: file)' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Excel sayfası boş' });
    }

    // Başlıkları normalize et: türkçe karakterleri sadeleştir, boşluk/noktalama kaldır
    const normalizeKey = (s) => String(s)
      .toLowerCase()
      .replace(/[ıİ]/g, 'i')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/[^a-z0-9]+/g, '');

    // Toplu işlem
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      rows.forEach((r) => {
        // Satır anahtarlarını normalize edilmiş map'e çevir
        const map = {};
        Object.keys(r).forEach((k) => {
          map[normalizeKey(k)] = r[k];
        });

        const barkod = String(map['urunbarkodu'] || map['barkod'] || '').trim();
        const urunAdi = String(map['urunismi'] || map['urunadi'] || '').trim();
        const beden = String(map['urunbedeni'] || map['beden'] || '').trim();
        const anaBlok = String(
          map['urununbulunananablogu'] || // "ÜRÜNÜN BULUNAN ANA BLOĞU"
          map['anablok'] ||
          map['blok'] ||
          ''
        ).trim();
        const koliNo = String(
          map['urununkolisi'] || // "ÜRÜNÜN KOLİSİ"
          map['kolino'] ||
          map['koli'] ||
          map['koliismi'] ||
          ''
        ).trim();
        const adetRaw = map['adet'] ?? map['miktar'];
        const adetNum = parseFloat(adetRaw);
        const adet = isNaN(adetNum) ? 1 : Math.max(0, adetNum);

        if (!barkod || !urunAdi) {
          return; // zorunlu alanlar yoksa satırı atla
        }

        // Ürün upsert
        db.run(
          `INSERT INTO urun (barkod, urun_adi, birim, beden, ana_blok)
           VALUES (?, ?, 'adet', ?, ?)
           ON CONFLICT(barkod) DO UPDATE SET
             urun_adi=excluded.urun_adi,
             beden=excluded.beden,
             ana_blok=excluded.ana_blok`,
          [barkod, urunAdi, beden, anaBlok]
        );

        if (koliNo) {
          // Koli var/yok oluştur
          db.run('INSERT OR IGNORE INTO koli (koli_no, lokasyon) VALUES (?, ?)', [koliNo, anaBlok || null]);
          // Lokasyonu güncelle (excelde varsa üzerine yaz)
          if (anaBlok) {
            db.run('UPDATE koli SET lokasyon = ? WHERE koli_no = ?', [anaBlok, koliNo]);
          }

          // Koli-Ürün adet güncelle
          db.run(
            `INSERT INTO koli_urun (koli_no, urun_barkod, adet)
             VALUES (?, ?, ?)
             ON CONFLICT(koli_no, urun_barkod) DO UPDATE SET adet = excluded.adet`,
            [koliNo, barkod, adet]
          );
        }
      });

      db.run('COMMIT', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ message: 'Excel içe aktarma tamamlandı' });
      });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Excel içe aktarma başarısız' });
  }
});

// Koli envanter raporu
app.get('/api/koli-envanter', (req, res) => {
  const query = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.durum,
      ku.urun_barkod,
      u.urun_adi,
      ku.adet,
      ku.guncelleme_tarihi
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no
    LEFT JOIN urun u ON ku.urun_barkod = u.barkod
    ORDER BY k.koli_no, u.urun_adi
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Koli listesi (ürün sayısı ve doluluk oranı ile)
app.get('/api/koli-liste', (req, res) => {
  const sql = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.durum,
      k.kapasite,
      COUNT(ku.urun_barkod) as urun_sayisi,
      COALESCE(SUM(ku.adet), 0) as toplam_adet,
      CASE 
        WHEN k.kapasite > 0 THEN ROUND((COALESCE(SUM(ku.adet), 0) * 100.0 / k.kapasite), 1)
        ELSE 0
      END as doluluk_orani
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no AND ku.adet > 0
    GROUP BY k.koli_no, k.lokasyon, k.durum, k.kapasite
    ORDER BY k.koli_no
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Belirli kolideki ürünler
app.get('/api/koli/:koli_no/urunler', (req, res) => {
  const { koli_no } = req.params;
  
  const sql = `
    SELECT 
      ku.urun_barkod,
      u.urun_adi,
      u.beden,
      ku.adet,
      ku.guncelleme_tarihi
    FROM koli_urun ku
    JOIN urun u ON ku.urun_barkod = u.barkod
    WHERE ku.koli_no = ? AND ku.adet > 0
    ORDER BY u.urun_adi
  `;
  
  db.all(sql, [koli_no], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Boş koli raporu
app.get('/api/bos-koli', (req, res) => {
  const query = `
    SELECT k.koli_no, k.lokasyon
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no
    WHERE ku.koli_no IS NULL OR ku.adet = 0
    ORDER BY k.koli_no
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Alış irsaliyesi
app.post('/api/alis-irsaliyesi', (req, res) => {
  const { irsaliye_no, koliler } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // İrsaliye kaydı oluştur
    db.run("INSERT INTO alis_irsaliyesi (irsaliye_no, toplam_koli) VALUES (?, ?)", 
      [irsaliye_no, koliler.length], function(err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Koli detaylarını kaydet
      let completed = 0;
      koliler.forEach((koli, index) => {
        const { koli_no, urunler } = koli;
        
        // Koli kaydını oluştur
        db.run("INSERT OR IGNORE INTO koli (koli_no) VALUES (?)", [koli_no]);
        
        // Ürünleri koliye ata
        urunler.forEach((urun) => {
          db.run(`INSERT INTO irsaliye_koli (irsaliye_no, koli_no, urun_barkod, adet) 
                   VALUES (?, ?, ?, ?)`,
            [irsaliye_no, koli_no, urun.barkod, urun.adet], function(err) {
            if (err) {
              db.run("ROLLBACK");
              res.status(500).json({ error: err.message });
              return;
            }
            
            // Koli-ürün tablosunu güncelle
            db.run(`INSERT OR REPLACE INTO koli_urun (koli_no, urun_barkod, adet) 
                     VALUES (?, ?, ?)`,
              [koli_no, urun.barkod, urun.adet]);
          });
        });
        
        completed++;
        if (completed === koliler.length) {
          db.run("COMMIT", (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
            } else {
              res.json({ message: 'Alış irsaliyesi başarıyla kaydedildi' });
            }
          });
        }
      });
    });
  });
});

// Koli transfer
app.post('/api/koli-transfer', (req, res) => {
  const { cikan_koli, giren_koli, urunler } = req.body;
  const transfer_no = uuidv4().substring(0, 8).toUpperCase();
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Transfer kaydı oluştur
    db.run("INSERT INTO koli_transfer (transfer_no, cikan_koli, giren_koli) VALUES (?, ?, ?)",
      [transfer_no, cikan_koli, giren_koli], function(err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Transfer detaylarını kaydet
      let completed = 0;
      urunler.forEach((urun) => {
        db.run("INSERT INTO transfer_detay (transfer_no, urun_barkod, adet) VALUES (?, ?, ?)",
          [transfer_no, urun.barkod, urun.adet], function(err) {
          if (err) {
            db.run("ROLLBACK");
            res.status(500).json({ error: err.message });
            return;
          }
          
          // Çıkan koliden ürünü düş
          db.run("UPDATE koli_urun SET adet = adet - ? WHERE koli_no = ? AND urun_barkod = ?",
            [urun.adet, cikan_koli, urun.barkod]);
          
          // Giren koliye ürünü ekle
          db.run(`INSERT OR REPLACE INTO koli_urun (koli_no, urun_barkod, adet) 
                   VALUES (?, ?, COALESCE((SELECT adet FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?), 0) + ?)`,
            [giren_koli, urun.barkod, giren_koli, urun.barkod, urun.adet]);
          
          completed++;
          if (completed === urunler.length) {
            db.run("COMMIT", (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.json({ transfer_no, message: 'Koli transferi başarıyla tamamlandı' });
              }
            });
          }
        });
      });
    });
  });
});

// Toplama fişi
app.post('/api/toplama-fisi', (req, res) => {
  const { siparis_no, toplama_listesi } = req.body;
  const fisi_no = `TF-${Date.now()}`;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Toplama fişi kaydı oluştur
    db.run("INSERT INTO toplama_fisi (fisi_no, toplam_urun) VALUES (?, ?)",
      [fisi_no, toplama_listesi.length], function(err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Toplama detaylarını kaydet
      let completed = 0;
      toplama_listesi.forEach((item) => {
        db.run("INSERT INTO toplama_detay (fisi_no, koli_no, urun_barkod, adet) VALUES (?, ?, ?, ?)",
          [fisi_no, item.koli_no, item.urun_barkod, item.adet], function(err) {
          if (err) {
            db.run("ROLLBACK");
            res.status(500).json({ error: err.message });
            return;
          }
          
          // Koli envanterinden düş
          db.run("UPDATE koli_urun SET adet = adet - ? WHERE koli_no = ? AND urun_barkod = ?",
            [item.adet, item.koli_no, item.urun_barkod]);
          
          completed++;
          if (completed === toplama_listesi.length) {
            db.run("COMMIT", (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.json({ fisi_no, message: 'Toplama fişi başarıyla oluşturuldu' });
              }
            });
          }
        });
      });
    });
  });
});

// Toplama fişi listesi
app.get('/api/toplama-fisi', (req, res) => {
  const { tarih } = req.query;
  
  let query = `
    SELECT 
      tf.fisi_no,
      tf.tarih,
      tf.toplam_urun,
      COUNT(td.id) as cikis_sayisi
    FROM toplama_fisi tf
    LEFT JOIN toplama_detay td ON tf.fisi_no = td.fisi_no
  `;
  
  const params = [];
  if (tarih) {
    query += ` WHERE DATE(tf.tarih) = ?`;
    params.push(tarih);
  }
  
  query += ` GROUP BY tf.fisi_no, tf.tarih, tf.toplam_urun ORDER BY tf.tarih DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Toplama fişi detayları
app.get('/api/toplama-fisi/:fisi_no', (req, res) => {
  const { fisi_no } = req.params;
  
  const query = `
    SELECT 
      td.*,
      u.urun_adi,
      u.beden,
      k.lokasyon
    FROM toplama_detay td
    LEFT JOIN urun u ON td.urun_barkod = u.barkod
    LEFT JOIN koli k ON td.koli_no = k.koli_no
    WHERE td.fisi_no = ?
    ORDER BY td.id
  `;
  
  db.all(query, [fisi_no], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Sayım işlemi
app.post('/api/sayim', (req, res) => {
  const { koli_listesi } = req.body;
  const sayim_no = `SY-${Date.now()}`;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    // Sayım kaydı oluştur
    db.run("INSERT INTO sayim (sayim_no, toplam_koli) VALUES (?, ?)",
      [sayim_no, koli_listesi.length], function(err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Sayım detaylarını kaydet
      let completed = 0;
      koli_listesi.forEach((koli) => {
        const { koli_no, urunler } = koli;
        
        urunler.forEach((urun) => {
          // Teorik adedi al
          db.get("SELECT adet FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?",
            [koli_no, urun.barkod], (err, row) => {
            if (err) {
              db.run("ROLLBACK");
              res.status(500).json({ error: err.message });
              return;
            }
            
            const teorik_adet = row ? row.adet : 0;
            const fiziksel_adet = urun.adet;
            const fark = fiziksel_adet - teorik_adet;
            
            db.run(`INSERT INTO sayim_detay 
                     (sayim_no, koli_no, urun_barkod, teorik_adet, fiziksel_adet, fark) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
              [sayim_no, koli_no, urun.barkod, teorik_adet, fiziksel_adet, fark], function(err) {
              if (err) {
                db.run("ROLLBACK");
                res.status(500).json({ error: err.message });
                return;
              }
              
              // Fiziksel adedi güncelle
              db.run(`INSERT OR REPLACE INTO koli_urun (koli_no, urun_barkod, adet) 
                       VALUES (?, ?, ?)`,
                [koli_no, urun.barkod, fiziksel_adet]);
              
              completed++;
              if (completed === koli_listesi.reduce((acc, koli) => acc + koli.urunler.length, 0)) {
                db.run("COMMIT", (err) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                  } else {
                    res.json({ sayim_no, message: 'Sayım başarıyla tamamlandı' });
                  }
                });
              }
            });
          });
        });
      });
    });
  });
});

// Raporlar
app.get('/api/rapor/siparis/:siparis_no', (req, res) => {
  const { siparis_no } = req.params;
  
  // Bu rapor sipariş numarasına göre koli bazlı ürün dağılımını gösterir
  const query = `
    SELECT 
      ku.koli_no,
      k.lokasyon,
      u.urun_adi,
      ku.adet,
      u.barkod
    FROM koli_urun ku
    JOIN koli k ON ku.koli_no = k.koli_no
    JOIN urun u ON ku.urun_barkod = u.barkod
    WHERE ku.adet > 0
    ORDER BY ku.koli_no, u.urun_adi
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/rapor/koli-envanter', (req, res) => {
  const { min_adet = 0, max_adet = 999999, sadece_bos = false } = req.query;
  
  let query = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      COALESCE(SUM(ku.adet), 0) as toplam_adet,
      COUNT(DISTINCT ku.urun_barkod) as urun_cesidi
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no
    GROUP BY k.koli_no, k.lokasyon
    HAVING toplam_adet >= ? AND toplam_adet <= ?
  `;
  
  const params = [min_adet, max_adet];
  
  if (sadece_bos === 'true') {
    query = query.replace('HAVING toplam_adet >= ? AND toplam_adet <= ?', 'HAVING toplam_adet = 0');
    params.splice(0, 2);
  }
  
  query += ' ORDER BY k.koli_no';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Server başlat
// Akıllı koli önerileri
app.get('/api/dashboard/smart-suggestions', (req, res) => {
  const sql = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.kapasite,
      COALESCE(SUM(ku.adet), 0) as toplam_adet,
      CASE 
        WHEN k.kapasite > 0 THEN ROUND((COALESCE(SUM(ku.adet), 0) * 100.0 / k.kapasite), 1)
        ELSE 0
      END as doluluk_orani
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no AND ku.adet > 0
    GROUP BY k.koli_no, k.lokasyon, k.kapasite
    HAVING doluluk_orani < 20 OR doluluk_orani > 80
    ORDER BY doluluk_orani
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    
    const suggestions = [];
    const lowCapacity = rows.filter(r => r.doluluk_orani < 20);
    const highCapacity = rows.filter(r => r.doluluk_orani > 80);
    
    // Düşük kapasiteli kolileri yüksek kapasiteli kolilere taşıma önerisi
    if (lowCapacity.length > 0 && highCapacity.length > 0) {
      suggestions.push({
        type: 'consolidation',
        title: 'Koli Birleştirme Önerisi',
        description: `${lowCapacity.length} düşük kapasiteli koli, ${highCapacity.length} yüksek kapasiteli koliye taşınabilir`,
        from: lowCapacity.slice(0, 3).map(k => k.koli_no),
        to: highCapacity.slice(0, 2).map(k => k.koli_no),
        priority: 'high'
      });
    }
    
    res.json(suggestions);
  });
});

// Dashboard aktiviteleri
app.get('/api/dashboard/activities', (req, res) => {
  const activities = [];
  
  // Son toplama fişlerini al
  db.all("SELECT * FROM toplama_fisi ORDER BY tarih DESC LIMIT 5", (err, rows) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    
    rows.forEach(row => {
      activities.push({
        time: new Date(row.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        action: 'Ürün Çıkışı',
        detail: `Toplama Fişi #${row.id} - ${row.toplam_adet} adet`
      });
    });
    
    // Son koli transferlerini al
    db.all("SELECT * FROM koli_transfer ORDER BY tarih DESC LIMIT 3", (err, transferRows) => {
      if (err) {
        console.error(err);
        return res.json(activities);
      }
      
      transferRows.forEach(row => {
        activities.push({
          time: new Date(row.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          action: 'Koli Transferi',
          detail: `${row.cikan_koli} → ${row.giren_koli}`
        });
      });
      
      // Tarihe göre sırala ve son 5'i al
      activities.sort((a, b) => b.time.localeCompare(a.time));
      res.json(activities.slice(0, 5));
    });
  });
});

app.listen(PORT, () => {
  console.log(`VMS Server ${PORT} portunda çalışıyor`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${dbPath}`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatma hatası:', err.message);
    } else {
      console.log('Veritabanı bağlantısı kapatıldı');
    }
    process.exit(0);
  });
});
