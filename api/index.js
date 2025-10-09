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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Veritabanı bağlantısı - Vercel için memory database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('Veritabanı bağlantısı başarılı');
    initializeDatabase();
  }
});

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
    UNIQUE(koli_no, urun_barkod)
  )`);

  // Index'ler
  db.run(`CREATE INDEX IF NOT EXISTS idx_urun_barkod ON urun (barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_urun_barkod ON koli_urun (urun_barkod)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_koli_no ON koli (koli_no)`);

  // Test verisi ekle
  db.run(`INSERT OR IGNORE INTO koli (koli_no, lokasyon, kapasite) VALUES 
    ('D1-0001', 'A Blok', 100),
    ('D1-0002', 'B Blok', 100),
    ('D1-0003', 'C Blok', 100)`);
}

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'VMS API çalışıyor!', timestamp: new Date().toISOString() });
});

app.get('/api/koli', (req, res) => {
  db.all('SELECT * FROM koli ORDER BY koli_no', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/urun', (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT u.*, 
           GROUP_CONCAT(ku.koli_no) as koliler,
           SUM(ku.adet) as toplam_adet
    FROM urun u
    LEFT JOIN koli_urun ku ON u.barkod = ku.urun_barkod
  `;
  
  if (search) {
    query += ` WHERE u.barkod LIKE ? OR u.urun_adi LIKE ?`;
    query += ` GROUP BY u.barkod ORDER BY u.urun_adi LIMIT 1000`;
    db.all(query, [`%${search}%`, `%${search}%`], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } else {
    query += ` GROUP BY u.barkod ORDER BY u.urun_adi LIMIT 1000`;
    db.all(query, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  }
});

// Diğer API routes buraya eklenebilir...

module.exports = app;
