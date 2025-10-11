// Next.js API route - Dashboard activities
import { loadData } from '../../data-store.js';

export async function GET() {
  try {
    console.log('Dashboard activities API çağrısı');
    
    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    // Gerçek verilerden aktiviteler oluştur
    const activities = [];
    
    // Son eklenen ürünlerden aktiviteler oluştur
    const recentUrunler = urunler.slice(-10).reverse(); // Son 10 ürün
    
    recentUrunler.forEach((urun, index) => {
      const timeAgo = index * 5; // Her aktivite 5 dakika arayla
      const timestamp = new Date(Date.now() - (timeAgo * 60000));
      
      activities.push({
        id: `urun_${urun.barkod}_${index}`,
        action: 'Ürün Eklendi',
        detail: `${urun.urun_adi} (${urun.barkod}) - ${urun.stok_adet || 1} adet`,
        time: timeAgo === 0 ? 'Az önce' : `${timeAgo} dakika önce`,
        timestamp: timestamp.toISOString(),
        user: 'admin',
        type: 'success'
      });
    });
    
    // Sadece gerçek ürün aktivitelerini kullan
    const allActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20); // Son 20 aktivite
    
    console.log('Dashboard activities oluşturuldu:', allActivities.length);
    return Response.json(allActivities);
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
