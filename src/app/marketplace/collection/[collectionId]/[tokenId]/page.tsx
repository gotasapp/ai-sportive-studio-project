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
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
  ImageIcon,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';
import { convertIpfsToHttp } from '@/lib/utils';
import { useNFTData } from '@/hooks/useNFTData';
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

// Function to generate enhanced mock data for price history
function getEnhancedMockData(): PriceData[] {
  const now = new Date();
  const mockData: PriceData[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 5);
    
    // Simulate price fluctuation with some randomness but trending upward
    const basePrice = 0.025 + (6 - i) * 0.003;
    const variation = (Math.random() - 0.5) * 0.01;
    const price = Math.max(0.01, basePrice + variation);
    
    mockData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(4)),
      volume: parseFloat((1 + Math.random() * 3).toFixed(1))
    });
  }
  
  return mockData;
}

// Enhanced activity types
interface ActivityItem {
  type: 'sale' | 'listing' | 'bid' | 'transfer' | 'mint';
  price?: string;
  from?: string;
  to?: string;
  date: string;
  timestamp: number;
  txHash?: string;
}

export default function NFTDetailPage({ params }: NFTDetailPageProps) {
  const account = useActiveAccount();
  
  // Usar hooks existentes para dados reais
  const { data: nftResponse, isLoading: nftLoading, error: nftError } = useNFTData(params.tokenId);
  const { nfts: marketplaceNFTs, loading: marketplaceLoading, totalCount, categories } = useMarketplaceData();
  
  // Estados locais
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
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
            
            // Gerar activity data com tipos diferentes de eventos
            const enhancedActivity: ActivityItem[] = salesResult.data.map((sale: any) => ({
              type: 'sale' as const,
              price: `${parseFloat(sale.price).toFixed(4)} CHZ`,
              from: sale.seller || '0x0000...0000',
              to: sale.buyer || '0x0000...0000',
              date: new Date(sale.timestamp || sale.date).toLocaleDateString(),
              timestamp: new Date(sale.timestamp || sale.date).getTime(),
              txHash: sale.transactionHash
            }));

            // Adicionar eventos mock se não houver dados suficientes
            if (enhancedActivity.length < 3) {
              const mockActivity: ActivityItem[] = [
                {
                  type: 'mint',
                  date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
                  to: nftData?.owner || '0x1234...5678'
                },
                {
                  type: 'listing',
                  price: '0.035 CHZ',
                  from: nftData?.owner || '0x1234...5678',
                  date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
                },
                {
                  type: 'bid',
                  price: '0.032 CHZ',
                  from: '0x9876...4321',
                  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
                }
              ];
              setActivityData([...enhancedActivity, ...mockActivity].sort((a, b) => b.timestamp - a.timestamp));
            } else {
              setActivityData(enhancedActivity.sort((a, b) => b.timestamp - a.timestamp));
            }
            
            // Gerar price history baseado em vendas reais ou dados mock melhorados
            if (salesResult.data.length > 0) {
              // Organizar dados reais por data e calcular médias de preço
              const salesByDate = salesResult.data.reduce((acc: any, sale: any) => {
                const dateKey = new Date(sale.timestamp || sale.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                if (!acc[dateKey]) {
                  acc[dateKey] = { prices: [], volumes: [] };
                }
                acc[dateKey].prices.push(parseFloat(sale.price) || 0);
                acc[dateKey].volumes.push(parseFloat(sale.volume) || 1);
                return acc;
              }, {});

              const realPriceHistory = Object.entries(salesByDate).map(([date, data]: [string, any]) => ({
                date,
                price: data.prices.reduce((sum: number, price: number) => sum + price, 0) / data.prices.length,
                volume: data.volumes.reduce((sum: number, vol: number) => sum + vol, 0)
              })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              setPriceHistory(realPriceHistory.length > 0 ? realPriceHistory : getEnhancedMockData());
            } else {
              setPriceHistory(getEnhancedMockData());
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
    nft => nft.tokenId === params.tokenId
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
      
      <main className="container mx-auto px-3 py-6">
                {/* Stats Cards no Topo - Mesmo tamanho do marketplace */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6 lg:mb-8">
          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
              <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
                Floor Price
              </CardTitle>
              <div className="p-1 rounded bg-[#A20131]/20">
                <BarChart3 className="h-3 w-3 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-sm font-bold text-[#FDFDFD] mb-0.5">
                {marketplaceStats.floorPrice}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                Current floor
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
              <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
                Total Volume
              </CardTitle>
              <div className="p-1 rounded bg-[#A20131]/20">
                <DollarSign className="h-3 w-3 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-sm font-bold text-[#FDFDFD] mb-0.5">
                {marketplaceStats.totalVolume}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
              <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
                Total Supply
              </CardTitle>
              <div className="p-1 rounded bg-[#A20131]/20">
                <Eye className="h-3 w-3 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-sm font-bold text-[#FDFDFD] mb-0.5">
                {marketplaceStats.mintedNFTs || totalCount}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                NFTs minted
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
              <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
                Listings
              </CardTitle>
              <div className="p-1 rounded bg-[#A20131]/20">
                <Tag className="h-3 w-3 text-[#A20131]" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-sm font-bold text-[#FDFDFD] mb-0.5">
                {marketplaceStats.totalListings}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                For sale
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Principal: NFT à esquerda, Traits e Compra à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_35%] gap-6 lg:gap-8 mb-6 lg:mb-8 justify-center">
          {/* NFT Image - mesma largura que Traits */}
          <div className="space-y-4">
            <Card className="cyber-card w-full">
              <CardContent className="p-2 lg:p-3">
                <div className="h-[600px] relative rounded-lg overflow-hidden bg-[#14101e] border border-[#FDFDFD]/10 w-[90%] mx-auto">
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
                        <ImageIcon className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-3" />
                        <p className="text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* NFT Info - Organizado e compacto */}
                <div className="mt-3 lg:mt-4 px-2">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-[#A20131] border-[#A20131] text-xs">
                      {displayData.collection}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1">
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[#FDFDFD]/70 hover:text-[#FDFDFD] p-1">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <h1 className="text-base lg:text-lg font-bold text-[#FDFDFD] mb-2 text-center">
                    {displayData.name}
                  </h1>
                  
                  {displayData.description && (
                    <p className="text-[#FDFDFD]/70 text-xs text-center leading-relaxed">
                      {displayData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price History Chart - 20% menor na largura */}
            <Card className="cyber-card w-[80%] mx-auto lg:w-full">
              <CardHeader className="p-3 lg:p-4 pb-2">
                <CardTitle className="text-[#FDFDFD] flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 mr-2 text-[#A20131]" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 lg:p-4 pt-0">
                {priceHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs lg:text-sm text-[#FDFDFD]/50">
                        {priceHistory.length > 1 && (
                          <span className="flex items-center">
                            {priceHistory[priceHistory.length - 1].price > priceHistory[0].price ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                <span className="text-green-500">+{(((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100).toFixed(1)}%</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                                <span className="text-red-500">{(((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100).toFixed(1)}%</span>
                              </>
                            )}
                            <span className="ml-1">vs first sale</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs lg:text-sm text-[#FDFDFD]/50">
                        Last 30 days
                      </div>
                    </div>
                    <ChartContainer config={chartConfig} className="h-[120px] lg:h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <defs>
                            <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#A20131"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor="#A20131"
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#FDFDFD', fontSize: 10 }}
                            tickMargin={8}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#FDFDFD', fontSize: 10 }}
                            tickMargin={8}
                            tickFormatter={(value) => `${value}`}
                          />
                          <ChartTooltip 
                            cursor={{ stroke: '#A20131', strokeWidth: 1, strokeOpacity: 0.5 }}
                            content={<ChartTooltipContent 
                              formatter={(value: any) => [`${parseFloat(value).toFixed(4)} CHZ`, 'Price']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#A20131"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#fillPrice)"
                            dot={{ fill: '#A20131', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 4, fill: '#A20131', strokeWidth: 2, stroke: '#FDFDFD' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="h-[140px] flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-[#FDFDFD]/30 mb-3" />
                      <p className="text-[#FDFDFD]/50">No price history available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Traits e Purchase Section - Containers 20% menores na largura */}
          <div className="space-y-4 lg:space-y-6 w-[80%] mx-auto lg:w-full">
            {/* Purchase Section - 20% menor */}
            <Card className="cyber-card">
              <CardHeader className="p-2 lg:p-3 pb-1">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-[#FDFDFD] text-xs">
                      {displayData.isListed ? 'Listed Price' : displayData.isAuction ? 'Auction Price' : 'Last Sale'}
                    </CardTitle>
                    <div className="text-lg lg:text-xl font-bold text-[#FDFDFD] mt-1">
                      {displayData.price} {displayData.currency}
                    </div>
                    <p className="text-[#FDFDFD]/50 text-xs">
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
              <CardContent className="p-2 lg:p-3 pt-0">
                {account ? (
                  displayData.isListed || displayData.isAuction ? (
                    <Button 
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white font-medium py-1.5"
                      size="sm"
                    >
                      <ShoppingBag className="h-3 w-3 mr-2" />
                      {displayData.isAuction ? 'Place Bid' : 'Buy Now'}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-[#FDFDFD]/10 text-[#FDFDFD] font-medium py-1.5 cursor-not-allowed border-[#FDFDFD]/20"
                      size="sm"
                      disabled
                    >
                      Not for Sale
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white font-medium py-1.5"
                    size="sm"
                  >
                    <Wallet className="h-3 w-3 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                
                {account && (displayData.isListed || displayData.isAuction) && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <Button variant="outline" className="cyber-border text-[#FDFDFD] text-xs py-1">
                      <Gavel className="h-3 w-3 mr-1" />
                      Offer
                    </Button>
                    <Button variant="outline" className="cyber-border text-[#FDFDFD] text-xs py-1">
                      <Activity className="h-3 w-3 mr-1" />
                      Bids
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traits Section - 20% menor */}
            <Card className="cyber-card">
              <CardHeader className="p-2 lg:p-3 pb-1">
                <CardTitle className="text-[#FDFDFD] flex items-center text-xs">
                  <Tag className="h-3 w-3 mr-2 text-[#A20131]" />
                  Traits ({displayData.traits?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0">
                {displayData.traits && displayData.traits.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-1">
                      {displayData.traits.map((trait, index) => (
                        <div key={index} className="p-1.5 rounded bg-[#14101e] border border-[#FDFDFD]/10">
                          <div className="text-xs text-[#FDFDFD]/50 uppercase tracking-wider">
                            {trait.trait_type}
                          </div>
                          <div className="text-xs font-medium text-[#FDFDFD] mt-0.5">
                            {trait.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Tag className="h-5 w-5 mx-auto text-[#FDFDFD]/30 mb-2" />
                      <p className="text-[#FDFDFD]/50 text-xs">No traits available</p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Details Section - 20% menor */}
            <Card className="cyber-card">
              <CardHeader className="p-2 lg:p-3 pb-1">
                <CardTitle className="text-[#FDFDFD] text-xs">Details</CardTitle>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#FDFDFD]/70 text-xs">Token ID</span>
                  <span className="text-[#FDFDFD] font-mono text-xs">#{displayData.tokenId}</span>
                </div>
                <Separator className="bg-[#FDFDFD]/10" />
                
                <div className="flex justify-between items-center">
                  <span className="text-[#FDFDFD]/70 text-xs">Collection</span>
                  <span className="text-[#FDFDFD] capitalize text-xs">{displayData.collection}</span>
                </div>
                <Separator className="bg-[#FDFDFD]/10" />
                
                {displayData.creator && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[#FDFDFD]/70 text-xs">Creator</span>
                      <span className="text-[#FDFDFD] font-mono text-xs">
                        {displayData.creator.slice(0, 6)}...{displayData.creator.slice(-4)}
                      </span>
                    </div>
                    <Separator className="bg-[#FDFDFD]/10" />
                  </>
                )}
                
                {displayData.owner && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#FDFDFD]/70 text-xs">Owner</span>
                    <span className="text-[#FDFDFD] font-mono text-xs">
                      {displayData.owner.slice(0, 6)}...{displayData.owner.slice(-4)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity/Sales History - 40% menor - 20% menor na largura */}
        <Card className="cyber-card w-[80%] mx-auto lg:w-full">
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-[#FDFDFD] flex items-center text-xs">
              <Activity className="h-3 w-3 mr-1 text-[#A20131]" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            {activityData.length > 0 ? (
              <div className="space-y-1">
                {activityData.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 rounded bg-[#14101e] border border-[#FDFDFD]/10">
                    <div className="flex items-center space-x-1.5">
                      <div className="p-0.5 rounded bg-[#A20131]/20">
                        {activity.type === 'sale' && <ShoppingBag className="h-2.5 w-2.5 text-[#A20131]" />}
                        {activity.type === 'listing' && <Tag className="h-2.5 w-2.5 text-[#A20131]" />}
                        {activity.type === 'bid' && <TrendingUp className="h-2.5 w-2.5 text-[#A20131]" />}
                        {activity.type === 'transfer' && <ArrowRight className="h-2.5 w-2.5 text-[#A20131]" />}
                        {activity.type === 'mint' && <Sparkles className="h-2.5 w-2.5 text-[#A20131]" />}
                      </div>
                      <div>
                        <div className="text-[#FDFDFD] font-medium capitalize text-xs">
                          {activity.type === 'mint' ? 'Minted' : 
                           activity.type === 'listing' ? 'Listed' :
                           activity.type === 'bid' ? 'Bid Placed' :
                           activity.type === 'transfer' ? 'Transferred' : 'Sale'}
                        </div>
                        <div className="text-[#FDFDFD]/50 text-xs">{activity.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.price && (
                        <div className="text-[#FDFDFD] font-bold text-xs">{activity.price}</div>
                      )}
                      {activity.from && activity.to && (
                        <div className="text-[#FDFDFD]/50 text-xs">
                          {activity.from.slice(0, 4)}...{activity.from.slice(-2)} 
                          <ArrowRight className="h-2 w-2 inline mx-1" />
                          {activity.to.slice(0, 4)}...{activity.to.slice(-2)}
                        </div>
                      )}
                      {activity.to && !activity.from && (
                        <div className="text-[#FDFDFD]/50 text-xs">
                          to {activity.to.slice(0, 4)}...{activity.to.slice(-2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {activityData.length > 4 && (
                  <div className="text-center pt-1">
                    <Button variant="ghost" size="sm" className="text-[#A20131] hover:text-[#A20131]/80 p-1">
                      <span className="text-xs">View All</span>
                      <ArrowRight className="ml-1 h-2.5 w-2.5" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-6 w-6 mx-auto text-[#FDFDFD]/30 mb-2" />
                <p className="text-[#FDFDFD]/50 text-xs">No activity yet</p>
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