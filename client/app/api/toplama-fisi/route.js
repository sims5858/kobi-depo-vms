// Next.js API route - Toplama fişi
import { loadData, addToplamaFisi, getFisiDetaylari } from '../data-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tarih = searchParams.get('tarih');
    
    console.log('Toplama fişi API çağrısı:', { tarih });
    
    // Veriyi yükle
    const data = loadData();
    const toplamaFisleri = data.toplamaFisleri;
    
    // Eğer belirli bir tarih isteniyorsa filtrele
    let filtrelenmisFisler = toplamaFisleri;
    if (tarih) {
      filtrelenmisFisler = toplamaFisleri.filter(fis => fis.tarih === tarih);
    }
    
    console.log(`Toplam ${toplamaFisleri.length} fiş, filtrelenmiş: ${filtrelenmisFisler.length}`);
    return Response.json(filtrelenmisFisler);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { urunler } = body;

    console.log('Toplama fişi oluşturuluyor:', { urun_sayisi: urunler?.length });

    // Basit validasyon
    if (!urunler || !Array.isArray(urunler)) {
      return Response.json({ error: 'Ürün listesi gerekli' }, { status: 400 });
    }

    // Yeni fiş oluştur
    const yeniFis = addToplamaFisi(urunler);

    return Response.json({
      success: true,
      message: 'Toplama fişi başarıyla oluşturuldu',
      fisi_no: yeniFis.fisi_no,
      toplam_urun: yeniFis.toplam_urun,
      toplam_adet: yeniFis.toplam_adet
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

