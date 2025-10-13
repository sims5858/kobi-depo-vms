import { NextResponse } from 'next/server';
import { urunDB } from '../../../lib/database';

export async function POST(request) {
  try {
    const { urunler: yeniUrunler } = await request.json();

    if (!Array.isArray(yeniUrunler) || yeniUrunler.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçerli ürün listesi gerekli' },
        { status: 400 }
      );
    }

    const { eklenenUrunler, hataliUrunler } = urunDB.addBulk(yeniUrunler);

    return NextResponse.json({
      success: true,
      message: `${eklenenUrunler.length} ürün başarıyla eklendi`,
      eklenen: eklenenUrunler.length,
      hatali: hataliUrunler.length,
      hataliUrunler: hataliUrunler
    });

  } catch (error) {
    console.error('Toplu ürün ekleme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
