import { NextResponse } from 'next/server';
import { loadData, saveData } from '../../data-store';

// Yedek listesini getir (memory'den)
export async function GET() {
  try {
    // Vercel'de dosya sistemi olmadığı için memory'den yedekleri al
    const data = loadData();
    const yedekler = data.yedekler || [];
    
    return NextResponse.json(yedekler);
  } catch (error) {
    console.error('Yedek listesi yüklenirken hata:', error);
    return NextResponse.json({ error: 'Yedek listesi yüklenirken hata oluştu' }, { status: 500 });
  }
}

// Yeni yedek al (memory'ye kaydet)
export async function POST(request) {
  try {
    const body = await request.json();
    const { aciklama } = body;
    
    // Mevcut veriyi yükle
    const data = loadData();
    
    // Yedek verisi oluştur
    const tarih = new Date();
    const yedekAdi = `yedek_${tarih.toISOString().split('T')[0]}_${tarih.toTimeString().split(' ')[0].replace(/:/g, '-')}`;
    
    const backupData = {
      id: yedekAdi,
      dosya_adi: `${yedekAdi}.json`,
      aciklama: aciklama || `Otomatik yedek - ${tarih.toLocaleString('tr-TR')}`,
      olusturma_tarihi: tarih.toISOString(),
      boyut: JSON.stringify(data).length,
      durum: 'aktif',
      veri: data // Tüm veriyi yedek olarak sakla
    };
    
    // Yedekleri data'ya ekle
    if (!data.yedekler) {
      data.yedekler = [];
    }
    data.yedekler.push(backupData);
    
    // Maksimum 10 yedek tut (eski yedekleri sil)
    if (data.yedekler.length > 10) {
      data.yedekler = data.yedekler.slice(-10);
    }
    
    // Veriyi kaydet
    saveData(data);
    
    console.log(`Yedek alındı: ${yedekAdi}`);
    
    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Yedek alma hatası:', error);
    return NextResponse.json({ error: 'Yedek alınırken hata oluştu' }, { status: 500 });
  }
}