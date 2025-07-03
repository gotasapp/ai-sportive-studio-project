import { NextResponse } from 'next/server';

// Mock data para logs - virá do DB no futuro
const mockLogs = [
  {
    id: 'log_1',
    timestamp: '2024-07-05T14:30:15Z',
    level: 'info',
    message: 'Admin user admin@chz.com logged in.',
    actor: {
      type: 'user',
      id: 'user_admin',
      name: 'admin@chz.com'
    },
    context: {
      ip: '192.168.1.1'
    }
  },
  {
    id: 'log_2',
    timestamp: '2024-07-05T14:25:00Z',
    level: 'success',
    message: 'Successfully minted NFT "Flamengo 81 Zico" (ID: jersey_1).',
    actor: {
      type: 'system',
      id: 'engine-minter'
    },
    context: {
      transactionId: '0xabc123...',
      contract: '0x7822...1407'
    }
  },
  {
    id: 'log_3',
    timestamp: '2024-07-05T14:20:10Z',
    level: 'warning',
    message: 'High traffic detected on stadium generator.',
    actor: {
      type: 'system',
      id: 'monitor'
    },
    context: {
      activeUsers: 1502
    }
  },
  {
    id: 'log_4',
    timestamp: '2024-07-05T14:15:05Z',
    level: 'error',
    message: 'Failed to process payment for user user_regular.',
    actor: {
      type: 'user',
      id: 'user_regular',
      name: 'someuser@email.com'
    },
    context: {
      paymentGateway: 'Stripe',
      errorCode: 'card_declined'
    }
  },
  {
    id: 'log_5',
    timestamp: '2024-07-05T13:50:00Z',
    level: 'info',
    message: 'Updated settings for "Badges".',
    actor: {
      type: 'user',
      id: 'user_admin',
      name: 'admin@chz.com'
    },
    context: {
      setting: 'claimDuration',
      oldValue: '30d',
      newValue: '60d'
    }
  }
];

export async function GET() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return NextResponse.json(mockLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
} 