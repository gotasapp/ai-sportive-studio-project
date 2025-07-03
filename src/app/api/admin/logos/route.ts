import { NextResponse } from 'next/server';

// Mock data para logos - virá do DB no futuro
const mockLogos = [
  {
    id: 'logo_1',
    name: 'Flamengo Shield',
    creator: {
      name: 'Designer_01',
      wallet: '0xabc...1234'
    },
    createdAt: '2024-07-06T10:00:00Z',
    status: 'Approved',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638539/logo_Flamengo_Shield_tpxjzt.png',
    usageCount: 120,
    tags: ['flamengo', 'shield', 'official'],
  },
  {
    id: 'logo_2',
    name: 'Palmeiras Modern',
    creator: {
      name: 'ArtStation_User',
      wallet: '0xdef...5678'
    },
    createdAt: '2024-07-05T15:30:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638542/logo_Palmeiras_Modern_g6gqjb.png',
    usageCount: 0,
    tags: ['palmeiras', 'modern', 'concept'],
  },
  {
    id: 'logo_3',
    name: 'Vasco Cross',
    creator: {
      name: 'Designer_01',
      wallet: '0xabc...1234'
    },
    createdAt: '2024-07-04T11:00:00Z',
    status: 'Approved',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638544/logo_Vasco_Cross_nltnnd.png',
    usageCount: 85,
    tags: ['vasco', 'cross', 'minimalist'],
  },
  {
    id: 'logo_4',
    name: 'Corinthians "CP" Monogram',
    creator: {
      name: 'Corinthiano_NFT',
      wallet: '0xghi...9012'
    },
    createdAt: '2024-07-03T09:00:00Z',
    status: 'Rejected',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638547/logo_Corinthians_Monogram_k9yeyj.png',
    usageCount: 0,
    tags: ['corinthians', 'monogram', 'vintage'],
  },
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockLogos);
  } catch (error) {
    console.error('Error fetching logos:', error);
    return NextResponse.json({ error: 'Failed to fetch logos' }, { status: 500 });
  }
} 