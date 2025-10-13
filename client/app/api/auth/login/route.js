// Next.js API route - Login
import { loadData } from '../../data-store.js';

export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();
    
    console.log('Login denemesi:', { kullanici_adi, sifre });
    
    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];
    
    console.log('Yüklenen kullanıcılar:', kullanicilar);

    // Kullanıcıyı bul
    const kullanici = kullanicilar.find(k => 
      k.kullanici_adi === kullanici_adi && 
      k.aktif === true
    );
    
    console.log('Bulunan kullanıcı:', kullanici);

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
        console.log('Login başarılı:', response);
        return Response.json(response);
      } else {
        console.log('Şifre yanlış');
        return Response.json({ 
          success: false, 
          error: 'Geçersiz şifre' 
        }, { status: 401 });
      }
    }

    console.log('Kullanıcı bulunamadı');
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
