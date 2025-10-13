// Debug Login API - Sorun tespiti için
import { loadData } from '../data-store.js';

export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json();
    
    console.log('🔍 Debug Login:', { kullanici_adi, sifre });
    
    // Veriyi yükle
    const data = loadData();
    const kullanicilar = data.kullanicilar || [];
    
    console.log('📋 Yüklenen kullanıcılar:', kullanicilar);
    console.log('📊 Toplam kullanıcı sayısı:', kullanicilar.length);

    // Kullanıcıyı bul
    const kullanici = kullanicilar.find(k => 
      k.kullanici_adi === kullanici_adi && 
      k.aktif === true
    );
    
    console.log('👤 Bulunan kullanıcı:', kullanici);

    if (kullanici) {
      console.log('🔑 Şifre kontrolü:', {
        girilen_sifre: sifre,
        kayitli_sifre: kullanici.sifre,
        esit_mi: sifre === kullanici.sifre
      });
      
      if (sifre === kullanici.sifre) {
        return Response.json({
          success: true,
          message: 'Login başarılı',
          user: kullanici
        });
      } else {
        return Response.json({
          success: false,
          message: 'Şifre yanlış',
          debug: {
            girilen_sifre: sifre,
            kayitli_sifre: kullanici.sifre,
            esit_mi: sifre === kullanici.sifre
          }
        });
      }
    }

    return Response.json({
      success: false,
      message: 'Kullanıcı bulunamadı',
      debug: {
        kullanici_adi,
        aktif_kullanicilar: kullanicilar.filter(k => k.aktif === true)
      }
    });

  } catch (error) {
    console.error('❌ Debug Login error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
