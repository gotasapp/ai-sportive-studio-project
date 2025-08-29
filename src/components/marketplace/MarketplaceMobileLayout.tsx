import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, LayoutGrid, List, Grid3X3, Search, Eye, Tag, Heart, MoreVertical } from "lucide-react";
import LaunchpadCarouselMobile, { LaunchpadItem } from "@/components/marketplace/LaunchpadCarouselMobile";
import Header from "@/components/Header";
import MarketplaceCardMobile from "./MarketplaceCardMobile";
import CollectionOverviewCard from "./CollectionOverviewCard";
import Link from "next/link";

export type MarketplaceMobileLayoutProps = {
  nfts: any[];
  collections: any[];
  filters: {
    active: string;
    onChange: (filter: string) => void;
  };
  onBuy: (nft: any) => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  launchpadItems: LaunchpadItem[];
  // ...other handlers and necessary props
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Jersey", value: "jersey" },
  { label: "Stadium", value: "stadium" },
  { label: "Badge", value: "badge" },
];

export default function MarketplaceMobileLayout({
  nfts,
  collections,
  filters,
  onBuy,
  onSearch,
  searchTerm,
  launchpadItems,
}: MarketplaceMobileLayoutProps) {
  // Grid type state
  const [viewTypeMobile, setViewTypeMobile] = useState<'large' | 'medium' | 'compact'>('large');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(nfts.length / itemsPerPage);
  const paginatedNFTs = nfts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [activeFilter, setActiveFilter] = useState('All');

  // Card rendering according to grid type
  const renderNFTGrid = () => {
          // Debug: log NFT data
    console.log('🔧 MarketplaceMobileLayout - NFTs data:', {
      totalNFTs: nfts.length,
      firstNFT: nfts[0],
      firstNFTKeys: nfts[0] ? Object.keys(nfts[0]) : [],
      hasVotingData: nfts[0] ? {
        hasId: !!(nfts[0]._id || nfts[0].id),
        hasVotes: typeof nfts[0].votes !== 'undefined',
        id: nfts[0]._id || nfts[0].id,
        votes: nfts[0].votes
      } : null
    });

    if (nfts.length === 0) {
      return <div className="text-center text-white/60 py-12">No NFTs found.</div>;
    }
    
    if (viewTypeMobile === 'large') {
      // Grid 2 columns, large cards
      return (
        <div className="grid grid-cols-2 gap-3">
          {paginatedNFTs.map(item => {
            // 🎯 EXATA MESMA LÓGICA DO DESKTOP NFTGrid
            // Treat Launchpad as Custom Collection for navigation by collectionId
            const isLaunchpadCollection =
              (item.type === 'launchpad' && item.status === 'active') ||
              item.type === 'launchpad_collection' ||
              item.collectionType === 'launchpad' ||
              item.marketplace?.isLaunchpadCollection;
            
            const isCollection = item.isCollection || item.marketplace?.isCollection || isLaunchpadCollection || false;
            
                        if (isCollection) {
              // 🎯 USAR EXATAMENTE O MESMO COMPONENTE DO DESKTOP
              const computedCollectionId =
                item.collectionId || item.customCollectionId || item.collectionData?._id || item._id;
              const computedIsCustom = !!(item.isCustomCollection || item.marketplace?.isCustomCollection || isLaunchpadCollection);
              
              // For active launchpads, send to dedicated mint page (igual ao desktop)
              const hrefOverride = isLaunchpadCollection && item.status === 'active' && computedCollectionId
                ? `/launchpad/${computedCollectionId}`
                : undefined;
              
              return (
                <CollectionOverviewCard
                  key={item.id}
                  name={item.name}
                  imageUrl={item.imageUrl || item.image_url}
                  collection={item.collection || item.category}
                  category={item.category}
                  collectionId={computedCollectionId}
                  isCustomCollection={computedIsCustom}
                  hrefOverride={hrefOverride}
                  
                  // Collection stats from marketplace data (igual ao desktop)
                  mintedUnits={item.marketplace?.mintedUnits || item.mintedUnits || 0}
                  totalUnits={item.marketplace?.totalUnits || item.totalUnits || 0}
                  availableUnits={item.marketplace?.availableUnits || item.availableUnits || 0}
                  floorPrice={item.price || '0 MATIC'}
                  uniqueOwners={item.marketplace?.uniqueOwners || item.uniqueOwners || 0}
                  listedCount={item.marketplace?.thirdwebListedCount || item.listedCount || 0}
                  auctionCount={item.marketplace?.thirdwebAuctionCount || item.auctionCount || 0}
                  
                  // 🎯 DADOS REAIS DE PREÇO DO MARKETPLACE
                  price={item.price}
                  isListed={item.isListed || false}
                  isAuction={item.isAuction || false}
                  currentBid={item.currentBid}
                  currency={item.currency || 'CHZ'}
                />
              );
            }
            
            // 🎯 RENDERIZAR COMO NFT INDIVIDUAL (igual ao desktop)
            return (
              <MarketplaceCardMobile
                key={item.id}
                name={item.name}
                imageUrl={item.imageUrl || item.image_url}
                price={item.price || 'Not for sale'}
                collection={item.collection || item.category}
                category={item.category}
                tokenId={item.tokenId || item.id}
                assetContract={item.contractAddress || item.assetContract}
                listingId={item.listingId}
                isListed={item.isListed || false}
                owner={item.owner || item.creator}
                collectionId={item.customCollectionId || item._id}
                isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection'}
                isAuction={item.isAuction || false}
                auctionId={item.auctionId}
                currentBid={item.currentBid}
                endTime={item.endTime}
                activeOffers={item.activeOffers || 0}
                viewType={viewTypeMobile}
                onBuy={onBuy}
                // Voting system
                nftId={item._id || item.id}
                votes={item.votes || 0}
                userVoted={false} // TODO: implement user verification
              />
            );
          })}
        </div>
      );
    }
    
    if (viewTypeMobile === 'medium') {
      // Horizontal list layout, medium cards
      return (
        <div className="flex flex-row gap-2 overflow-x-auto pb-2">
          {paginatedNFTs.map(item => {
            // 🎯 EXATA MESMA LÓGICA DO DESKTOP NFTGrid
            const isLaunchpadCollection =
              (item.type === 'launchpad' && item.status === 'active') ||
              item.type === 'launchpad_collection' ||
              item.collectionType === 'launchpad' ||
              item.marketplace?.isLaunchpadCollection;
            
            const isCollection = item.isCollection || item.marketplace?.isCollection || isLaunchpadCollection || false;
            
            if (isCollection) {
              const computedCollectionId =
                item.collectionId || item.customCollectionId || item.collectionData?._id || item._id;
              const computedIsCustom = !!(item.isCustomCollection || item.marketplace?.isCustomCollection || isLaunchpadCollection);
              
              const hrefOverride = isLaunchpadCollection && item.status === 'active' && computedCollectionId
                ? `/launchpad/${computedCollectionId}`
                : undefined;
              
              return (
                <CollectionOverviewCard
                  key={item.id}
                  name={item.name}
                  imageUrl={item.imageUrl || item.image_url}
                  collection={item.collection || item.category}
                  category={item.category}
                  collectionId={computedCollectionId}
                  isCustomCollection={computedIsCustom}
                  hrefOverride={hrefOverride}
                  
                  mintedUnits={item.marketplace?.mintedUnits || item.mintedUnits || 0}
                  totalUnits={item.marketplace?.totalUnits || item.totalUnits || 0}
                  availableUnits={item.marketplace?.availableUnits || item.availableUnits || 0}
                  floorPrice={item.price || '0 MATIC'}
                  uniqueOwners={item.marketplace?.uniqueOwners || item.uniqueOwners || 0}
                  listedCount={item.marketplace?.thirdwebListedCount || item.listedCount || 0}
                  auctionCount={item.marketplace?.thirdwebAuctionCount || item.auctionCount || 0}
                  
                  // 🎯 DADOS REAIS DE PREÇO DO MARKETPLACE
                  price={item.price}
                  isListed={item.isListed || false}
                  isAuction={item.isAuction || false}
                  currentBid={item.currentBid}
                  currency={item.currency || 'CHZ'}
                />
              );
            }
            
            return (
              <MarketplaceCardMobile
                key={item.id}
                name={item.name}
                imageUrl={item.imageUrl || item.image_url}
                price={item.price || 'Not for sale'}
                collection={item.collection || item.category}
                category={item.category}
                tokenId={item.tokenId || item.id}
                assetContract={item.contractAddress || item.assetContract}
                listingId={item.listingId}
                isListed={item.isListed || false}
                owner={item.owner || item.creator}
                collectionId={item.customCollectionId || item._id}
                isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection'}
                isAuction={item.isAuction || false}
                auctionId={item.auctionId}
                currentBid={item.currentBid}
                endTime={item.endTime}
                activeOffers={item.activeOffers || 0}
                viewType="medium"
                onBuy={onBuy}
                // Voting system
                nftId={item._id || item.id}
                votes={item.votes || 0}
                userVoted={false} // TODO: implement user verification
              />
            );
          })}
        </div>
      );
    }
    
    // Compact: vertical list
    return (
      <div className="flex flex-col gap-2">
        {paginatedNFTs.map(item => {
          // 🎯 EXATA MESMA LÓGICA DO DESKTOP NFTGrid
          const isLaunchpadCollection =
            (item.type === 'launchpad' && item.status === 'active') ||
            item.type === 'launchpad_collection' ||
            item.collectionType === 'launchpad' ||
            item.marketplace?.isLaunchpadCollection;
          
          const isCollection = item.isCollection || item.marketplace?.isCollection || isLaunchpadCollection || false;
          
          if (isCollection) {
            const computedCollectionId =
              item.collectionId || item.customCollectionId || item.collectionData?._id || item._id;
            const computedIsCustom = !!(item.isCustomCollection || item.marketplace?.isCustomCollection || isLaunchpadCollection);
            
            const hrefOverride = isLaunchpadCollection && item.status === 'active' && computedCollectionId
              ? `/launchpad/${computedCollectionId}`
              : undefined;
            
            return (
              <CollectionOverviewCard
                key={item.id}
                name={item.name}
                imageUrl={item.imageUrl || item.image_url}
                collection={item.collection || item.category}
                category={item.category}
                collectionId={computedCollectionId}
                isCustomCollection={computedIsCustom}
                hrefOverride={hrefOverride}
                
                mintedUnits={item.marketplace?.mintedUnits || item.mintedUnits || 0}
                totalUnits={item.marketplace?.totalUnits || item.totalUnits || 0}
                availableUnits={item.marketplace?.availableUnits || item.availableUnits || 0}
                floorPrice={item.price || '0 MATIC'}
                uniqueOwners={item.marketplace?.uniqueOwners || item.uniqueOwners || 0}
                listedCount={item.marketplace?.thirdwebListedCount || item.listedCount || 0}
                auctionCount={item.marketplace?.thirdwebAuctionCount || item.auctionCount || 0}
                
                // 🎯 DADOS REAIS DE PREÇO DO MARKETPLACE
                price={item.price}
                isListed={item.isListed || false}
                isAuction={item.isAuction || false}
                currentBid={item.currentBid}
                currency={item.currency || 'CHZ'}
              />
            );
          }
          
          return (
            <MarketplaceCardMobile
              key={item.id}
              name={item.name}
              imageUrl={item.imageUrl || item.image_url}
              price={item.price || 'Not for sale'}
              collection={item.collection || item.category}
              category={item.category}
              tokenId={item.tokenId || item.id}
              assetContract={item.contractAddress || item.assetContract}
              listingId={item.listingId}
              isListed={item.isListed || false}
              owner={item.owner || item.creator}
              collectionId={item.customCollectionId || item._id}
              isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection'}
              isAuction={item.isAuction || false}
              auctionId={item.auctionId}
              currentBid={item.currentBid}
              endTime={item.endTime}
              activeOffers={item.activeOffers || 0}
              viewType="compact"
              onBuy={onBuy}
              // Voting system
              nftId={item._id || item.id}
              votes={item.votes || 0}
              userVoted={false} // TODO: implement user verification
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col overflow-x-hidden">
      <Header />
      <div className="px-2 pt-2">
        <LaunchpadCarouselMobile launchpadItems={launchpadItems} />
      </div>
      {/* Filtros */}
      <div className="flex items-center gap-2 mt-4 mb-2 w-full justify-center">
        {['All', 'Jersey', 'Stadium', 'Badge'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={
              (activeFilter === filter
                ? 'bg-[#FF0052] text-white'
                : 'text-white/80') +
              ' px-4 py-1.5 rounded-lg font-semibold text-xs border-none min-w-[60px] transition-all duration-150'
            }
            style={activeFilter !== filter ? { background: 'rgba(20,16,30,0.4)' } : {}}
          >
            {filter}
          </button>
        ))}
      </div>
      {/* Filtro e busca */}
      <div className="flex items-center gap-2 mt-4 mb-2">
        {/* ...chips de filtro... */}
        <div className="relative w-[90%] mx-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FF0052] transition-all text-sm"
            style={{ background: 'rgba(20,16,30,0.4)' }}
          />
        </div>
      </div>
      {/* Toggle de visualização */}
      <div className="flex justify-center gap-2 mb-2">
        <Button
          variant={viewTypeMobile === 'large' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'large' ? 'bg-[#FF0052] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
          onClick={() => setViewTypeMobile('large')}
        >
          <LayoutGrid className="w-5 h-5" />
        </Button>
        <Button
          variant={viewTypeMobile === 'medium' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'medium' ? 'bg-[#FF0052] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
          onClick={() => setViewTypeMobile('medium')}
        >
          <Grid3X3 className="w-5 h-5" />
        </Button>
        <Button
          variant={viewTypeMobile === 'compact' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'compact' ? 'bg-[#FF0052] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
          onClick={() => setViewTypeMobile('compact')}
        >
          <List className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-8">
        {renderNFTGrid()}
      </div>
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-4">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage - 1)}>
              Previous
            </Button>
          )}
          <span className="text-white/70 text-sm flex items-center">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage + 1)}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 