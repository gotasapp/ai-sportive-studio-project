import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, LayoutGrid, List, Grid3X3, Search, Eye, Tag, Heart, MoreVertical } from "lucide-react";
import MarketplaceStatsBarMobile from "@/components/marketplace/MarketplaceStatsBarMobile";
import LaunchpadCarouselMobile, { LaunchpadItem } from "@/components/marketplace/LaunchpadCarouselMobile";
import Header from "@/components/Header";
import MarketplaceCardMobile from "./MarketplaceCardMobile";
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
  volume24h: string;
  volumeChange: number;
  sales24h: string;
  salesChange: number;
  launchpadItems: LaunchpadItem[];
  // ...outros handlers e props necessários
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
  volume24h,
  volumeChange,
  sales24h,
  salesChange,
  launchpadItems,
}: MarketplaceMobileLayoutProps) {
  // Estado do tipo de grid
  const [viewTypeMobile, setViewTypeMobile] = useState<'large' | 'medium' | 'compact'>('large');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(nfts.length / itemsPerPage);
  const paginatedNFTs = nfts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [activeFilter, setActiveFilter] = useState('All');

  // Renderização dos cards conforme o tipo de grid
  const renderNFTGrid = () => {
    // Debug: log dos dados dos NFTs
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
      // Grid 2 colunas, cards grandes
      return (
        <div className="grid grid-cols-2 gap-3">
          {paginatedNFTs.map(nft => {
            // Debug específico para cada NFT
            const nftId = nft._id || nft.id;
            console.log('🔧 Rendering NFT:', {
              name: nft.name,
              nftId,
              votes: nft.votes,
              hasNftId: !!nftId,
              nftKeys: Object.keys(nft)
            });
            
            return (
            <MarketplaceCardMobile
              key={nft.id}
              name={nft.name}
              imageUrl={nft.imageUrl || nft.image_url}
              price={nft.price || 'Not for sale'}
              collection={nft.collection || nft.category}
              category={nft.category}
              tokenId={nft.tokenId || nft.id}
              assetContract={nft.contractAddress || nft.assetContract}
              listingId={nft.listingId}
              isListed={nft.isListed || false}
              owner={nft.owner || nft.creator}
              collectionId={nft.customCollectionId || nft._id}
              isCustomCollection={!!nft.customCollectionId || nft.type === 'custom_collection'}
              isAuction={nft.isAuction || false}
              auctionId={nft.auctionId}
              currentBid={nft.currentBid}
              endTime={nft.endTime}
              activeOffers={nft.activeOffers || 0}
              viewType="large"
              onBuy={onBuy}
              // Sistema de voting
              nftId={nft._id || nft.id}
              votes={nft.votes || 0}
              userVoted={false} // TODO: implementar verificação de usuário
            />
            );
          })}
        </div>
      );
    }
    
    if (viewTypeMobile === 'medium') {
      // Grid 3 colunas, cards médios
      return (
        <div className="grid grid-cols-3 gap-2">
          {paginatedNFTs.map(nft => (
            <MarketplaceCardMobile
              key={nft.id}
              name={nft.name}
              imageUrl={nft.imageUrl || nft.image_url}
              price={nft.price || 'Not for sale'}
              collection={nft.collection || nft.category}
              category={nft.category}
              tokenId={nft.tokenId || nft.id}
              assetContract={nft.contractAddress || nft.assetContract}
              listingId={nft.listingId}
              isListed={nft.isListed || false}
              owner={nft.owner || nft.creator}
              collectionId={nft.customCollectionId || nft._id}
              isCustomCollection={!!nft.customCollectionId || nft.type === 'custom_collection'}
              isAuction={nft.isAuction || false}
              auctionId={nft.auctionId}
              currentBid={nft.currentBid}
              endTime={nft.endTime}
              activeOffers={nft.activeOffers || 0}
              viewType="medium"
              onBuy={onBuy}
              // Sistema de voting
              nftId={nft._id || nft.id}
              votes={nft.votes || 0}
              userVoted={false} // TODO: implementar verificação de usuário
            />
          ))}
        </div>
      );
    }
    
    // Compact: lista vertical
    return (
      <div className="flex flex-col gap-2">
        {paginatedNFTs.map(nft => (
          <MarketplaceCardMobile
            key={nft.id}
            name={nft.name}
            imageUrl={nft.imageUrl || nft.image_url}
            price={nft.price || 'Not for sale'}
            collection={nft.collection || nft.category}
            category={nft.category}
            tokenId={nft.tokenId || nft.id}
            assetContract={nft.contractAddress || nft.assetContract}
            listingId={nft.listingId}
            isListed={nft.isListed || false}
            owner={nft.owner || nft.creator}
            collectionId={nft.customCollectionId || nft._id}
            isCustomCollection={!!nft.customCollectionId || nft.type === 'custom_collection'}
            isAuction={nft.isAuction || false}
            auctionId={nft.auctionId}
            currentBid={nft.currentBid}
            endTime={nft.endTime}
            activeOffers={nft.activeOffers || 0}
            viewType="compact"
            onBuy={onBuy}
            // Sistema de voting
            nftId={nft._id || nft.id}
            votes={nft.votes || 0}
            userVoted={false} // TODO: implementar verificação de usuário
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col overflow-x-hidden">
      <Header />
      <div className="py-2">
        <MarketplaceStatsBarMobile
          volume24h={volume24h}
          volumeChange={volumeChange}
          sales24h={sales24h}
          salesChange={salesChange}
        />
      </div>
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