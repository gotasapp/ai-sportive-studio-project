import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// Webhook secret - será configurado no Thirdweb Engine Dashboard
const WEBHOOK_SECRET = process.env.THIRDWEB_WEBHOOK_SECRET || 'your-webhook-secret';

/**
 * Webhook endpoint para receber notificações da Thirdweb Engine
 * Dispara automaticamente quando NFTs são mintados
 * 
 * Events suportados:
 * - mined_transaction: NFT mintado com sucesso
 * - sent_transaction: Transação enviada (pendente)
 * - errored_transaction: Erro na transação
 */
export async function POST(request: Request) {
  try {
    console.log('🔔 Thirdweb Webhook: Received notification');
    
    // Obter headers e body
    const signature = request.headers.get('X-Engine-Signature');
    const timestamp = request.headers.get('X-Engine-Timestamp');
    const body = await request.text();
    
    console.log('📦 Webhook payload preview:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: body.length,
      timestamp
    });

    // Verificar headers obrigatórios
    if (!signature || !timestamp) {
      console.error('❌ Missing signature or timestamp header');
      return NextResponse.json({ 
        error: 'Missing signature or timestamp header' 
      }, { status: 401 });
    }

    // Verificar se o webhook não expirou (5 minutos)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp);
    const expirationTime = 300; // 5 minutos

    if (currentTime - webhookTime > expirationTime) {
      console.error('❌ Webhook expired:', { 
        currentTime, 
        webhookTime, 
        diffSeconds: currentTime - webhookTime 
      });
      return NextResponse.json({ 
        error: 'Request has expired' 
      }, { status: 401 });
    }

    // Verificar assinatura do webhook
    if (!verifyWebhookSignature(body, timestamp, signature, WEBHOOK_SECRET)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ 
        error: 'Invalid signature' 
      }, { status: 401 });
    }

    console.log('✅ Webhook signature verified successfully');

    // Parse do payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error);
      return NextResponse.json({ 
        error: 'Invalid JSON payload' 
      }, { status: 400 });
    }

    console.log('📋 Webhook event details:', {
      status: payload.status,
      transactionHash: payload.transactionHash?.slice(0, 10) + '...' || 'N/A',
      chainId: payload.chainId,
      contractAddress: payload.toAddress?.slice(0, 8) + '...' || 'N/A',
      eventType: payload.eventType || 'transaction'
    });

    // Processar apenas transações mineradas com sucesso
    if (payload.status === 'mined' && payload.onchainStatus === 'success') {
      console.log('🎉 Processing successful mint transaction');
      
      // Verificar se é do nosso contrato NFT
      const ourNftContract = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET?.toLowerCase();
      const contractAddress = payload.toAddress?.toLowerCase();
      
      if (contractAddress === ourNftContract) {
        console.log('✅ Transaction is from our NFT contract');
        
        // Extrair tokenId dos logs da transação
        const tokenId = extractTokenIdFromLogs(payload.transactionReceipt?.logs || []);
        
        if (tokenId !== null) {
          console.log(`🎯 Found tokenId: ${tokenId}`);
          
          // Salvar automaticamente no MongoDB
          const syncResult = await syncNFTToMongoDB({
            tokenId: tokenId.toString(),
            transactionHash: payload.transactionHash,
            chainId: payload.chainId || 80002,
            blockNumber: payload.blockNumber,
            contractAddress: payload.toAddress,
            mintedAt: new Date(),
            webhookReceivedAt: new Date()
          });

          if (syncResult.success) {
            console.log('✅ NFT synced to MongoDB successfully');
            
            return NextResponse.json({
              success: true,
              message: 'NFT minted and synced to database',
              tokenId: tokenId.toString(),
              transactionHash: payload.transactionHash,
              syncResult
            });
          } else {
            console.error('❌ Failed to sync NFT to MongoDB:', syncResult.error);
          }
        } else {
          console.log('⚠️ Could not extract tokenId from transaction logs');
        }
      } else {
        console.log('ℹ️ Transaction not from our NFT contract, ignoring');
      }
    } else {
      console.log(`ℹ️ Ignoring transaction with status: ${payload.status}, onchain: ${payload.onchainStatus}`);
    }

    // Resposta padrão para outros eventos
    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      eventProcessed: payload.status === 'mined' && payload.onchainStatus === 'success'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Verifica a assinatura do webhook da Thirdweb Engine
 */
function verifyWebhookSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    const payload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Extrai o tokenId dos logs da transação
 * Procura por eventos Transfer do ERC1155/ERC721
 */
function extractTokenIdFromLogs(logs: any[]): number | null {
  try {
    for (const log of logs) {
      // ERC721 Transfer event: Transfer(address,address,uint256)
      // ERC1155 TransferSingle: TransferSingle(address,address,address,uint256,uint256)
      
      if (log.topics && log.topics.length >= 4) {
        // Para ERC721, o tokenId está no topics[3]
        // Para ERC1155, o tokenId está no data ou topics dependendo da implementação
        
        const tokenIdHex = log.topics[3];
        if (tokenIdHex) {
          const tokenId = parseInt(tokenIdHex, 16);
          if (!isNaN(tokenId) && tokenId >= 0) {
            return tokenId;
          }
        }
      }
      
      // Tentar extrair do data se não estiver nos topics
      if (log.data && log.data.length > 2) {
        try {
          // Remove 0x prefix e converte para number
          const dataWithoutPrefix = log.data.slice(2);
          if (dataWithoutPrefix.length >= 64) {
            const tokenIdHex = dataWithoutPrefix.slice(0, 64);
            const tokenId = parseInt(tokenIdHex, 16);
            if (!isNaN(tokenId) && tokenId >= 0) {
              return tokenId;
            }
          }
        } catch (parseError) {
          // Continue tentando outros logs
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error extracting tokenId from logs:', error);
    return null;
  }
}

/**
 * Sincroniza o NFT mintado com o MongoDB
 * Atualiza o documento existente com o tokenId real da blockchain
 */
async function syncNFTToMongoDB(nftData: {
  tokenId: string;
  transactionHash: string;
  chainId: number;
  blockNumber?: number;
  contractAddress: string;
  mintedAt: Date;
  webhookReceivedAt: Date;
}): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    console.log('🔄 Syncing NFT to MongoDB:', {
      tokenId: nftData.tokenId,
      transactionHash: nftData.transactionHash.slice(0, 10) + '...',
      chainId: nftData.chainId
    });

    // Buscar NFT correspondente por transactionHash primeiro
    const collections = ['jerseys', 'stadiums', 'badges'];
    let updateResult = null;
    let collectionFound = null;

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Tentar encontrar por transactionHash
      const nftDoc = await collection.findOne({
        $or: [
          { transactionHash: nftData.transactionHash },
          { 'blockchain.transactionHash': nftData.transactionHash }
        ]
      });

      if (nftDoc) {
        console.log(`✅ Found NFT in ${collectionName} collection:`, nftDoc._id);
        
        // Atualizar com tokenId e dados da blockchain
        const updateData = {
          $set: {
            tokenId: nftData.tokenId,
            blockchainTokenId: nftData.tokenId,
            transactionHash: nftData.transactionHash,
            mintedAt: nftData.mintedAt,
            isMinted: true,
            mintStatus: 'confirmed',
            
            // Dados da blockchain
            blockchain: {
              chainId: nftData.chainId,
              network: nftData.chainId === 80002 ? 'Polygon Amoy' : 'CHZ Chain',
              contractAddress: nftData.contractAddress,
              transactionHash: nftData.transactionHash,
              tokenId: nftData.tokenId,
              blockNumber: nftData.blockNumber || null,
              explorerUrl: `https://amoy.polygonscan.com/tx/${nftData.transactionHash}`,
              mintedAt: nftData.mintedAt,
              webhookSyncedAt: nftData.webhookReceivedAt
            },

            // Marketplace
            marketplace: {
              isListable: true,
              canTrade: true,
              verified: true,
              isListed: false
            },

            // Timestamps
            updatedAt: new Date(),
            webhookSyncedAt: nftData.webhookReceivedAt
          }
        };

        updateResult = await collection.updateOne(
          { _id: nftDoc._id },
          updateData
        );

        collectionFound = collectionName;
        break;
      }
    }

    if (updateResult && updateResult.modifiedCount > 0) {
      console.log(`✅ NFT updated successfully in ${collectionFound} collection`);
      return {
        success: true,
        result: {
          collection: collectionFound,
          tokenId: nftData.tokenId,
          transactionHash: nftData.transactionHash,
          updated: true
        }
      };
    } else {
      console.log('⚠️ No matching NFT found in MongoDB for this transaction');
      return {
        success: false,
        error: 'No matching NFT found in database'
      };
    }

  } catch (error) {
    console.error('❌ MongoDB sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * GET handler para testar o endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Thirdweb Engine Webhook Endpoint',
    status: 'ready',
    timestamp: new Date().toISOString(),
    supportedEvents: [
      'mined_transaction',
      'sent_transaction', 
      'errored_transaction'
    ],
    filterCriteria: {
      chainId: 80002,
      contractAddress: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET,
      eventType: 'mint'
    }
  });
} 