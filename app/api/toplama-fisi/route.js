import { NextResponse } from 'next/server';

// In-memory toplama fisi geçmişi (demo için)
let toplamaFisiListesi = [];

export async function POST(request) {
  try {
    const { urunler, toplam_urun } = await request.json();

    if (!urunler || !Array.isArray(urunler) || urunler.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün listesi gerekli' },
        { status: 400 }
      );
    }

    // Toplama fisi oluştur
    const fisiNo = `TF-${Date.now()}`;
    const toplamaFisi = {
      fisi_no: fisiNo,
      urunler: urunler,
      toplam_urun: toplam_urun || urunler.length,
      toplam_adet: urunler.reduce((sum, urun) => sum + (urun.adet || 1), 0),
      tarih: new Date().toISOString(),
      durum: 'tamamlandı'
    };

    toplamaFisiListesi.push(toplamaFisi);

    return NextResponse.json({
      success: true,
      message: 'Toplama fisi başarıyla oluşturuldu',
      fisi: toplamaFisi
    });

  } catch (error) {
    console.error('Toplama fisi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json(toplamaFisiListesi);

  } catch (error) {
    console.error('Toplama fisi listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
