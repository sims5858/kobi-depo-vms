// Next.js API route - Koli listesi
import { loadData, saveData } from '../data-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    console.log('Koli listesi API çağrısı:', { search });
    
    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    // Ürün verilerinden koli listesi oluştur
    const koliMap = new Map();
    
    // Tüm ürünleri işle
    urunler.forEach(urun => {
      if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
        // Yeni format: koli_detaylari kullan
        Object.entries(urun.koli_detaylari).forEach(([koli_no, adet]) => {
          if (!koliMap.has(koli_no)) {
            koliMap.set(koli_no, {
              id: koli_no,
              koli_no,
              lokasyon: koli_no,
              kapasite: 100,
              durum: 'aktif',
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
              id: koli_no,
              koli_no,
              lokasyon: koli_no,
              kapasite: 100,
              durum: 'aktif',
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
    let koliler = Array.from(koliMap.values()).map(koli => {
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
                   koli.doluluk_orani > 50 ? 'orta' : 'aktif';
      return koli;
    });
    
    // Koli numarasına göre sırala
    koliler.sort((a, b) => a.koli_no.localeCompare(b.koli_no));
    
    // Arama filtresi
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase();
      koliler = koliler.filter(koli => 
        koli.koli_no.toLowerCase().includes(searchTerm) ||
        koli.lokasyon.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log('Toplam koli sayısı:', koliler.length);
    return Response.json(koliler);
  } catch (error) {
    console.error('Koli listesi API hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// Yeni koli oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    const { koli_no, lokasyon, durum = 'aktif' } = body;
    
    console.log('Yeni koli oluşturuluyor:', { koli_no, lokasyon, durum });
    
    if (!koli_no || !lokasyon) {
      return Response.json({ error: 'Koli numarası ve lokasyon gerekli' }, { status: 400 });
    }
    
    // Veriyi yükle
    const data = loadData();
    
    // Koli zaten var mı kontrol et
    const existingKoli = data.koliler?.find(k => k.koli_no === koli_no);
    if (existingKoli) {
      return Response.json({ error: 'Bu koli numarası zaten kullanılıyor' }, { status: 400 });
    }
    
    // Yeni koli oluştur
    const yeniKoli = {
      id: koli_no,
      koli_no,
      lokasyon,
      durum,
      kapasite: 100,
      urun_sayisi: 0,
      toplam_adet: 0,
      doluluk_orani: 0,
      olusturma_tarihi: new Date().toISOString()
    };
    
    // Koliler listesine ekle
    if (!data.koliler) {
      data.koliler = [];
    }
    data.koliler.push(yeniKoli);
    
    // Veriyi kaydet
    saveData(data);
    
    console.log('Koli başarıyla oluşturuldu:', yeniKoli);
    
    return Response.json({
      success: true,
      message: 'Koli başarıyla oluşturuldu',
      koli: yeniKoli
    });
    
  } catch (error) {
    console.error('Koli oluşturma API hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
