import { NextResponse } from 'next/server';
const { koliDB, urunDB, aktiviteDB } = require('../../lib/persistent-database');

// GET - Tüm kolileri listele
export async function GET() {
  try {
    // Gerçek koli verilerini al
    const koliListesi = koliDB.getAll();
    
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