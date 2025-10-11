// Next.js API route - Admin kullanıcı yönetimi
let kullanicilar = [
  {
    id: 1,
    kullanici_adi: 'admin',
    ad_soyad: 'Admin User',
    email: 'admin@vms.com',
    sifre: 'admin123',
    rol: 'admin',
    aktif: true,
    olusturma_tarihi: new Date().toISOString()
  },
  {
    id: 2,
    kullanici_adi: 'operator1',
    ad_soyad: 'Operatör Kullanıcı',
    email: 'operator@vms.com',
    sifre: 'operator123',
    rol: 'operator',
    aktif: true,
    olusturma_tarihi: new Date().toISOString()
  },
  {
    id: 3,
    kullanici_adi: 'user1',
    ad_soyad: 'Normal Kullanıcı',
    email: 'user@vms.com',
    sifre: 'user123',
    rol: 'kullanici',
    aktif: true,
    olusturma_tarihi: new Date().toISOString()
  }
];

export async function GET() {
  try {
    return Response.json(kullanicilar);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { kullanici_adi, email, sifre, ad_soyad, rol } = body;

    // Basit validasyon
    if (!kullanici_adi || !email || !sifre || !ad_soyad) {
      return Response.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Kullanıcı adı kontrolü
    const mevcutKullanici = kullanicilar.find(k => k.kullanici_adi === kullanici_adi);
    if (mevcutKullanici) {
      return Response.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 });
    }

    // Yeni kullanıcı oluştur
    const yeniKullanici = {
      id: Date.now(),
      kullanici_adi,
      ad_soyad,
      email,
      sifre: sifre, // Şifre bilgisini sakla
      rol: rol || 'kullanici',
      aktif: true,
      olusturma_tarihi: new Date().toISOString()
    };

    // Listeye ekle
    kullanicilar.push(yeniKullanici);

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi',
      user: yeniKullanici
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
