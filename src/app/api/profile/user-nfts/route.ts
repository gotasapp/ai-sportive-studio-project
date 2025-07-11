import { NextResponse } from 'next/server';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { convertIpfsToHttp } from '@/lib/utils';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    if (!userAddress) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    console.log('🔍 Fetching NFTs for user:', userAddress);

    // Create contracts
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // Get all NFTs and marketplace data
    const [allNFTs, listings, auctions] = await Promise.all([
      getNFTs({ contract: nftContract, start: 0, count: 100 }),
      getAllValidListings({ contract: marketplaceContract, start: 0, count: BigInt(100) }),
      getAllAuctions({ contract: marketplaceContract, start: 0, count: BigInt(100) })
    ]);

    console.log(`📊 Total NFTs in contract: ${allNFTs.length}`);

    // Filter marketplace data for our contract
    const ourListings = listings.filter(listing => 
      listing.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
    );
    
    const ourAuctions = auctions.filter(auction => 
      auction.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
    );

    // Create lookup maps
    const listingsByTokenId = new Map();
    const auctionsByTokenId = new Map();
    
    ourListings.forEach(listing => {
      const tokenId = listing.tokenId?.toString();
      if (tokenId) {
        listingsByTokenId.set(tokenId, listing);
      }
    });
    
    ourAuctions.forEach(auction => {
      const tokenId = auction.tokenId?.toString();
      if (tokenId) {
        auctionsByTokenId.set(tokenId, auction);
      }
    });

    // Check ownership for each NFT
    const userNFTs = [];
    
    for (const nft of allNFTs) {
      try {
        const tokenId = nft.id?.toString();
        if (!tokenId) continue;

        // Check actual ownership
        const owner = await ownerOf({
          contract: nftContract,
          tokenId: BigInt(tokenId)
        });

        const isOwned = owner.toLowerCase() === userAddress.toLowerCase();
        
        // Check if user has this NFT listed
        const listing = listingsByTokenId.get(tokenId);
        const isListed = listing && listing.creatorAddress?.toLowerCase() === userAddress.toLowerCase();
        
        // Check if user has this NFT in auction
        const auction = auctionsByTokenId.get(tokenId);
        const isAuctioned = auction && auction.creatorAddress?.toLowerCase() === userAddress.toLowerCase();

        // Include NFT if user owns it, listed it, or has it in auction
        if (isOwned || isListed || isAuctioned) {
          const metadata = nft.metadata || {};
          
          let status = 'owned';
          let price = undefined;
          
          if (isListed) {
            status = 'listed';
            price = listing.currencyValuePerToken?.displayValue || 
                   `${(Number(listing.pricePerToken || 0) / 1e18).toFixed(2)} MATIC`;
          } else if (isAuctioned) {
            status = 'listed';
            const minBidWei = auction.minimumBidAmount || BigInt(0);
            const minBidMatic = Number(minBidWei) / Math.pow(10, 18);
            price = `${minBidMatic.toFixed(2)} MATIC`;
          }

          // Check if user created this NFT
          const isCreatedByUser = 
            (metadata.creator as any)?.toLowerCase() === userAddress.toLowerCase() ||
            (metadata.minted_by as any)?.toLowerCase() === userAddress.toLowerCase() ||
            (Array.isArray(metadata.attributes) && metadata.attributes.some((attr: any) => 
              (attr.trait_type?.toLowerCase() === 'creator' || 
               attr.trait_type?.toLowerCase() === 'minted_by') &&
              attr.value?.toLowerCase() === userAddress.toLowerCase()
            ));
          
          if (isCreatedByUser) {
            status = 'created';
          }

          userNFTs.push({
            id: `${NFT_CONTRACT_ADDRESS}-${tokenId}`,
            tokenId,
            name: metadata.name || `NFT #${tokenId}`,
            imageUrl: convertIpfsToHttp(metadata.image || ''),
            price,
            status,
            createdAt: new Date().toISOString(),
            collection: determineCategory(metadata),
            owner,
            isOwned,
            isListed,
            isAuctioned
          });

          console.log(`✅ User NFT found: ${metadata.name} (Token ID: ${tokenId}, Status: ${status})`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not check ownership for NFT ${nft.id}:`, error);
      }
    }

    console.log(`🎉 Found ${userNFTs.length} NFTs for user ${userAddress}`);

    return NextResponse.json({
      success: true,
      data: {
        userAddress,
        nfts: userNFTs,
        totalNFTs: userNFTs.length,
        owned: userNFTs.filter(nft => nft.status === 'owned').length,
        listed: userNFTs.filter(nft => nft.status === 'listed').length,
        created: userNFTs.filter(nft => nft.status === 'created').length,
        contractStats: {
          totalNFTsInContract: allNFTs.length,
          totalListings: ourListings.length,
          totalAuctions: ourAuctions.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user NFTs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user NFTs'
    }, { status: 500 });
  }
}

function determineCategory(metadata: any): 'jerseys' | 'stadiums' | 'badges' {
  const name = (metadata.name || '').toLowerCase();
  const description = (metadata.description || '').toLowerCase();
  const attributes = metadata.attributes || [];
  
  // Check attributes first (most reliable)
  const categoryAttribute = attributes.find((attr: any) => 
    attr.trait_type?.toLowerCase() === 'category' || 
    attr.trait_type?.toLowerCase() === 'type'
  );
  
  if (categoryAttribute) {
    const category = categoryAttribute.value?.toLowerCase();
    if (category === 'jersey' || category === 'jerseys') return 'jerseys';
    if (category === 'stadium' || category === 'stadiums') return 'stadiums';
    if (category === 'badge' || category === 'badges') return 'badges';
  }
  
  // Fallback to name/description analysis
  if (name.includes('jersey') || description.includes('jersey') || name.includes('#')) {
    return 'jerseys';
  }
  
  if (name.includes('stadium') || description.includes('stadium') || 
      name.includes('arena') || description.includes('arena')) {
    return 'stadiums';
  }
  
  if (name.includes('badge') || description.includes('badge') ||
      name.includes('achievement') || description.includes('achievement')) {
    return 'badges';
  }
  
  // Default to jerseys
  return 'jerseys';
} 