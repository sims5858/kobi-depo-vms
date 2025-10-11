// Next.js API route - Login
export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();
    
    // Basit kullanıcı listesi
    const kullanicilar = [
      {
        id: 1,
        kullanici_adi: 'admin',
        ad_soyad: 'Admin User',
        email: 'admin@vms.com',
        sifre: 'admin123',
        rol: 'admin',
        aktif: true
      },
      {
        id: 2,
        kullanici_adi: 'operator1',
        ad_soyad: 'Operatör Kullanıcı',
        email: 'operator@vms.com',
        sifre: 'operator123',
        rol: 'operator',
        aktif: true
      },
      {
        id: 3,
        kullanici_adi: 'user1',
        ad_soyad: 'Normal Kullanıcı',
        email: 'user@vms.com',
        sifre: 'user123',
        rol: 'kullanici',
        aktif: true
      }
    ];

    // Kullanıcıyı bul
    const kullanici = kullanicilar.find(k => 
      k.kullanici_adi === kullanici_adi && 
      k.aktif === true
    );

    if (kullanici) {
      // Şifre kontrolü
      if (sifre === kullanici.sifre) {
        const token = 'demo-token-' + Date.now();
        const response = {
          success: true,
          token: token,
          user: {
            id: kullanici.id,
            kullanici_adi: kullanici.kullanici_adi,
            ad_soyad: kullanici.ad_soyad,
            email: kullanici.email,
            rol: kullanici.rol,
            aktif: kullanici.aktif
          }
        };
        return Response.json(response);
      } else {
        return Response.json({ 
          success: false, 
          error: 'Geçersiz şifre' 
        }, { status: 401 });
      }
    }

    return Response.json({ 
      success: false, 
      error: 'Geçersiz kullanıcı adı veya şifre' 
    }, { status: 401 });

  } catch (error) {
    console.log('Login error:', error);
    return Response.json({ 
      success: false, 
      error: 'Sunucu hatası: ' + error.message 
    }, { status: 500 });
  }
}
