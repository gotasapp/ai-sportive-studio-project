import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("chz_database"); // Nome do seu banco de dados
    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json({ message: 'Token ID é obrigatório' }, { status: 400 });
    }

    const jersey = await db.collection('jerseys').findOne({ tokenId: tokenId });

    if (!jersey) {
      return NextResponse.json({ message: 'Jersey não encontrada' }, { status: 404 });
    }

    return NextResponse.json(jersey);
  } catch (e) {
    console.error('Erro na API de Jersey por Token ID:', e);
    return NextResponse.json({ message: 'Erro ao buscar jersey', error: e }, { status: 500 });
  }
} 