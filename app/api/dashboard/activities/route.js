import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Örnek aktivite verileri
    const activities = [
      {
        id: 1,
        action: 'Ürün Çıkışı',
        detail: 'Koli #001 - 5 adet ürün çıkışı yapıldı',
        time: '2 dakika önce',
        type: 'success'
      },
      {
        id: 2,
        action: 'Koli Transferi',
        detail: 'Koli #003 A1 lokasyonundan B2 lokasyonuna taşındı',
        time: '15 dakika önce',
        type: 'info'
      },
      {
        id: 3,
        action: 'Yeni Ürün Eklendi',
        detail: 'Barkod: 123456789 - Yeni ürün sisteme eklendi',
        time: '1 saat önce',
        type: 'success'
      },
      {
        id: 4,
        action: 'Sayım Tamamlandı',
        detail: 'Koli #005 sayımı tamamlandı - 3 adet fark bulundu',
        time: '2 saat önce',
        type: 'warning'
      },
      {
        id: 5,
        action: 'Kullanıcı Girişi',
        detail: 'Admin kullanıcısı sisteme giriş yaptı',
        time: '3 saat önce',
        type: 'info'
      }
    ];

    return NextResponse.json(activities);

  } catch (error) {
    console.error('Aktivite verileri hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
