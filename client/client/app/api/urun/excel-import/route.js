import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosyayı buffer'a çevir
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Excel dosyası boş' },
        { status: 400 }
      );
    }

    console.log('Excel verisi yüklendi:', jsonData.length, 'satır');
    console.log('İlk satır örneği:', jsonData[0]);

    // Veri formatını kontrol et ve dönüştür
    const urunler = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Sütun isimlerini normalize et - sizin formatınıza göre
      const barkod = row['ÜRÜN BARKODU'] || row['ürün barkodu'] || 
                     row['Barkod'] || row['barkod'] || row['BARKOD'] || 
                     row['urun_barkod'] || row['URUN_BARKOD'] || '';
      
      const urun_adi = row['ÜRÜN İSMİ'] || row['ürün ismi'] || 
                       row['Ürün Adı'] || row['urun_adi'] || row['ÜRÜN ADI'] || 
                       row['urun_adi'] || row['URUN_ADI'] || '';
      
      const kategori = row['ÜRÜN BEDENİ'] || row['ürün bedeni'] || 
                       row['Kategori'] || row['kategori'] || row['KATEGORI'] || '';
      
      const stok_miktari = row['ADET'] || row['adet'] || 
                           row['Stok Miktarı'] || row['stok_miktari'] || row['STOK MİKTARI'] || 
                           row['stok'] || row['STOK'] || 0;
      
      const lokasyon = row['ÜRÜNÜN BULUNAN ANA BLOĞU'] || row['ürünün bulunan ana bloğu'] || '';
      const koli = row['ÜRÜNÜN KOLİSİ'] || row['ürünün kolisi'] || '';

      // Boş satırları atla
      if (!barkod || !urun_adi || barkod.toString().trim() === '' || urun_adi.toString().trim() === '') {
        console.log(`Satır ${i + 2} atlandı - boş barkod veya ürün adı`);
        continue;
      }

      // Ürün objesi oluştur
      const urun = {
        barkod: barkod.toString().trim(),
        urun_adi: urun_adi.toString().trim(),
        kategori: kategori.toString().trim() || 'Genel',
        birim: 'Adet',
        stok_miktari: parseInt(stok_miktari) || 0,
        raf_omru: null,
        tedarikci: '',
        aciklama: '',
        lokasyon: lokasyon.toString().trim(),
        koli: koli.toString().trim(),
        olusturma_tarihi: new Date().toISOString().split('T')[0]
      };

      urunler.push(urun);
    }

    console.log(`${urunler.length} ürün işlendi`);

    return NextResponse.json({
      success: true,
      message: `${urunler.length} ürün başarıyla işlendi`,
      urunler: urunler,
      totalRows: jsonData.length,
      processedRows: urunler.length
    });

  } catch (error) {
    console.error('Excel import hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Excel dosyası işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}