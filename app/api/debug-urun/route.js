import { NextResponse } from 'next/server';
import { urunDB } from '../../lib/supabase-database.js';

export async function GET() {
  try {
    console.log('=== DEBUG ÜRÜN API ===');
    
    // Supabase'den ürünleri al
    const urunler = await urunDB.getAll();
    console.log('Supabase\'den alınan ürünler:', urunler);
    console.log('Ürün sayısı:', urunler.length);
    
    // İlk 3 ürünü detaylı logla
    if (urunler.length > 0) {
      console.log('İlk 3 ürün detayı:');
      urunler.slice(0, 3).forEach((urun, index) => {
        console.log(`Ürün ${index + 1}:`, {
          id: urun.id,
          barkod: urun.barkod,
          urun_adi: urun.urun_adi,
          stok_miktari: urun.stok_miktari,
          created_at: urun.created_at
        });
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug API başarılı',
      urun_sayisi: urunler.length,
      urunler: urunler,
      ilk_3_urun: urunler.slice(0, 3)
    });
    
  } catch (error) {
    console.error('Debug API hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug API hatası: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
