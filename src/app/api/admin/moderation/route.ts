import { NextResponse } from 'next/server';

// Mock data para itens pendentes de moderação - virá do DB no futuro
const mockPendingItems = [
  {
    id: 'jersey_pending_1',
    type: 'Jersey',
    name: 'São Paulo Concept Art',
    creator: {
      name: 'TricolorFan',
      wallet: '0x1a2b...c3d4'
    },
    submittedAt: '2024-07-05T10:15:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638530/pending_Sao_Paulo_Concept_gqgexr.png',
    details: {
      prompt: 'A futuristic São Paulo FC jersey with red, white, and black geometric patterns.'
    }
  },
  {
    id: 'stadium_pending_1',
    type: 'Stadium',
    name: 'Neo Maracanã',
    creator: {
      name: 'FutureArchitect',
      wallet: '0x5e6f...a7b8'
    },
    submittedAt: '2024-07-05T09:45:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638532/pending_Neo_Maracana_yhlxgr.png',
    details: {
      baseImage: 'maracana_day_light.png',
      style: 'cyberpunk',
      atmosphere: 'championship_night'
    }
  },
  {
    id: 'badge_pending_1',
    type: 'Badge',
    name: 'Creator Guild',
    creator: {
      name: 'CommunityManager',
      wallet: '0x9c8d...e7f6'
    },
    submittedAt: '2024-07-04T18:00:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638535/pending_Creator_Guild_z5wwnw.png',
    details: {
      description: 'A badge for users who have had 3 or more creations approved.'
    }
  },
   {
    id: 'jersey_pending_2',
    type: 'Jersey',
    name: 'Gremio 95 Tribute',
    creator: {
      name: 'Gremista1995',
      wallet: '0x3g4h...i5j6'
    },
    submittedAt: '2024-07-05T11:05:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638537/pending_Gremio_95_f1iili.png',
    details: {
      prompt: 'A retro jersey inspired by Gremio 1995 Libertadores championship, with blue, black and white stripes.'
    }
  },
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return NextResponse.json(mockPendingItems);
  } catch (error) {
    console.error('Error fetching moderation items:', error);
    return NextResponse.json({ error: 'Failed to fetch items for moderation' }, { status: 500 });
  }
} 