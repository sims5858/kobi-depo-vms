import { NextResponse } from 'next/server';
import { koliDB } from '../../../lib/database';

export async function POST(request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçerli ID listesi gerekli' },
        { status: 400 }
      );
    }

    const silinenKoliler = [];
    const hataliKoliler = [];

    for (const id of ids) {
      const deletedKoli = koliDB.delete(parseInt(id));
      if (deletedKoli) {
        silinenKoliler.push(deletedKoli);
      } else {
        hataliKoliler.push({ id, hata: 'Koli bulunamadı' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${silinenKoliler.length} koli başarıyla silindi`,
      silinen: silinenKoliler.length,
      hatali: hataliKoliler.length,
      hataliKoliler: hataliKoliler,
      silinenKoliler: silinenKoliler
    });

  } catch (error) {
    console.error('Toplu koli silme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
