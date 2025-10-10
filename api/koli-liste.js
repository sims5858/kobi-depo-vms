// Vercel API endpoint - Koli listesi
module.exports = (req, res) => {
  const koliler = [
    {
      koli_no: 'D2-0099',
      lokasyon: 'D2-0099',
      kapasite: 100,
      durum: 'dolu',
      urun_sayisi: 3,
      toplam_adet: 50,
      doluluk_orani: 50,
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0014',
      lokasyon: 'D2-0014',
      kapasite: 100,
      durum: 'dolu',
      urun_sayisi: 2,
      toplam_adet: 25,
      doluluk_orani: 25,
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0015',
      lokasyon: 'D2-0015',
      kapasite: 100,
      durum: 'bos',
      urun_sayisi: 0,
      toplam_adet: 0,
      doluluk_orani: 0,
      olusturma_tarihi: new Date().toISOString()
    },
    {
      koli_no: 'D2-0025',
      lokasyon: 'D2-0025',
      kapasite: 100,
      durum: 'dolu',
      urun_sayisi: 1,
      toplam_adet: 15,
      doluluk_orani: 15,
      olusturma_tarihi: new Date().toISOString()
    }
  ];

  res.status(200).json(koliler);
};
