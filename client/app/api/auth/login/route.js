// Optimized Login API
import { loadData } from '../../data-store.js';

export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();
    
    // Input validation
    if (!kullanici_adi || !sifre) {
      return Response.json({ 
        success: false, 
        error: 'Kullanıcı adı ve şifre gerekli' 
      }, { status: 400 });
    }
    
    console.log('🔐 Login denemesi:', { kullanici_adi });
    
    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];

    // Kullanıcıyı bul - Optimized
    const kullanici = kullanicilar.find(k => 
      k.kullanici_adi === kullanici_adi && 
      k.aktif === true
    );

    if (kullanici && sifre === kullanici.sifre) {
      const token = 'vms-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
      console.log('✅ Login başarılı:', kullanici.kullanici_adi);
      return Response.json(response);
    }

    console.log('❌ Login başarısız:', kullanici_adi);
    return Response.json({ 
      success: false, 
      error: 'Geçersiz kullanıcı adı veya şifre' 
    }, { status: 401 });

  } catch (error) {
    console.error('❌ Login error:', error);
    return Response.json({ 
      success: false, 
      error: 'Sunucu hatası' 
    }, { status: 500 });
  }
}
