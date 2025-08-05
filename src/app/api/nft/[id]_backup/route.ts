import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { getContract, readContract } from 'thirdweb';
import { thirdwebClient } from '@/lib/thirdweb';
import { polygonAmoy } from 'thirdweb/chains';

const DB_NAME = 'chz-app-db';

// Mapear endereço do contrato por coleção (para NFTs novos da blockchain)
const CONTRACT_ADDRESSES: Record<string, string> = {
  jerseys: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  stadiums: process.env.NEXT_PUBLIC_STADIUMS_CONTRACT_POLYGON_TESTNET || '',
  badges: process.env.NEXT_PUBLIC_BADGES_CONTRACT_POLYGON_TESTNET || ''
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Buscando NFT com ID:', params.id);
    
    // Verificar se é um ObjectId (NFT antigo) ou tokenId numérico (NFT novo)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.id);
    
    if (!isObjectId) {
      // Se não é ObjectId, é um tokenId de custom collection - buscar do MongoDB
      console.log('🗄️ Buscando NFT novo (custom collection) do MongoDB, tokenId:', params.id);
      
      try {
        const mongoClient = await connectToDatabase();
        const db = mongoClient.db(DB_NAME);
        
        // Buscar NFT em custom_collection_mints
        const customNft = await db.collection('custom_collection_mints').findOne({
          tokenId: params.id
        });
        
        if (!customNft) {
          return NextResponse.json(
            { success: false, error: 'Custom collection NFT not found' },
            { status: 404 }
          );
        }
        
        // Buscar dados da coleção pai
        const customCollection = await db.collection('custom_collections').findOne({
          _id: customNft.customCollectionId
        });
        
        console.log('✅ NFT de custom collection encontrado');
        
        // Formatar dados para o frontend compatível com useNFTData
        const formattedData = {
          success: true,
          data: {
            tokenId: params.id,
            name: customCollection?.name ? `${customCollection.name} #${params.id}` : `NFT #${params.id}`,
            description: customCollection?.description || 'Custom collection NFT',
            image: customCollection?.imageUrl || customCollection?.image || '',
            imageHttp: customCollection?.imageUrl || customCollection?.image || '',
            owner: customNft.owner || customNft.minterWallet || '',
            attributes: [
              { trait_type: 'Type', value: 'Custom Collection' },
              { trait_type: 'Collection', value: customCollection?.name || 'Unknown' },
              { trait_type: 'Category', value: customCollection?.category || 'custom' },
              { trait_type: 'Status', value: 'Minted' },
              ...(customCollection?.attributes || [])
            ],
            metadata: {
              name: customCollection?.name,
              description: customCollection?.description,
              image: customCollection?.imageUrl || customCollection?.image,
              collection: customCollection?.name
            },
            collection: customCollection?.name || 'custom',
            category: customCollection?.category || 'custom',
            contractAddress: customCollection?.contractAddress || '',
            blockchain: {
              chainId: 80002, // ou CHZ dependendo da config
              network: 'Custom Contract',
              transactionHash: customNft.transactionHash,
              mintedAt: customNft.mintedAt
            }
          },
          source: 'database',
          cached_at: new Date()
        };
        
        return NextResponse.json(formattedData);
        
      } catch (error) {
        console.error('❌ Erro ao buscar NFT de custom collection:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch custom collection NFT' },
          { status: 500 }
        );
      }
    }
    
    // NFT antigo (ObjectId) - buscar da Thirdweb com contratos importados
    console.log('🔗 Buscando NFT ANTIGO via Thirdweb (contrato importado), ObjectId:', params.id);
    
    try {
      // Primeiro buscar no MongoDB para obter o tokenId real e categoria
      const mongoClient = await connectToDatabase();
      const db = mongoClient.db(DB_NAME);
      
      const collections = ['jerseys', 'stadiums', 'badges'];
      let nftData = null;
      let foundCollection = '';
      
      for (const collection of collections) {
        try {
          const result = await db.collection(collection).findOne({
            _id: new ObjectId(params.id)
          });
          
          if (result) {
            nftData = result;
            foundCollection = collection;
            break;
          }
        } catch (error) {
          console.log(`❌ Erro ao buscar em ${collection}:`, error);
        }
      }
      
      if (!nftData) {
        return NextResponse.json(
          { success: false, error: 'Legacy NFT not found in database' },
          { status: 404 }
        );
      }
      
      // Se temos tokenId, buscar da blockchain via Thirdweb
      if (nftData.tokenId) {
        console.log('🔗 Buscando dados completos da Thirdweb para tokenId:', nftData.tokenId);
        
        const contractAddress = CONTRACT_ADDRESSES[foundCollection];
        if (!contractAddress) {
          console.log('❌ Contrato não configurado para', foundCollection);
          // Fallback para dados do MongoDB
        } else {
          try {
            const contract = getContract({
              client: thirdwebClient,
              chain: polygonAmoy,
              address: contractAddress,
            });
            
            // Buscar dados da blockchain
            const tokenUri = await readContract({
              contract,
              method: "function tokenURI(uint256 tokenId) view returns (string)",
              params: [BigInt(nftData.tokenId)]
            });
            
            const owner = await readContract({
              contract,
              method: "function ownerOf(uint256 tokenId) view returns (address)",
              params: [BigInt(nftData.tokenId)]
            });
            
            // Buscar metadados IPFS
            let blockchainMetadata = {};
            if (tokenUri && tokenUri.startsWith('ipfs://')) {
              try {
                const httpUrl = tokenUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                const metadataResponse = await fetch(httpUrl);
                blockchainMetadata = await metadataResponse.json();
              } catch (error) {
                console.log('❌ Erro ao buscar metadados IPFS:', error);
              }
            }
            
            console.log('✅ NFT antigo encontrado via Thirdweb');
            
            // Combinar dados do MongoDB com dados da blockchain
            const formattedData = {
              success: true,
              data: {
                tokenId: nftData.tokenId,
                name: blockchainMetadata.name || nftData.name,
                description: blockchainMetadata.description || nftData.description || `AI-generated ${foundCollection.slice(0, -1)}`,
                image: blockchainMetadata.image || nftData.imageUrl || nftData.image_url,
                imageHttp: blockchainMetadata.image ? blockchainMetadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : nftData.imageUrl || nftData.image_url,
                owner: owner,
                attributes: blockchainMetadata.attributes || nftData.attributes || [
                  { trait_type: 'Type', value: foundCollection.slice(0, -1) },
                  { trait_type: 'Status', value: 'Minted' },
                  { trait_type: 'Collection', value: foundCollection }
                ],
                metadata: {
                  name: blockchainMetadata.name || nftData.name,
                  description: blockchainMetadata.description || nftData.description,
                  image: blockchainMetadata.image || nftData.imageUrl,
                  tokenUri: tokenUri
                },
                collection: foundCollection,
                category: foundCollection.slice(0, -1), // jersey, stadium, badge
                contractAddress: contractAddress,
                blockchain: {
                  chainId: 80002,
                  network: 'Polygon Amoy',
                  tokenUri: tokenUri,
                  transactionHash: nftData.transactionHash,
                  mintedAt: nftData.mintedAt || nftData.createdAt
                }
              },
              source: 'thirdweb',
              cached_at: new Date()
            };
            
            return NextResponse.json(formattedData);
            
          } catch (thirdwebError) {
            console.error('❌ Erro Thirdweb para NFT antigo:', thirdwebError);
            // Fallback para dados do MongoDB
          }
        }
      }
      
      // Fallback: usar dados do MongoDB se Thirdweb falhar
      console.log('📦 Usando dados do MongoDB como fallback');
      const formattedData = {
        success: true,
        data: {
          tokenId: nftData.tokenId || nftData._id.toString(),
          name: nftData.name,
          description: nftData.description || `AI-generated ${foundCollection.slice(0, -1)}`,
          image: nftData.imageUrl || nftData.image_url,
          imageHttp: nftData.imageUrl || nftData.image_url,
          owner: nftData.creator?.wallet || nftData.creatorWallet || '',
          attributes: nftData.attributes || [
            { trait_type: 'Type', value: foundCollection.slice(0, -1) },
            { trait_type: 'Status', value: 'Minted' },
            { trait_type: 'Collection', value: foundCollection }
          ],
          metadata: {
            name: nftData.name,
            description: nftData.description,
            image: nftData.imageUrl || nftData.image_url,
            creator: nftData.creator?.wallet || nftData.creatorWallet
          },
          collection: foundCollection,
          category: foundCollection.slice(0, -1), // jersey, stadium, badge
          contractAddress: CONTRACT_ADDRESSES[foundCollection] || '',
          blockchain: {
            chainId: 80002,
            network: 'Polygon Amoy (Fallback)',
            transactionHash: nftData.transactionHash,
            mintedAt: nftData.mintedAt || nftData.createdAt
          }
        },
        source: 'database_fallback',
        cached_at: new Date()
      };
    
    return NextResponse.json(formattedData);
    
  } catch (error) {
    console.error('❌ Erro ao buscar NFT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}