'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Tag, 
  Gavel, 
  HandHeart,
  Wallet,
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface DashboardStats {
  totalEarnings: string;
  totalSpent: string;
  itemsOwned: number;
  itemsListed: number;
  activeOffers: number;
  activeBids: number;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'offer' | 'bid' | 'listing';
  nftName: string;
  nftImage: string;
  price: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  transactionHash: string;
}

interface UserNFT {
  id: string;
  name: string;
  imageUrl: string;
  collection: string;
  category: string;
  isListed: boolean;
  listingPrice?: string;
  lastSalePrice?: string;
  views: number;
  offers: number;
}

export default function MarketplaceDashboard() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      loadDashboardData();
    }
  }, [account]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // TODO: Implementar chamadas reais para APIs
      // Mock data para demonstração
      const mockStats: DashboardStats = {
        totalEarnings: '2.4 CHZ',
        totalSpent: '1.8 CHZ',
        itemsOwned: 12,
        itemsListed: 3,
        activeOffers: 2,
        activeBids: 1,
      };

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'sell',
          nftName: 'Flamengo Jersey #123',
          nftImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
          price: '0.5 CHZ',
          date: '2024-01-20',
          status: 'completed',
          transactionHash: '0x1234...5678',
        },
        {
          id: '2',
          type: 'buy',
          nftName: 'Allianz Arena Stadium',
          nftImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636633/bafybeigiluwv7wjg3rmwwnjfjndvbiy7vkusihwyvjd3iz3yzudl4kfhia_dmsrtn.png',
          price: '0.3 CHZ',
          date: '2024-01-18',
          status: 'completed',
          transactionHash: '0x5678...1234',
        },
        {
          id: '3',
          type: 'offer',
          nftName: 'Badge Conquista #45',
          nftImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
          price: '0.1 CHZ',
          date: '2024-01-17',
          status: 'pending',
          transactionHash: '0x9876...4321',
        },
      ];

      const mockUserNFTs: UserNFT[] = [
        {
          id: '1',
          name: 'Corinthians Jersey #10',
          imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
          collection: 'Jersey Collection',
          category: 'jersey',
          isListed: true,
          listingPrice: '0.2 CHZ',
          views: 45,
          offers: 2,
        },
        {
          id: '2',
          name: 'Allianz Arena',
          imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636633/bafybeigiluwv7wjg3rmwwnjfjndvbiy7vkusihwyvjd3iz3yzudl4kfhia_dmsrtn.png',
          collection: 'Stadium Collection',
          category: 'stadium',
          isListed: false,
          lastSalePrice: '0.3 CHZ',
          views: 89,
          offers: 0,
        },
      ];

      setStats(mockStats);
      setTransactions(mockTransactions);
      setUserNFTs(mockUserNFTs);
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
              case 'buy': return <ShoppingBag className="h-4 w-4 text-[#FDFDFD]" />;
        case 'sell': return <TrendingUp className="h-4 w-4 text-[#FDFDFD]" />;
        case 'listing': return <Tag className="h-4 w-4 text-[#FDFDFD]" />;
        case 'bid': return <Gavel className="h-4 w-4 text-[#FDFDFD]" />;
        case 'offer': return <HandHeart className="h-4 w-4 text-[#FDFDFD]" />;
        default: return <Wallet className="h-4 w-4 text-[#FDFDFD]" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Wallet className="h-16 w-16 text-[#FDFDFD]/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#FDFDFD] mb-2">Connect Your Wallet</h1>
            <p className="text-[#FDFDFD]/70">To access your dashboard, please connect your wallet first.</p>
            <div className="mt-6">
              <w3m-button />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-[#FF0052] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FDFDFD] mb-2">My Dashboard</h1>
          <p className="text-[#FDFDFD]/70">Manage your NFTs and marketplace activities</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#FDFDFD]/70">Total Earnings</CardTitle>
                                  <TrendingUp className="h-4 w-4 text-[#FF0052]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#FDFDFD]">{stats.totalEarnings}</div>
                <p className="text-xs text-[#FDFDFD]/50">From all sales</p>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#FDFDFD]/70">Total Spent</CardTitle>
                                  <TrendingDown className="h-4 w-4 text-[#FF0052]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#FDFDFD]">{stats.totalSpent}</div>
                <p className="text-xs text-[#FDFDFD]/50">On all purchases</p>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#FDFDFD]/70">Owned NFTs</CardTitle>
                <Wallet className="h-4 w-4 text-[#FF0052]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#FF0052]">{stats.itemsOwned}</div>
                <p className="text-xs text-[#FDFDFD]/50">{stats.itemsListed} listed</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="nfts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#333333]/20">
            <TabsTrigger value="nfts" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              My NFTs
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              Activity
            </TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              Offers
            </TabsTrigger>
            <TabsTrigger value="bids" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              Bids
            </TabsTrigger>
          </TabsList>

          {/* My NFTs */}
          <TabsContent value="nfts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.map((nft) => (
                <Card key={nft.id} className="cyber-card overflow-hidden">
                  <div className="relative aspect-square">
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                    {nft.isListed && (
                      <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400">
                        Listed
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#FDFDFD] mb-1">{nft.name}</h3>
                    <p className="text-sm text-[#FDFDFD]/70 mb-3">{nft.collection}</p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-[#FDFDFD]/50">
                          {nft.isListed ? 'Price' : 'Last Sale'}
                        </p>
                        <p className="text-sm font-medium text-[#FF0052]">
                          {nft.isListed ? nft.listingPrice : nft.lastSalePrice}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3 text-xs text-[#FDFDFD]/50">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{nft.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HandHeart className="h-3 w-3" />
                            <span>{nft.offers}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-[#FF0052] hover:bg-[#FF0052]/90">
                        {nft.isListed ? 'Edit' : 'List'}
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#FDFDFD]/20">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-[#FDFDFD]">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center space-x-4 p-4 bg-[#333333]/20 rounded-lg">
                      <img
                        src={transaction.nftImage}
                        alt={transaction.nftName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTransactionIcon(transaction.type)}
                          <p className="font-medium text-[#FDFDFD] truncate">
                            {transaction.nftName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                          <span className="text-xs text-[#FDFDFD]/50">
                            {new Date(transaction.date).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#FF0052]">{transaction.price}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#FDFDFD]/50">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers */}
          <TabsContent value="offers" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-[#FDFDFD]">Active Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[#FDFDFD]/50">
                  <HandHeart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active offers at the moment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids */}
          <TabsContent value="bids" className="space-y-4">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-[#FDFDFD]">Active Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-[#FDFDFD]/50">
                  <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active bids at the moment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 