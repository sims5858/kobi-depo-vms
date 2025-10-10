// Vercel API endpoint - Koli listesi
export default function handler(req, res) {
  const koliler = [
    {
      koli_no: 'D2-0099',
      lokasyon: 'D2-0099',
      kapasite: 100,
      durum: 'dolu',
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0014',
      lokasyon: 'D2-0014',
      kapasite: 100,
      durum: 'dolu',
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0015',
      lokasyon: 'D2-0015',
      kapasite: 100,
      durum: 'bos',
      olusturma_tarihi: new Date().toISOString()
    }
  ];

  res.status(200).json(koliler);
}
