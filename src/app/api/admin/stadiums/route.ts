import { NextResponse } from 'next/server';

// Mock data para stadiums - virá do DB no futuro
const mockStadiums = [
  {
    id: 'stadium_1',
    name: 'Maracanã Future',
    creator: {
      name: 'RioNFTs',
      wallet: '0xAbc...dEfg'
    },
    createdAt: '2024-07-04T10:00:00Z',
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638520/stadium_Maracana_Future_bgrqjo.png',
    mintCount: 10,
    editionSize: 20,
  },
  {
    id: 'stadium_2',
    name: 'Allianz Parque Night',
    creator: {
      name: 'PalmeirasDAO',
      wallet: '0xDef...Abc1'
    },
    createdAt: '2024-07-03T11:20:00Z',
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638522/stadium_Allianz_Parque_Night_n7wanl.png',
    mintCount: 50,
    editionSize: 50,
  },
  {
    id: 'stadium_3',
    name: 'São Januário VR',
    creator: {
      name: 'Vascaino.eth',
      wallet: '0xGhi...jKlM'
    },
    createdAt: '2024-06-30T15:00:00Z',
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638525/stadium_Sao_Januario_VR_r5k9vw.png',
    mintCount: 0,
    editionSize: 100,
  },
  {
    id: 'stadium_4',
    name: 'Camp Nou Reimagined',
    creator: {
      name: 'BarcaFan',
      wallet: '0x456...7890'
    },
    createdAt: '2024-06-28T18:00:00Z',
    status: 'Error',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638527/stadium_Camp_Nou_Reimagined_mkvhqy.png',
    mintCount: 0,
    editionSize: 100,
  }
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockStadiums);
  } catch (error) {
    console.error('Error fetching stadiums:', error);
    return NextResponse.json({ error: 'Failed to fetch stadiums' }, { status: 500 });
  }
} 