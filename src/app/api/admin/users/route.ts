import { NextResponse } from 'next/server';

// Mock data - no futuro, virá do banco de dados
const mockUsers = [
  {
    id: 'usr_1',
    walletAddress: '0xAbc...dEfg',
    name: 'CryptoKing',
    email: 'king@crypto.eth',
    joinedAt: '2024-06-15T10:30:00Z',
    nftsCreated: 12,
    lastActivity: '2024-07-03T18:45:00Z',
    status: 'Active',
  },
  {
    id: 'usr_2',
    walletAddress: '0x123...4567',
    name: 'NFTCollector',
    email: 'collector@nfts.io',
    joinedAt: '2024-05-20T14:00:00Z',
    nftsCreated: 45,
    lastActivity: '2024-07-02T11:20:00Z',
    status: 'Active',
  },
  {
    id: 'usr_3',
    walletAddress: '0xDef...Abc1',
    name: 'ArtFan',
    email: 'fan@art.com',
    joinedAt: '2024-03-10T09:15:00Z',
    nftsCreated: 5,
    lastActivity: '2024-06-25T20:10:00Z',
    status: 'Inactive',
  },
    {
    id: 'usr_4',
    walletAddress: '0xGhi...jKlM',
    name: 'Vascaino.eth',
    email: 'vasco@gigante.com',
    joinedAt: '2024-02-01T11:05:00Z',
    nftsCreated: 22,
    lastActivity: '2024-07-03T19:00:00Z',
    status: 'Active',
  },
  {
    id: 'usr_5',
    walletAddress: '0xNop...QrSt',
    name: 'SPFC_Hodler',
    email: 'spfc@tricolor.io',
    joinedAt: '2024-01-25T18:30:00Z',
    nftsCreated: 31,
    lastActivity: '2024-07-01T14:50:00Z',
    status: 'Banned',
  },
];

export async function GET() {
  try {
    // No futuro, aqui você faria a chamada ao seu banco de dados.
    // ex: const users = await db.user.findMany();
    // Para simular um delay de rede:
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 