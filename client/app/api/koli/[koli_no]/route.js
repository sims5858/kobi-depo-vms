// Next.js API route - Tekil koli düzenleme ve silme
import { loadData, saveData } from '../../data-store.js';

// Koli düzenle
export async function PUT(request, { params }) {
  try {
    const { koli_no } = params;
    const body = await request.json();
    const { lokasyon, durum } = body;
    
    console.log('Koli düzenleniyor:', { koli_no, lokasyon, durum });
    
    if (!lokasyon) {
      return Response.json({ error: 'Lokasyon gerekli' }, { status: 400 });
    }
    
    // Veriyi yükle
    const data = loadData();
    
    // Koli bul (koliler listesinde)
    const koliIndex = data.koliler?.findIndex(k => k.koli_no === koli_no);
    if (koliIndex === -1 || !data.koliler) {
      return Response.json({ error: 'Koli bulunamadı' }, { status: 404 });
    }
    
    // Koli güncelle
    data.koliler[koliIndex] = {
      ...data.koliler[koliIndex],
      lokasyon,
      durum: durum || 'aktif'
    };
    
    // Veriyi kaydet
    saveData(data);
    
    console.log('Koli başarıyla güncellendi:', data.koliler[koliIndex]);
    
    return Response.json({
      success: true,
      message: 'Koli başarıyla güncellendi',
      koli: data.koliler[koliIndex]
    });
    
  } catch (error) {
    console.error('Koli güncelleme API hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { koli_no } = params;
    
    console.log('Koli silme başladı:', koli_no);
    
    if (!koli_no) {
      return Response.json({ error: 'Koli numarası gerekli' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    let silinen = 0;
    let guncellenen = 0;

    // Ürünlerden bu koli numarasını kaldır
    for (let i = urunler.length - 1; i >= 0; i--) {
      const urun = urunler[i];
      
      if (urun.koli_detaylari && urun.koli_detaylari[koli_no]) {
        // Koli detaylarından bu koli numarasını kaldır
        delete urun.koli_detaylari[koli_no];
        
        // Eğer koli detayları boş kaldıysa, ürünü sil
        if (Object.keys(urun.koli_detaylari).length === 0) {
          urunler.splice(i, 1);
          silinen++;
          console.log('Ürün silindi (koli detayları boş):', urun.barkod);
        } else {
          // Lokasyon string'ini güncelle
          urun.lokasyon = Object.keys(urun.koli_detaylari).join(', ');
          guncellenen++;
          console.log('Ürün güncellendi:', urun.barkod, 'yeni lokasyon:', urun.lokasyon);
        }
      } else if (urun.lokasyon && urun.lokasyon.includes(koli_no)) {
        // Eski format: lokasyon string'inden koli numarasını kaldır
        const lokasyonlar = urun.lokasyon.split(',').map(loc => loc.trim());
        const yeniLokasyonlar = lokasyonlar.filter(loc => loc !== koli_no);
        
        if (yeniLokasyonlar.length === 0) {
          // Hiç lokasyon kalmadıysa ürünü sil
          urunler.splice(i, 1);
          silinen++;
          console.log('Ürün silindi (lokasyon boş):', urun.barkod);
        } else {
          // Lokasyonu güncelle
          urun.lokasyon = yeniLokasyonlar.join(', ');
          guncellenen++;
          console.log('Ürün güncellendi:', urun.barkod, 'yeni lokasyon:', urun.lokasyon);
        }
      }
    }

    // Güncellenmiş veriyi kaydet
    data.urunler = urunler;
    saveData(data);

    console.log('Koli silme tamamlandı:', { koli_no, silinen, guncellenen });

    return Response.json({
      success: true,
      message: 'Koli başarıyla silindi',
      koli_no,
      silinen_urun: silinen,
      guncellenen_urun: guncellenen
    });

  } catch (error) {
    console.error('Koli silme API hatası:', error);
    return Response.json({ 
      error: 'Sunucu hatası: ' + error.message 
    }, { status: 500 });
  }
}
