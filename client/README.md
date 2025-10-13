# CoreTrack V3 - Depo Yönetim Sistemi

Modern Next.js tabanlı depo yönetim sistemi.

## 🚀 Deploy Seçenekleri

### 1. Vercel (Önerilen)
```bash
# Vercel CLI ile
npm i -g vercel
vercel

# Veya GitHub ile otomatik deploy
# 1. GitHub'a push edin
# 2. vercel.com'a gidin
# 3. GitHub repo'nuzu bağlayın
```

### 2. Netlify
```bash
# Netlify CLI ile
npm i -g netlify-cli
netlify deploy --prod

# Veya GitHub ile otomatik deploy
# 1. GitHub'a push edin
# 2. netlify.com'a gidin
# 3. GitHub repo'nuzu bağlayın
```

### 3. Railway
```bash
# Railway CLI ile
npm i -g @railway/cli
railway login
railway deploy
```

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn

## 🛠️ Kurulum

```bash
npm install
npm run build
npm start
```

## 🔑 Giriş Bilgileri

- **Kullanıcı Adı:** admin
- **Şifre:** admin123

## 📁 Proje Yapısı

```
client/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── dashboard/      # Dashboard sayfası
│   ├── login/          # Giriş sayfası
│   └── ...
├── components/         # React bileşenleri
├── data/              # Veri dosyaları
└── public/            # Statik dosyalar
```

## 🌐 Canlı Demo

Deploy edildikten sonra burada link olacak.