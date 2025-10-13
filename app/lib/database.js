// Ortak veritabanı yönetimi
let urunler = [];
let koliler = [
  { id: 1, koli_no: 'KOLI001', lokasyon: 'A1', kapasite: 100, dolu_miktar: 30, urun_sayisi: 5, aciklama: 'Elektronik ürünler', doluluk_orani: 30, olusturma_tarihi: '2024-01-01', guncelleme_tarihi: '2024-01-01' },
  { id: 2, koli_no: 'KOLI002', lokasyon: 'B2', kapasite: 150, dolu_miktar: 80, urun_sayisi: 12, aciklama: 'Gıda ürünleri', doluluk_orani: 53, olusturma_tarihi: '2024-01-01', guncelleme_tarihi: '2024-01-01' },
];
let nextUrunId = 1;
let nextKoliId = 3;

// Ürün işlemleri
export const urunDB = {
  getAll: () => urunler,
  
  add: (urun) => {
    const newUrun = {
      id: nextUrunId++,
      ...urun,
      olusturma_tarihi: new Date().toISOString().split('T')[0]
    };
    urunler.push(newUrun);
    return newUrun;
  },
  
  addBulk: (yeniUrunler) => {
    const eklenenUrunler = [];
    const hataliUrunler = [];
    const mevcutBarkodlar = new Set(urunler.map(u => u.barkod));
    
    for (const urun of yeniUrunler) {
      const { barkod, urun_adi, kategori, birim, stok_miktari, raf_omru, tedarikci, aciklama, lokasyon, koli } = urun;
      
      if (!barkod || !urun_adi) {
        hataliUrunler.push({ ...urun, hata: 'Barkod ve ürün adı gerekli' });
        continue;
      }
      
      if (mevcutBarkodlar.has(barkod)) {
        hataliUrunler.push({ ...urun, hata: 'Bu barkod zaten kullanılıyor' });
        continue;
      }
      
      const newUrun = {
        id: nextUrunId++,
        barkod,
        urun_adi,
        kategori: kategori || '',
        birim: birim || 'Adet',
        stok_miktari: parseInt(stok_miktari) || 0,
        raf_omru: raf_omru ? parseInt(raf_omru) : null,
        tedarikci: tedarikci || '',
        aciklama: aciklama || '',
        lokasyon: lokasyon || '',
        koli: koli || '',
        olusturma_tarihi: new Date().toISOString().split('T')[0]
      };
      
      urunler.push(newUrun);
      eklenenUrunler.push(newUrun);
      mevcutBarkodlar.add(barkod);
    }
    
    return { eklenenUrunler, hataliUrunler };
  },
  
  update: (id, updatedUrun) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      urunler[index] = { ...urunler[index], ...updatedUrun };
      return urunler[index];
    }
    return null;
  },
  
  delete: (id) => {
    const index = urunler.findIndex(u => u.id === id);
    if (index !== -1) {
      return urunler.splice(index, 1)[0];
    }
    return null;
  }
};

// Koli işlemleri
export const koliDB = {
  getAll: () => {
    return koliler.map(koli => ({
      ...koli,
      doluluk_orani: koli.doluluk_orani !== undefined ? koli.doluluk_orani : Math.round(((koli.dolu_miktar || 0) / (koli.kapasite || 100)) * 100),
      olusturma_tarihi: koli.olusturma_tarihi || new Date().toISOString().split('T')[0],
      guncelleme_tarihi: koli.guncelleme_tarihi || new Date().toISOString().split('T')[0]
    }));
  },
  
  add: (koli) => {
    const newKoli = {
      id: nextKoliId++,
      ...koli,
      doluluk_orani: Math.round(((koli.dolu_miktar || 0) / (koli.kapasite || 100)) * 100),
      olusturma_tarihi: new Date().toISOString().split('T')[0],
      guncelleme_tarihi: new Date().toISOString().split('T')[0]
    };
    koliler.push(newKoli);
    return newKoli;
  },
  
  addBulk: (koliNumaralari) => {
    const eklenenKoliler = [];
    const mevcutKoliNumaralari = new Set(koliler.map(k => k.koli_no));
    
    for (const koliNo of koliNumaralari) {
      if (!koliNo || koliNo.trim() === '') continue;
      
      const trimmedKoliNo = koliNo.trim();
      
      if (mevcutKoliNumaralari.has(trimmedKoliNo)) continue;
      
      const newKoli = {
        id: nextKoliId++,
        koli_no: trimmedKoliNo,
        lokasyon: '',
        kapasite: 100,
        dolu_miktar: 0,
        urun_sayisi: 0,
        aciklama: '',
        doluluk_orani: 0,
        olusturma_tarihi: new Date().toISOString().split('T')[0],
        guncelleme_tarihi: new Date().toISOString().split('T')[0]
      };
      
      koliler.push(newKoli);
      eklenenKoliler.push(newKoli);
      mevcutKoliNumaralari.add(trimmedKoliNo);
    }
    
    return eklenenKoliler;
  },
  
  update: (id, updatedKoli) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      koliler[index] = { ...koliler[index], ...updatedKoli };
      return koliler[index];
    }
    return null;
  },
  
  delete: (id) => {
    const index = koliler.findIndex(k => k.id === id);
    if (index !== -1) {
      return koliler.splice(index, 1)[0];
    }
    return null;
  }
};
