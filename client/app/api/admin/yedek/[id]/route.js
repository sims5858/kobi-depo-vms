import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, `${id}.json`);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Yedek dosyası bulunamadı' }, { status: 404 });
    }
    
    // Dosyayı sil
    fs.unlinkSync(backupPath);
    
    console.log(`Yedek silindi: ${id}.json`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Yedek başarıyla silindi' 
    });
  } catch (error) {
    console.error('Yedek silme hatası:', error);
    return NextResponse.json({ error: 'Yedek silinirken hata oluştu' }, { status: 500 });
  }
}
