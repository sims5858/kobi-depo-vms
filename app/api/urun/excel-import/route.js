import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { urunDB, koliDB, aktiviteDB } from '../../../lib/supabase-database.js';

// Helper function to find column value with multiple possible names
function findColumnValue(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return '';
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosyayı oku
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Basit validasyon
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel dosyası boş' },
        { status: 400 }
      );
    }

    // Debug: Excel verilerini logla
    console.log('=== EXCEL IMPORT DEBUG ===');
    console.log('Excel dosyasından okunan veri:', data);
    console.log('Veri uzunluğu:', data.length);
    console.log('İlk satır örneği:', data[0]);
    console.log('Kolon isimleri:', data[0] ? Object.keys(data[0]) : 'Veri yok');
    
    // Her satırı detaylı incele
    data.forEach((row, index) => {
      console.log(`Satır ${index + 1}:`, row);
      console.log(`Satır ${index + 1} kolonları:`, Object.keys(row));
    });
    
    console.log('========================');

    // Ürünleri veritabanına ekle
    let eklenenUrunler = [];
    let hataSayisi = 0;

    for (const urun of data) {
      try {
        // Daha esnek kolon eşleştirme - kullanıcının formatına göre güncellendi
        const barkod = findColumnValue(urun, ['Barkod', 'barkod', 'BARKOD', 'ÜRÜN BARKODU', 'Ürün Barkodu', 'Ürün Barkod', 'Barcode', 'BARCODE']);
        const urun_adi = findColumnValue(urun, ['Ürün Adı', 'Ürün Adi', 'urun_adi', 'ÜRÜN İSMİ', 'Ürün İsmi', 'Urun_Adi', 'URUN_ADI', 'adi', 'Adi', 'Ürün', 'Product', 'PRODUCT', 'name', 'Name']);
        const birim = findColumnValue(urun, ['Birim', 'birim', 'BIRIM', 'Koli No', 'Koli', 'koli', 'ÜRÜNÜN KOLİSİ', 'Ürünün Kolisi', 'Koli Numarası', 'Unit', 'UNIT', 'box', 'Box']);
        const stok_miktari = findColumnValue(urun, ['Stok Miktarı', 'Stok Miktari', 'stok_miktari', 'Stok_Miktari', 'STOK_MIKTARI', 'miktar', 'Miktar', 'Quantity', 'QUANTITY', 'qty', 'Qty', 'ADET', 'Adet', 'adet']);
        const aciklama = findColumnValue(urun, ['Açıklama', 'Aciklama', 'aciklama', 'ACIKLAMA', 'Description', 'DESCRIPTION', 'desc', 'Desc']);
        
        console.log('Stok miktarı raw değeri:', stok_miktari, 'Tip:', typeof stok_miktari);
        
        const yeniUrun = {
          barkod: barkod || '',
          urun_adi: urun_adi || '',
          birim: birim || '',
          stok_miktari: stok_miktari !== '' && stok_miktari !== null && stok_miktari !== undefined ? parseInt(stok_miktari) : 0, // 0 değeri korunur
          birim_fiyat: 0,
          aciklama: aciklama || ''
        };

        console.log('İşlenen ürün:', yeniUrun);

        // Gerekli alanları kontrol et
        if (!yeniUrun.barkod || !yeniUrun.urun_adi) {
          console.log('Eksik alan hatası:', yeniUrun);
          hataSayisi++;
          continue;
        }

        // Aynı barkod + koli kombinasyonu var mı kontrol et
        // Aynı barkod farklı kolilerde olabilir, ama aynı barkod + aynı koli olamaz
        const mevcutUrun = await urunDB.getByBarkodAndKoli(yeniUrun.barkod, yeniUrun.birim);
        if (mevcutUrun) {
          console.log('Barkod + Koli çakışması:', yeniUrun.barkod, 'koli:', yeniUrun.birim);
          hataSayisi++;
          continue;
        }

        // Ürünü ekle
        const eklenenUrun = await urunDB.add(yeniUrun);
        eklenenUrunler.push(eklenenUrun);
        console.log('Ürün başarıyla eklendi:', eklenenUrun);

      } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        hataSayisi++;
      }
    }

    // Aktivite kaydet
    if (eklenenUrunler.length > 0) {
      await aktiviteDB.add({
        mesaj: 'Excel dosyasından ürün import edildi',
        detay: `${eklenenUrunler.length} ürün başarıyla eklendi`,
        tip: 'excel_import'
      });
    }

    // Preview için tüm ürünleri döndür (eklenen + hatalı olanlar)
    const previewUrunler = data.map((urun, index) => {
      try {
        console.log(`Preview için işlenen satır ${index + 1}:`, urun);
        
        // Daha esnek kolon eşleştirme - kullanıcının formatına göre güncellendi
        const barkod = findColumnValue(urun, ['Barkod', 'barkod', 'BARKOD', 'ÜRÜN BARKODU', 'Ürün Barkodu', 'Ürün Barkod', 'Barcode', 'BARCODE']);
        const urun_adi = findColumnValue(urun, ['Ürün Adı', 'Ürün Adi', 'urun_adi', 'ÜRÜN İSMİ', 'Ürün İsmi', 'Urun_Adi', 'URUN_ADI', 'adi', 'Adi', 'Ürün', 'Product', 'PRODUCT', 'name', 'Name']);
        const birim = findColumnValue(urun, ['Birim', 'birim', 'BIRIM', 'Koli No', 'Koli', 'koli', 'ÜRÜNÜN KOLİSİ', 'Ürünün Kolisi', 'Koli Numarası', 'Unit', 'UNIT', 'box', 'Box']);
        const stok_miktari = findColumnValue(urun, ['Stok Miktarı', 'Stok Miktari', 'stok_miktari', 'Stok_Miktari', 'STOK_MIKTARI', 'miktar', 'Miktar', 'Quantity', 'QUANTITY', 'qty', 'Qty', 'ADET', 'Adet', 'adet']);
        const aciklama = findColumnValue(urun, ['aciklama', 'Aciklama', 'ACIKLAMA', 'Açıklama', 'Aciklama', 'açıklama', 'Description', 'DESCRIPTION', 'desc', 'Desc']);
        
        console.log('Preview - Stok miktarı raw değeri:', stok_miktari, 'Tip:', typeof stok_miktari);
        
        const result = {
          barkod: barkod || '',
          urun_adi: urun_adi || '',
          birim: birim || '',
          stok_miktari: stok_miktari !== '' && stok_miktari !== null && stok_miktari !== undefined ? parseInt(stok_miktari) : 0, // 0 değeri korunur
          birim_fiyat: 0,
          aciklama: aciklama || ''
        };
        
        console.log(`İşlenen sonuç ${index + 1}:`, result);
        return result;
      } catch (error) {
        console.error('Preview ürün oluşturma hatası:', error);
        return null;
      }
    }).filter(urun => urun && urun.barkod && urun.urun_adi);

    console.log('Preview ürünler:', previewUrunler);

    return NextResponse.json({
      success: true,
      message: `${previewUrunler.length} ürün algılandı`,
      importedCount: eklenenUrunler.length,
      errorCount: hataSayisi,
      urunler: previewUrunler, // Preview için tüm geçerli ürünler
      eklenenUrunler: eklenenUrunler // Gerçekten eklenen ürünler
    });

  } catch (error) {
    console.error('Excel import hatası:', error);
    return NextResponse.json(
      { error: 'Excel dosyası işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}
