import { NextResponse } from 'next/server';
import { urunDB, koliDB, aktiviteDB } from '../../lib/persistent-database.js';

export async function GET() {
  try {
    const urunler = urunDB.getAll();
    console.log('=== ÜRÜN LİSTESİ API ===');
    console.log('Toplam ürün sayısı:', urunler.length);
    console.log('Ürünler:', urunler);
    return NextResponse.json(urunler);

  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const yeniUrun = await request.json();

    // Validasyon
    if (!yeniUrun.barkod || !yeniUrun.urun_adi) {
      return NextResponse.json(
        { error: 'Barkod ve ürün adı gerekli' },
        { status: 400 }
      );
    }

    // Stok miktarı kontrolü - negatif stok engelle
    if (yeniUrun.stok_miktari !== undefined && yeniUrun.stok_miktari < 0) {
      return NextResponse.json(
        { error: 'Stok miktarı negatif olamaz' },
        { status: 400 }
      );
    }

    // Stok miktarı varsayılan değer
    if (yeniUrun.stok_miktari === undefined || yeniUrun.stok_miktari === null) {
      yeniUrun.stok_miktari = 0;
    }

    // Aynı barkod + koli kombinasyonu var mı kontrol et
    // Aynı barkod farklı kolilerde olabilir, ama aynı barkod + aynı koli olamaz
    const mevcutUrun = urunDB.getAll().find(u => 
      u.barkod === yeniUrun.barkod && (u.koli === yeniUrun.koli || u.birim === yeniUrun.koli)
    );
    if (mevcutUrun) {
      return NextResponse.json(
        { error: `Bu barkod (${yeniUrun.barkod}) zaten ${yeniUrun.koli || yeniUrun.birim} kolisinde kullanılıyor` },
        { status: 400 }
      );
    }

    // Ürünü ekle
    const eklenenUrun = urunDB.add(yeniUrun);

    // Aktivite kaydet
    aktiviteDB.add({
      mesaj: 'Yeni ürün eklendi',
      detay: `${yeniUrun.urun_adi} (${yeniUrun.barkod}) eklendi`,
      tip: 'urun_ekleme'
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla eklendi',
      urun: eklenenUrun
    });

  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, ...guncelUrun } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    const guncellenenUrun = urunDB.update(id, guncelUrun);

    if (!guncellenenUrun) {
      return NextResponse.json(
        { error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Aktivite kaydet
    aktiviteDB.add({
      mesaj: 'Ürün güncellendi',
      detay: `${guncellenenUrun.urun_adi} (${guncellenenUrun.barkod}) güncellendi`,
      tip: 'urun_guncelleme'
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      urun: guncellenenUrun
    });

  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }
    
    console.log('=== ÜRÜN SİLME ===');
    console.log('Silinecek ürün ID:', id);
    
    // Ürün var mı kontrol et
    const urun = urunDB.getById(parseInt(id));
    if (!urun) {
      return NextResponse.json(
        { error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }
    
    // Ürün sil
    const silinenUrun = urunDB.delete(parseInt(id));
    
    if (silinenUrun) {
      // Aktivite kaydet
      aktiviteDB.add({
        mesaj: 'Ürün silindi',
        detay: `${urun.urun_adi} (${urun.barkod}) silindi`,
        tip: 'urun_silme'
      });
      
      console.log('Ürün başarıyla silindi:', urun.urun_adi);
      
      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla silindi',
        urun: silinenUrun
      });
    } else {
      return NextResponse.json(
        { error: 'Ürün silinemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
