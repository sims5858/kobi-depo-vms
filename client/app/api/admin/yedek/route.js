import { NextResponse } from 'next/server';
import { loadData, saveData } from '../../data-store';
import fs from 'fs';
import path from 'path';

// Yedek klasörü oluştur
const createBackupDir = () => {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

// Yedek listesini getir
export async function GET() {
  try {
    const backupDir = createBackupDir();
    const files = fs.readdirSync(backupDir);
    
    const yedekler = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          id: file.replace('.json', ''),
          dosya_adi: file,
          aciklama: file.replace('.json', '').replace(/_/g, ' '),
          olusturma_tarihi: stats.birthtime.toISOString(),
          boyut: stats.size,
          durum: 'aktif'
        };
      })
      .sort((a, b) => new Date(b.olusturma_tarihi) - new Date(a.olusturma_tarihi));

    return NextResponse.json(yedekler);
  } catch (error) {
    console.error('Yedek listesi yüklenirken hata:', error);
    return NextResponse.json({ error: 'Yedek listesi yüklenirken hata oluştu' }, { status: 500 });
  }
}

// Yeni yedek al
export async function POST(request) {
  try {
    const body = await request.json();
    const { aciklama } = body;
    
    // Mevcut veriyi yükle
    const data = loadData();
    
    // Yedek dosya adı oluştur
    const tarih = new Date();
    const tarihStr = tarih.toISOString().split('T')[0]; // YYYY-MM-DD
    const saatStr = tarih.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const yedekAdi = `yedek_${tarihStr}_${saatStr}`;
    const dosyaAdi = `${yedekAdi}.json`;
    
    // Yedek klasörü oluştur
    const backupDir = createBackupDir();
    const backupPath = path.join(backupDir, dosyaAdi);
    
    // Yedek verisi oluştur
    const backupData = {
      ...data,
      yedek_bilgisi: {
        yedek_adi: yedekAdi,
        aciklama: aciklama || `Otomatik yedek - ${tarih.toLocaleString('tr-TR')}`,
        olusturma_tarihi: tarih.toISOString(),
        versiyon: '1.0',
        toplam_urun: data.urunler ? data.urunler.length : 0,
        toplam_koli: data.koliler ? data.koliler.length : 0,
        toplam_kullanici: data.kullanicilar ? data.kullanicilar.length : 0
      }
    };
    
    // Yedek dosyasını kaydet
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // Yedek bilgilerini döndür
    const stats = fs.statSync(backupPath);
    const yedekInfo = {
      id: yedekAdi,
      dosya_adi: dosyaAdi,
      aciklama: backupData.yedek_bilgisi.aciklama,
      olusturma_tarihi: backupData.yedek_bilgisi.olusturma_tarihi,
      boyut: stats.size,
      durum: 'aktif',
      detay: {
        toplam_urun: backupData.yedek_bilgisi.toplam_urun,
        toplam_koli: backupData.yedek_bilgisi.toplam_koli,
        toplam_kullanici: backupData.yedek_bilgisi.toplam_kullanici
      }
    };
    
    console.log(`Yedek alındı: ${dosyaAdi} (${stats.size} bytes)`);
    
    return NextResponse.json(yedekInfo);
  } catch (error) {
    console.error('Yedek alma hatası:', error);
    return NextResponse.json({ error: 'Yedek alınırken hata oluştu' }, { status: 500 });
  }
}
