import { NextResponse } from 'next/server';
import { urunDB } from '../../lib/database';

export async function GET() {
  try {
    return NextResponse.json(urunDB.getAll());

  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { barkod, urun_adi, kategori, birim, stok_miktari, raf_omru, tedarikci, aciklama, lokasyon, koli } = await request.json();

    if (!barkod || !urun_adi) {
      return NextResponse.json(
        { success: false, error: 'Barkod ve ürün adı gerekli' },
        { status: 400 }
      );
    }

    // Barkod kontrolü
    const existingUrun = urunDB.getAll().find(u => u.barkod === barkod);
    if (existingUrun) {
      return NextResponse.json(
        { success: false, error: 'Bu barkod zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Yeni ürün oluştur
    const newUrun = urunDB.add({
      barkod,
      urun_adi,
      kategori: kategori || '',
      birim: birim || 'Adet',
      stok_miktari: parseInt(stok_miktari) || 0,
      raf_omru: raf_omru ? parseInt(raf_omru) : null,
      tedarikci: tedarikci || '',
      aciklama: aciklama || '',
      lokasyon: lokasyon || '',
      koli: koli || ''
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla eklendi',
      urun: newUrun
    });

  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, barkod, urun_adi, kategori, birim, stok_miktari, raf_omru, tedarikci, aciklama } = await request.json();

    if (!id || !barkod || !urun_adi || !stok_miktari) {
      return NextResponse.json(
        { success: false, error: 'ID, barkod, ürün adı ve stok miktarı gerekli' },
        { status: 400 }
      );
    }

    const urunIndex = urunler.findIndex(u => u.id === parseInt(id));
    if (urunIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Barkod kontrolü (kendisi hariç)
    const existingUrun = urunler.find(u => u.barkod === barkod && u.id !== parseInt(id));
    if (existingUrun) {
      return NextResponse.json(
        { success: false, error: 'Bu barkod zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Ürünü güncelle
    urunler[urunIndex] = {
      ...urunler[urunIndex],
      barkod,
      urun_adi,
      kategori: kategori || '',
      birim: birim || '',
      stok_miktari: parseInt(stok_miktari),
      raf_omru: raf_omru ? parseInt(raf_omru) : null,
      tedarikci: tedarikci || '',
      aciklama: aciklama || ''
    };

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      urun: urunler[urunIndex]
    });

  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      );
    }

    const urunIndex = urunler.findIndex(u => u.id === parseInt(id));
    if (urunIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    urunler.splice(urunIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });

  } catch (error) {
    console.error('Ürün silme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
