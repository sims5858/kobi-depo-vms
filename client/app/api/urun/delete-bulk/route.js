// Next.js API route - Toplu ürün silme
import { urunler } from '../excel-import/route.js';

export async function POST(request) {
  try {
    const { barkodlar } = await request.json();
    
    console.log('Toplu silme başladı:', barkodlar.length, 'ürün');
    
    if (!barkodlar || !Array.isArray(barkodlar)) {
      return Response.json({ error: 'Barkod listesi gerekli' }, { status: 400 });
    }

    let silinen = 0;
    const hatalar = [];

    for (const barkod of barkodlar) {
      try {
        const urunIndex = urunler.findIndex(u => u.barkod === barkod);
        
        if (urunIndex !== -1) {
          urunler.splice(urunIndex, 1);
          silinen++;
          console.log('Ürün silindi:', barkod);
        } else {
          hatalar.push(`${barkod}: Ürün bulunamadı`);
        }
      } catch (error) {
        console.error('Ürün silme hatası:', error);
        hatalar.push(`${barkod}: ${error.message}`);
      }
    }

    console.log('Toplu silme tamamlandı:', { silinen, toplam: barkodlar.length });

    return Response.json({
      success: true,
      message: 'Toplu silme tamamlandı',
      silinen,
      toplam: barkodlar.length,
      hatalar: hatalar.length > 0 ? hatalar : null
    });

  } catch (error) {
    console.error('Toplu silme API hatası:', error);
    return Response.json({ 
      error: 'Sunucu hatası: ' + error.message 
    }, { status: 500 });
  }
}
