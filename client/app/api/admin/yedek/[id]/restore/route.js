import { NextResponse } from 'next/server';
import { loadData, saveData } from '../../../data-store';
import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { onay } = body;
    
    if (!onay) {
      return NextResponse.json({ error: 'Geri yükleme onayı gerekli' }, { status: 400 });
    }
    
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, `${id}.json`);
    
    // Yedek dosyası var mı kontrol et
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Yedek dosyası bulunamadı' }, { status: 404 });
    }
    
    // Yedek dosyasını oku
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    // Yedek bilgilerini kaldır (sadece veri kalsın)
    delete backupData.yedek_bilgisi;
    
    // Mevcut veriyi yedekle (güvenlik için)
    const currentData = loadData();
    const currentBackupPath = path.join(backupDir, `geri_yukleme_oncesi_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(currentBackupPath, JSON.stringify(currentData, null, 2));
    
    // Veriyi geri yükle
    saveData(backupData);
    
    console.log(`Veri geri yüklendi: ${id}.json`);
    console.log(`Mevcut veri yedeklendi: ${currentBackupPath}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Veriler başarıyla geri yüklendi',
      yedek_dosyasi: id,
      mevcut_veri_yedeklendi: currentBackupPath
    });
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    return NextResponse.json({ error: 'Geri yükleme sırasında hata oluştu' }, { status: 500 });
  }
}
