import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Örnek koli verileri
    const koliListesi = [
      {
        id: 1,
        koli_no: '001',
        lokasyon: 'A1-01',
        urun_sayisi: 15,
        toplam_adet: 150,
        doluluk_orani: 75,
        son_guncelleme: '2025-01-13 10:30:00'
      },
      {
        id: 2,
        koli_no: '002',
        lokasyon: 'A1-02',
        urun_sayisi: 8,
        toplam_adet: 80,
        doluluk_orani: 40,
        son_guncelleme: '2025-01-13 09:15:00'
      },
      {
        id: 3,
        koli_no: '003',
        lokasyon: 'A2-01',
        urun_sayisi: 0,
        toplam_adet: 0,
        doluluk_orani: 0,
        son_guncelleme: '2025-01-13 08:45:00'
      },
      {
        id: 4,
        koli_no: '004',
        lokasyon: 'B1-01',
        urun_sayisi: 20,
        toplam_adet: 200,
        doluluk_orani: 100,
        son_guncelleme: '2025-01-13 11:20:00'
      },
      {
        id: 5,
        koli_no: '005',
        lokasyon: 'B1-02',
        urun_sayisi: 12,
        toplam_adet: 120,
        doluluk_orani: 60,
        son_guncelleme: '2025-01-13 10:45:00'
      }
    ];

    return NextResponse.json(koliListesi);

  } catch (error) {
    console.error('Koli listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
