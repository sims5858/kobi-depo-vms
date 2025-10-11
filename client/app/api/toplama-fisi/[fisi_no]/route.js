// Next.js API route - Toplama fişi detayları
import { getFisiDetaylari } from '../../data-store.js';

export async function GET(request, { params }) {
  try {
    const { fisi_no } = params;
    
    console.log('Fiş detayları API çağrısı:', { fisi_no });
    
    const detaylar = getFisiDetaylari(fisi_no);
    console.log(`Fiş ${fisi_no} için ${detaylar.length} ürün bulundu`);
    
    return Response.json(detaylar);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
