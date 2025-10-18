import { NextResponse } from 'next/server';
import { urunDB, koliDB, aktiviteDB } from '../../../lib/supabase-database.js';

export async function POST(request) {
  try {
    const requestData = await request.json();
    console.log('Bulk import request data:', requestData);
    
    // Frontend'den gelen format: { urunler: [...] }
    const bulkData = requestData.urunler || requestData;
    
    if (!bulkData || !Array.isArray(bulkData)) {
      console.log('Geçersiz veri formatı:', bulkData);
      return NextResponse.json(
        { error: 'Geçersiz veri formatı - urunler array bekleniyor' },
        { status: 400 }
      );
    }

    let eklenenUrunler = [];
    let hataSayisi = 0;

    for (const urun of bulkData) {
      try {
        console.log('İşlenen ürün:', urun);
        
        // Validasyon
        if (!urun.barkod || !urun.urun_adi) {
          console.log('Eksik alan hatası:', urun);
          hataSayisi++;
          continue;
        }

        // Aynı barkod + koli kombinasyonu var mı kontrol et
        // Aynı barkod farklı kolilerde olabilir, ama aynı barkod + aynı koli olamaz
        const mevcutUrun = urunDB.getAll().find(u => 
          u.barkod === urun.barkod && u.birim === urun.birim
        );
        if (mevcutUrun) {
          console.log('Barkod + Koli çakışması:', urun.barkod, 'koli:', urun.birim);
          hataSayisi++;
          continue;
        }

        // Ürünü ekle
        const eklenenUrun = urunDB.add(urun);
        eklenenUrunler.push(eklenenUrun);
        console.log('Ürün başarıyla eklendi:', eklenenUrun);

      } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        hataSayisi++;
      }
    }

    // Aktivite kaydet
    if (eklenenUrunler.length > 0) {
      aktiviteDB.add({
        mesaj: 'Toplu ürün ekleme',
        detay: `${eklenenUrunler.length} ürün başarıyla eklendi`,
        tip: 'bulk_import'
      });
    }
    
    console.log('Bulk import sonucu:', {
      eklenen: eklenenUrunler.length,
      hatali: hataSayisi,
      toplam: bulkData.length
    });

    return NextResponse.json({
      success: true,
      message: `${eklenenUrunler.length} ürün başarıyla eklendi`,
      eklenen: eklenenUrunler.length,
      hatali: hataSayisi,
      urunler: eklenenUrunler
    });
  } catch (error) {
    console.error('Toplu ürün ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
