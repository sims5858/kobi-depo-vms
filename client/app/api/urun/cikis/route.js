// Next.js API route - Ürün çıkış
import { loadData, updateUrunler, addCikisKaydi } from '../../data-store.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { koli_no, barkod, adet } = body;

    console.log('Ürün çıkışı:', { koli_no, barkod, adet });

    // Basit validasyon
    if (!koli_no || !barkod || !adet) {
      return Response.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Veriyi yükle
    const data = loadData();
    const urunler = data.urunler;
    
    // Ürünü bul
    const urunIndex = urunler.findIndex(urun => urun.barkod === barkod);
    if (urunIndex === -1) {
      return Response.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const urun = urunler[urunIndex];
    let kalanAdet = 0;
    let guncellendi = false;

    // Yeni format: koli_detaylari kullan
    if (urun.koli_detaylari && urun.koli_detaylari[koli_no]) {
      const mevcutAdet = parseInt(urun.koli_detaylari[koli_no]);
      if (mevcutAdet >= adet) {
        urun.koli_detaylari[koli_no] = mevcutAdet - adet;
        kalanAdet = urun.koli_detaylari[koli_no];
        guncellendi = true;
        
        // Eğer koli tamamen boşaldıysa kaldır
        if (kalanAdet === 0) {
          delete urun.koli_detaylari[koli_no];
        }
      }
    }
    // Eski format: lokasyon string'i kullan
    else if (urun.lokasyon && urun.lokasyon.includes(koli_no)) {
      const mevcutAdet = urun.stok_adet || 1;
      if (mevcutAdet >= adet) {
        urun.stok_adet = mevcutAdet - adet;
        kalanAdet = urun.stok_adet;
        guncellendi = true;
        
        // Lokasyon string'ini güncelle
        if (kalanAdet === 0) {
          urun.lokasyon = urun.lokasyon.split(',').filter(loc => loc.trim() !== koli_no).join(',');
        }
      }
    }

    if (!guncellendi) {
      return Response.json({ error: 'Yeterli stok bulunmuyor' }, { status: 400 });
    }

    console.log(`Ürün çıkışı başarılı: ${barkod} - ${adet} adet, kalan: ${kalanAdet}`);

    // Güncellenmiş veriyi kaydet
    updateUrunler(urunler);

    // Çıkış geçmişine kayıt ekle
    addCikisKaydi(koli_no, barkod, urun.urun_adi, adet);

    return Response.json({
      success: true,
      message: 'Ürün çıkışı başarıyla yapıldı',
      kalan_adet: kalanAdet,
      cikis_no: `C${Date.now()}`,
      urun_adi: urun.urun_adi
    });
  } catch (error) {
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
