import { NextResponse } from 'next/server';

// In-memory transfer geçmişi (demo için)
let transferHistory = [];

export async function POST(request) {
  try {
    const { koli_no, kaynak_lokasyon, hedef_lokasyon, aciklama } = await request.json();

    if (!koli_no || !kaynak_lokasyon || !hedef_lokasyon) {
      return NextResponse.json(
        { success: false, error: 'Koli no, kaynak ve hedef lokasyon gerekli' },
        { status: 400 }
      );
    }

    // Transfer kaydı oluştur
    const transfer = {
      id: Date.now(),
      koli_no,
      kaynak_lokasyon,
      hedef_lokasyon,
      aciklama: aciklama || '',
      tarih: new Date().toISOString(),
      durum: 'tamamlandı'
    };

    transferHistory.push(transfer);

    return NextResponse.json({
      success: true,
      message: 'Koli transferi başarıyla tamamlandı',
      transfer
    });

  } catch (error) {
    console.error('Koli transfer hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json(transferHistory);

  } catch (error) {
    console.error('Transfer geçmişi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
