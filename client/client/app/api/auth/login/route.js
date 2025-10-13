import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();

    if (!kullanici_adi || !sifre) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Basit giriş kontrolü (demo için)
    if (kullanici_adi === 'admin' && sifre === 'admin123') {
      const userData = {
        id: 1,
        kullanici_adi: 'admin',
        ad_soyad: 'Admin Kullanıcı',
        email: 'admin@coretrack.com',
        rol: 'admin',
        aktif: true
      };

      return NextResponse.json({
        success: true,
        token: 'demo-token-123',
        user: userData,
        message: 'Giriş başarılı'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Geçersiz kullanıcı adı veya şifre' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login API hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
