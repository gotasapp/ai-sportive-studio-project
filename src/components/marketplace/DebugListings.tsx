'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useActiveWalletChain } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';
import { createThirdwebClient } from 'thirdweb';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';
const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

export function DebugListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chain = useActiveWalletChain();

  const fetchListings = async () => {
    if (!chain) return;
    
    setIsLoading(true);
    try {
      const marketplaceContract = getContract({
        client,
        chain: chain,
        address: MARKETPLACE_CONTRACT_ADDRESS,
      });
      
      console.log('🔍 Starting to fetch listings...');
      
      // Try to get all valid listings (start small, then expand if needed)
      let allListings: any[] = [];
      
      // Batch 1: First 10 listings
      try {
        const batch1 = await getAllValidListings({
          contract: marketplaceContract,
          start: 0,
          count: 10,
        });
        console.log('🔍 BATCH 1 (0-9):', batch1);
        allListings = [...allListings, ...batch1];
      } catch (error) {
        console.warn('⚠️ Error in batch 1:', error);
      }
      
      // Batch 2: Next 10 listings (if batch 1 worked)
      if (allListings.length > 0) {
        try {
          const batch2 = await getAllValidListings({
            contract: marketplaceContract,
            start: 10,
            count: 10,
          });
          console.log('🔍 BATCH 2 (10-19):', batch2);
          allListings = [...allListings, ...batch2];
        } catch (error) {
          console.warn('⚠️ Error in batch 2:', error);
        }
      }
      
      console.log('🔍 ALL LISTINGS COMBINED:', allListings);
      setListings(allListings);
      
    } catch (error) {
      console.error('❌ Error in main fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ourContractListings = listings.filter(listing => 
    listing.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
  );

  return (
    <div className="p-4 bg-[#333333]/20 rounded-lg space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold text-[#FDFDFD]">Debug Listings</h3>
        <Button
          onClick={fetchListings}
          disabled={isLoading || !chain}
          className="bg-[#A20131] hover:bg-[#A20131]/90 text-white"
        >
          {isLoading ? 'Loading...' : 'Fetch All Listings'}
        </Button>
      </div>

      {listings.length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-[#FDFDFD] mb-2">
              All Marketplace Listings ({listings.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {listings.map((listing, index) => (
                <div key={index} className="text-sm text-[#FDFDFD]/80 bg-[#333333]/10 p-2 rounded">
                  <strong>Listing #{listing.id?.toString()}</strong> - 
                  Contract: {listing.assetContractAddress?.slice(0, 10)}... - 
                  Token: {listing.tokenId?.toString()} - 
                  Price: {listing.currencyValuePerToken?.displayValue} - 
                  Creator: {listing.creatorAddress?.slice(0, 10)}...
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-[#A20131] mb-2">
              Our Contract Listings ({ourContractListings.length})
            </h4>
            {ourContractListings.length > 0 ? (
              <div className="space-y-2">
                {ourContractListings.map((listing, index) => (
                  <div key={index} className="text-sm text-[#FDFDFD] bg-[#A20131]/20 p-3 rounded border border-[#A20131]/30">
                    <div className="font-bold">✅ LISTING ID: {listing.id?.toString()}</div>
                    <div>Token ID: {listing.tokenId?.toString()}</div>
                    <div>Price: {listing.currencyValuePerToken?.displayValue} {listing.currencyValuePerToken?.symbol}</div>
                    <div>Creator: {listing.creatorAddress}</div>
                    <div>Asset Contract: {listing.assetContractAddress}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#FDFDFD]/70">No listings found for our contract</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 