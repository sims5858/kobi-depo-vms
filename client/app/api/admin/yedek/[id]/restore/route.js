import { NextResponse } from 'next/server';
import { loadData, saveData } from '../../../../data-store';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { onay } = body;
    
    if (!onay) {
      return NextResponse.json({ error: 'Geri yükleme onayı gerekli' }, { status: 400 });
    }
    
    // Mevcut veriyi yükle
    const currentData = loadData();
    
    // Yedek dosyasını bul
    const yedek = currentData.yedekler?.find(y => y.id === id);
    
    if (!yedek) {
      return NextResponse.json({ error: 'Yedek bulunamadı' }, { status: 404 });
    }
    
    // Mevcut veriyi yedekle (güvenlik için)
    const mevcutYedek = {
      id: `geri_yukleme_oncesi_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      dosya_adi: `geri_yukleme_oncesi_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      aciklama: `Geri yükleme öncesi otomatik yedek - ${new Date().toLocaleString('tr-TR')}`,
      olusturma_tarihi: new Date().toISOString(),
      boyut: JSON.stringify(currentData).length,
      durum: 'aktif',
      veri: { ...currentData }
    };
    
    // Mevcut yedekleri data'ya ekle
    if (!currentData.yedekler) {
      currentData.yedekler = [];
    }
    currentData.yedekler.push(mevcutYedek);
    
    // Yedek verisini geri yükle
    const restoredData = {
      ...yedek.veri,
      yedekler: currentData.yedekler // Yedek listesini koru
    };
    
    // Veriyi kaydet
    saveData(restoredData);
    
    console.log(`Veri geri yüklendi: ${id}`);
    console.log(`Mevcut veri yedeklendi: ${mevcutYedek.id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Veriler başarıyla geri yüklendi',
      yedek_dosyasi: id,
      mevcut_veri_yedeklendi: mevcutYedek.id
    });
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    return NextResponse.json({ error: 'Geri yükleme sırasında hata oluştu' }, { status: 500 });
  }
}