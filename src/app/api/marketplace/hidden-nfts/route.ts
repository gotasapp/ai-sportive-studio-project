import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const hiddenDocs = await db.collection('hidden_nfts').find().toArray();
    const hiddenIds = hiddenDocs
      .filter((doc: any) => !doc.type || doc.type === 'id')
      .map((doc: any) => doc.tokenId);
    const hiddenNames = hiddenDocs
      .filter((doc: any) => doc.type === 'name')
      .map((doc: any) => doc.tokenId);
    return NextResponse.json({ hiddenIds, hiddenNames });
  } catch (error) {
    return NextResponse.json({ hiddenIds: [], hiddenNames: [], error: (error as any)?.message || 'Failed to fetch hidden NFTs' }, { status: 500 });
  }
} 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tokenIds: string[] = Array.isArray(body?.tokenIds) ? body.tokenIds : [];
    const names: string[] = Array.isArray(body?.names) ? body.names : [];

    if (tokenIds.length === 0 && names.length === 0) {
      return NextResponse.json({ success: false, error: 'Provide tokenIds and/or names arrays' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const col = db.collection('hidden_nfts');

    let inserted = 0;
    // Upsert tokenIds
    for (const id of tokenIds) {
      if (!id) continue;
      const res = await col.updateOne(
        { tokenId: id, type: { $in: [null, 'id'] } },
        { $set: { tokenId: id, type: 'id', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedId || res.modifiedCount > 0) inserted++;
    }

    // Upsert names
    for (const name of names) {
      if (!name) continue;
      const res = await col.updateOne(
        { tokenId: name, type: 'name' },
        { $set: { tokenId: name, type: 'name', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedId || res.modifiedCount > 0) inserted++;
    }

    return NextResponse.json({ success: true, inserted, tokenIds: tokenIds.length, names: names.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update hidden NFTs' }, { status: 500 });
  }
}