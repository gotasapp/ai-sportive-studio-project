import { NextResponse } from 'next/server';

// Mock data para badges - virá do DB no futuro
const mockBadges = [
  {
    id: 'badge_1',
    name: 'CHZ Founder',
    creator: {
      name: 'Admin',
      wallet: '0xAbc...dEfg'
    },
    createdAt: '2024-07-01T10:00:00Z',
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638510/badge_CHZ_Founder_wkvhcy.png',
    mintCount: 500,
    editionSize: 1000,
  },
  {
    id: 'badge_2',
    name: 'Top Collector',
    creator: {
      name: 'Admin',
      wallet: '0xDef...Abc1'
    },
    createdAt: '2024-06-15T12:00:00Z',
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638512/badge_Top_Collector_lq9vbj.png',
    mintCount: 88,
    editionSize: 100,
  },
  {
    id: 'badge_3',
    name: 'Early Adopter',
    creator: {
      name: 'Admin',
      wallet: '0xGhi...jKlM'
    },
    createdAt: '2024-05-20T09:30:00Z',
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638515/badge_Early_Adopter_gy8kdh.png',
    mintCount: 1234,
    editionSize: 2000,
  },
  {
    id: 'badge_4',
    name: 'Genesis Jersey',
    creator: {
      name: 'Admin',
      wallet: '0x123...4567'
    },
    createdAt: '2024-07-05T14:00:00Z',
    status: 'Expired',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638517/badge_Genesis_Jersey_bdfmld.png',
    mintCount: 100,
    editionSize: 100,
  },
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockBadges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
} 