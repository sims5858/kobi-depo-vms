// Next.js API route - Ürün listesi
import { urunler as excelUrunler } from './excel-import/route.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    // Excel import API'sinden ürünleri al
    let urunler = [...excelUrunler];

    // Arama filtresi
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase();
      urunler = urunler.filter(urun => 
        urun.barkod.toLowerCase().includes(searchTerm) ||
        urun.urun_adi.toLowerCase().includes(searchTerm) ||
        (urun.kategori && urun.kategori.toLowerCase().includes(searchTerm))
      );
    }

    return Response.json(urunler);
  } catch (error) {
    console.error('Ürün listesi API hatası:', error);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
