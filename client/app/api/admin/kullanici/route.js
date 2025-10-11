// Next.js API route - Admin kullanıcı yönetimi
import { loadData, updateKullanicilar } from '../../data-store.js';

export async function GET() {
  try {
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];
    console.log('Kullanıcılar yüklendi:', kullanicilar.length);
    return Response.json(kullanicilar);
  } catch (error) {
    console.error('Kullanıcılar yükleme hatası:', error);
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

    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];

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
    
    // Veriyi kaydet
    updateKullanicilar(kullanicilar);

    return Response.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi',
      user: yeniKullanici
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
