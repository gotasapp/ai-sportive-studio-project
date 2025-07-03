import { NextResponse } from 'next/server';

// Mock data para jerseys - virá do DB no futuro
const mockJerseys = [
  {
    id: 'jersey_1',
    name: 'Flamengo 81 Zico',
    creator: {
      name: 'CryptoKing',
      wallet: '0xAbc...dEfg'
    },
    createdAt: '2024-07-03T18:45:00Z',
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
    mintCount: 150,
    editionSize: 200,
  },
  {
    id: 'jersey_2',
    name: 'Palmeiras Cyber',
    creator: {
      name: 'ArtFan',
      wallet: '0xDef...Abc1'
    },
    createdAt: '2024-07-02T15:30:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636631/bafybeiesm3ufeepsaog2alh6jqch3t3il47tkpx3662v4fmjkxosthinqy_e2qdxh.png',
    mintCount: 0,
    editionSize: 100,
  },
  {
    id: 'jersey_3',
    name: 'Vasco Camisas Negras',
    creator: {
      name: 'Vascaino.eth',
      wallet: '0xGhi...jKlM'
    },
    createdAt: '2024-07-01T11:00:00Z',
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636629/bafybeie3yd2h7gw5yypyvk4vomlxigebscfc2b4a3yoxkggjhya6tj5l24_hlhcku.png',
    mintCount: 50,
    editionSize: 50,
  },
  {
    id: 'jersey_4',
    name: 'Corinthians Democracia',
    creator: {
      name: 'NFTCollector',
      wallet: '0x123...4567'
    },
    createdAt: '2024-06-30T09:00:00Z',
    status: 'Error',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636627/Corinthians_JEFF_10_t7lveq.png',
    mintCount: 0,
    editionSize: 100,
  },
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockJerseys);
  } catch (error) {
    console.error('Error fetching jerseys:', error);
    return NextResponse.json({ error: 'Failed to fetch jerseys' }, { status: 500 });
  }
} 