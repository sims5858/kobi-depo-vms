// Vercel API endpoint - Ürün listesi
export default function handler(req, res) {
  const urunler = [
    {
      barkod: 'BRK123456',
      urun_adi: 'Demo Ürün 1',
      kategori: 'Elektronik',
      birim_fiyat: 150.00,
      stok_adet: 50,
      min_stok: 10,
      max_stok: 100,
      lokasyon: 'D2-0099'
    },
    {
      barkod: 'BRK789012',
      urun_adi: 'Demo Ürün 2',
      kategori: 'Giyim',
      birim_fiyat: 75.50,
      stok_adet: 25,
      min_stok: 5,
      max_stok: 50,
      lokasyon: 'D2-0014'
    }
  ];

  res.status(200).json(urunler);
}
