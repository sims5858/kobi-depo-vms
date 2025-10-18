// Supabase veritabanı - PostgreSQL tabanlı kalıcı veri depolama
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jfmtqhuxhbuohygcinqt.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbXRxaHV4aGJ1b2h5Z2NpbnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjA1MDUsImV4cCI6MjA3NjEzNjUwNX0.5aunuT4k0LjVBw_BaljVJHCrxtF7yKlz09H7f-ppDkE'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Generic Supabase Class
class SupabaseCollection {
  constructor(tableName) {
    this.tableName = tableName
  }

  async getAll() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Supabase ${this.tableName} getAll hatası:`, error)
      return []
    }
  }

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Supabase ${this.tableName} getById hatası:`, error)
      return null
    }
  }

  async add(item) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{ ...item, created_at: new Date().toISOString() }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Supabase ${this.tableName} add hatası:`, error)
      throw error
    }
  }

  async update(id, updatedFields) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ ...updatedFields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Supabase ${this.tableName} update hatası:`, error)
      throw error
    }
  }

  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error(`Supabase ${this.tableName} delete hatası:`, error)
      return false
    }
  }
}

// Specific DB Classes
export class SupabaseUrunDB extends SupabaseCollection {
  constructor() {
    super('urunler')
  }

  async getByBarkodAndKoli(barkod, koliNo) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('barkod', barkod)
        .or(`koli.eq.${koliNo},birim.eq.${koliNo}`)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase UrunDB getByBarkodAndKoli hatası:', error)
      return null
    }
  }
}

export class SupabaseKoliDB extends SupabaseCollection {
  constructor() {
    super('koliler')
  }

  async getByKoliNo(koliNo) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('koli_no', koliNo)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase KoliDB getByKoliNo hatası:', error)
      return null
    }
  }
}

export class SupabaseKullaniciDB extends SupabaseCollection {
  constructor() {
    super('kullanicilar')
  }

  async getByKullaniciAdi(kullanici_adi) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('kullanici_adi', kullanici_adi)
        .eq('aktif', true)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase KullaniciDB getByKullaniciAdi hatası:', error)
      return null
    }
  }

  async getByUsername(username) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('kullanici_adi', username)
        .eq('aktif', true)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase KullaniciDB getByUsername hatası:', error)
      return null
    }
  }
}

export class SupabaseAktiviteDB extends SupabaseCollection {
  constructor() {
    super('aktiviteler')
  }
}

export class SupabaseToplamaDB extends SupabaseCollection {
  constructor() {
    super('toplama')
  }

  async getByFisNo(fisNo) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('fis_no', fisNo)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase ToplamaDB getByFisNo hatası:', error)
      return null
    }
  }

  async deleteByFisNo(fisNo) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('fis_no', fisNo)
      
      if (error) throw error
      return { fis_no: fisNo }
    } catch (error) {
      console.error('Supabase ToplamaDB delete hatası:', error)
      return null
    }
  }
}

export class SupabaseTransferDB extends SupabaseCollection {
  constructor() {
    super('transfer')
  }
}

// Export instances
export const urunDB = new SupabaseUrunDB()
export const koliDB = new SupabaseKoliDB()
export const kullaniciDB = new SupabaseKullaniciDB()
export const aktiviteDB = new SupabaseAktiviteDB()
export const toplamaDB = new SupabaseToplamaDB()
export const transferDB = new SupabaseTransferDB()

export { supabase }
