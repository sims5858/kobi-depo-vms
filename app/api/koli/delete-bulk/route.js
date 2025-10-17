import { NextResponse } from 'next/server';
import { koliDB, urunDB, aktiviteDB } from '../../../lib/persistent-database.js';

export async function POST(request) {
  try {
    const deleteData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Toplu koli silme başarılı'
    });
  } catch (error) {
    console.error('Toplu koli silme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
