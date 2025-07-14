'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Gavel,
  Activity,
  DollarSign,
  Tag,
  BarChart3,
  ExternalLink,
  Share2,
  Heart,
  Eye,
  Users,
  Crown,
  Zap,
  Wallet,
  ImageIcon
} from 'lucide-react';
import Header from '@/components/Header';
import { convertIpfsToHttp } from '@/lib/utils';
// import { useNFTData } from '@/hooks/useNFTData';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';

interface NFTDetailPageProps {
  params: { 
    collectionId: string;
    tokenId: string;
  };
}

interface SaleData {
  price: string;
  date: string;
  buyer?: string;
  seller?: string;
}

interface PriceData {
  date: string;
  price: number;
  volume: number;
}

interface MarketplaceStats {
  totalListings: number;
  totalAuctions: number;
  totalVolume: string;
  floorPrice: string;
  totalSupply?: number;
  mintedNFTs?: number;
}

// Chart config for price history
const chartConfig = {
  price: {
    label: "Price",
    color: "#A20131",
  },
} satisfies ChartConfig;

export default function NFTDetailPage({ params }: NFTDetailPageProps) {
  const account = useActiveAccount();
  
  // Usar hooks existentes para dados reais
  // const { data: nftResponse, isLoading: nftLoading, error: nftError } = useNFTData(params.tokenId);
  const { nfts: marketplaceNFTs, loading: marketplaceLoading, totalCount, categories } = useMarketplaceData();
  
  // Dados mock temporários para debug
  const nftResponse = {
    success: true,
    data: {
      tokenId: params.tokenId,
      name: `NFT #${params.tokenId}`,
      description: 'Mock NFT for testing',
      image: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      imageHttp: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      owner: '0x1234567890123456789012345678901234567890',
      attributes: [
        { trait_type: 'Team', value: 'Flamengo' },
        { trait_type: 'Player', value: 'Jefferson' },
        { trait_type: 'Number', value: '10' },
        { trait_type: 'Style', value: 'Heritage' }
      ],
      metadata: {
        creator: '0x1234567890123456789012345678901234567890'
      }
    }
  };
  const nftLoading = false;
  const nftError = null;
  
  // Estados locais
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats>({
    totalListings: 0,
    totalAuctions: 0,
    totalVolume: "0.00 CHZ",
    floorPrice: "0.00 CHZ"
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Buscar dados específicos do marketplace e vendas
  useEffect(() => {
    async function fetchMarketplaceData() {
      try {
        setStatsLoading(true);

        // Buscar stats da coleção
        const statsResponse = await fetch(`/api/marketplace/nft-collection/stats?collection=${params.collectionId}`);
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          if (statsResult.success) {
            setMarketplaceStats(prev => ({
              ...prev,
              totalSupply: statsResult.data.totalSupply,
              mintedNFTs: statsResult.data.mintedNFTs,
              totalVolume: `${statsResult.data.salesVolume.toFixed(2)} CHZ`,
              totalListings: statsResult.data.totalListings || 0,
              totalAuctions: statsResult.data.totalAuctions || 0
            }));
          }
        }

        // Buscar dados de vendas específicas deste NFT
        const salesResponse = await fetch(`/api/marketplace/sales?collection=${params.collectionId}&tokenId=${params.tokenId}`);
        if (salesResponse.ok) {
          const salesResult = await salesResponse.json();
          if (salesResult.success && salesResult.data) {
            setSalesData(salesResult.data);
            
            // Gerar price history baseado em vendas reais ou dados mock
            if (salesResult.data.length > 0) {
              const realPriceHistory = salesResult.data.map((sale: any, index: number) => ({
                date: new Date(sale.timestamp || sale.date).toLocaleDateString(),
                price: parseFloat(sale.price) || 0.025 + (index * 0.005),
                volume: parseFloat(sale.volume) || 1.0 + (index * 0.5)
              }));
              setPriceHistory(realPriceHistory);
            } else {
              // Mock data se não houver vendas
              const mockPriceHistory: PriceData[] = [
                { date: "Dec 30", price: 0.025, volume: 2.1 },
                { date: "Jan 5", price: 0.032, volume: 3.2 },
                { date: "Jan 10", price: 0.028, volume: 1.8 },
                { date: "Jan 15", price: 0.045, volume: 4.5 },
                { date: "Jan 20", price: 0.038, volume: 2.9 },
                { date: "Jan 25", price: 0.041, volume: 3.1 }
              ];
              setPriceHistory(mockPriceHistory);
            }
          }
        }

      } catch (err) {
        console.error('Error fetching marketplace data:', err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchMarketplaceData();
  }, [params.tokenId, params.collectionId]);

  // Calcular stats dinâmicos baseados nos dados do marketplace
  useEffect(() => {
    if (!marketplaceLoading && marketplaceNFTs.length > 0) {
      const listings = marketplaceNFTs.filter(nft => nft.isListed);
      const auctions = marketplaceNFTs.filter(nft => nft.isAuction);
      
      // Calcular floor price
      const listedPrices = listings
        .map(nft => parseFloat(nft.price || '0'))
        .filter(price => price > 0);
      const floorPrice = listedPrices.length > 0 ? Math.min(...listedPrices) : 0;

      setMarketplaceStats(prev => ({
        ...prev,
        totalListings: listings.length,
        totalAuctions: auctions.length,
        floorPrice: `${floorPrice.toFixed(3)} CHZ`
      }));
    }
  }, [marketplaceNFTs, marketplaceLoading]);

  // Dados do NFT atual
  const nftData = nftResponse?.data;
  const loading = nftLoading || statsLoading;

  // Encontrar NFT específico no marketplace para dados de listing/auction
  const currentMarketplaceNFT = marketplaceNFTs.find(
    nft => nft.tokenId === params.tokenId && nft.type === params.collectionId
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <NFTDetailSkeleton />
        </main>
      </div>
    );
  }

  if (nftError || !nftData) {
    return notFound();
  }

  // Preparar dados para exibição
  const displayData = {
    id: nftData.tokenId,
    name: nftData.name || `NFT #${params.tokenId}`,
    description: nftData.description || '',
    imageUrl: convertIpfsToHttp(nftData.imageHttp || nftData.image || ''),
    tokenId: params.tokenId,
    collection: params.collectionId,
    creator: nftData.metadata?.creator || '',
    owner: nftData.owner || '',
    price: currentMarketplaceNFT?.price || '0.047',
    currency: 'CHZ',
    traits: nftData.attributes || [],
    stats: {
      views: Math.floor(Math.random() * 1000) + 100,
      favorites: Math.floor(Math.random() * 50) + 10,
      owners: 1
    },
    isListed: currentMarketplaceNFT?.isListed || false,
    isAuction: currentMarketplaceNFT?.isAuction || false
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards no Topo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-6 lg:mb-8">
          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-[#FDFDFD]/70">
                Floor Price
              </CardTitle>
              <div className="p-1 lg:p-2 rounded bg-[#A20131]/20">
                <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 pt-0">
              <div className="text-lg lg:text-2xl font-bold text-[#FDFDFD]">
                {marketplaceStats.floorPrice}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                Current floor
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-[#FDFDFD]/70">
                Total Volume
              </CardTitle>
              <div className="p-1 lg:p-2 rounded bg-[#A20131]/20">
                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 pt-0">
              <div className="text-lg lg:text-2xl font-bold text-[#FDFDFD]">
                {marketplaceStats.totalVolume}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-[#FDFDFD]/70">
                Total Supply
              </CardTitle>
              <div className="p-1 lg:p-2 rounded bg-[#A20131]/20">
                <Eye className="h-3 w-3 lg:h-4 lg:w-4 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 pt-0">
              <div className="text-lg lg:text-2xl font-bold text-[#FDFDFD]">
                {marketplaceStats.mintedNFTs || totalCount}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                NFTs minted
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-[#FDFDFD]/70">
                Listings
              </CardTitle>
              <div className="p-1 lg:p-2 rounded bg-[#A20131]/20">
                <Tag className="h-3 w-3 lg:h-4 lg:w-4 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 pt-0">
              <div className="text-lg lg:text-2xl font-bold text-[#FDFDFD]">
                {marketplaceStats.totalListings}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                For sale
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Principal: NFT à esquerda, Traits e Compra à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* NFT Image + Chart */}
          <div className="space-y-4 lg:space-y-6">
            {/* NFT Image */}
            <Card className="cyber-card">
              <CardContent className="p-4 lg:p-6">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-[#14101e] border border-[#FDFDFD]/10">
                  {displayData.imageUrl ? (
                    <Image
                      src={displayData.imageUrl}
                      alt={displayData.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-[#FDFDFD]/50 text-center">
                        <ImageIcon className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-4" />
                        <p className="text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* NFT Info */}
                <div className="mt-4 lg:mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[#A20131] border-[#A20131] text-xs">
                      {displayData.collection}
                    </Badge>
                    <div className="flex items-center space-x-1 lg:space-x-2">
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1 lg:p-2">
                        <Heart className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1 lg:p-2">
                        <Share2 className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1 lg:p-2">
                        <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h1 className="text-xl lg:text-2xl font-bold text-[#FDFDFD] mb-2">
                    {displayData.name}
                  </h1>
                  
                  {displayData.description && (
                    <p className="text-[#FDFDFD]/70 text-sm">
                      {displayData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price History Chart */}
            <Card className="cyber-card">
              <CardHeader className="p-4 lg:p-6 pb-2 lg:pb-4">
                <CardTitle className="text-[#FDFDFD] flex items-center text-sm lg:text-base">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-[#A20131]" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                <ChartContainer config={chartConfig} className="h-[160px] lg:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#A20131"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#A20131"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FDFDFD', fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FDFDFD', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#14101e',
                          border: '1px solid rgba(253, 253, 253, 0.1)',
                          borderRadius: '8px',
                          color: '#FDFDFD',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} CHZ`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#A20131"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#fillPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Traits e Purchase Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* Purchase Section */}
            <Card className="cyber-card">
              <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-[#FDFDFD] text-sm lg:text-base">
                      {displayData.isListed ? 'Listed Price' : displayData.isAuction ? 'Auction Price' : 'Last Sale'}
                    </CardTitle>
                    <div className="text-2xl lg:text-3xl font-bold text-[#FDFDFD] mt-1 lg:mt-2">
                      {displayData.price} {displayData.currency}
                    </div>
                    <p className="text-[#FDFDFD]/50 text-xs lg:text-sm">
                      ≈ ${(parseFloat(displayData.price) * 0.12).toFixed(2)} USD
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      displayData.isListed 
                        ? 'text-green-400 border-green-400' 
                        : displayData.isAuction 
                        ? 'text-yellow-400 border-yellow-400'
                        : 'text-[#A20131] border-[#A20131]'
                    } text-xs`}
                  >
                    {displayData.isListed ? 'For Sale' : displayData.isAuction ? 'Auction' : 'Owned'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                {account ? (
                  displayData.isListed || displayData.isAuction ? (
                    <Button 
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white font-medium py-2 lg:py-3"
                      size="lg"
                    >
                      <ShoppingBag className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      {displayData.isAuction ? 'Place Bid' : 'Buy Now'}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-[#FDFDFD]/10 text-[#FDFDFD] font-medium py-2 lg:py-3 cursor-not-allowed border-[#FDFDFD]/20"
                      size="lg"
                      disabled
                    >
                      Not for Sale
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white font-medium py-2 lg:py-3"
                    size="lg"
                  >
                    <Wallet className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                
                {account && (displayData.isListed || displayData.isAuction) && (
                  <div className="mt-3 lg:mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="cyber-border text-[#FDFDFD] text-xs lg:text-sm py-2">
                      <Gavel className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      Make Offer
                    </Button>
                    <Button variant="outline" className="cyber-border text-[#FDFDFD] text-xs lg:text-sm py-2">
                      <Activity className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      View Bids
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traits Section */}
            <Card className="cyber-card">
              <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
                <CardTitle className="text-[#FDFDFD] flex items-center text-sm lg:text-base">
                  <Tag className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-[#A20131]" />
                  Traits ({displayData.traits?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                {displayData.traits && displayData.traits.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                    {displayData.traits.map((trait, index) => (
                      <div key={index} className="p-2 lg:p-3 rounded-lg bg-[#14101e] border border-[#FDFDFD]/10">
                        <div className="text-xs text-[#FDFDFD]/50 uppercase tracking-wider">
                          {trait.trait_type}
                        </div>
                        <div className="text-xs lg:text-sm font-medium text-[#FDFDFD] mt-1">
                          {trait.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 lg:py-8">
                    <Tag className="h-8 w-8 lg:h-12 lg:w-12 mx-auto text-[#FDFDFD]/30 mb-2 lg:mb-4" />
                    <p className="text-[#FDFDFD]/50 text-sm">No traits available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Section */}
            <Card className="cyber-card">
              <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
                <CardTitle className="text-[#FDFDFD] text-sm lg:text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0 space-y-2 lg:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#FDFDFD]/70 text-sm">Token ID</span>
                  <span className="text-[#FDFDFD] font-mono text-sm">#{displayData.tokenId}</span>
                </div>
                <Separator className="bg-[#FDFDFD]/10" />
                
                <div className="flex justify-between items-center">
                  <span className="text-[#FDFDFD]/70 text-sm">Collection</span>
                  <span className="text-[#FDFDFD] capitalize text-sm">{displayData.collection}</span>
                </div>
                <Separator className="bg-[#FDFDFD]/10" />
                
                {displayData.creator && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[#FDFDFD]/70 text-sm">Creator</span>
                      <span className="text-[#FDFDFD] font-mono text-xs lg:text-sm">
                        {displayData.creator.slice(0, 6)}...{displayData.creator.slice(-4)}
                      </span>
                    </div>
                    <Separator className="bg-[#FDFDFD]/10" />
                  </>
                )}
                
                {displayData.owner && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#FDFDFD]/70 text-sm">Owner</span>
                    <span className="text-[#FDFDFD] font-mono text-xs lg:text-sm">
                      {displayData.owner.slice(0, 6)}...{displayData.owner.slice(-4)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity/Sales History */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-[#FDFDFD] flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#A20131]" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <div className="space-y-3">
                {salesData.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#14101e] border border-[#FDFDFD]/10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-[#A20131]/20">
                        <ShoppingBag className="h-4 w-4 text-[#A20131]" />
                      </div>
                      <div>
                        <div className="text-[#FDFDFD] font-medium">Sale</div>
                        <div className="text-[#FDFDFD]/50 text-sm">{sale.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FDFDFD] font-bold">{sale.price} CHZ</div>
                      {sale.buyer && (
                        <div className="text-[#FDFDFD]/50 text-sm">
                          {sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-[#FDFDFD]/30 mb-4" />
                <p className="text-[#FDFDFD]/50">No activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Loading skeleton component
function NFTDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="cyber-card">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="cyber-card">
            <CardContent className="p-6">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="cyber-card">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 