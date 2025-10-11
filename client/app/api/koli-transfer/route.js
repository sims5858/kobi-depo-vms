// Next.js API route - Koli transfer
import { loadData, updateUrunler } from '../data-store.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { cikan_koli, giren_koli, urunler: transferUrunleri } = body;

    console.log('Koli transfer API çağrısı:', { cikan_koli, giren_koli, urun_sayisi: transferUrunleri?.length });

    // Basit validasyon
    if (!cikan_koli || !giren_koli || !transferUrunleri || !Array.isArray(transferUrunleri)) {
      return Response.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    const transferNo = `T${Date.now()}`;
    const toplamUrun = transferUrunleri.reduce((sum, urun) => sum + urun.adet, 0);
    let transferEdilenUrunSayisi = 0;

    // Transfer işlemini gerçekleştir
    transferUrunleri.forEach(transferUrun => {
      const urunIndex = urunler.findIndex(urun => urun.barkod === transferUrun.barkod);
      if (urunIndex !== -1) {
        const urun = urunler[urunIndex];
        
        // Yeni format: koli_detaylari kullan
        if (urun.koli_detaylari && urun.koli_detaylari[cikan_koli]) {
          const mevcutAdet = parseInt(urun.koli_detaylari[cikan_koli]);
          const transferAdet = transferUrun.adet;
          
          if (mevcutAdet >= transferAdet) {
            // Çıkan koliden düş
            urun.koli_detaylari[cikan_koli] = mevcutAdet - transferAdet;
            if (urun.koli_detaylari[cikan_koli] === 0) {
              delete urun.koli_detaylari[cikan_koli];
            }
            
            // Giren koliye ekle
            if (urun.koli_detaylari[giren_koli]) {
              urun.koli_detaylari[giren_koli] += transferAdet;
            } else {
              urun.koli_detaylari[giren_koli] = transferAdet;
            }
            
            transferEdilenUrunSayisi++;
            console.log(`Transfer: ${transferUrun.barkod} - ${transferAdet} adet (${cikan_koli} → ${giren_koli})`);
          }
        }
        // Eski format: lokasyon string'i kullan
        else if (urun.lokasyon && urun.lokasyon.includes(cikan_koli)) {
          const mevcutAdet = urun.stok_adet || 1;
          const transferAdet = transferUrun.adet;
          
          if (mevcutAdet >= transferAdet) {
            // Lokasyon string'ini güncelle
            let lokasyonlar = urun.lokasyon.split(',').map(loc => loc.trim());
            lokasyonlar = lokasyonlar.filter(loc => loc !== cikan_koli);
            lokasyonlar.push(giren_koli);
            urun.lokasyon = lokasyonlar.join(',');
            
            transferEdilenUrunSayisi++;
            console.log(`Transfer: ${transferUrun.barkod} - ${transferAdet} adet (${cikan_koli} → ${giren_koli})`);
          }
        }
      }
    });

    console.log(`Transfer tamamlandı: ${transferEdilenUrunSayisi} ürün transfer edildi`);

    // Güncellenmiş veriyi kaydet
    updateUrunler(urunler);

    return Response.json({
      success: true,
      message: 'Koli transfer başarıyla tamamlandı',
      transfer_no: transferNo,
      cikan_koli,
      giren_koli,
      transfer_edilen_urun_sayisi: transferEdilenUrunSayisi,
      toplam_adet: toplamUrun
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
