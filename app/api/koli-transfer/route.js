import { NextResponse } from 'next/server';
const { transferDB, urunDB, koliDB, aktiviteDB } = require('../../lib/persistent-database');

export async function GET() {
  try {
    // Son 10 günlük transfer geçmişini al
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const transferHistory = transferDB.getAll().filter(transfer => 
      new Date(transfer.tarih) >= tenDaysAgo
    );
    
    return NextResponse.json(transferHistory);
  } catch (error) {
    console.error('Transfer geçmişi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { 
      cikan_koli, 
      giren_koli, 
      transfer_listesi, 
      transfer_mode = 'single',
      kullanici_adi = 'Sistem' 
    } = await request.json();

    console.log('=== TRANSFER DEBUG ===');
    console.log('Çıkan koli:', cikan_koli);
    console.log('Giren koli:', giren_koli);
    console.log('Transfer listesi:', transfer_listesi);
    console.log('Transfer modu:', transfer_mode);
    console.log('Transfer listesi uzunluğu:', transfer_listesi.length);
    if (transfer_listesi.length > 0) {
      console.log('İlk transfer item:', transfer_listesi[0]);
    }

    if (!cikan_koli || !giren_koli || !transfer_listesi || !Array.isArray(transfer_listesi)) {
      console.log('=== VALIDATION ERROR ===');
      console.log('cikan_koli:', cikan_koli);
      console.log('giren_koli:', giren_koli);
      console.log('transfer_listesi:', transfer_listesi);
      console.log('transfer_listesi is array:', Array.isArray(transfer_listesi));
      return NextResponse.json(
        { error: 'Çıkan koli, giren koli ve transfer listesi gerekli' },
        { status: 400 }
      );
    }

    const transferDetaylari = [];

    // Her ürün için transfer işlemi
    for (const transferItem of transfer_listesi) {
      const { urun_barkod, adet } = transferItem;

      // Ürünü bul
      let bulunanUrun;
      
      if (transfer_mode === 'multiple') {
        // Çoklu transfer modunda: cikan_koli bir array
        const cikanKoliArray = Array.isArray(cikan_koli) ? cikan_koli : [cikan_koli];
        console.log('Çoklu transfer - Çıkan koli array:', cikanKoliArray);
        console.log('Aranan barkod:', urun_barkod);
        
        bulunanUrun = urunDB.getAll().find(urun => 
          urun.barkod === urun_barkod && cikanKoliArray.includes(urun.birim)
        );
        
        console.log('Çoklu transfer - Bulunan ürün:', bulunanUrun);
      } else {
        // Tekli transfer modunda
        bulunanUrun = urunDB.getAll().find(urun => 
          urun.barkod === urun_barkod && urun.birim === cikan_koli
        );
      }

      if (!bulunanUrun) {
        console.log('Ürün bulunamadı:', urun_barkod, 'Çıkan koli:', cikan_koli);
        return NextResponse.json(
          { error: `Ürün bulunamadı: ${urun_barkod}` },
          { status: 400 }
        );
      }

      // Stok kontrolü
      if (bulunanUrun.stok_miktari < adet) {
        return NextResponse.json(
          { error: `Yetersiz stok: ${bulunanUrun.urun_adi} (Mevcut: ${bulunanUrun.stok_miktari}, İstenen: ${adet})` },
          { status: 400 }
        );
      }

      // Çıkan koliden stok düş
      const yeniStok = bulunanUrun.stok_miktari - adet;
      urunDB.update(bulunanUrun.id, { stok_miktari: yeniStok });

      // Giren koliye ürün ekle
      const girenKoliUrun = urunDB.getAll().find(urun => 
        urun.barkod === urun_barkod && urun.birim === giren_koli
      );

      if (girenKoliUrun) {
        // Giren koliye aynı ürün varsa stok artır
        const girenKoliYeniStok = girenKoliUrun.stok_miktari + adet;
        urunDB.update(girenKoliUrun.id, { stok_miktari: girenKoliYeniStok });
        console.log(`Giren koliye stok artırıldı: ${urun_barkod} - ${giren_koli} (${girenKoliUrun.stok_miktari} → ${girenKoliYeniStok})`);
      } else {
        // Giren koliye yeni ürün ekle
        const yeniUrun = {
          barkod: bulunanUrun.barkod,
          urun_adi: bulunanUrun.urun_adi,
          birim: giren_koli,
          stok_miktari: adet,
          aciklama: bulunanUrun.aciklama || ''
        };
        urunDB.add(yeniUrun);
        console.log(`Giren koliye yeni ürün eklendi: ${urun_barkod} - ${giren_koli} (${adet} adet)`);
      }

      transferDetaylari.push({
        urun_id: bulunanUrun.id,
        urun_barkod: urun_barkod,
        urun_adi: bulunanUrun.urun_adi,
        adet: adet,
        eski_stok: bulunanUrun.stok_miktari,
        yeni_stok: yeniStok,
        cikan_koli: cikan_koli,
        giren_koli: giren_koli
      });
    }

    // Transfer kaydını oluştur
    const transfer = transferDB.add({
      cikan_koli: transfer_mode === 'multiple' ? cikan_koli : [cikan_koli],
      giren_koli: giren_koli,
      transfer_listesi: transferDetaylari,
      transfer_mode: transfer_mode,
      kullanici_adi: kullanici_adi,
      tarih: new Date().toISOString()
    });

    // Koli bilgilerini güncelle
    const updateKoliStats = (koliNo) => {
      const koliUrunleri = urunDB.getAll().filter(urun => urun.birim === koliNo);
      // Sadece stoklu ürünleri say (stok_miktari > 0)
      const stokluUrunleri = koliUrunleri.filter(urun => urun.stok_miktari > 0);
      const toplamStok = stokluUrunleri.reduce((sum, urun) => sum + (urun.stok_miktari || 0), 0);
      const urunSayisi = stokluUrunleri.length; // Sadece stoklu ürün sayısı
      
      // Koli bilgilerini güncelle
      const koli = koliDB.getAll().find(k => k.koli_no === koliNo);
      if (koli) {
        koliDB.update(koli.id, {
          dolu_miktar: toplamStok,
          urun_sayisi: urunSayisi,
          doluluk_orani: koli.kapasite > 0 ? Math.round((toplamStok / koli.kapasite) * 100) : 0,
          guncelleme_tarihi: new Date().toISOString().split('T')[0]
        });
        console.log(`Koli ${koliNo} güncellendi: ${toplamStok} stok, ${urunSayisi} stoklu ürün (${koliUrunleri.length} toplam ürün)`);
      }
    };

    // Çıkan koli bilgilerini güncelle
    if (transfer_mode === 'multiple') {
      const cikanKoliArray = Array.isArray(cikan_koli) ? cikan_koli : [cikan_koli];
      cikanKoliArray.forEach(koliNo => updateKoliStats(koliNo));
    } else {
      updateKoliStats(cikan_koli);
    }

    // Giren koli bilgilerini güncelle
    updateKoliStats(giren_koli);

    // Aktivite kaydet
    aktiviteDB.add({
      mesaj: 'Koli transferi tamamlandı',
      detay: {
        cikan_koli: cikan_koli,
        giren_koli: giren_koli,
        transfer_sayisi: transfer_listesi.length,
        transfer_mode: transfer_mode
      },
      tip: 'koli_transfer'
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer başarıyla tamamlandı',
      transfer: transfer
    });

  } catch (error) {
    console.error('Transfer hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}