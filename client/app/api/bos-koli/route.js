// Next.js API route - Boş koli raporu
import { loadData } from '../data-store.js';

export async function GET() {
  try {
    console.log('Boş koli raporu API çağrısı');
    
    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    // Tüm koli numaralarını topla
    const tumKoliler = new Set();
    
    urunler.forEach(urun => {
      if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
        Object.keys(urun.koli_detaylari).forEach(koli_no => tumKoliler.add(koli_no));
      } else if (urun.lokasyon) {
        urun.lokasyon.split(',').forEach(loc => tumKoliler.add(loc.trim()));
      }
    });
    
    // Boş kolileri bul
    const bosKoliler = [];
    const doluKoliler = new Set();
    
    // Dolu kolileri tespit et
    urunler.forEach(urun => {
      if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
        Object.entries(urun.koli_detaylari).forEach(([koli_no, adet]) => {
          if (parseInt(adet) > 0) {
            doluKoliler.add(koli_no);
          }
        });
      } else if (urun.lokasyon && (urun.stok_adet || 0) > 0) {
        urun.lokasyon.split(',').forEach(loc => doluKoliler.add(loc.trim()));
      }
    });
    
    // Boş kolileri oluştur
    tumKoliler.forEach(koli_no => {
      if (!doluKoliler.has(koli_no)) {
        bosKoliler.push({
          koli_no: koli_no,
          lokasyon: koli_no,
          kapasite: 100,
          durum: 'bos',
          urun_sayisi: 0,
          toplam_adet: 0,
          doluluk_orani: 0,
          olusturma_tarihi: new Date().toISOString()
        });
      }
    });
    
    console.log(`Toplam ${tumKoliler.size} koli, ${bosKoliler.length} boş koli`);
    return Response.json(bosKoliler);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
