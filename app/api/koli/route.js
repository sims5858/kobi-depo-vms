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

// DELETE - Koli sil
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Koli ID gerekli' },
        { status: 400 }
      );
    }
    
    console.log('=== KOLI SILME ===');
    console.log('Silinecek koli ID:', id);
    
    // Koli var mı kontrol et
    const koli = koliDB.getById(parseInt(id));
    if (!koli) {
      return NextResponse.json(
        { error: 'Koli bulunamadı' },
        { status: 404 }
      );
    }
    
    // Koli sil
    const silinenKoli = koliDB.delete(parseInt(id));
    
    if (silinenKoli) {
      // Aktivite kaydet
      aktiviteDB.add({
        mesaj: 'Koli silindi',
        detay: {
          koli_no: koli.koli_no,
          lokasyon: koli.lokasyon
        },
        tip: 'koli_silme'
      });
      
      console.log('Koli başarıyla silindi:', koli.koli_no);
      
      return NextResponse.json({
        success: true,
        message: 'Koli başarıyla silindi',
        koli: silinenKoli
      });
    } else {
      return NextResponse.json(
        { error: 'Koli silinemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Koli silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
