// Next.js API route - Excel ile ürün import
import { loadData, updateUrunler } from '../../data-store.js';

// Veriyi yükle
const getUrunler = () => {
  const data = loadData();
  return data.urunler;
};

// Export kaldırıldı - Next.js API route'ları sadece HTTP metodları export etmeli

export async function POST(request) {
  try {
    const body = await request.json();
    const { urunler: excelUrunler } = body;

    console.log('Excel import başladı:', { urun_sayisi: excelUrunler?.length });
    console.log('Excel verisi örneği:', JSON.stringify(excelUrunler.slice(0, 2), null, 2));

    if (!excelUrunler || !Array.isArray(excelUrunler)) {
      console.error('Excel verisi geçersiz:', excelUrunler);
      return Response.json({ error: 'Ürün listesi gerekli' }, { status: 400 });
    }

    // Mevcut ürünleri al
    const urunler = getUrunler();
    let eklenen = 0;
    let guncellenen = 0;

    // Mevcut ürünleri güncelle veya yeni ürün ekle
    excelUrunler.forEach(excelUrun => {
      const mevcutIndex = urunler.findIndex(urun => urun.barkod === excelUrun.barkod);
      
      if (mevcutIndex !== -1) {
        // Mevcut ürünü güncelle
        const mevcutUrun = urunler[mevcutIndex];
        
        // Koli detaylarını güncelle
        if (excelUrun.koli_no && excelUrun.adet) {
          if (!mevcutUrun.koli_detaylari) {
            mevcutUrun.koli_detaylari = {};
          }
          
          // Eğer aynı koli varsa adetleri topla
          if (mevcutUrun.koli_detaylari[excelUrun.koli_no]) {
            mevcutUrun.koli_detaylari[excelUrun.koli_no] += excelUrun.adet;
          } else {
            mevcutUrun.koli_detaylari[excelUrun.koli_no] = excelUrun.adet;
          }
          
          // Toplam stok adetini hesapla
          mevcutUrun.stok_adet = Object.values(mevcutUrun.koli_detaylari).reduce((sum, adet) => sum + adet, 0);
          
          // Lokasyon string'ini güncelle
          const koliListesi = Object.keys(mevcutUrun.koli_detaylari);
          mevcutUrun.lokasyon = koliListesi.join(', ');
          
          console.log(`Ürün güncellendi: ${excelUrun.barkod} Lokasyon: ${mevcutUrun.lokasyon}`);
        }
        
        guncellenen++;
      } else {
        // Yeni ürün ekle
        const yeniUrun = {
          barkod: excelUrun.barkod,
          urun_adi: excelUrun.urun_adi,
          beden: excelUrun.beden || '',
          stok_adet: excelUrun.adet || 1,
          koli_detaylari: excelUrun.koli_no ? { [excelUrun.koli_no]: excelUrun.adet || 1 } : {},
          lokasyon: excelUrun.koli_no || '',
          birim: 'adet',
          aciklama: '',
          olusturma_tarihi: new Date().toISOString()
        };
        
        urunler.push(yeniUrun);
        console.log(`Yeni ürün eklendi: ${excelUrun.barkod}`);
        eklenen++;
      }
    });

    // Veriyi kalıcı olarak kaydet
    console.log('Veri kaydediliyor...', { eklenen, guncellenen, toplam: urunler.length });
    updateUrunler(urunler);
    console.log('Veri kaydedildi!');

    console.log(`Excel import tamamlandı: { eklenen: ${eklenen}, guncellenen: ${guncellenen}, toplam: ${urunler.length} }`);

    return Response.json({
      success: true,
      message: 'Excel import başarıyla tamamlandı',
      eklenen,
      guncellenen,
      toplam: urunler.length
    });

  } catch (error) {
    console.error('Excel import hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}