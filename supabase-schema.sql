-- Supabase veritabanı şeması
-- Bu SQL kodlarını Supabase SQL Editor'da çalıştırın

-- Kullanıcılar tablosu
CREATE TABLE kullanicilar (
  id SERIAL PRIMARY KEY,
  kullanici_adi VARCHAR(50) UNIQUE NOT NULL,
  sifre VARCHAR(255) NOT NULL,
  ad_soyad VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  rol VARCHAR(20) DEFAULT 'user',
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler tablosu
CREATE TABLE urunler (
  id SERIAL PRIMARY KEY,
  barkod VARCHAR(50) NOT NULL,
  urun_adi VARCHAR(200) NOT NULL,
  koli VARCHAR(50),
  birim VARCHAR(50),
  stok_miktari INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Koliler tablosu
CREATE TABLE koliler (
  id SERIAL PRIMARY KEY,
  koli_no VARCHAR(50) UNIQUE NOT NULL,
  lokasyon VARCHAR(100),
  kapasite INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktiviteler tablosu
CREATE TABLE aktiviteler (
  id SERIAL PRIMARY KEY,
  mesaj TEXT NOT NULL,
  detay JSONB,
  tip VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Toplama tablosu
CREATE TABLE toplama (
  id SERIAL PRIMARY KEY,
  fis_no VARCHAR(50) UNIQUE NOT NULL,
  urunler JSONB NOT NULL,
  toplam_urun INTEGER DEFAULT 0,
  olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transfer tablosu
CREATE TABLE transfer (
  id SERIAL PRIMARY KEY,
  transfer_no VARCHAR(50) UNIQUE NOT NULL,
  urunler JSONB NOT NULL,
  toplam_urun INTEGER DEFAULT 0,
  olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_urunler_barkod ON urunler(barkod);
CREATE INDEX idx_urunler_koli ON urunler(koli);
CREATE INDEX idx_urunler_birim ON urunler(birim);
CREATE INDEX idx_koliler_koli_no ON koliler(koli_no);
CREATE INDEX idx_kullanicilar_kullanici_adi ON kullanicilar(kullanici_adi);
CREATE INDEX idx_toplam_fis_no ON toplama(fis_no);
CREATE INDEX idx_transfer_transfer_no ON transfer(transfer_no);

-- RLS (Row Level Security) politikaları
ALTER TABLE kullanicilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE koliler ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktiviteler ENABLE ROW LEVEL SECURITY;
ALTER TABLE toplama ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer ENABLE ROW LEVEL SECURITY;

-- Tüm tablolar için genel erişim politikaları
CREATE POLICY "Enable all operations for all users" ON kullanicilar FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON urunler FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON koliler FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON aktiviteler FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON toplama FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON transfer FOR ALL USING (true);
