import { NextResponse } from 'next/server';
import { koliDB } from '../../../lib/database';

export async function POST(request) {
  try {
    const { koliNumaralari } = await request.json();

    if (!Array.isArray(koliNumaralari) || koliNumaralari.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçerli koli numarası listesi gerekli' },
        { status: 400 }
      );
    }

    const eklenenKoliler = koliDB.addBulk(koliNumaralari);

    return NextResponse.json({
      success: true,
      message: `${eklenenKoliler.length} koli başarıyla eklendi`,
      eklenen: eklenenKoliler.length,
      eklenenKoliler: eklenenKoliler
    });

  } catch (error) {
    console.error('Toplu koli ekleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}