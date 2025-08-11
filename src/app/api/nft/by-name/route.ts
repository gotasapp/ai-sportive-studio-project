import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const tx = searchParams.get('tx');

    if (!name && !tx) {
      return NextResponse.json({ success: false, error: 'Provide at least name or tx' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const jerseys = db.collection('jerseys');

    const filters: any[] = [];
    if (name) {
      // Try exact (case-insensitive) first
      filters.push({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
      // Fallback contains
      filters.push({ name: { $regex: escapeRegex(name), $options: 'i' } });
    }
    if (tx) {
      // Try common transaction fields
      filters.push({ transactionHash: tx });
      filters.push({ txHash: tx });
      filters.push({ tx: tx });
    }

    const query = filters.length > 0 ? { $or: filters } : {};

    const doc = await jerseys.findOne(query, {
      projection: {
        _id: 1,
        name: 1,
        category: 1,
        contractAddress: 1,
        tokenId: 1,
        votes: 1,
        transactionHash: 1,
        txHash: 1,
        tx: 1,
        imageUrl: 1,
      },
      sort: { name: 1 },
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: 'NFT not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id: doc._id,
      name: doc.name,
      category: doc.category,
      contractAddress: doc.contractAddress,
      tokenId: doc.tokenId,
      votes: doc.votes || 0,
      tx: doc.transactionHash || doc.txHash || doc.tx || null,
      imageUrl: doc.imageUrl || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}


