import { NextResponse } from 'next/server';
import { koliDB, urunDB, aktiviteDB } from '../../../lib/persistent-database.js';

export async function POST(request) {
  try {
    const { koliNumaralari } = await request.json();
    
    console.log('=== BULK KOLI IMPORT ===');
    console.log('Gelen koli numaraları:', koliNumaralari);
    
    if (!koliNumaralari || !Array.isArray(koliNumaralari)) {
      return NextResponse.json(
        { error: 'Koli numaraları array olarak gönderilmeli' },
        { status: 400 }
      );
    }
    
    let eklenen = 0;
    let zatenVar = 0;
    const eklenenKoliler = [];
    
    for (const koliNo of koliNumaralari) {
      if (!koliNo || koliNo.trim() === '') continue;
      
      // Koli zaten var mı kontrol et
      const mevcutKoli = koliDB.getAll().find(k => k.koli_no === koliNo.trim());
      
      if (mevcutKoli) {
        console.log(`Koli ${koliNo} zaten mevcut`);
        zatenVar++;
        continue;
      }
      
      // Yeni koli oluştur
      const yeniKoli = {
        koli_no: koliNo.trim(),
        lokasyon: '',
        kapasite: 100,
        dolu_miktar: 0,
        urun_sayisi: 0,
        aciklama: 'Ürün yönetiminden otomatik oluşturuldu',
        doluluk_orani: 0
      };
      
      const eklenenKoli = koliDB.add(yeniKoli);
      eklenenKoliler.push(eklenenKoli);
      eklenen++;
      
      console.log(`Koli ${koliNo} eklendi:`, eklenenKoli);
    }
    
    // Aktivite kaydet
    if (eklenen > 0) {
      aktiviteDB.add({
        mesaj: `${eklenen} koli toplu olarak eklendi`,
        detay: {
          eklenen_koli_sayisi: eklenen,
          koli_numaralari: koliNumaralari.slice(0, 5) // İlk 5 tanesini göster
        },
        tip: 'koli_toplu_ekleme'
      });
    }
    
    console.log(`Toplam ${eklenen} koli eklendi, ${zatenVar} koli zaten mevcuttu`);
    
    return NextResponse.json({
      success: true,
      message: `${eklenen} koli başarıyla eklendi`,
      eklenen: eklenen,
      zaten_var: zatenVar,
      eklenen_koliler: eklenenKoliler
    });
  } catch (error) {
    console.error('Toplu koli ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
