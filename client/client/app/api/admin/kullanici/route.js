import { NextResponse } from 'next/server';

// In-memory kullanıcı veritabanı (demo için)
let users = [
  {
    id: 1,
    kullanici_adi: 'admin',
    ad_soyad: 'Admin Kullanıcı',
    email: 'admin@coretrack.com',
    rol: 'admin',
    aktif: true
  },
  {
    id: 2,
    kullanici_adi: 'user1',
    ad_soyad: 'Test Kullanıcı',
    email: 'user1@coretrack.com',
    rol: 'kullanici',
    aktif: true
  }
];

let nextId = 3;

export async function GET() {
  try {
    return NextResponse.json(users);

  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { kullanici_adi, email, sifre, ad_soyad, rol } = await request.json();

    if (!kullanici_adi || !email || !sifre || !ad_soyad) {
      return NextResponse.json(
        { success: false, error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcı adı kontrolü
    const existingUser = users.find(u => u.kullanici_adi === kullanici_adi);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Yeni kullanıcı oluştur
    const newUser = {
      id: nextId++,
      kullanici_adi,
      ad_soyad,
      email,
      rol: rol || 'kullanici',
      aktif: true
    };

    users.push(newUser);

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi',
      user: newUser
    });

  } catch (error) {
    console.error('Kullanıcı ekleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, kullanici_adi, email, sifre, ad_soyad, rol } = await request.json();

    if (!id || !kullanici_adi || !email || !ad_soyad) {
      return NextResponse.json(
        { success: false, error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı adı kontrolü (kendisi hariç)
    const existingUser = users.find(u => u.kullanici_adi === kullanici_adi && u.id !== parseInt(id));
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Kullanıcıyı güncelle
    users[userIndex] = {
      ...users[userIndex],
      kullanici_adi,
      ad_soyad,
      email,
      rol: rol || users[userIndex].rol
    };

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: users[userIndex]
    });

  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Admin kullanıcısını silmeyi engelle
    if (users[userIndex].kullanici_adi === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin kullanıcısı silinemez' },
        { status: 400 }
      );
    }

    users.splice(userIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });

  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
