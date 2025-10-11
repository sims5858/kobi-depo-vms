// Next.js API route - Admin kullanıcı düzenleme ve silme
// Kullanıcı verilerini doğrudan burada tanımlayalım
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
  }
];

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { kullanici_adi, email, sifre, ad_soyad, rol } = body;

    // Basit validasyon
    if (!kullanici_adi || !email || !ad_soyad) {
      return Response.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Kullanıcıyı bul
    const kullaniciIndex = kullanicilar.findIndex(k => k.id === parseInt(id));
    if (kullaniciIndex === -1) {
      return Response.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Kullanıcı adı kontrolü (kendisi hariç)
    const mevcutKullanici = kullanicilar.find(k => k.kullanici_adi === kullanici_adi && k.id !== parseInt(id));
    if (mevcutKullanici) {
      return Response.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 400 });
    }

    // Kullanıcıyı güncelle
    kullanicilar[kullaniciIndex] = {
      ...kullanicilar[kullaniciIndex],
      kullanici_adi,
      ad_soyad,
      email,
      rol: rol || 'kullanici',
      guncelleme_tarihi: new Date().toISOString()
    };

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: kullanicilar[kullaniciIndex]
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Admin kullanıcısını silmeyi engelle
    if (id === '1') {
      return Response.json({ error: 'Admin kullanıcısı silinemez' }, { status: 400 });
    }

    // Kullanıcıyı bul ve sil
    const kullaniciIndex = kullanicilar.findIndex(k => k.id === parseInt(id));
    if (kullaniciIndex === -1) {
      return Response.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    kullanicilar.splice(kullaniciIndex, 1);

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
