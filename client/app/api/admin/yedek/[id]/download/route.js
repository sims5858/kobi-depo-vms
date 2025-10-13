import { NextResponse } from 'next/server';
import { loadData } from '../../../../data-store.js';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Mevcut veriyi yükle
    const data = loadData();
    
    // Yedek dosyasını bul
    const yedek = data.yedekler?.find(y => y.id === id);
    
    if (!yedek) {
      return NextResponse.json({ error: 'Yedek bulunamadı' }, { status: 404 });
    }
    
    // Yedek verisini JSON olarak döndür
    const fileContent = JSON.stringify(yedek.veri, null, 2);
    
    // Response headers ayarla
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${yedek.dosya_adi}"`);
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Yedek indirme hatası:', error);
    return NextResponse.json({ error: 'Yedek indirilirken hata oluştu' }, { status: 500 });
  }
}