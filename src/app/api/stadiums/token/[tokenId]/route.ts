import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("chz_database");
    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json({ message: 'Token ID é obrigatório' }, { status: 400 });
    }

    const stadium = await db.collection('stadiums').findOne({ tokenId: tokenId });

    if (!stadium) {
      return NextResponse.json({ message: 'Stadium não encontrado' }, { status: 404 });
    }

    return NextResponse.json(stadium);
  } catch (e) {
    console.error('Erro na API de Stadium por Token ID:', e);
    return NextResponse.json({ message: 'Erro ao buscar stadium', error: e }, { status: 500 });
  }
} 