import { NextResponse } from 'next/server';
import { aktiviteDB } from '../../../lib/persistent-database.js';

export async function GET() {
  try {
    const aktiviteler = aktiviteDB.getAll();
    
    // Tarihe göre sırala (en yeni en üstte) ve son 50 aktiviteyi al
    const formattedActivities = aktiviteler
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih)) // En yeni en üstte
      .slice(0, 50) // İlk 50 aktiviteyi al
      .map(activity => ({
        id: activity.id,
        action: activity.mesaj || activity.aciklama || 'Aktivite',
        detail: typeof activity.detay === 'object' ? JSON.stringify(activity.detay) : activity.detay || 'Detay yok',
        date: activity.tarih,
        type: activity.tip || 'genel'
      }));
    
    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Aktivite listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
