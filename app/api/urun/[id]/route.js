import { NextResponse } from 'next/server';
const { urunDB, aktiviteDB } = require('../../../lib/persistent-database');

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    // Hızlı silme işlemi - minimal log
    const silinenUrun = urunDB.getById(id);
    
    if (!silinenUrun) {
      return NextResponse.json(
        { error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    const basarili = urunDB.delete(id);

    if (basarili) {
      // Aktivite kaydet (asenkron, hata olursa da silme işlemi başarılı olsun)
      setImmediate(() => {
        try {
          aktiviteDB.add({
            mesaj: 'Ürün silindi',
            detay: `${silinenUrun.urun_adi} (${silinenUrun.barkod}) silindi`,
            tip: 'urun_silme'
          });
        } catch (activityError) {
          console.warn('Aktivite kaydedilemedi:', activityError);
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla silindi'
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
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    const urun = urunDB.getById(id);
    if (!urun) {
      return NextResponse.json(
        { error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(urun);

  } catch (error) {
    console.error('Ürün getirme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const guncelUrun = await request.json();

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    // Stok miktarı kontrolü - negatif stok engelle
    if (guncelUrun.stok_miktari !== undefined && guncelUrun.stok_miktari < 0) {
      return NextResponse.json(
        { error: 'Stok miktarı negatif olamaz' },
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
