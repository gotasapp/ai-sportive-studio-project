// src/components/marketplace/NFTGrid.tsx
'use client';

import { useState } from 'react';
import MarketplaceCard from './MarketplaceCard';
import CollectionOverviewCard from './CollectionOverviewCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NETWORK_CURRENCY } from '@/lib/network-config';

interface NFTGridProps {
  items: any[];
  getContractByCategory: (category: string) => string;
}

export default function NFTGrid({ items, getContractByCategory }: NFTGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Grid with 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6">
        {currentItems.map((item) => {
        // 🎯 CRITICAL DECISION: Use CollectionOverviewCard for collections
        // Treat Launchpad as Custom Collection for navigation by collectionId
        const isLaunchpadCollection =
          (item.type === 'launchpad' && item.status === 'active') ||
          item.type === 'launchpad_collection' ||
          item.collectionType === 'launchpad' ||
          item.marketplace?.isLaunchpadCollection;
        
        // DEBUG: Log for Kane 2018 collection
        if (item.name?.includes('Kane') || item.collection?.includes('Kane')) {
          console.log('🔍 DEBUG Kane Collection:', {
            name: item.name,
            type: item.type,
            status: item.status,
            collectionType: item.collectionType,
            isLaunchpadCollection: item.marketplace?.isLaunchpadCollection,
            isLaunchpadDetected: isLaunchpadCollection,
            _id: item._id,
            collectionId: item.collectionId
          });
        }
        const isCollection = item.isCollection || item.marketplace?.isCollection || isLaunchpadCollection || false;
        
        if (isCollection) {
          const computedCollectionId =
            item.collectionId || item.customCollectionId || item.collectionData?._id || item._id;
          const computedIsCustom = !!(item.isCustomCollection || item.marketplace?.isCustomCollection || isLaunchpadCollection);
          // For active launchpads, send to dedicated mint page (which already exists!)
          const hrefOverride = isLaunchpadCollection && item.status === 'active' && computedCollectionId
            ? `/launchpad/${computedCollectionId}`
            : undefined;
          
          // DEBUG: Log for Kane 2018
          if (item.name?.includes('Kane') || item.collection?.includes('Kane')) {
            console.log('🔍 DEBUG Kane hrefOverride:', {
              isLaunchpadCollection,
              status: item.status,
              computedCollectionId,
              hrefOverride,
              willUseOverride: !!hrefOverride
            });
          }
          return (
            <CollectionOverviewCard
              key={item.id}
              name={item.name}
              imageUrl={item.imageUrl}
              collection={item.category || `By ${item.creator || 'Anonymous'}`}
              category={item.category}
              collectionId={computedCollectionId}
              isCustomCollection={computedIsCustom}
              hrefOverride={hrefOverride}
              
              // Collection stats from marketplace data
              mintedUnits={item.marketplace?.mintedUnits || item.mintedUnits || 0}
              totalUnits={item.marketplace?.totalUnits || item.totalUnits || 0}
              availableUnits={item.marketplace?.availableUnits || item.availableUnits || 0}
              floorPrice={item.marketplace?.thirdwebData?.price ? `${item.marketplace.thirdwebData.price} ${NETWORK_CURRENCY}` : (item.price || `0 ${NETWORK_CURRENCY}`)}
              uniqueOwners={item.marketplace?.uniqueOwners || item.uniqueOwners || 0}
              listedCount={item.marketplace?.thirdwebListedCount || item.listedCount || 0}
              auctionCount={item.marketplace?.thirdwebAuctionCount || item.auctionCount || 0}
            />
          );
        }
        
        // 🎯 For individual NFTs, use normal MarketplaceCard
        return (
          <MarketplaceCard
            key={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            price={item.price || 'Not for sale'}
            collection={item.category || `By ${item.creator || 'Anonymous'}`}
            category={item.category}
            tokenId={item.tokenId}
            assetContract={item.contractAddress || getContractByCategory(item.category)}
            owner={item.owner || item.creator}
            isListed={item.isListed || false}
            listingId={item.listingId}
            isAuction={item.isAuction || false}
            auctionId={item.auctionId}
            currentBid={item.currentBid}
            endTime={item.endTime}
            activeOffers={item.activeOffers || 0}
            // Props for Custom Collections (in case it's a collection NFT)
            collectionId={item.customCollectionId || item._id}
            isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection' || item.marketplace?.isCustomCollection}
          />
        );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="flex items-center gap-2">
            {/* Botão Anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Números das páginas */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show only pages close to current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={`h-8 w-8 p-0 ${
                        page === currentPage
                          ? 'bg-[#FF0052] text-[#FDFDFD] hover:bg-[#FF0052]/80'
                          : 'bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10'
                      }`}
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return (
                    <span key={page} className="text-[#FDFDFD]/50 px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            {/* Botão Próximo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Info da paginação */}
      <div className="text-center text-sm text-[#FDFDFD]/70 pb-4">
        Showing {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length} items
      </div>
    </div>
  );
} 