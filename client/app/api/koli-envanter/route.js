// Next.js API route - Koli envanter
import { loadData } from '../data-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const koliNo = searchParams.get('koli_no');
    
    console.log('Koli envanter API çağrısı:', { koliNo });
    
    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    // Gerçek ürün verilerinden koli envanter oluştur
    const koliEnvanter = [];
    
    urunler.forEach(urun => {
      if (urun.koli_detaylari && Object.keys(urun.koli_detaylari).length > 0) {
        // Yeni format: koli_detaylari kullan
        Object.entries(urun.koli_detaylari).forEach(([koli_no, adet]) => {
          koliEnvanter.push({
            id: `${urun.barkod}_${koli_no}`,
            koli_no: koli_no,
            urun_barkod: urun.barkod,
            urun_adi: urun.urun_adi,
            adet: parseInt(adet),
            beden: urun.beden || '',
            kategori: urun.kategori || ''
          });
        });
      } else if (urun.lokasyon) {
        // Eski format: lokasyon string'ini parse et
        const lokasyonlar = urun.lokasyon.split(',').map(loc => loc.trim());
        lokasyonlar.forEach(koli_no => {
          koliEnvanter.push({
            id: `${urun.barkod}_${koli_no}`,
            koli_no: koli_no,
            urun_barkod: urun.barkod,
            urun_adi: urun.urun_adi,
            adet: urun.stok_adet || 1,
            beden: urun.beden || '',
            kategori: urun.kategori || ''
          });
        });
      }
    });

    // Eğer belirli bir koli numarası isteniyorsa filtrele
    if (koliNo) {
      const filtrelenmis = koliEnvanter.filter(item => item.koli_no === koliNo);
      console.log(`Koli ${koliNo} için ${filtrelenmis.length} ürün bulundu`);
      return Response.json(filtrelenmis);
    }

    console.log(`Toplam ${koliEnvanter.length} koli envanter kaydı`);
    return Response.json(koliEnvanter);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
