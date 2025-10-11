# VMS - Depo Yönetim Sistemi (Next.js)

Bu proje, KOBİ Depo V3 VMS (Varlık Yönetim Sistemi) uygulamasının Next.js versiyonudur.

## Özellikler

- **Dashboard**: Depo genel bakış ve istatistikler
- **Koli Transfer**: Koli transfer işlemleri
- **Ürün Toplama**: Ürün toplama fişi işlemleri
- **Sayım**: Envanter sayım işlemleri
- **Raporlar**: Analiz ve raporlar
- **Koli Yönetimi**: Koli işlemleri
- **Ürün Yönetimi**: Ürün işlemleri
- **Admin Panel**: Kullanıcı yönetimi (sadece admin)

## Teknolojiler

- **Next.js 14**: React framework
- **React 18**: UI kütüphanesi
- **Bootstrap 5**: CSS framework
- **React Bootstrap**: Bootstrap React bileşenleri
- **React Icons**: İkon kütüphanesi
- **React Toastify**: Bildirim sistemi
- **TypeScript**: Tip güvenliği

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcıda `http://localhost:3000` adresini açın.

## Demo Giriş

- **Kullanıcı Adı**: admin
- **Şifre**: admin123

## Proje Yapısı

```
client/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard sayfası
│   ├── login/            # Login sayfası
│   ├── koli-transfer/    # Koli transfer sayfası
│   ├── urun-toplama/     # Ürün toplama sayfası
│   ├── sayim/            # Sayım sayfası
│   ├── raporlar/         # Raporlar sayfası
│   ├── koli-yonetimi/    # Koli yönetimi sayfası
│   ├── urun-yonetimi/    # Ürün yönetimi sayfası
│   ├── admin/            # Admin panel sayfası
│   ├── layout.js         # Ana layout
│   └── globals.css       # Global CSS
├── components/            # React bileşenleri
│   ├── Navbar.js         # Navigasyon çubuğu
│   └── Sidebar.js        # Yan menü
└── package.json          # Proje bağımlılıkları
```

## API Endpoints

- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/dashboard/activities` - Dashboard aktiviteleri
- `GET /api/koli-liste` - Koli listesi
- `GET /api/urun` - Ürün listesi

## Geliştirme

Proje Next.js App Router kullanmaktadır. Yeni sayfalar eklemek için `app/` klasörü altında ilgili klasörü oluşturun ve `page.js` dosyası ekleyin.

## Build

Üretim için build almak için:

```bash
npm run build
npm start
```

## Notlar

- Bu proje, orijinal React projesinden Next.js'e çevrilmiştir
- Tüm işlevler aynı şekilde çalışmaktadır
- API routes Next.js formatına çevrilmiştir
- Authentication ve routing Next.js App Router ile yönetilmektedir
