import { NextResponse } from 'next/server';
const { koliDB } = require('../../lib/persistent-database');

export async function GET() {
  try {
    // Gerçek koli verilerini al
    const koliListesi = koliDB.getAll();
    
    // Dashboard için uygun formata çevir
    const formattedKoliListesi = koliListesi.map(koli => ({
      id: koli.id,
      koli_no: koli.koli_no,
      lokasyon: koli.lokasyon || '',
      kapasite: koli.kapasite || 100,
      dolu_miktar: koli.dolu_miktar || 0,
      urun_sayisi: koli.urun_sayisi || 0,
      aciklama: koli.aciklama || '',
      doluluk_orani: koli.doluluk_orani || 0,
      olusturma_tarihi: koli.olusturma_tarihi,
      guncelleme_tarihi: koli.guncelleme_tarihi
    }));
    
    return NextResponse.json(formattedKoliListesi);
  } catch (error) {
    console.error('Koli listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}