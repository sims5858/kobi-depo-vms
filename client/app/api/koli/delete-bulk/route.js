// Next.js API route - Toplu koli silme
import { loadData, saveData } from '../../data-store.js';

export async function POST(request) {
  try {
    const { koli_ids } = await request.json();
    
    console.log('Toplu koli silme başladı:', koli_ids.length, 'koli');
    
    if (!koli_ids || !Array.isArray(koli_ids)) {
      return Response.json({ error: 'Koli ID listesi gerekli' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    let silinen = 0;
    const hatalar = [];

    for (const koliId of koli_ids) {
      try {
        // Bu koli numarasına sahip ürünleri bul ve sil
        const koliNo = koliId; // koliId aslında koli_no
        
        // Ürünlerden bu koli numarasını kaldır
        let urunGuncellendi = false;
        for (let i = urunler.length - 1; i >= 0; i--) {
          const urun = urunler[i];
          
          if (urun.koli_detaylari && urun.koli_detaylari[koliNo]) {
            // Koli detaylarından bu koli numarasını kaldır
            delete urun.koli_detaylari[koliNo];
            
            // Eğer koli detayları boş kaldıysa, ürünü sil
            if (Object.keys(urun.koli_detaylari).length === 0) {
              urunler.splice(i, 1);
              console.log('Ürün silindi (koli detayları boş):', urun.barkod);
            } else {
              // Lokasyon string'ini güncelle
              urun.lokasyon = Object.keys(urun.koli_detaylari).join(', ');
              console.log('Ürün güncellendi:', urun.barkod, 'yeni lokasyon:', urun.lokasyon);
            }
            urunGuncellendi = true;
          } else if (urun.lokasyon && urun.lokasyon.includes(koliNo)) {
            // Eski format: lokasyon string'inden koli numarasını kaldır
            const lokasyonlar = urun.lokasyon.split(',').map(loc => loc.trim());
            const yeniLokasyonlar = lokasyonlar.filter(loc => loc !== koliNo);
            
            if (yeniLokasyonlar.length === 0) {
              // Hiç lokasyon kalmadıysa ürünü sil
              urunler.splice(i, 1);
              console.log('Ürün silindi (lokasyon boş):', urun.barkod);
            } else {
              // Lokasyonu güncelle
              urun.lokasyon = yeniLokasyonlar.join(', ');
              console.log('Ürün güncellendi:', urun.barkod, 'yeni lokasyon:', urun.lokasyon);
            }
            urunGuncellendi = true;
          }
        }
        
        if (urunGuncellendi) {
          silinen++;
          console.log('Koli silindi:', koliNo);
        } else {
          console.log('Koli bulunamadı:', koliNo);
        }
      } catch (error) {
        console.error('Koli silme hatası:', error);
        hatalar.push(`${koliId}: ${error.message}`);
      }
    }

    // Güncellenmiş veriyi kaydet
    data.urunler = urunler;
    saveData(data);

    console.log('Toplu koli silme tamamlandı:', { silinen, toplam: koli_ids.length });

    return Response.json({
      success: true,
      message: 'Toplu koli silme tamamlandı',
      silinen,
      toplam: koli_ids.length,
      hatalar: hatalar.length > 0 ? hatalar : null
    });

  } catch (error) {
    console.error('Toplu koli silme API hatası:', error);
    return Response.json({ 
      error: 'Sunucu hatası: ' + error.message 
    }, { status: 500 });
  }
}
