// Netlify Function - Ürün listesi
exports.handler = async (event, context) => {
  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  const { q } = event.queryStringParameters || {};
  
  let urunler = [
    {
      barkod: 'BRK123456',
      urun_adi: 'Demo Ürün 1',
      kategori: 'Elektronik',
      birim_fiyat: 150.00,
      stok_adet: 50,
      min_stok: 10,
      max_stok: 100,
      lokasyon: 'D2-0099',
      toplam_adet: 50,
      beden: 'M',
      ana_blok: 'A'
    },
    {
      barkod: 'BRK789012',
      urun_adi: 'Demo Ürün 2',
      kategori: 'Giyim',
      birim_fiyat: 75.50,
      stok_adet: 25,
      min_stok: 5,
      max_stok: 50,
      lokasyon: 'D2-0014',
      toplam_adet: 25,
      beden: 'L',
      ana_blok: 'B'
    },
    {
      barkod: 'BRK345678',
      urun_adi: 'Demo Ürün 3',
      kategori: 'Ev & Yaşam',
      birim_fiyat: 200.00,
      stok_adet: 15,
      min_stok: 3,
      max_stok: 30,
      lokasyon: 'D2-0025',
      toplam_adet: 15,
      beden: 'XL',
      ana_blok: 'C'
    }
  ];

  // Arama filtresi
  if (q && q.trim()) {
    const searchTerm = q.toLowerCase();
    urunler = urunler.filter(urun => 
      urun.barkod.toLowerCase().includes(searchTerm) ||
      urun.urun_adi.toLowerCase().includes(searchTerm) ||
      urun.kategori.toLowerCase().includes(searchTerm)
    );
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(urunler)
  };
};
