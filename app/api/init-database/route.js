// Supabase veritabanını başlat - default verileri oluştur
import { NextResponse } from 'next/server';
import { kullaniciDB, urunDB, koliDB, aktiviteDB } from '../../lib/supabase-database.js';

export async function POST() {
  try {
    console.log('=== SUPABASE DATABASE INITIALIZATION ===');
    
    // Default kullanıcıları oluştur
    const defaultKullanicilar = [
      {
        kullanici_adi: 'admin',
        sifre: 'Lafuma1818.-', // Özel admin şifresi
        ad_soyad: 'Sistem Yöneticisi',
        email: 'admin@kobi.com',
        rol: 'admin',
        aktif: true
      }
    ];
    
    // Kullanıcıları ekle
    for (const kullanici of defaultKullanicilar) {
      const mevcutKullanici = await kullaniciDB.getByKullaniciAdi(kullanici.kullanici_adi);
      if (!mevcutKullanici) {
        await kullaniciDB.add(kullanici);
        console.log('Default kullanıcı eklendi:', kullanici.kullanici_adi);
      }
    }
    
    // Aktivite kaydet
    await aktiviteDB.add({
      mesaj: 'Veritabanı başlatıldı',
      detay: 'Supabase PostgreSQL bağlantısı kuruldu ve default veriler oluşturuldu',
      tip: 'system_init'
    });
    
    console.log('Database initialization tamamlandı');
    
    return NextResponse.json({
      success: true,
      message: 'Veritabanı başarıyla başlatıldı',
      kullanicilar: await kullaniciDB.getAll()
    });
    
  } catch (error) {
    console.error('Database initialization hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Veritabanı başlatma hatası: ' + error.message 
      },
      { status: 500 }
    );
  }
}
