import { NextResponse } from 'next/server';
import { koliDB, urunDB, aktiviteDB } from '../../lib/persistent-database.js';

// GET - Tüm kolileri listele
export async function GET() {
  try {
    console.log('=== KOLI API GET ===');
    console.log('Vercel ortamı:', process.env.VERCEL ? 'Evet' : 'Hayır');
    
    // Gerçek koli verilerini al
    const koliListesi = koliDB.getAll();
    console.log('Koli DB getAll() sonucu:', koliListesi);
    console.log('Koli sayısı:', koliListesi.length);
    
    if (koliListesi.length > 0) {
      console.log('İlk 3 koli:', koliListesi.slice(0, 3));
    }
    
    return NextResponse.json(koliListesi);
  } catch (error) {
    console.error('Koli listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Yeni koli ekle
export async function POST(request) {
  try {
    const yeniKoli = await request.json();
    
    // Basit validasyon
    if (!yeniKoli.koli_no) {
      return NextResponse.json(
        { error: 'Koli numarası gerekli' },
        { status: 400 }
      );
    }
    
    // Koli ekle
    const eklenenKoli = koliDB.add(yeniKoli);
    
    // Aktivite kaydet
    aktiviteDB.add({
      mesaj: 'Yeni koli eklendi',
      detay: {
        koli_no: yeniKoli.koli_no,
        lokasyon: yeniKoli.lokasyon
      },
      tip: 'koli_ekleme'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Koli başarıyla eklendi',
      koli: eklenenKoli
    });
  } catch (error) {
    console.error('Koli ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
