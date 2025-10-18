import { NextResponse } from 'next/server';
import { koliDB, urunDB, aktiviteDB } from '../../lib/supabase-database.js';

// GET - Tüm kolileri listele
export async function GET() {
  try {
    console.log('=== KOLI API GET ===');
    console.log('Vercel ortamı:', process.env.VERCEL ? 'Evet' : 'Hayır');
    
    // Gerçek koli verilerini al
    const koliListesi = await koliDB.getAll();
    console.log('Koli DB getAll() sonucu:', koliListesi);
    console.log('Koli sayısı:', koliListesi.length);
    
    // Ürün verilerini al
    const urunler = await urunDB.getAll();
    console.log('Toplam ürün sayısı:', urunler.length);
    
    // Her koli için istatistikleri hesapla
    const koliListesiWithStats = koliListesi.map(koli => {
      // Bu koliye ait ürünleri bul (hem koli hem birim field'larından)
      const koliUrunleri = urunler.filter(urun => {
        const koliMatch = (urun.koli === koli.koli_no) || (urun.birim === koli.koli_no);
        const stoklu = urun.stok_miktari > 0; // Sadece stoklu ürünler
        return koliMatch && stoklu;
      });
      
      // İstatistikleri hesapla
      const urunSayisi = koliUrunleri.length;
      const toplamAdet = koliUrunleri.reduce((toplam, urun) => toplam + (urun.stok_miktari || 0), 0);
      const dolulukOrani = koli.kapasite > 0 ? (toplamAdet / koli.kapasite) * 100 : 0;
      
      console.log(`Koli ${koli.koli_no}: ${urunSayisi} ürün, ${toplamAdet} adet, %${dolulukOrani.toFixed(1)} doluluk`);
      
      return {
        ...koli,
        urun_sayisi: urunSayisi,
        toplam_adet: toplamAdet,
        doluluk_orani: Math.round(dolulukOrani * 10) / 10, // 1 ondalık basamak
        son_guncelleme: new Date().toISOString().split('T')[0]
      };
    });
    
    if (koliListesiWithStats.length > 0) {
      console.log('İlk 3 koli (istatistiklerle):', koliListesiWithStats.slice(0, 3));
    }
    
    return NextResponse.json(koliListesiWithStats);
  } catch (error) {
    console.error('Koli listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Yeni koli ekle
export async function POST(request) {
  try {
    const yeniKoli = await request.json();
    
    // Basit validasyon
    if (!yeniKoli.koli_no) {
      return NextResponse.json(
        { error: 'Koli numarası gerekli' },
        { status: 400 }
      );
    }
    
    // Koli ekle
    const eklenenKoli = koliDB.add(yeniKoli);
    
    // Aktivite kaydet
    aktiviteDB.add({
      mesaj: 'Yeni koli eklendi',
      detay: {
        koli_no: yeniKoli.koli_no,
        lokasyon: yeniKoli.lokasyon
      },
      tip: 'koli_ekleme'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Koli başarıyla eklendi',
      koli: eklenenKoli
    });
  } catch (error) {
    console.error('Koli ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// DELETE - Koli sil
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Koli ID gerekli' },
        { status: 400 }
      );
    }
    
    console.log('=== KOLI SILME ===');
    console.log('Silinecek koli ID:', id);
    
    // Koli var mı kontrol et
    const koli = koliDB.getById(parseInt(id));
    if (!koli) {
      return NextResponse.json(
        { error: 'Koli bulunamadı' },
        { status: 404 }
      );
    }
    
    // Koli sil
    const silinenKoli = koliDB.delete(parseInt(id));
    
    if (silinenKoli) {
      // Aktivite kaydet
      aktiviteDB.add({
        mesaj: 'Koli silindi',
        detay: {
          koli_no: koli.koli_no,
          lokasyon: koli.lokasyon
        },
        tip: 'koli_silme'
      });
      
      console.log('Koli başarıyla silindi:', koli.koli_no);
      
      return NextResponse.json({
        success: true,
        message: 'Koli başarıyla silindi',
        koli: silinenKoli
      });
    } else {
      return NextResponse.json(
        { error: 'Koli silinemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Koli silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
