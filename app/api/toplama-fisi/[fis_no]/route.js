import { NextResponse } from 'next/server';
import { toplamaDB, urunDB, aktiviteDB } from '../../../lib/persistent-database.js';

export async function DELETE(request, { params }) {
  try {
    console.log('Fiş silme API çağrıldı, params:', params);
    const fis_no = params.fis_no;
    console.log('Fiş numarası:', fis_no);

    if (!fis_no) {
      return NextResponse.json(
        { error: 'Fiş numarası gerekli' },
        { status: 400 }
      );
    }

    // Fişi bul
    const toplamaFisiListesi = toplamaDB.getAll();
    console.log('Toplam fiş sayısı:', toplamaFisiListesi.length);
    console.log('Mevcut fişler:', toplamaFisiListesi.map(f => f.fis_no));
    console.log('Aranan fiş numarası:', fis_no);
    
    const fis = toplamaFisiListesi.find(f => f.fis_no === fis_no);
    console.log('Bulunan fiş:', fis);

    if (!fis) {
      console.log('Fiş bulunamadı! Mevcut fişler:', toplamaFisiListesi.map(f => f.fis_no));
      return NextResponse.json(
        { error: `Fiş bulunamadı: ${fis_no}. Mevcut fişler: ${toplamaFisiListesi.map(f => f.fis_no).join(', ')}` },
        { status: 404 }
      );
    }

    console.log('Silinecek fiş:', fis);

    // Fişteki ürünlerin stoklarını geri yükle
    const stokGeriYuklemeleri = [];
    
    for (const urun of fis.urunler) {
      // Ürünü bul (barkod ve koli numarasına göre - hem koli hem birim field'larından)
      let mevcutUrun = urunDB.getAll().find(u => 
        u.barkod === urun.urun_barkod && (u.koli === urun.koli_no || u.birim === urun.koli_no)
      );

      // Eğer bulunamazsa, sadece barkod ile ara
      if (!mevcutUrun) {
        mevcutUrun = urunDB.getAll().find(u => u.barkod === urun.urun_barkod);
      }

      if (mevcutUrun) {
        // Stok geri yükle
        const yeniStok = mevcutUrun.stok_miktari + urun.adet;
        urunDB.update(mevcutUrun.id, { stok_miktari: yeniStok });

        stokGeriYuklemeleri.push({
          urun_id: mevcutUrun.id,
          urun_adi: urun.urun_adi,
          eski_stok: mevcutUrun.stok_miktari,
          yeni_stok: yeniStok,
          geri_yuklenen_adet: urun.adet
        });

        console.log(`Stok geri yüklendi: ${urun.urun_adi} - ${mevcutUrun.stok_miktari} → ${yeniStok}`);
      } else {
        console.warn(`Ürün bulunamadı: ${urun.urun_barkod} (Koli: ${urun.koli_no})`);
      }
    }

    // Fişi sil
    const basarili = toplamaDB.delete(fis.id);

    if (!basarili) {
      return NextResponse.json(
        { error: 'Fiş silinemedi' },
        { status: 500 }
      );
    }

    // Aktivite kaydet
    try {
      aktiviteDB.add({
        mesaj: 'Fiş silindi ve stoklar geri yüklendi',
        detay: `Fiş: ${fis_no}, ${fis.urunler.length} ürün, ${fis.urunler.reduce((sum, u) => sum + u.adet, 0)} adet`,
        tip: 'fis_silme',
        stok_geri_yuklemeleri: stokGeriYuklemeleri
      });
    } catch (activityError) {
      console.warn('Aktivite kaydedilemedi:', activityError);
    }

    return NextResponse.json({
      success: true,
      message: 'Fiş başarıyla silindi ve stoklar geri yüklendi',
      silinen_fis: {
        fis_no: fis.fis_no,
        urun_sayisi: fis.urunler.length,
        toplam_adet: fis.urunler.reduce((sum, u) => sum + u.adet, 0)
      },
      stok_geri_yuklemeleri: stokGeriYuklemeleri
    });

  } catch (error) {
    console.error('Fiş silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
