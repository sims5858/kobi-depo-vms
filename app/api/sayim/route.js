import { NextResponse } from 'next/server';

// In-memory sayım geçmişi (demo için)
let sayimListesi = [];

export async function POST(request) {
  try {
    const { sayim_kayitlari, toplam_urun } = await request.json();

    if (!sayim_kayitlari || !Array.isArray(sayim_kayitlari) || sayim_kayitlari.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sayım kayıtları gerekli' },
        { status: 400 }
      );
    }

    // Sayım raporu oluştur
    const sayimRaporu = {
      id: Date.now(),
      sayim_kayitlari: sayim_kayitlari,
      toplam_urun: toplam_urun || sayim_kayitlari.length,
      esit_sayisi: sayim_kayitlari.filter(s => s.fark === 0).length,
      fazla_sayisi: sayim_kayitlari.filter(s => s.fark > 0).length,
      eksik_sayisi: sayim_kayitlari.filter(s => s.fark < 0).length,
      tarih: new Date().toISOString(),
      durum: 'tamamlandı'
    };

    sayimListesi.push(sayimRaporu);

    return NextResponse.json({
      success: true,
      message: 'Sayım işlemi başarıyla tamamlandı',
      rapor: sayimRaporu
    });

  } catch (error) {
    console.error('Sayım hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json(sayimListesi);

  } catch (error) {
    console.error('Sayım listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
