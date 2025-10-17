import { NextResponse } from 'next/server';
import { toplamaDB, urunDB, koliDB, aktiviteDB } from '../../lib/persistent-database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fis_no = searchParams.get('fis_no');
    
    const toplamaFisiListesi = toplamaDB.getAll();
    
    if (fis_no) {
      // Fiş numarasına göre filtrele
      const filtered = toplamaFisiListesi.filter(fis => fis.fis_no === fis_no);
      // Ürün detaylarını düzleştir
      const flattened = filtered.flatMap(fis => 
        fis.urunler.map(urun => ({
          fisi_no: fis.fis_no,
          koli_no: urun.koli_no,
          barkod: urun.urun_barkod,
          urun_adi: urun.urun_adi,
          adet: urun.adet,
          eski_stok: urun.eski_stok,
          yeni_stok: urun.yeni_stok,
          tarih: fis.tarih
        }))
      );
      return NextResponse.json(flattened);
    }
    
    return NextResponse.json(toplamaFisiListesi);
  } catch (error) {
    console.error('Toplama fişi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { fis_no, fisi_no: fisi_no_alt, urunler, kullanici_adi, siparis_tamamlandi } = await request.json();

    // fis_no veya fisi_no kabul et, eğer yoksa ilk üründen al
    let actualFisNo = fis_no || fisi_no_alt;
    
    // Eğer üst seviyede fis_no yoksa, ilk üründen al
    if (!actualFisNo && urunler && urunler.length > 0) {
      actualFisNo = urunler[0].fisi_no || urunler[0].fis_no;
    }

    if (!actualFisNo || !urunler || !Array.isArray(urunler)) {
      return NextResponse.json(
        { error: 'Fiş numarası ve ürün listesi gerekli' },
        { status: 400 }
      );
    }

    const stokGuncellemeleri = [];
    const aktiviteLoglari = [];

    // Her ürün için stok güncelleme
    for (const urun of urunler) {
      // Ürünü bul (barkod ve koli numarasına göre)
      let mevcutUrun = urunDB.getAll().find(u => 
        u.barkod === urun.urun_barkod && u.birim === urun.koli_no
      );

      // Eğer bulunamazsa, sadece barkod ile ara
      if (!mevcutUrun) {
        mevcutUrun = urunDB.getAll().find(u => u.barkod === urun.urun_barkod);
      }

      if (!mevcutUrun) {
        return NextResponse.json(
          { error: `Ürün bulunamadı: ${urun.urun_barkod} (Koli: ${urun.koli_no})` },
          { status: 400 }
        );
      }

      // Stok kontrolü - negatif stok engelle
      if (mevcutUrun.stok_miktari < urun.adet) {
        return NextResponse.json(
          { error: `Yetersiz stok: ${urun.urun_adi} (Mevcut: ${mevcutUrun.stok_miktari}, İstenen: ${urun.adet}) (Koli: ${urun.koli_no}). Stok negatif olamaz!` },
          { status: 400 }
        );
      }

      // Stok 0 kontrolü - ek güvenlik
      if (mevcutUrun.stok_miktari === 0) {
        return NextResponse.json(
          { error: `Stok tükendi: ${urun.urun_adi} (Koli: ${urun.koli_no}). Bu ürün için stok bulunmuyor.` },
          { status: 400 }
        );
      }

      // Stok güncelle
      const yeniStok = mevcutUrun.stok_miktari - urun.adet;
      urunDB.update(mevcutUrun.id, { stok_miktari: yeniStok });

      stokGuncellemeleri.push({
        urun_id: mevcutUrun.id,
        eski_stok: mevcutUrun.stok_miktari,
        yeni_stok: yeniStok,
        cikis_adet: urun.adet
      });

      // Ürün detaylarını güncelle
      urun.eski_stok = mevcutUrun.stok_miktari;
      urun.yeni_stok = yeniStok;
    }

    // Toplama fişini kaydet
    const toplamaFisi = toplamaDB.add({
      fis_no: actualFisNo,
      urunler,
      kullanici_adi: kullanici_adi || 'Sistem',
      tarih: new Date().toISOString(),
      stok_guncellemeleri: stokGuncellemeleri
    });

    // Aktivite kaydet
    const mesaj = siparis_tamamlandi ? 'Sipariş tamamlandı - Stoklar güncellendi' : 'Toplama fişi oluşturuldu';
    aktiviteDB.add({
      mesaj: mesaj,
      detay: {
        fisi_no: actualFisNo,
        urun_sayisi: urunler.length,
        toplam_adet: urunler.reduce((sum, u) => sum + u.adet, 0),
        siparis_tamamlandi: siparis_tamamlandi || false
      },
      tip: siparis_tamamlandi ? 'siparis_tamamlandi' : 'toplama_fisi'
    });

    return NextResponse.json({
      success: true,
      message: 'Toplama fişi başarıyla oluşturuldu',
      toplama_fisi: toplamaFisi
    });

  } catch (error) {
    console.error('Toplama fişi oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
