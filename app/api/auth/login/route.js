import { NextResponse } from 'next/server';
import { kullaniciDB } from '../../../lib/kv-database.js';

export async function POST(request) {
  try {
    console.log('=== LOGIN API BAŞLADI ===');
    console.log('Vercel ortamı:', process.env.VERCEL ? 'Evet' : 'Hayır');
    
    const body = await request.json();
    console.log('Gelen request body:', body);
    
    const { kullanici_adi, sifre } = body;

    if (!kullanici_adi || !sifre) {
      console.log('Eksik parametreler:', { kullanici_adi: !!kullanici_adi, sifre: !!sifre });
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    console.log('=== LOGIN DEBUG ===');
    console.log('Giriş yapılmaya çalışılan kullanıcı:', kullanici_adi);
    
    // Kullanıcı veritabanını kontrol et
    console.log('Kullanıcı DB mevcut mu:', !!kullaniciDB);
    const kullanicilar = await kullaniciDB.getAll();
    console.log('Tüm kullanıcılar:', kullanicilar);
    
    // Kullanıcıyı bul - önce getByKullaniciAdi ile dene
    let user = await kullaniciDB.getByKullaniciAdi(kullanici_adi);
    console.log('getByKullaniciAdi ile bulunan kullanıcı:', user);
    
    // Eğer bulunamazsa getByUsername ile dene
    if (!user) {
      user = await kullaniciDB.getByUsername(kullanici_adi);
      console.log('getByUsername ile bulunan kullanıcı:', user);
    }
    
    console.log('Final kullanıcı:', user);
    console.log('Kullanıcı aktif mi:', user ? user.aktif : 'Kullanıcı bulunamadı');
    
    if (!user) {
      console.log('Kullanıcı bulunamadı veya aktif değil');
      return NextResponse.json(
        { success: false, error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Şifre kontrolü (şimdilik plain text, daha sonra hash'lenecek)
    if (user.sifre !== sifre) {
      console.log('Şifre yanlış');
      return NextResponse.json(
        { success: false, error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    console.log('Giriş başarılı:', user.kullanici_adi);

    // Kullanıcı verilerini döndür (şifre hariç)
    const userData = {
      id: user.id,
      kullanici_adi: user.kullanici_adi,
      ad_soyad: user.ad_soyad || 'Admin Kullanıcı',
      email: user.email || 'admin@example.com',
      rol: user.rol || 'admin',
      aktif: user.aktif !== false
    };

    const response = {
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user: userData,
      message: 'Giriş başarılı'
    };

    console.log('Login başarılı, response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('=== LOGIN API HATASI ===');
    console.error('Hata detayı:', error);
    console.error('Hata stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
