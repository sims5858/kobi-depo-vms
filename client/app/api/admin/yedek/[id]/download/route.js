import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, `${id}.json`);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Yedek dosyası bulunamadı' }, { status: 404 });
    }
    
    // Dosyayı oku
    const fileContent = fs.readFileSync(backupPath, 'utf8');
    
    // Response headers ayarla
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${id}.json"`);
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Yedek indirme hatası:', error);
    return NextResponse.json({ error: 'Yedek indirilirken hata oluştu' }, { status: 500 });
  }
}
