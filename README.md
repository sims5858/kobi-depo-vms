# KOBİ Depo V3 VMS Yönetim Sistemi

Modern, kapsamlı ve kullanıcı dostu bir depo yönetim sistemi. Koli bazlı envanter yönetimi, barkod entegrasyonu ve gerçek zamanlı raporlama özellikleri ile depo operasyonlarınızı optimize edin.

## 🚀 Özellikler

### 📦 Mal Girişi
- **Alış İrsaliyesi Yönetimi**: İrsaliye bazlı mal girişi
- **Koli Numaralandırma**: Otomatik koli numaralandırma sistemi
- **Barkod Entegrasyonu**: Koli ve ürün barkod okuma
- **Toplu İşlem**: Çoklu koli ve ürün girişi

### 🔄 Koli Transfer ve Yuvalama
- **Koli Transferi**: Koliler arası ürün transferi
- **Yuvalama (Nesting)**: Düşük stoklu kolileri birleştirme
- **Boş Koli Yönetimi**: Boş koli tespiti ve yeniden kullanım
- **Transfer Geçmişi**: Tüm transfer işlemlerinin kaydı

### 📋 Ürün Toplama
- **Toplama Fişi**: Sipariş bazlı ürün toplama
- **Koli Envanteri**: Gerçek zamanlı koli durumu
- **Toplama Optimizasyonu**: Verimli toplama sırası
- **Sevke Hazırlık**: Transfer ve irsaliye entegrasyonu

### 📊 Sayım ve Envanter
- **Fiziksel Sayım**: Teorik vs fiziksel karşılaştırma
- **Lokasyon Güncelleme**: Sayım sonrası lokasyon düzenleme
- **Fark Raporları**: Sayım farklarının analizi
- **Excel İçe/Dışa Aktarım**: Sayım verilerinin Excel formatında işlenmesi

### 📈 Raporlama
- **Sipariş Raporları**: Koli bazlı sipariş analizi
- **Envanter Raporları**: Detaylı stok raporları
- **Boş Koli Raporları**: Boş koli tespiti ve optimizasyon
- **Excel Export**: Tüm raporların Excel formatında indirilmesi

### 🏷️ Barkod Yönetimi
- **Kamera Tarama**: Mobil cihazlarda barkod tarama
- **Manuel Giriş**: Barkod manuel giriş seçeneği
- **Çoklu Format**: Farklı barkod formatları desteği
- **Tarama Geçmişi**: Son taramaların kaydı

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **SQLite** - Veritabanı
- **RESTful API** - API mimarisi

### Frontend
- **React** - UI framework
- **React Bootstrap** - UI bileşenleri
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP client
- **React Toastify** - Bildirimler

### Diğer Araçlar
- **Moment.js** - Tarih/saat işlemleri
- **XLSX** - Excel dosya işlemleri
- **UUID** - Benzersiz ID üretimi
- **Multer** - Dosya yükleme

## 📋 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Modern web tarayıcısı

### Adım 1: Projeyi İndirin
```bash
git clone <repository-url>
cd VMS
```

### Adım 2: Backend Bağımlılıklarını Yükleyin
```bash
npm install
```

### Adım 3: Frontend Bağımlılıklarını Yükleyin
```bash
cd client
npm install
cd ..
```

### Adım 4: Uygulamayı Başlatın

#### Geliştirme Ortamı
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

#### Üretim Ortamı
```bash
# Frontend build
npm run build

# Uygulamayı başlat
npm start
```

## 🌐 Kullanım

### 1. Mal Girişi
1. **İrsaliye Numarası** girin
2. **Koli numarasını** okutun veya girin
3. **Ürün barkodlarını** okutun
4. **Koli tamamla** butonuna basın
5. **İrsaliye kaydet** ile işlemi tamamlayın

### 2. Koli Transfer
1. **Çıkan koli** numarasını seçin
2. **Transfer edilecek ürünleri** seçin
3. **Giren koli** numarasını belirleyin
4. **Transferi tamamla** ile işlemi bitirin

### 3. Ürün Toplama
1. **Sipariş numarası** girin
2. **Koli numarasını** seçin
3. **Toplama edilecek ürünleri** seçin
4. **Toplama fişi oluştur** ile işlemi tamamlayın

### 4. Sayım İşlemi
1. **Koli numarasını** seçin
2. **Fiziksel sayım** yapın
3. **Farkları** kontrol edin
4. **Sayımı tamamla** ile envanteri güncelleyin

## 📱 Barkod Tarama

### Kamera ile Tarama
1. **Taramayı Başlat** butonuna basın
2. Kamera izni verin
3. Barkodu kameraya gösterin
4. Otomatik tarama gerçekleşir

### Manuel Giriş
1. **Manuel Barkod Girişi** alanına kod girin
2. **Enter** tuşuna basın

## 📊 Raporlar

### Sipariş Raporu
- Sipariş numarasına göre koli bazlı ürün dağılımı
- Lokasyon bilgileri ile birlikte
- Excel formatında indirme

### Koli Envanter Raporu
- Koli bazlı stok durumu
- Adet filtreleme seçenekleri
- Boş/dolu koli durumları

### Boş Koli Raporu
- Boş kolilerin listesi
- Lokasyon bilgileri
- Yeniden kullanım için hazır

## 🔧 API Endpoints

### Koli Yönetimi
- `GET /api/koli` - Koli listesi
- `POST /api/koli` - Yeni koli oluştur
- `GET /api/koli-envanter` - Koli envanter raporu
- `GET /api/bos-koli` - Boş koli listesi

### Ürün Yönetimi
- `GET /api/urun` - Ürün listesi
- `POST /api/urun` - Yeni ürün oluştur

### Mal Girişi
- `POST /api/alis-irsaliyesi` - Alış irsaliyesi kaydet

### Transfer İşlemleri
- `POST /api/koli-transfer` - Koli transferi yap
- `POST /api/toplama-fisi` - Toplama fişi oluştur

### Sayım İşlemleri
- `POST /api/sayim` - Sayım kaydet

### Raporlar
- `GET /api/rapor/siparis/:siparis_no` - Sipariş raporu
- `GET /api/rapor/koli-envanter` - Koli envanter raporu

## 👥 Personel İhtiyaçları

### Elleçleme Personeli (2 kişi)
- El terminali kullanımı
- Barkod okuma cihazları
- Kablosuz okuyucular
- Mobil cihazlar

### Depo Süreç Operatörü (1 kişi)
- Sistem yönetimi
- Rapor analizi
- Süreç optimizasyonu
- Kalite kontrol

## 🎯 Sistem Avantajları

### ✅ Verimlilik
- Hızlı mal girişi ve çıkışı
- Otomatik koli numaralandırma
- Gerçek zamanlı envanter takibi

### ✅ Doğruluk
- Barkod tabanlı işlemler
- Fiziksel sayım kontrolü
- Otomatik fark hesaplama

### ✅ Raporlama
- Detaylı analiz raporları
- Excel entegrasyonu
- Gerçek zamanlı dashboard

### ✅ Kullanıcı Dostu
- Modern web arayüzü
- Mobil uyumlu tasarım
- Sezgisel kullanım

## 🔒 Güvenlik

- SQLite veritabanı güvenliği
- Input validation
- Error handling
- Data backup önerileri

## 📞 Destek

Herhangi bir sorun yaşadığınızda:

1. **Dokümantasyonu** kontrol edin
2. **Console loglarını** inceleyin
3. **Veritabanı** durumunu kontrol edin
4. **Sistem gereksinimlerini** doğrulayın

## 🚀 Gelecek Güncellemeler

- [ ] Mobil uygulama (React Native)
- [ ] Gelişmiş barkod tarama (ZXing entegrasyonu)
- [ ] RFID desteği
- [ ] Çoklu depo yönetimi
- [ ] ERP entegrasyonu
- [ ] Otomatik lokasyon önerisi
- [ ] AI tabanlı stok optimizasyonu

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

---

**KOBİ Depo V3 VMS** ile depo operasyonlarınızı bir üst seviyeye taşıyın! 🚀
