// Next.js API route - Çıkış geçmişi
import { loadData } from '../data-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tarih = searchParams.get('tarih');
    
    console.log('Çıkış geçmişi API çağrısı:', { tarih });
    
    // Veriyi yükle
    const data = loadData();
    const cikisGecmisi = data.cikisGecmisi;
    
    // Eğer belirli bir tarih isteniyorsa filtrele
    let filtrelenmisGecmis = cikisGecmisi;
    if (tarih) {
      filtrelenmisGecmis = cikisGecmisi.filter(item => item.tarih === tarih);
    }
    
    console.log(`Toplam ${cikisGecmisi.length} çıkış kaydı, filtrelenmiş: ${filtrelenmisGecmis.length}`);
    return Response.json(filtrelenmisGecmis);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

