import { NextResponse } from 'next/server';
import { koliDB, urunDB, aktiviteDB } from '../../../lib/persistent-database.js';

export async function POST(request) {
  try {
    console.log('=== KOLI SYNC FROM PRODUCTS ===');
    
    // Tüm ürünleri al
    const urunler = urunDB.getAll();
    console.log('Toplam ürün sayısı:', urunler.length);
    
    // Koli numaralarını topla (hem koli hem birim field'larından)
    const koliNumaralari = new Set();
    urunler.forEach(urun => {
      // koli field'ından
      if (urun.koli && urun.koli.trim() !== '') {
        koliNumaralari.add(urun.koli.trim());
        console.log('Koli field\'ından bulundu:', urun.koli.trim());
      }
      // birim field'ından (eski veriler için)
      if (urun.birim && urun.birim.trim() !== '' && !urun.koli) {
        koliNumaralari.add(urun.birim.trim());
        console.log('Birim field\'ından bulundu:', urun.birim.trim());
      }
    });
    
    console.log('Ürünlerden bulunan koli numaraları:', Array.from(koliNumaralari));
    
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
        aciklama: 'Ürünlerden otomatik oluşturuldu',
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
        mesaj: `${eklenen} koli ürünlerden otomatik oluşturuldu`,
        detay: {
          eklenen_koli_sayisi: eklenen,
          koli_numaralari: Array.from(koliNumaralari).slice(0, 5)
        },
        tip: 'koli_urun_sync'
      });
    }
    
    console.log(`Toplam ${eklenen} koli eklendi, ${zatenVar} koli zaten mevcuttu`);
    
    return NextResponse.json({
      success: true,
      message: `${eklenen} koli ürünlerden oluşturuldu`,
      eklenen: eklenen,
      zaten_var: zatenVar,
      eklenen_koliler: eklenenKoliler,
      toplam_koli_sayisi: koliNumaralari.size
    });
  } catch (error) {
    console.error('Koli sync hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
}
