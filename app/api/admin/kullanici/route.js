import { NextResponse } from 'next/server';
import { kullaniciDB } from '../../../lib/persistent-database.js';

export async function GET() {
  try {
    const kullanicilar = kullaniciDB.getAll();
    return NextResponse.json(kullanicilar);
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const yeniKullanici = await request.json();

    // Validasyon
    if (!yeniKullanici.kullanici_adi || !yeniKullanici.sifre) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Aynı kullanıcı adı var mı kontrol et
    const mevcutKullanici = kullaniciDB.findByUsername(yeniKullanici.kullanici_adi);
    if (mevcutKullanici) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Email kontrolü
    if (yeniKullanici.email) {
      const mevcutEmail = kullaniciDB.findByEmail(yeniKullanici.email);
      if (mevcutEmail) {
        return NextResponse.json(
          { error: 'Bu email adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Kullanıcıyı ekle
    const eklenenKullanici = kullaniciDB.add({
      ...yeniKullanici,
      aktif: true,
      rol: yeniKullanici.rol || 'kullanici'
    });

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi',
      kullanici: eklenenKullanici
    });

  } catch (error) {
    console.error('Kullanıcı ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, ...guncelKullanici } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcı adı kontrolü (kendisi hariç)
    if (guncelKullanici.kullanici_adi) {
      const mevcutKullanici = kullaniciDB.findByUsername(guncelKullanici.kullanici_adi);
      if (mevcutKullanici && mevcutKullanici.id !== id) {
        return NextResponse.json(
          { error: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Email kontrolü (kendisi hariç)
    if (guncelKullanici.email) {
      const mevcutEmail = kullaniciDB.findByEmail(guncelKullanici.email);
      if (mevcutEmail && mevcutEmail.id !== id) {
        return NextResponse.json(
          { error: 'Bu email adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    const guncellenenKullanici = kullaniciDB.update(id, guncelKullanici);

    if (!guncellenenKullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      kullanici: guncellenenKullanici
    });

  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    const silinenKullanici = kullaniciDB.getById(id);
    if (!silinenKullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Admin kullanıcısını silmeyi engelle
    if (silinenKullanici.kullanici_adi === 'admin') {
      return NextResponse.json(
        { error: 'Admin kullanıcısı silinemez' },
        { status: 400 }
      );
    }

    const basarili = kullaniciDB.delete(id);

    if (basarili) {
      return NextResponse.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi'
      });
    } else {
      return NextResponse.json(
        { error: 'Kullanıcı silinemedi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
