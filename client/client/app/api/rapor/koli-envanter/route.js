import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Demo koli envanter verileri
    const koliEnvanter = [
      {
        koli_no: 'K001',
        lokasyon: 'A1-01',
        urun_sayisi: 15,
        toplam_adet: 150,
        doluluk_orani: 85.5,
        son_guncelleme: '2025-01-13 10:30:00'
      },
      {
        koli_no: 'K002',
        lokasyon: 'A1-02',
        urun_sayisi: 8,
        toplam_adet: 80,
        doluluk_orani: 45.2,
        son_guncelleme: '2025-01-13 09:15:00'
      },
      {
        koli_no: 'K003',
        lokasyon: 'A1-03',
        urun_sayisi: 0,
        toplam_adet: 0,
        doluluk_orani: 0,
        son_guncelleme: '2025-01-13 08:00:00'
      },
      {
        koli_no: 'K004',
        lokasyon: 'A2-01',
        urun_sayisi: 12,
        toplam_adet: 120,
        doluluk_orani: 67.8,
        son_guncelleme: '2025-01-13 11:45:00'
      },
      {
        koli_no: 'K005',
        lokasyon: 'A2-02',
        urun_sayisi: 20,
        toplam_adet: 200,
        doluluk_orani: 95.0,
        son_guncelleme: '2025-01-13 12:00:00'
      }
    ];

    return NextResponse.json(koliEnvanter);

  } catch (error) {
    console.error('Koli envanter raporu hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
