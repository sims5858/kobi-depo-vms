// Next.js API route - Koli envanter raporu
import { loadData } from '../../data-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const minAdet = searchParams.get('min_adet');
    const maxAdet = searchParams.get('max_adet');
    const sadeceBos = searchParams.get('sadece_bos');
    
    console.log('Koli envanter raporu filtresi:', { minAdet, maxAdet, sadeceBos });
    
    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    const koliler = data.koliler || [];
    
    console.log('Toplam ürün sayısı:', urunler.length);
    console.log('Toplam koli sayısı:', koliler.length);
    console.log('Koli örnekleri:', koliler.slice(0, 3));
    
    // Ürün verilerinden koli envanter raporu oluştur
    const koliMap = new Map();
    
    // Önce tüm kolileri ekle (boş olanlar dahil)
    koliler.forEach(koli => {
      koliMap.set(koli.koli_no, {
        koli_no: koli.koli_no,
        lokasyon: koli.lokasyon || koli.koli_no,
        kapasite: 100,
        durum: 'bos',
        urun_sayisi: 0,
        toplam_adet: 0,
        doluluk_orani: 0,
        olusturma_tarihi: koli.olusturma_tarihi || new Date().toISOString()
      });
    });
    
    console.log('Başlangıç koli map boyutu:', koliMap.size);
    
    // Tüm ürünleri işle
    urunler.forEach(urun => {
      if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
        // Yeni format: koli_detaylari kullan
        Object.entries(urun.koli_detaylari).forEach(([koli_no, adet]) => {
          if (!koliMap.has(koli_no)) {
            koliMap.set(koli_no, {
              koli_no,
              lokasyon: koli_no,
              kapasite: 100,
              durum: 'dolu',
              urun_sayisi: 0,
              toplam_adet: 0,
              doluluk_orani: 0,
              olusturma_tarihi: new Date().toISOString()
            });
          }
          
          const koli = koliMap.get(koli_no);
          koli.urun_sayisi += 1;
          koli.toplam_adet += parseInt(adet);
        });
      } else if (urun.lokasyon) {
        // Eski format: lokasyon string'ini parse et
        const lokasyonlar = urun.lokasyon.split(',').map(loc => loc.trim());
        lokasyonlar.forEach(koli_no => {
          if (!koliMap.has(koli_no)) {
            koliMap.set(koli_no, {
              koli_no,
              lokasyon: koli_no,
              kapasite: 100,
              durum: 'dolu',
              urun_sayisi: 0,
              toplam_adet: 0,
              doluluk_orani: 0,
              olusturma_tarihi: new Date().toISOString()
            });
          }
          
          const koli = koliMap.get(koli_no);
          koli.urun_sayisi += 1;
          koli.toplam_adet += urun.stok_adet || 1;
        });
      }
    });
    
    // Map'i array'e çevir ve doluluk oranını hesapla
    let koliRaporu = Array.from(koliMap.values()).map(koli => {
      // Gerçekçi kapasite hesaplaması
      let kapasite;
      
      if (koli.toplam_adet === 0) {
        // Boş koli - varsayılan kapasite
        kapasite = 100;
      } else if (koli.toplam_adet <= 10) {
        // Küçük koli (1-10 adet)
        kapasite = 50;
      } else if (koli.toplam_adet <= 50) {
        // Orta koli (11-50 adet)
        kapasite = 100;
      } else if (koli.toplam_adet <= 100) {
        // Büyük koli (51-100 adet)
        kapasite = 150;
      } else {
        // Çok büyük koli (100+ adet)
        kapasite = 200;
      }
      
      koli.kapasite = kapasite;
      
      // Doluluk oranını hesapla
      koli.doluluk_orani = Math.min(100, Math.round((koli.toplam_adet / kapasite) * 100));
      
      // Durum belirleme
      koli.durum = koli.toplam_adet === 0 ? 'bos' : 
                   koli.doluluk_orani > 80 ? 'dolu' : 
                   koli.doluluk_orani > 50 ? 'orta' : 'az';
      return koli;
    });
    
    // Koli numarasına göre sırala
    koliRaporu.sort((a, b) => a.koli_no.localeCompare(b.koli_no));
    
    console.log('Toplam koli sayısı:', koliRaporu.length);

    // Filtreleme
    console.log('Filtreleme öncesi koli sayısı:', koliRaporu.length);
    console.log('Filtreleme öncesi örnek koliler:', koliRaporu.slice(0, 3));
    
    if (minAdet) {
      const minAdetNum = parseInt(minAdet);
      const oncekiSayi = koliRaporu.length;
      koliRaporu = koliRaporu.filter(koli => koli.toplam_adet >= minAdetNum);
      console.log(`Min adet filtresi (${minAdetNum}): ${oncekiSayi} -> ${koliRaporu.length} koli kaldı`);
    }

    if (maxAdet && maxAdet !== '999999') {
      const maxAdetNum = parseInt(maxAdet);
      const oncekiSayi = koliRaporu.length;
      koliRaporu = koliRaporu.filter(koli => koli.toplam_adet <= maxAdetNum);
      console.log(`Max adet filtresi (${maxAdetNum}): ${oncekiSayi} -> ${koliRaporu.length} koli kaldı`);
    }

    if (sadeceBos === 'true') {
      const oncekiSayi = koliRaporu.length;
      koliRaporu = koliRaporu.filter(koli => koli.toplam_adet === 0);
      console.log(`Sadece boş koliler: ${oncekiSayi} -> ${koliRaporu.length} koli kaldı`);
      console.log('Boş koli örnekleri:', koliRaporu.slice(0, 3));
    }

    console.log('Filtrelenmiş koli sayısı:', koliRaporu.length);
    return Response.json(koliRaporu);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
