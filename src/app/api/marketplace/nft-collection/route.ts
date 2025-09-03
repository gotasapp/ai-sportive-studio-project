import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import clientPromise from '@/lib/mongodb';

/**
 * API para buscar NFTs diretamente do contrato de NFT Collection
 * Usa funções oficiais da Thirdweb v5: getNFT, getAllNFTs, tokenURI, ownerOf
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'getAllNFTs';
    const tokenId = searchParams.get('tokenId');
    const ownerAddress = searchParams.get('owner');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('🎨 NFT Collection API:', { action, tokenId, ownerAddress, limit });

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Endereço do contrato NFT Collection
    const contractAddress = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: contractAddress,
    });

    if (action === 'getAllNFTs') {
      console.log('📋 Getting all NFTs from collection...');
      
      try {
        // Obter total supply primeiro
        const totalSupply = await readContract({
          contract: nftContract,
          method: "function totalSupply() view returns (uint256)",
          params: []
        });

        console.log(`📊 Collection total supply: ${totalSupply}`);

        if (Number(totalSupply) === 0) {
          return NextResponse.json({
            success: true,
            nfts: [],
            totalSupply: 0,
            message: 'No NFTs minted yet'
          });
        }

        const nfts = [];
        const tokensToFetch = Math.min(limit, Number(totalSupply));

        for (let i = 0; i < tokensToFetch; i++) {
          const tokenId = i;
          
          try {
            // Buscar owner
            const owner = await readContract({
              contract: nftContract,
              method: "function ownerOf(uint256) view returns (address)",
              params: [BigInt(tokenId)]
            });

            // Buscar tokenURI
            const tokenUri = await readContract({
              contract: nftContract,
              method: "function tokenURI(uint256) view returns (string)",
              params: [BigInt(tokenId)]
            });

            let metadata = null;
            
            // Tentar buscar metadata se for URL válida
            if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
              try {
                let fetchUrl = tokenUri;
                if (tokenUri.startsWith('ipfs://')) {
                  fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }
                
                const metadataResponse = await fetch(fetchUrl);
                if (metadataResponse.ok) {
                  metadata = await metadataResponse.json();
                }
              } catch (metadataError) {
                console.log(`⚠️ Could not fetch metadata for token ${tokenId}`);
              }
            }

            nfts.push({
              tokenId: tokenId.toString(),
              owner,
              tokenUri,
              metadata,
              contractAddress
            });

          } catch (tokenError: any) {
            console.log(`⚠️ Could not fetch token ${tokenId}:`, tokenError?.message || tokenError);
            continue;
          }
        }

        // === BLACKLIST FILTER ===
        // Buscar tokenIds ocultos do MongoDB
        const client = await clientPromise;
        const db = client.db('chz-app-db');
        const hiddenDocs = await db.collection('hidden_nfts').find().toArray();
        const hiddenIds = hiddenDocs.map(doc => doc.tokenId);
        // Filtrar NFTs
        const visibleNFTs = nfts.filter(nft => !hiddenIds.includes(nft.tokenId));
        // Retornar apenas as NFTs visíveis
        return NextResponse.json({
          success: true,
          nfts: visibleNFTs,
          totalSupply: Number(totalSupply),
          fetched: visibleNFTs.length,
          contractAddress
        });

      } catch (error: any) {
        console.error('❌ Error fetching all NFTs:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch NFTs from collection',
          details: error?.message || error
        }, { status: 500 });
      }
    }

    if (action === 'getNFT' && tokenId) {
      console.log(`🎯 Getting specific NFT: ${tokenId}`);
      
      try {
        // Verificar se token existe e buscar owner
        const owner = await readContract({
          contract: nftContract,
          method: "function ownerOf(uint256) view returns (address)",
          params: [BigInt(tokenId)]
        });

        // Buscar tokenURI
        const tokenUri = await readContract({
          contract: nftContract,
          method: "function tokenURI(uint256) view returns (string)",
          params: [BigInt(tokenId)]
        });

        let metadata = null;
        
        // Tentar buscar metadata
        if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
          try {
            let fetchUrl = tokenUri;
            if (tokenUri.startsWith('ipfs://')) {
              fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            const metadataResponse = await fetch(fetchUrl);
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json();
            }
          } catch (metadataError) {
            console.log(`⚠️ Could not fetch metadata for token ${tokenId}`);
          }
        }

        return NextResponse.json({
          success: true,
          nft: {
            tokenId,
            owner,
            tokenUri,
            metadata,
            contractAddress
          }
        });

      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Token ${tokenId} not found or error fetching`,
          details: error?.message || error
        }, { status: 404 });
      }
    }

    if (action === 'getOwnedNFTs' && ownerAddress) {
      console.log(`👤 Getting NFTs owned by: ${ownerAddress}`);
      
      try {
        // Obter total supply
        const totalSupply = await readContract({
          contract: nftContract,
          method: "function totalSupply() view returns (uint256)",
          params: []
        });

        console.log(`📊 Checking ownership in ${totalSupply} tokens...`);

        const ownedNfts = [];
        
        for (let i = 0; i < Number(totalSupply); i++) {
          try {
            const owner = await readContract({
              contract: nftContract,
              method: "function ownerOf(uint256) view returns (address)",
              params: [BigInt(i)]
            });

            if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
              // Buscar tokenURI e metadata
              const tokenUri = await readContract({
                contract: nftContract,
                method: "function tokenURI(uint256) view returns (string)",
                params: [BigInt(i)]
              });

              let metadata = null;
              
              if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
                try {
                  let fetchUrl = tokenUri;
                  if (tokenUri.startsWith('ipfs://')) {
                    fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                  
                  const metadataResponse = await fetch(fetchUrl);
                  if (metadataResponse.ok) {
                    metadata = await metadataResponse.json();
                  }
                } catch (metadataError) {
                  console.log(`⚠️ Could not fetch metadata for token ${i}`);
                }
              }

              ownedNfts.push({
                tokenId: i.toString(),
                owner,
                tokenUri,
                metadata,
                contractAddress
              });
            }
          } catch (tokenError: any) {
            continue;
          }
        }

        // === BLACKLIST FILTER ===
        // Buscar tokenIds ocultos do MongoDB
        const client = await clientPromise;
        const db = client.db('chz-app-db');
        const hiddenDocs = await db.collection('hidden_nfts').find().toArray();
        const hiddenIds = hiddenDocs.map(doc => doc.tokenId);
        // Filtrar NFTs
        const visibleOwnedNfts = ownedNfts.filter(nft => !hiddenIds.includes(nft.tokenId));
        return NextResponse.json({
          success: true,
          nfts: visibleOwnedNfts,
          totalSupply: Number(totalSupply),
          owner: ownerAddress,
          ownedCount: visibleOwnedNfts.length
        });

      } catch (error: any) {
        console.error('❌ Error fetching owned NFTs:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch owned NFTs',
          details: error?.message || error
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: getAllNFTs, getNFT, or getOwnedNFTs'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ NFT Collection API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error?.message || error
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tokenIds, ownerAddress } = body;

    console.log('🎨 NFT Collection API POST:', { action, tokenIds, ownerAddress });

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const contractAddress = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: contractAddress,
    });

    if (action === 'batchGetNFTs' && tokenIds && Array.isArray(tokenIds)) {
      console.log(`📦 Batch getting NFTs: ${tokenIds.join(', ')}`);
      
      const results = [];

      for (const tokenId of tokenIds) {
        try {
          const owner = await readContract({
            contract: nftContract,
            method: "function ownerOf(uint256) view returns (address)",
            params: [BigInt(tokenId)]
          });

          const tokenUri = await readContract({
            contract: nftContract,
            method: "function tokenURI(uint256) view returns (string)",
            params: [BigInt(tokenId)]
          });

          let metadata = null;
          
          if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
            try {
              let fetchUrl = tokenUri;
              if (tokenUri.startsWith('ipfs://')) {
                fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
              
              const metadataResponse = await fetch(fetchUrl);
              if (metadataResponse.ok) {
                metadata = await metadataResponse.json();
              }
            } catch (metadataError) {
              console.log(`⚠️ Could not fetch metadata for token ${tokenId}`);
            }
          }

          results.push({
            tokenId: tokenId.toString(),
            owner,
            tokenUri,
            metadata,
            contractAddress,
            success: true
          });

        } catch (error: any) {
          results.push({
            tokenId: tokenId.toString(),
            success: false,
            error: error?.message || error
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        totalRequested: tokenIds.length,
        successful: results.filter(r => r.success).length
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid POST action. Use: batchGetNFTs'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ NFT Collection API POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error?.message || error
    }, { status: 500 });
  }
} 