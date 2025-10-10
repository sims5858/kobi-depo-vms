const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vms-secret-key-2025';

// Terminal log buffer
const terminalLogBuffer = [];
const TERMINAL_LOG_MAX = 1000;
const pushTerminalLog = (level, args) => {
  try {
    const text = args.map(a => {
      if (a instanceof Error) return `${a.message}\n${a.stack}`;
      if (typeof a === 'object') return JSON.stringify(a);
      return String(a);
    }).join(' ');
    terminalLogBuffer.push({ timestamp: new Date().toISOString(), level, text });
    if (terminalLogBuffer.length > TERMINAL_LOG_MAX) terminalLogBuffer.shift();
  } catch (_) {}
};

// Console wrap
const _log = console.log.bind(console);
const _info = console.info ? console.info.bind(console) : console.log.bind(console);
const _warn = console.warn.bind(console);
const _error = console.error.bind(console);
console.log = (...args) => { pushTerminalLog('info', args); _log(...args); };
console.info = (...args) => { pushTerminalLog('info', args); _info(...args); };
console.warn = (...args) => { pushTerminalLog('warn', args); _warn(...args); };
console.error = (...args) => { pushTerminalLog('error', args); _error(...args); };

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'client/build')));

// React Router için catch-all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Log yazma fonksiyonu
const writeLog = (level, action, details, user = null, req = null) => {
  const ip = req ? req.ip : '127.0.0.1';
  const userAgent = req ? req.get('User-Agent') : 'System';
  
  db.run(
    'INSERT INTO system_logs (level, user, action, details, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
    [level, user, action, details, ip, userAgent],
    function(err) {
      if (err) {
        console.error('Log yazma hatası:', err);
      }
    }
  );
};

// Kimlik doğrulama middleware'i
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Unauthorized access attempt', { ip: req.ip, path: req.path });
    return res.status(401).json({ error: 'Erişim token\'ı gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('Invalid token attempt', { ip: req.ip, path: req.path, error: err.message });
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Admin yetkisi kontrolü
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Admin yetkisi gerekli' });
  }
  next();
};

// Veritabanı bağlantısı
const db = new sqlite3.Database('./vms_database.sqlite', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası', { error: err.message });
    process.exit(1);
  } else {
    console.log('Veritabanı bağlantısı başarılı');
    initializeDatabase();
  }
});

// Veritabanı tablolarını oluştur
function initializeDatabase() {
  // Kullanıcı tablosu
  db.run(`CREATE TABLE IF NOT EXISTS kullanici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_adi TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sifre TEXT NOT NULL,
    ad_soyad TEXT NOT NULL,
    rol TEXT DEFAULT 'kullanici',
    aktif INTEGER DEFAULT 1,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    son_giris DATETIME,
    olusturan_id INTEGER,
    FOREIGN KEY (olusturan_id) REFERENCES kullanici(id)
  )`);

  // Kullanıcı oturum tablosu
  db.run(`CREATE TABLE IF NOT EXISTS kullanici_oturum (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    son_aktivite DATETIME DEFAULT CURRENT_TIMESTAMP,
    aktif INTEGER DEFAULT 1,
    FOREIGN KEY (kullanici_id) REFERENCES kullanici(id)
  )`);

  // Koli tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    koli_no TEXT UNIQUE NOT NULL,
    lokasyon TEXT,
    kapasite INTEGER DEFAULT 100,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ürün tablosu
  db.run(`CREATE TABLE IF NOT EXISTS urun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barkod TEXT UNIQUE NOT NULL,
    urun_adi TEXT,
    beden TEXT,
    ana_blok TEXT,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Koli-Ürün ilişki tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli_urun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER DEFAULT 1,
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (koli_no) REFERENCES koli(koli_no),
    FOREIGN KEY (urun_barkod) REFERENCES urun(barkod)
  )`);

  // Koli-Ürün benzersizliği: aynı ürün aynı kolide bir kez bulunmalı
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uq_koli_urun ON koli_urun(koli_no, urun_barkod)`);

  // Koli transfer tablosu
  db.run(`CREATE TABLE IF NOT EXISTS koli_transfer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT UNIQUE NOT NULL,
    cikan_koli TEXT NOT NULL,
    giren_koli TEXT NOT NULL,
    transfer_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    kullanici_id INTEGER,
    FOREIGN KEY (kullanici_id) REFERENCES kullanici(id)
  )`);

  // Transfer detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS transfer_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    adet INTEGER NOT NULL,
    FOREIGN KEY (transfer_no) REFERENCES koli_transfer(transfer_no)
  )`);

  // Toplama fişi tablosu
  db.run(`CREATE TABLE IF NOT EXISTS toplama_fisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fisi_no TEXT UNIQUE NOT NULL,
    toplama_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    kullanici_id INTEGER,
    FOREIGN KEY (kullanici_id) REFERENCES kullanici(id)
  )`);

  // Toplama detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS toplama_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fisi_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    koli_no TEXT NOT NULL,
    adet INTEGER NOT NULL,
    FOREIGN KEY (fisi_no) REFERENCES toplama_fisi(fisi_no)
  )`);

  // Sistem log tablosu
  db.run(`CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL,
    user TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip TEXT,
    user_agent TEXT
  )`);

  // Sayım tablosu
  db.run(`CREATE TABLE IF NOT EXISTS sayim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sayim_no TEXT UNIQUE NOT NULL,
    sayim_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    kullanici_id INTEGER,
    FOREIGN KEY (kullanici_id) REFERENCES kullanici(id)
  )`);

  // Sayım detay tablosu
  db.run(`CREATE TABLE IF NOT EXISTS sayim_detay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sayim_no TEXT NOT NULL,
    koli_no TEXT NOT NULL,
    urun_barkod TEXT NOT NULL,
    mevcut_adet INTEGER NOT NULL,
    sayilan_adet INTEGER NOT NULL,
    fark INTEGER NOT NULL,
    FOREIGN KEY (sayim_no) REFERENCES sayim(sayim_no)
  )`);

  // Index'ler
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_koli_urun_unique ON koli_urun (koli_no, urun_barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_urun_barkod ON urun (barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_urun_barkod ON koli_urun (urun_barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_no ON koli (koli_no)`);

  // Kapasite kolonu ekle (eğer yoksa)
  db.run(`ALTER TABLE koli ADD COLUMN kapasite INTEGER DEFAULT 100`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Kapasite kolonu eklenirken hata:', err);
    }
  });

  // Admin kullanıcısı oluştur
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO kullanici (kullanici_adi, email, sifre, ad_soyad, rol) VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'admin@vms.com', adminPassword, 'Sistem Yöneticisi', 'admin'],
    (err) => {
      if (err) {
        console.error('Admin kullanıcısı oluşturulurken hata:', err);
      } else {
        console.log('Admin kullanıcısı hazır: admin / admin123');
        // Örnek veri ekle
        addSampleData();
      }
    }
  );
}

// Örnek veri ekleme fonksiyonu
function addSampleData() {
  // Örnek koliler
  const sampleKolis = [
    { koli_no: 'A001', lokasyon: 'A Blok', kapasite: 100 },
    { koli_no: 'A002', lokasyon: 'A Blok', kapasite: 100 },
    { koli_no: 'B001', lokasyon: 'B Blok', kapasite: 100 },
    { koli_no: 'B002', lokasyon: 'B Blok', kapasite: 100 },
    { koli_no: 'C001', lokasyon: 'C Blok', kapasite: 100 }
  ];

  // Örnek ürünler
  const sampleUrunler = [
    { barkod: '197804390502', urun_adi: 'T-Shirt', beden: 'M', ana_blok: 'A Blok' },
    { barkod: '197804390503', urun_adi: 'Pantolon', beden: 'L', ana_blok: 'A Blok' },
    { barkod: '197804390504', urun_adi: 'Kazak', beden: 'S', ana_blok: 'B Blok' },
    { barkod: '197804390505', urun_adi: 'Etek', beden: 'M', ana_blok: 'B Blok' },
    { barkod: '197804390506', urun_adi: 'Ceket', beden: 'L', ana_blok: 'C Blok' }
  ];

  // Kolileri ekle
  sampleKolis.forEach((koli, index) => {
    db.run('INSERT OR IGNORE INTO koli (koli_no, lokasyon, kapasite) VALUES (?, ?, ?)',
      [koli.koli_no, koli.lokasyon, koli.kapasite],
      (err) => {
        if (err) {
          console.error(`Koli ekleme hatası (${koli.koli_no}):`, err);
        }
      }
    );
  });

  // Ürünleri ekle
  sampleUrunler.forEach((urun, index) => {
    db.run('INSERT OR IGNORE INTO urun (barkod, urun_adi, beden, ana_blok) VALUES (?, ?, ?, ?)',
      [urun.barkod, urun.urun_adi, urun.beden, urun.ana_blok],
      (err) => {
        if (err) {
          console.error(`Ürün ekleme hatası (${urun.barkod}):`, err);
        } else {
          // Koli-ürün ilişkisini ekle
          const koli_no = urun.ana_blok === 'A Blok' ? 'A001' : 
                         urun.ana_blok === 'B Blok' ? 'B001' : 'C001';
          const adet = Math.floor(Math.random() * 20) + 1; // 1-20 arası rastgele adet
          
          db.run('INSERT OR IGNORE INTO koli_urun (koli_no, urun_barkod, adet) VALUES (?, ?, ?)',
            [koli_no, urun.barkod, adet],
            (err) => {
              if (err) {
                console.error(`Koli-ürün ilişki hatası (${urun.barkod}):`, err);
              }
            }
          );
        }
      }
    );
  });

  console.log('Örnek veri eklendi: 5 koli, 5 ürün');
}

// Kullanıcı girişi
app.post('/api/auth/login', (req, res) => {
  const { kullanici_adi, sifre } = req.body;

  db.get('SELECT * FROM kullanici WHERE kullanici_adi = ? AND aktif = 1', [kullanici_adi], (err, user) => {
    if (err) {
      console.error('Database error during login', { error: err.message, kullanici_adi });
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    if (!user) {
      console.warn('Login attempt with invalid username', { kullanici_adi, ip: req.ip });
      writeLog('warn', 'LOGIN_FAILED', `Geçersiz kullanıcı adı: ${kullanici_adi}`, null, req);
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    bcrypt.compare(sifre, user.sifre, (err, result) => {
      if (err) {
        console.error('Bcrypt error during login', { error: err.message, kullanici_adi });
        return res.status(500).json({ error: 'Şifre doğrulama hatası' });
      }
      
      if (!result) {
        console.warn('Login attempt with invalid password', { kullanici_adi, ip: req.ip });
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Son giriş tarihini güncelle
      db.run('UPDATE kullanici SET son_giris = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (err) => {
        if (err) {
          console.error('Error updating last login', { error: err.message, userId: user.id });
        }
      });

      // JWT token oluştur
      const token = jwt.sign(
        {
          id: user.id,
          kullanici_adi: user.kullanici_adi,
          rol: user.rol
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Successful login', { kullanici_adi, userId: user.id, ip: req.ip });
      writeLog('success', 'LOGIN_SUCCESS', `Kullanıcı giriş yaptı: ${user.ad_soyad}`, user.kullanici_adi, req);

      res.json({
        token,
        user: {
          id: user.id,
          kullanici_adi: user.kullanici_adi,
          email: user.email,
          ad_soyad: user.ad_soyad,
          rol: user.rol
        }
      });
    });
  });
});

// Kullanıcı çıkışı
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Başarıyla çıkış yapıldı' });
});

// Mevcut kullanıcı bilgisi
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      kullanici_adi: req.user.kullanici_adi,
      rol: req.user.rol
    }
  });
});

// Admin: Kullanıcı listesi
app.get('/api/admin/kullanici', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, kullanici_adi, email, ad_soyad, rol, aktif, olusturma_tarihi, son_giris FROM kullanici ORDER BY olusturma_tarihi DESC', (err, rows) => {
    if (err) {
      console.error('Kullanıcı listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Admin: Yeni kullanıcı oluştur
app.post('/api/admin/kullanici', authenticateToken, requireAdmin, (req, res) => {
  const { kullanici_adi, email, sifre, ad_soyad, rol } = req.body;
  
  if (!kullanici_adi || !email || !sifre || !ad_soyad || !rol) {
    return res.status(400).json({ error: 'Tüm alanlar gerekli' });
  }

  const hashedPassword = bcrypt.hashSync(sifre, 10);
  
  db.run('INSERT INTO kullanici (kullanici_adi, email, sifre, ad_soyad, rol, olusturan_id) VALUES (?, ?, ?, ?, ?, ?)',
    [kullanici_adi, email, hashedPassword, ad_soyad, rol, req.user.id],
    function(err) {
      if (err) {
        console.error('Kullanıcı oluşturma hatası:', err);
        return res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
      }
      res.json({ id: this.lastID, message: 'Kullanıcı başarıyla oluşturuldu' });
    }
  );
});

// Admin: Kullanıcı güncelle
app.put('/api/admin/kullanici/:id', authenticateToken, requireAdmin, (req, res) => {
  const { kullanici_adi, email, ad_soyad, rol, aktif } = req.body;
  const userId = req.params.id;
  
  db.run('UPDATE kullanici SET kullanici_adi = ?, email = ?, ad_soyad = ?, rol = ?, aktif = ? WHERE id = ?',
    [kullanici_adi, email, ad_soyad, rol, aktif, userId],
    function(err) {
      if (err) {
        console.error('Kullanıcı güncelleme hatası:', err);
        return res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
      }
      res.json({ message: 'Kullanıcı başarıyla güncellendi' });
    }
  );
});

// Admin: Kullanıcı şifre değiştir
app.put('/api/admin/kullanici/:id/sifre', authenticateToken, requireAdmin, (req, res) => {
  const { sifre } = req.body;
  const userId = req.params.id;
  
  if (!sifre) {
    return res.status(400).json({ error: 'Şifre gerekli' });
  }

  const hashedPassword = bcrypt.hashSync(sifre, 10);
  
  db.run('UPDATE kullanici SET sifre = ? WHERE id = ?',
    [hashedPassword, userId],
    function(err) {
      if (err) {
        console.error('Şifre değiştirme hatası:', err);
        return res.status(500).json({ error: 'Şifre değiştirilemedi' });
      }
      res.json({ message: 'Şifre başarıyla değiştirildi' });
    }
  );
});

// Admin: Kullanıcı sil
app.delete('/api/admin/kullanici/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
  }
  
  db.run('DELETE FROM kullanici WHERE id = ?', [userId], function(err) {
    if (err) {
      console.error('Kullanıcı silme hatası:', err);
      return res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  });
});

// Yeni koli ekle
app.post('/api/koli', (req, res) => {
  const { koli_no, lokasyon, kapasite } = req.body;
  
  if (!koli_no) {
    return res.status(400).json({ error: 'Koli numarası gerekli' });
  }

  db.run('INSERT INTO koli (koli_no, lokasyon, kapasite) VALUES (?, ?, ?)',
    [koli_no, lokasyon || null, kapasite || 100],
    function(err) {
      if (err) {
        console.error('Koli ekleme hatası:', err);
        return res.status(500).json({ error: 'Koli eklenemedi' });
      }
      res.json({ id: this.lastID, message: 'Koli başarıyla eklendi' });
    }
  );
});

// Koli sil
app.delete('/api/koli/:koli_no', (req, res) => {
  const koli_no = req.params.koli_no;
  
  // Önce koli-ürün ilişkilerini sil
  db.run('DELETE FROM koli_urun WHERE koli_no = ?', [koli_no], (err) => {
    if (err) {
      console.error('Koli-ürün silme hatası:', err);
      return res.status(500).json({ error: 'Koli silinemedi' });
    }
    
    // Sonra koliyi sil
    db.run('DELETE FROM koli WHERE koli_no = ?', [koli_no], function(err) {
      if (err) {
        console.error('Koli silme hatası:', err);
        return res.status(500).json({ error: 'Koli silinemedi' });
      }
      res.json({ message: 'Koli başarıyla silindi' });
    });
  });
});

// Toplu koli sil
app.post('/api/koli/delete-bulk', (req, res) => {
  const { koli_nolar } = req.body;
  
  if (!koli_nolar || !Array.isArray(koli_nolar)) {
    return res.status(400).json({ error: 'Geçersiz koli listesi' });
  }

  const placeholders = koli_nolar.map(() => '?').join(',');
  
  // Önce koli-ürün ilişkilerini sil
  db.run(`DELETE FROM koli_urun WHERE koli_no IN (${placeholders})`, koli_nolar, (err) => {
    if (err) {
      console.error('Toplu koli-ürün silme hatası:', err);
      return res.status(500).json({ error: 'Koliler silinemedi' });
    }
    
    // Sonra kolileri sil
    db.run(`DELETE FROM koli WHERE koli_no IN (${placeholders})`, koli_nolar, function(err) {
      if (err) {
        console.error('Toplu koli silme hatası:', err);
        return res.status(500).json({ error: 'Koliler silinemedi' });
      }
      res.json({ message: `${koli_nolar.length} koli başarıyla silindi` });
    });
  });
});

// Koli listesi (ürün sayısı ile)
app.get('/api/koli-liste', (req, res) => {
  const query = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.kapasite,
      k.olusturma_tarihi,
      k.guncelleme_tarihi,
      COUNT(ku.urun_barkod) as urun_sayisi,
      COALESCE(SUM(ku.adet), 0) as toplam_adet,
      CASE WHEN COALESCE(SUM(ku.adet), 0) = 0 THEN 'bos' ELSE 'dolu' END as durum,
      CASE 
        WHEN k.kapasite > 0 THEN ROUND((COUNT(ku.urun_barkod) * 100.0 / k.kapasite), 2)
        ELSE 0 
      END as doluluk_orani
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no AND ku.adet > 0
    GROUP BY k.koli_no, k.lokasyon, k.kapasite, k.olusturma_tarihi, k.guncelleme_tarihi
    ORDER BY k.koli_no
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Koli listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Ürün listesi
app.get('/api/urun', (req, res) => {
  const { search, q } = req.query;
  let query = `
    SELECT 
      u.*,
      GROUP_CONCAT(DISTINCT ku.koli_no) as koliler,
      COALESCE(SUM(ku.adet), 0) as toplam_adet
    FROM urun u
    LEFT JOIN koli_urun ku ON u.barkod = ku.urun_barkod AND ku.adet > 0
  `;
  
  const params = [];
  const term = (q && q.toString().trim()) || (search && search.toString().trim());
  if (term) {
    query += ` WHERE u.barkod LIKE ? OR u.urun_adi LIKE ?`;
    params.push(`%${term}%`, `%${term}%`);
  }
  
  query += ` GROUP BY u.barkod ORDER BY u.urun_adi`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Ürün listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Yeni ürün ekle
app.post('/api/urun', (req, res) => {
  const { barkod, urun_adi, beden, koli_no } = req.body;
  
  if (!barkod) {
    return res.status(400).json({ error: 'Barkod gerekli' });
  }

  // Ürünü ekle
  db.run(`
    INSERT INTO urun (barkod, urun_adi, beden)
    VALUES (?, ?, ?)
    ON CONFLICT(barkod) DO UPDATE SET
      urun_adi = excluded.urun_adi,
      beden = excluded.beden,
      guncelleme_tarihi = CURRENT_TIMESTAMP
  `,
    [barkod, urun_adi || null, beden || null],
    function(err) {
      if (err) {
        console.error('Ürün ekleme hatası:', err);
        return res.status(500).json({ error: 'Ürün eklenemedi' });
      }

      // Koli-ürün ilişkisini ekle
      if (koli_no) {
        db.run(`
          INSERT INTO koli_urun (koli_no, urun_barkod, adet)
          VALUES (?, ?, 1)
          ON CONFLICT(koli_no, urun_barkod) DO UPDATE SET
            adet = excluded.adet,
            guncelleme_tarihi = CURRENT_TIMESTAMP
        `,
          [koli_no, barkod],
          function(err) {
            if (err) {
              console.error('Koli-ürün ilişki hatası:', err);
            }
          }
        );
      }

      res.json({ id: this.lastID, message: 'Ürün başarıyla eklendi' });
    }
  );
});

// Ürün sil
app.delete('/api/urun/:barkod', (req, res) => {
  const barkod = req.params.barkod;
  
  db.run('DELETE FROM koli_urun WHERE urun_barkod = ?', [barkod], (err) => {
    if (err) {
      console.error('Koli-ürün silme hatası:', err);
      return res.status(500).json({ error: 'Ürün silinemedi' });
    }
    
    db.run('DELETE FROM urun WHERE barkod = ?', [barkod], function(err) {
      if (err) {
        console.error('Ürün silme hatası:', err);
        return res.status(500).json({ error: 'Ürün silinemedi' });
      }
      res.json({ message: 'Ürün başarıyla silindi' });
    });
  });
});

// Toplu ürün sil
app.post('/api/urun/delete-bulk', (req, res) => {
  const { barkodlar } = req.body;
  
  if (!barkodlar || !Array.isArray(barkodlar)) {
    return res.status(400).json({ error: 'Geçersiz barkod listesi' });
  }

  const placeholders = barkodlar.map(() => '?').join(',');
  
  db.run(`DELETE FROM koli_urun WHERE urun_barkod IN (${placeholders})`, barkodlar, (err) => {
    if (err) {
      console.error('Toplu koli-ürün silme hatası:', err);
      return res.status(500).json({ error: 'Ürünler silinemedi' });
    }
    
    db.run(`DELETE FROM urun WHERE barkod IN (${placeholders})`, barkodlar, function(err) {
      if (err) {
        console.error('Toplu ürün silme hatası:', err);
        return res.status(500).json({ error: 'Ürünler silinemedi' });
      }
      res.json({ message: `${barkodlar.length} ürün başarıyla silindi` });
    });
  });
});

// Ürün konum sorgula
app.get('/api/urun/konum', (req, res) => {
  const { barkod, q } = req.query;

  const searchBarcode = (q && q.trim()) || (barkod && barkod.toString().trim());
  const searchName = q && q.trim();

  if (!searchBarcode && !searchName) {
    return res.status(400).json({ error: 'Sorgu için barkod veya ürün adı (q) gerekli' });
  }

  // Barkod tam eşleşme öncelikli, yoksa ürün adına göre arama
  const params = [];
  let whereClause = '';
  if (searchBarcode) {
    whereClause = 'u.barkod = ?';
    params.push(searchBarcode);
  } else {
    whereClause = 'LOWER(u.urun_adi) LIKE ?';
    params.push(`%${searchName.toLowerCase()}%`);
  }

  const query = `
    SELECT 
      u.barkod,
      u.urun_adi,
      u.beden,
      u.ana_blok,
      ku.koli_no,
      ku.adet,
      k.lokasyon
    FROM koli_urun ku
    JOIN urun u ON ku.urun_barkod = u.barkod
    JOIN koli k ON ku.koli_no = k.koli_no
    WHERE ${whereClause} AND ku.adet > 0
    ORDER BY ku.adet DESC
  `;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Konum sorgu hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Belirli kolidaki ürünler
app.get('/api/koli/:koli_no/urunler', (req, res) => {
  const koli_no = req.params.koli_no;
  
  const query = `
    SELECT 
      u.barkod as urun_barkod,
      u.urun_adi,
      u.beden,
      ku.adet,
      ku.guncelleme_tarihi
    FROM koli_urun ku
    JOIN urun u ON ku.urun_barkod = u.barkod
    WHERE ku.koli_no = ? AND ku.adet > 0
    ORDER BY u.urun_adi
  `;
  
  db.all(query, [koli_no], (err, rows) => {
    if (err) {
      console.error('Koli ürün listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Koli envanter (ürün toplama için)
app.get('/api/koli-envanter', (req, res) => {
  const { koli_no } = req.query;
  
  if (koli_no) {
    // Belirli bir koli için envanter
    const query = `
      SELECT 
        u.barkod as urun_barkod,
        u.urun_adi,
        u.beden,
        ku.adet,
        ku.koli_no
      FROM koli_urun ku
      JOIN urun u ON ku.urun_barkod = u.barkod
      WHERE ku.koli_no = ? AND ku.adet > 0
      ORDER BY u.urun_adi
    `;
    
    db.all(query, [koli_no], (err, rows) => {
      if (err) {
        console.error('Koli envanter hatası:', err);
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json(rows);
    });
  } else {
    // Tüm koliler için envanter (koli arama için)
    const query = `
      SELECT 
        u.barkod as urun_barkod,
        u.urun_adi,
        u.beden,
        ku.adet,
        ku.koli_no
      FROM koli_urun ku
      JOIN urun u ON ku.urun_barkod = u.barkod
      WHERE ku.adet > 0
      ORDER BY ku.koli_no, u.urun_adi
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        console.error('Koli envanter hatası:', err);
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json(rows);
    });
  }
});

// Ürün çıkışı (ürün toplama için)
app.post('/api/urun/cikis', (req, res) => {
  const { barkod, koli_no, adet } = req.body;
  
  if (!barkod || !koli_no || !adet) {
    return res.status(400).json({ error: 'Barkod, koli numarası ve adet gerekli' });
  }

  // Mevcut stoku kontrol et
  db.get('SELECT adet FROM koli_urun WHERE urun_barkod = ? AND koli_no = ?', [barkod, koli_no], (err, row) => {
    if (err) {
      console.error('Stok kontrol hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    if (!row) {
      return res.status(400).json({ error: 'Ürün bu kolide bulunamadı' });
    }
    
    if (row.adet < adet) {
      return res.status(400).json({ error: 'Yetersiz stok' });
    }
    
    const yeniAdet = row.adet - adet;
    
    if (yeniAdet <= 0) {
      // Ürünü tamamen çıkar
      db.run('DELETE FROM koli_urun WHERE urun_barkod = ? AND koli_no = ?', [barkod, koli_no], function(err) {
        if (err) {
          console.error('Ürün çıkış hatası:', err);
          return res.status(500).json({ error: 'Ürün çıkarılamadı' });
        }
        res.json({ 
          message: 'Ürün başarıyla çıkarıldı',
          kalan_adet: 0
        });
      });
    } else {
      // Adeti güncelle
      db.run('UPDATE koli_urun SET adet = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE urun_barkod = ? AND koli_no = ?',
        [yeniAdet, barkod, koli_no], function(err) {
        if (err) {
          console.error('Ürün güncelleme hatası:', err);
          return res.status(500).json({ error: 'Ürün güncellenemedi' });
        }
        res.json({ 
          message: 'Ürün başarıyla güncellendi',
          kalan_adet: yeniAdet
        });
      });
    }
  });
});

// Excel ile ürün içe aktarma
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Excel dosyası yükleme klasörü oluştur
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.post('/api/urun/import-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Excel dosyası gerekli' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel dosyası boş' });
    }

    console.log(`Excel import başladı: ${data.length} satır işlenecek`);

    // Header'ları normalize et
    const normalizeHeader = (header) => {
      // Türkçe başlıkları güvenli anahtarlara dönüştür (İ/i nokta problemi dahil)
      return header
        .toString()
        .normalize('NFD')                 // kombinasyonlu işaretlere ayır
        .replace(/[\u0300-\u036f]/g, '') // tüm diakritikleri kaldır
        .toLowerCase()
        .replace(/[çğışöü]/g, (m) => ({ 'ç':'c','ğ':'g','ş':'s','ö':'o','ü':'u','ı':'i' }[m] || m))
        .replace(/[^a-z0-9]+/g, '_')      // kalan özel karakterleri alt çizgiye çevir
        .replace(/^_+|_+$/g, '')          // baş/son alt çizgileri temizle
        .replace(/_+/g, '_');             // çoklu alt çizgileri tekle
    };

    // Verileri hazırla
    const urunler = [];
    const koliler = new Set();
    const koliUrunler = [];
    const guncellenenUrunler = new Set();
    const yeniUrunler = new Set();

    data.forEach((row, index) => {
      try {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = normalizeHeader(key);
          normalizedRow[normalizedKey] = row[key];
        });

        const barkod = normalizedRow.urun_barkodu || normalizedRow.barkod || normalizedRow.product_barcode;
        const urun_adi = normalizedRow.urun_adi || normalizedRow.urun_ismi || normalizedRow.product_name;
        const beden = normalizedRow.beden || normalizedRow.urun_bedeni || normalizedRow.size;
        const ana_blok = normalizedRow.urunun_bulunan_ana_blogu || normalizedRow.ana_blok || normalizedRow.main_block;
        // Koli numarasını sadece "ÜRÜNÜN KOLİSİ" (E sütunu) ve muhtemel varyasyonlarından al
        const koli_no_raw = normalizedRow.urunun_kolisi || normalizedRow.koli_numarasi || normalizedRow.koli || normalizedRow.koli_no || normalizedRow.package;
        const koli_no = koli_no_raw ? koli_no_raw.toString().trim() : null;
        const adet = parseInt(normalizedRow.adet || normalizedRow.quantity || 1);

        // Debug: İlk birkaç satır için normalize edilmiş verileri logla
        if (index < 3) {
          console.log(`Satır ${index + 1} - Normalize edilmiş veriler:`, {
            barkod,
            urun_adi,
            beden,
            ana_blok,
            koli_no,
            adet,
            normalizedRow
          });
        }

        if (!barkod) {
          return;
        }

        // Ürün verilerini hazırla
        urunler.push([barkod, urun_adi || null, beden || null, ana_blok || null]);

        // Koli verilerini hazırla - sadece E sütunu (koli_no) varsa ilişkilendir
        if (koli_no) {
          koliler.add(koli_no);
          koliUrunler.push([koli_no, barkod, adet]);
        }
      } catch (error) {
        console.error(`Satır işleme hatası (satır ${index + 1}):`, error);
      }
    });

    // Batch insert işlemleri
    let successCount = 0;
    let errorCount = 0;
    let guncellenenCount = 0;
    let yeniCount = 0;

    // Önce mevcut ürünleri kontrol et
    const mevcutUrunler = new Map();
    if (urunler.length > 0) {
      const barkodlar = urunler.map(u => u[0]);
      const placeholders = barkodlar.map(() => '?').join(',');
      
      db.all(`SELECT barkod, urun_adi, beden, ana_blok FROM urun WHERE barkod IN (${placeholders})`, barkodlar, (err, rows) => {
        if (err) {
          console.error('Mevcut ürün kontrol hatası:', err);
        } else {
          rows.forEach(row => {
            mevcutUrunler.set(row.barkod, row);
          });
        }
      });
    }

    // Ürünleri akıllı şekilde ekle/güncelle
    if (urunler.length > 0) {
      const urunStmt = db.prepare(`
        INSERT INTO urun (barkod, urun_adi, beden, ana_blok)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(barkod) DO UPDATE SET
          urun_adi = excluded.urun_adi,
          beden = excluded.beden,
          ana_blok = excluded.ana_blok,
          guncelleme_tarihi = CURRENT_TIMESTAMP
      `);
      urunler.forEach(urun => {
        try {
          const [barkod, urun_adi, beden, ana_blok] = urun;
          const mevcutUrun = mevcutUrunler.get(barkod);
          
          if (mevcutUrun) {
            // Mevcut ürün - güncelle
            guncellenenUrunler.add(barkod);
            guncellenenCount++;
            console.log(`Ürün güncellendi: ${barkod} - ${urun_adi || mevcutUrun.urun_adi}`);
          } else {
            // Yeni ürün - ekle
            yeniUrunler.add(barkod);
            yeniCount++;
            console.log(`Yeni ürün eklendi: ${barkod} - ${urun_adi}`);
          }
          
          urunStmt.run(urun);
          successCount++;
        } catch (err) {
          console.error('Ürün ekleme hatası:', err);
          errorCount++;
        }
      });
      urunStmt.finalize();
    }

    // Kolileri batch olarak ekle
    if (koliler.size > 0) {
      const koliStmt = db.prepare(`
        INSERT INTO koli (koli_no, lokasyon)
        VALUES (?, ?)
        ON CONFLICT(koli_no) DO UPDATE SET
          lokasyon = excluded.lokasyon,
          guncelleme_tarihi = CURRENT_TIMESTAMP
      `);
      koliler.forEach(koli_no => {
        try {
          koliStmt.run([koli_no, koli_no]);
        } catch (err) {
          console.error('Koli ekleme hatası:', err);
        }
      });
      koliStmt.finalize();
    }

    // Koli-ürün ilişkilerini akıllı şekilde ekle/güncelle
    if (koliUrunler.length > 0) {
      const koliUrunStmt = db.prepare(`
        INSERT INTO koli_urun (koli_no, urun_barkod, adet)
        VALUES (?, ?, ?)
        ON CONFLICT(koli_no, urun_barkod) DO UPDATE SET
          adet = excluded.adet,
          guncelleme_tarihi = CURRENT_TIMESTAMP
      `);
      koliUrunler.forEach(koliUrun => {
        try {
          const [koli_no, barkod, adet] = koliUrun;
          
          // Mevcut koli-ürün ilişkisini kontrol et
          db.get('SELECT adet FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?', [koli_no, barkod], (err, row) => {
            if (err) {
              console.error('Koli-ürün kontrol hatası:', err);
            } else if (row) {
              console.log(`Koli-ürün ilişkisi güncellendi: ${barkod} -> ${koli_no} (${row.adet} -> ${adet})`);
            } else {
              console.log(`Yeni koli-ürün ilişkisi: ${barkod} -> ${koli_no} (${adet})`);
            }
          });
          
          koliUrunStmt.run(koliUrun);
        } catch (err) {
          console.error('Koli-ürün ilişki hatası:', err);
        }
      });
      koliUrunStmt.finalize();
    }

    // Dosyayı sil
    fs.unlinkSync(req.file.path);

    console.log(`Excel import tamamlandı: ${successCount} başarılı, ${errorCount} hata`);
    console.log(`Güncellenen ürünler: ${guncellenenCount}, Yeni ürünler: ${yeniCount}`);

    res.json({
      message: 'Excel dosyası başarıyla işlendi',
      successCount,
      errorCount,
      totalRows: data.length,
      processedUrunler: urunler.length,
      processedKoliler: koliler.size,
      guncellenenUrunler: guncellenenCount,
      yeniUrunler: yeniCount,
      detay: {
        guncellenenBarkodlar: Array.from(guncellenenUrunler),
        yeniBarkodlar: Array.from(yeniUrunler)
      }
    });

  } catch (error) {
    console.error('Excel işleme hatası:', error);
    res.status(500).json({ error: 'Excel dosyası işlenemedi' });
  }
});

// Koli transfer
app.post('/api/koli-transfer', (req, res) => {
  const { cikan_koli, giren_koli, urunler } = req.body;
  
  if (!cikan_koli || !giren_koli || !urunler || !Array.isArray(urunler)) {
    return res.status(400).json({ error: 'Geçersiz transfer verisi' });
  }

  const transfer_no = `TRF-${Date.now()}`;
  
  // Transfer kaydı oluştur
  db.run('INSERT INTO koli_transfer (transfer_no, cikan_koli, giren_koli) VALUES (?, ?, ?)',
    [transfer_no, cikan_koli, giren_koli],
    function(err) {
      if (err) {
        console.error('Transfer kayıt hatası:', err);
        return res.status(500).json({ error: 'Transfer kaydedilemedi' });
      }

      // Transfer detaylarını ekle
      let completed = 0;
      let errors = 0;

      urunler.forEach((urun, index) => {
        const { barkod, adet } = urun;
        
        // Transfer detayını ekle
        db.run('INSERT INTO transfer_detay (transfer_no, urun_barkod, adet) VALUES (?, ?, ?)',
          [transfer_no, barkod, adet],
          function(err) {
            if (err) {
              console.error(`Transfer detay hatası (${barkod}):`, err);
              errors++;
            } else {
              // Çıkan kolidan ürünü çıkar
              db.run('UPDATE koli_urun SET adet = adet - ? WHERE koli_no = ? AND urun_barkod = ?',
                [adet, cikan_koli, barkod],
                function(err) {
                  if (err) {
                    console.error(`Çıkan koli güncelleme hatası (${barkod}):`, err);
                    errors++;
                  } else {
                    // Giren koliye ürünü ekle
                    db.run('INSERT OR REPLACE INTO koli_urun (koli_no, urun_barkod, adet) VALUES (?, ?, COALESCE((SELECT adet FROM koli_urun WHERE koli_no = ? AND urun_barkod = ?), 0) + ?)',
                      [giren_koli, barkod, giren_koli, barkod, adet],
                      function(err) {
                        if (err) {
                          console.error(`Giren koli güncelleme hatası (${barkod}):`, err);
                          errors++;
                        } else {
                          completed++;
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });

      res.json({ 
        transfer_no, 
        message: 'Transfer başlatıldı',
        completed,
        errors
      });
    }
  );
});

// Toplama fişi oluştur
app.post('/api/toplama-fisi', (req, res) => {
  const { urunler } = req.body;
  
  if (!urunler || !Array.isArray(urunler)) {
    return res.status(400).json({ error: 'Geçersiz toplama verisi' });
  }

  const fisi_no = `TOP-${Date.now()}`;
  
  // Toplama fişi oluştur
  db.run('INSERT INTO toplama_fisi (fisi_no) VALUES (?)',
    [fisi_no],
    function(err) {
      if (err) {
        console.error('Toplama fişi hatası:', err);
        return res.status(500).json({ error: 'Toplama fişi oluşturulamadı' });
      }

      // Toplama detaylarını ekle
      let completed = 0;
      let errors = 0;

      urunler.forEach((urun, index) => {
        const { barkod, koli_no, adet } = urun;
        
        // Toplama detayını ekle
        db.run('INSERT INTO toplama_detay (fisi_no, urun_barkod, koli_no, adet) VALUES (?, ?, ?, ?)',
          [fisi_no, barkod, koli_no, adet],
          function(err) {
            if (err) {
              console.error(`Toplama detay hatası (${barkod}):`, err);
              errors++;
            } else {
              // Kolidan ürünü çıkar
              db.run('UPDATE koli_urun SET adet = adet - ? WHERE koli_no = ? AND urun_barkod = ?',
                [adet, koli_no, barkod],
                function(err) {
                  if (err) {
                    console.error(`Koli güncelleme hatası (${barkod}):`, err);
                    errors++;
                  } else {
                    completed++;
                  }
                }
              );
            }
          }
        );
      });

      res.json({ 
        fisi_no, 
        message: 'Toplama fişi oluşturuldu',
        completed,
        errors
      });
    }
  );
});

// Toplama fişi listesi
app.get('/api/toplama-fisi', (req, res) => {
  const { tarih } = req.query;
  
  let query = 'SELECT * FROM toplama_fisi';
  const params = [];
  
  if (tarih) {
    query += ' WHERE DATE(toplama_tarihi) = ?';
    params.push(tarih);
  }
  
  query += ' ORDER BY toplama_tarihi DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Toplama fişi listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Toplama fişi detayı
app.get('/api/toplama-fisi/:fisi_no', (req, res) => {
  const fisi_no = req.params.fisi_no;
  
  const query = `
    SELECT 
      td.*,
      u.urun_adi,
      u.beden
    FROM toplama_detay td
    JOIN urun u ON td.urun_barkod = u.barkod
    WHERE td.fisi_no = ?
    ORDER BY u.urun_adi
  `;
  
  db.all(query, [fisi_no], (err, rows) => {
    if (err) {
      console.error('Toplama fişi detay hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Çıkış geçmişi (tarihe göre, fişsiz, koli bazlı)
app.get('/api/cikis-gecmisi', (req, res) => {
  const { tarih } = req.query;
  if (!tarih) {
    return res.status(400).json({ error: 'tarih parametresi gerekli (YYYY-MM-DD)' });
  }

  const query = `
    SELECT 
      td.koli_no,
      td.urun_barkod,
      u.urun_adi,
      SUM(td.adet) AS adet
    FROM toplama_detay td
    JOIN toplama_fisi tf ON tf.fisi_no = td.fisi_no
    JOIN urun u ON u.barkod = td.urun_barkod
    WHERE DATE(tf.toplama_tarihi) = ?
    GROUP BY td.koli_no, td.urun_barkod, u.urun_adi
    ORDER BY td.koli_no, u.urun_adi
  `;

  db.all(query, [tarih], (err, rows) => {
    if (err) {
      console.error('Çıkış geçmişi sorgu hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Dashboard aktiviteleri
app.get('/api/dashboard/activities', (req, res) => {
  const activities = [
    {
      action: 'Sistem Başlatıldı',
      detail: 'VMS sistemi başarıyla çalışıyor',
      time: moment().format('HH:mm')
    }
  ];
  
  res.json(activities);
});

// Koli envanter raporu
app.get('/api/rapor/koli-envanter', (req, res) => {
  const { min_adet, max_adet, sadece_bos } = req.query;

  // Temel rapor: koli bazlı toplam adet ve ürün çeşidi
  let query = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.kapasite,
      COUNT(DISTINCT ku.urun_barkod) as urun_cesidi,
      COALESCE(SUM(ku.adet), 0) as toplam_adet,
      CASE 
        WHEN k.kapasite > 0 THEN ROUND((COUNT(ku.urun_barkod) * 100.0 / k.kapasite), 2)
        ELSE 0 
      END as doluluk_orani
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no AND ku.adet > 0
    GROUP BY k.koli_no, k.lokasyon, k.kapasite
  `;

  const params = [];
  const hasMin = typeof min_adet !== 'undefined' && min_adet !== '';
  const hasMax = typeof max_adet !== 'undefined' && max_adet !== '';
  const onlyEmpty = String(sadece_bos || '').toLowerCase() === 'true';

  const havingClauses = [];
  if (onlyEmpty) {
    havingClauses.push('toplam_adet = 0');
  }
  if (hasMin) {
    havingClauses.push('toplam_adet >= ?');
    params.push(Number(min_adet));
  }
  if (hasMax) {
    havingClauses.push('toplam_adet <= ?');
    params.push(Number(max_adet));
  }
  if (havingClauses.length > 0) {
    query += ' HAVING ' + havingClauses.join(' AND ');
  }

  query += ' ORDER BY toplam_adet DESC, k.koli_no ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Koli envanter raporu hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Boş koliler
app.get('/api/bos-koli', (req, res) => {
  const query = `
    SELECT 
      k.koli_no,
      k.lokasyon,
      k.kapasite,
      k.olusturma_tarihi
    FROM koli k
    LEFT JOIN koli_urun ku ON k.koli_no = ku.koli_no AND ku.adet > 0
    WHERE ku.koli_no IS NULL
    ORDER BY k.koli_no
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Boş koli listesi hatası:', err);
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'VMS API çalışıyor',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Terminal logs endpoint
app.get('/api/terminal-logs', authenticateToken, requireAdmin, (req, res) => {
  const { limit, level } = req.query;
  const lim = Math.min(parseInt(limit || '200', 10) || 200, 1000);
  let logs = terminalLogBuffer;
  if (level) {
    logs = logs.filter(l => l.level === level);
  }
  const slice = logs.slice(-lim);
  res.json(slice);
});

// Admin log endpoint
app.get('/api/admin/logs', authenticateToken, (req, res) => {
  // Sadece admin kullanıcılar log görebilir
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
  }

  const { level, dateFrom, dateTo, search } = req.query;
  
  let query = `
    SELECT 
      timestamp,
      level,
      user,
      action,
      details,
      ip
    FROM system_logs 
    WHERE 1=1
  `;
  const params = [];

  if (level && level !== 'all') {
    query += ' AND level = ?';
    params.push(level);
  }

  if (dateFrom) {
    query += ' AND DATE(timestamp) >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ' AND DATE(timestamp) <= ?';
    params.push(dateTo);
  }

  if (search) {
    query += ' AND (user LIKE ? OR action LIKE ? OR details LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY timestamp DESC LIMIT 1000';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Log sorgu hatası:', err);
      return res.status(500).json({ error: 'Log sorgu hatası' });
    }
    res.json(rows);
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.warn('404 Not Found', { path: req.originalUrl, method: req.method, ip: req.ip });
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Server başlatma
const server = app.listen(PORT, () => {
  console.log(`VMS Server ${PORT} portunda çalışıyor`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    db.close((err) => {
      if (err) {
        console.error('Veritabanı kapatma hatası', { error: err.message });
      } else {
        console.log('Veritabanı bağlantısı kapatıldı');
      }
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection', { error: err.message, stack: err.stack });
  gracefulShutdown('unhandledRejection');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;