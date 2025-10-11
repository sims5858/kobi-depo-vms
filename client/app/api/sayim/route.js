// Next.js API route - Sayım
import { loadData, updateUrunler } from '../data-store.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sayim_listesi } = body;

    console.log('Sayım API çağrısı:', { urun_sayisi: sayim_listesi?.length });

    // Basit validasyon
    if (!sayim_listesi || !Array.isArray(sayim_listesi)) {
      return Response.json({ error: 'Sayım listesi gerekli' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    const sayimNo = `S${Date.now()}`;
    let toplamFark = 0;
    let guncellenenUrunSayisi = 0;

    // Sayım sonuçlarını işle
    sayim_listesi.forEach(sayimItem => {
      const urunIndex = urunler.findIndex(urun => urun.barkod === sayimItem.barkod);
      if (urunIndex !== -1) {
        const urun = urunler[urunIndex];
        const mevcutAdet = urun.stok_adet || 0;
        const sayimAdet = sayimItem.sayim_adet || 0;
        const fark = sayimAdet - mevcutAdet;
        
        // Stok adetini güncelle
        urun.stok_adet = sayimAdet;
        toplamFark += fark;
        guncellenenUrunSayisi++;
        
        console.log(`Ürün ${sayimItem.barkod}: ${mevcutAdet} → ${sayimAdet} (fark: ${fark})`);
      }
    });

    console.log(`Sayım tamamlandı: ${guncellenenUrunSayisi} ürün güncellendi, toplam fark: ${toplamFark}`);

    // Güncellenmiş veriyi kaydet
    updateUrunler(urunler);

    return Response.json({
      success: true,
      message: 'Sayım başarıyla tamamlandı',
      sayim_no: sayimNo,
      toplam_fark: toplamFark,
      islenen_urun_sayisi: sayim_listesi.length,
      guncellenen_urun_sayisi: guncellenenUrunSayisi
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
