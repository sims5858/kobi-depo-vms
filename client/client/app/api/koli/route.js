import { NextResponse } from 'next/server';
import { koliDB } from '../../lib/database';

// GET - Tüm kolileri listele
export async function GET() {
  try {
    return NextResponse.json(koliDB.getAll());
  } catch (error) {
    console.error('Koli listesi alınırken hata:', error);
    return NextResponse.json(
      { error: 'Koli listesi alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni koli ekle
export async function POST(request) {
  try {
    const body = await request.json();
    const { koli_no, lokasyon, kapasite, dolu_miktar, urun_sayisi } = body;

    // Koli numarası kontrolü
    const existingKoli = koliDB.getAll().find(k => k.koli_no === koli_no);
    if (existingKoli) {
      return NextResponse.json(
        { error: 'Bu koli numarası zaten mevcut' },
        { status: 400 }
      );
    }

    const yeniKoli = koliDB.add({
      koli_no: koli_no,
      lokasyon: lokasyon || '',
      kapasite: kapasite || 100,
      dolu_miktar: dolu_miktar || 0,
      urun_sayisi: urun_sayisi || 0,
      doluluk_orani: Math.round(((dolu_miktar || 0) / (kapasite || 100)) * 100),
      olusturma_tarihi: new Date().toISOString().split('T')[0],
      guncelleme_tarihi: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json(yeniKoli, { status: 201 });
  } catch (error) {
    console.error('Koli eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Koli eklenemedi' },
      { status: 500 }
    );
  }
}

// PUT - Koli güncelle
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, koli_no, lokasyon, kapasite, dolu_miktar, urun_sayisi } = body;

    const koliIndex = kolilerDB.findIndex(k => k.id === id);
    if (koliIndex === -1) {
      return NextResponse.json(
        { error: 'Koli bulunamadı' },
        { status: 404 }
      );
    }

    // Koli numarası değişiyorsa kontrol et
    if (koli_no && koli_no !== kolilerDB[koliIndex].koli_no) {
      const existingKoli = kolilerDB.find(k => k.koli_no === koli_no && k.id !== id);
      if (existingKoli) {
        return NextResponse.json(
          { error: 'Bu koli numarası zaten mevcut' },
          { status: 400 }
        );
      }
    }

    kolilerDB[koliIndex] = {
      ...kolilerDB[koliIndex],
      koli_no: koli_no || kolilerDB[koliIndex].koli_no,
      lokasyon: lokasyon || kolilerDB[koliIndex].lokasyon,
      kapasite: kapasite || kolilerDB[koliIndex].kapasite,
      dolu_miktar: dolu_miktar !== undefined ? dolu_miktar : kolilerDB[koliIndex].dolu_miktar,
      urun_sayisi: urun_sayisi !== undefined ? urun_sayisi : kolilerDB[koliIndex].urun_sayisi,
      doluluk_orani: Math.round(((dolu_miktar !== undefined ? dolu_miktar : kolilerDB[koliIndex].dolu_miktar) / (kapasite || kolilerDB[koliIndex].kapasite)) * 100),
      guncelleme_tarihi: new Date().toISOString().split('T')[0]
    };

    return NextResponse.json(kolilerDB[koliIndex]);
  } catch (error) {
    console.error('Koli güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Koli güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Koli sil
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Koli ID gerekli' },
        { status: 400 }
      );
    }

    const deletedKoli = koliDB.delete(parseInt(id));
    if (!deletedKoli) {
      return NextResponse.json(
        { error: 'Koli bulunamadı' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Koli başarıyla silindi' });
  } catch (error) {
    console.error('Koli silinirken hata:', error);
    return NextResponse.json(
      { error: 'Koli silinemedi' },
      { status: 500 }
    );
  }
}
