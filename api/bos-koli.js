module.exports = (req, res) => {
  // Vercel'de örnek boş koli listesi
  res.json([
    {
      koli_no: 'K003',
      lokasyon: 'A Blok',
      kapasite: 100,
      mevcut_adet: 0
    },
    {
      koli_no: 'K004',
      lokasyon: 'B Blok',
      kapasite: 100,
      mevcut_adet: 0
    }
  ]);
};
