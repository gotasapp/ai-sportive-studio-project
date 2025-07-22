import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, LayoutGrid, List, Grid3X3, Search } from "lucide-react";
import MarketplaceStatsBarMobile from "@/components/marketplace/MarketplaceStatsBarMobile";
import LaunchpadCarouselMobile, { LaunchpadItem } from "@/components/marketplace/LaunchpadCarouselMobile";
import Header from "@/components/Header";

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

  // Renderização dos cards conforme o tipo de grid
  const renderNFTGrid = () => {
    if (nfts.length === 0) {
      return <div className="text-center text-white/60 py-12">No NFTs found.</div>;
    }
    if (viewTypeMobile === 'large') {
      // Grid 2 colunas, cards grandes
      return (
        <div className="grid grid-cols-2 gap-3">
          {paginatedNFTs.map(nft => (
            <div key={nft.id} className="rounded-xl p-3 flex flex-col items-center shadow-md" style={{ background: 'rgba(20,16,30,0.4)' }}>
              <img src={nft.imageUrl || nft.image_url} alt={nft.name} className="w-full h-28 rounded-lg object-cover bg-[#222] mb-2" />
              <div className="font-semibold text-white text-base text-center w-full truncate">{nft.name}</div>
              <div className="text-xs text-white/60 text-center w-full">{nft.collection || nft.category}</div>
              <div className="text-sm text-[#A20131] font-bold mt-1 w-full text-center">{nft.price}</div>
              <Button size="sm" className="bg-[#A20131] text-white px-4 py-2 rounded-lg font-semibold mt-2 w-full" onClick={() => onBuy(nft)}>
                Buy
              </Button>
            </div>
          ))}
        </div>
      );
    }
    if (viewTypeMobile === 'medium') {
      // Grid 3 colunas, cards médios
      return (
        <div className="grid grid-cols-3 gap-2">
          {paginatedNFTs.map(nft => (
            <div key={nft.id} className="rounded-lg p-2 flex flex-col items-center shadow-sm" style={{ background: 'rgba(20,16,30,0.4)' }}>
              <img src={nft.imageUrl || nft.image_url} alt={nft.name} className="w-full h-16 rounded-md object-cover bg-[#222] mb-1" />
              <div className="font-semibold text-white text-xs text-center w-full truncate">{nft.name}</div>
              <div className="text-[10px] text-white/60 text-center w-full">{nft.collection || nft.category}</div>
              <div className="text-xs text-[#A20131] font-bold mt-0.5 w-full text-center">{nft.price}</div>
            </div>
          ))}
        </div>
      );
    }
    // Compact: lista vertical original, um card grande por linha, mas mais compacto (~15% menor)
    return (
      <div className="flex flex-col gap-2">
        {paginatedNFTs.map(nft => (
          <div key={nft.id} className="rounded-xl p-2 flex items-center gap-2 shadow-md min-h-[60px]" style={{ background: 'rgba(20,16,30,0.4)' }}>
            <img src={nft.imageUrl || nft.image_url} alt={nft.name} className="w-12 h-12 rounded-lg object-cover bg-[#222]" />
            <div className="flex-1">
              <div className="font-semibold text-white text-sm leading-tight">{nft.name}</div>
              <div className="text-[11px] text-white/60 leading-tight">{nft.collection || nft.category}</div>
              <div className="text-xs text-[#A20131] font-bold mt-0.5">{nft.price}</div>
            </div>
            <Button size="sm" className="bg-[#A20131] text-white px-3 py-1.5 rounded-lg font-semibold text-xs h-8 min-w-[56px]" onClick={() => onBuy(nft)}>
              Buy
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="py-2">
        <LaunchpadCarouselMobile launchpadItems={launchpadItems} />
      </div>
      <div className="px-4 pt-2">
        <MarketplaceStatsBarMobile
          volume24h={volume24h}
          volumeChange={volumeChange}
          sales24h={sales24h}
          salesChange={salesChange}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-[#14101e]">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filters.active === f.value ? "default" : "outline"}
            className={`rounded-full px-4 py-2 text-sm whitespace-nowrap ${filters.active === f.value ? 'bg-[#A20131] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
            onClick={() => filters.onChange(f.value)}
          >
            {f.label}
          </Button>
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
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#A20131] transition-all text-sm"
            style={{ background: 'rgba(20,16,30,0.4)' }}
          />
        </div>
      </div>
      {/* Toggle de visualização */}
      <div className="flex justify-center gap-2 mb-2">
        <Button
          variant={viewTypeMobile === 'large' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'large' ? 'bg-[#A20131] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
          onClick={() => setViewTypeMobile('large')}
        >
          <LayoutGrid className="w-5 h-5" />
        </Button>
        <Button
          variant={viewTypeMobile === 'medium' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'medium' ? 'bg-[#A20131] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
          onClick={() => setViewTypeMobile('medium')}
        >
          <Grid3X3 className="w-5 h-5" />
        </Button>
        <Button
          variant={viewTypeMobile === 'compact' ? 'default' : 'outline'}
          className={`rounded-full p-2 ${viewTypeMobile === 'compact' ? 'bg-[#A20131] text-white' : 'bg-white/5 text-white/80 border-white/10'}`}
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
              Anterior
            </Button>
          )}
          <span className="text-white/70 text-sm flex items-center">Página {currentPage} de {totalPages}</span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage + 1)}>
              Próxima
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 