import { NextResponse } from 'next/server';
import { loadData, saveData } from '../../../../data-store.js';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Mevcut veriyi yükle
    const data = loadData();
    
    // Yedek dosyasını bul ve sil
    if (data.yedekler) {
      const yedekIndex = data.yedekler.findIndex(y => y.id === id);
      
      if (yedekIndex === -1) {
        return NextResponse.json({ error: 'Yedek bulunamadı' }, { status: 404 });
      }
      
      // Yedeği sil
      data.yedekler.splice(yedekIndex, 1);
      
      // Veriyi kaydet
      saveData(data);
      
      console.log(`Yedek silindi: ${id}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Yedek başarıyla silindi' 
      });
    } else {
      return NextResponse.json({ error: 'Yedek bulunamadı' }, { status: 404 });
    }
  } catch (error) {
    console.error('Yedek silme hatası:', error);
    return NextResponse.json({ error: 'Yedek silinirken hata oluştu' }, { status: 500 });
  }
}