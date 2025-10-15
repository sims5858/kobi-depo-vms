import { NextResponse } from 'next/server';
const { kullaniciDB } = require('../../../lib/persistent-database');

export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();

    if (!kullanici_adi || !sifre) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    console.log('=== LOGIN DEBUG ===');
    console.log('Giriş yapılmaya çalışılan kullanıcı:', kullanici_adi);
    
    // Kullanıcıyı bul
    const user = kullaniciDB.getByKullaniciAdi(kullanici_adi);
    
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
      ad_soyad: user.ad_soyad,
      email: user.email,
      rol: user.rol,
      aktif: user.aktif
    };

    return NextResponse.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user: userData,
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login API hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}