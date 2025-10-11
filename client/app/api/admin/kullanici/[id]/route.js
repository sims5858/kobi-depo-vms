// Next.js API route - Admin kullanıcı düzenleme ve silme
import { loadData, updateKullanicilar } from '../../../data-store.js';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { kullanici_adi, email, sifre, ad_soyad, rol } = body;

    console.log('Kullanıcı düzenleniyor:', { id, kullanici_adi, email, rol });

    // Basit validasyon
    if (!kullanici_adi || !email || !ad_soyad) {
      return Response.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];

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
      sifre: sifre || kullanicilar[kullaniciIndex].sifre, // Şifre değiştirilmediyse eski şifreyi koru
      rol: rol || kullanicilar[kullaniciIndex].rol,
      guncelleme_tarihi: new Date().toISOString()
    };

    // Veriyi kaydet
    updateKullanicilar(kullanicilar);

    console.log('Kullanıcı başarıyla güncellendi:', kullanicilar[kullaniciIndex]);

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: kullanicilar[kullaniciIndex]
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    console.log('Kullanıcı siliniyor:', { id });

    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];

    // Kullanıcıyı bul
    const kullaniciIndex = kullanicilar.findIndex(k => k.id === parseInt(id));
    if (kullaniciIndex === -1) {
      return Response.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Admin kullanıcısını silmeyi engelle
    if (kullanicilar[kullaniciIndex].rol === 'admin') {
      return Response.json({ error: 'Admin kullanıcısı silinemez' }, { status: 400 });
    }

    // Kullanıcıyı sil
    const silinenKullanici = kullanicilar.splice(kullaniciIndex, 1)[0];

    // Veriyi kaydet
    updateKullanicilar(kullanicilar);

    console.log('Kullanıcı başarıyla silindi:', silinenKullanici);

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi',
      user: silinenKullanici
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}