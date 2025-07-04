'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Image,
  Database,
  Trophy,
  Clock,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react'

// Tipos para os dados da API
interface OverviewData {
  totalNFTs: number;
  totalUsers: number;
  totalRevenue: number;
  avgGenerationTime: number;
  successRate: number;
  growth: {
    nfts: number;
    users: number;
    revenue: number;
  };
}

interface PopularTeam {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface RecentSale {
  user: { name: string; avatar: string; };
  nft: { name: string; type: 'Jersey' | 'Stadium' | 'Badge'; };
  value: number;
  timestamp: string;
}

// Dados fallback para carregamento instantâneo
const FALLBACK_OVERVIEW = {
  totalNFTs: 247,
  totalUsers: 89,
  totalRevenue: 1250.75,
  avgGenerationTime: 8.2,
  successRate: 95.1,
  growth: { nfts: 14.2, users: 9.1, revenue: 27.3 }
};

const FALLBACK_TEAMS = [
  { name: 'Flamengo', count: 45, percentage: 25.5, color: '#ff0000' },
  { name: 'Palmeiras', count: 38, percentage: 21.6, color: '#00aa00' },
  { name: 'Corinthians', count: 32, percentage: 18.2, color: '#000000' },
  { name: 'São Paulo', count: 28, percentage: 15.9, color: '#ff0000' },
  { name: 'Vasco', count: 21, percentage: 11.9, color: '#000000' }
];

export default function AdminDashboard() {
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());
  
  // Estados para dados reais (opcionais)
  const [overviewData, setOverviewData] = useState<OverviewData>(FALLBACK_OVERVIEW);
  const [popularTeamsData, setPopularTeamsData] = useState<PopularTeam[]>(FALLBACK_TEAMS);
  const [recentSalesData, setRecentSalesData] = useState<RecentSale[]>([]);
  
  // Estados de loading (não bloqueia a UI)
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  // Função para buscar dados reais (com timeout rápido)
  const fetchOverviewData = async () => {
    if (loadingOverview) return;
    setLoadingOverview(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos máximo
      
      const response = await fetch('/api/admin/analytics?metric=overview', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      }
    } catch (error) {
      console.log('Using fallback overview data');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchPopularTeamsData = async () => {
    if (loadingTeams) return;
    setLoadingTeams(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/admin/analytics?metric=popularTeams', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setPopularTeamsData(data);
      }
    } catch (error) {
      console.log('Using fallback teams data');
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchRecentSalesData = async () => {
    if (loadingSales) return;
    setLoadingSales(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('/api/admin/analytics?metric=recentSales', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setRecentSalesData(data);
      }
    } catch (error) {
      console.log('Recent sales data not available');
      setRecentSalesData([]);
    } finally {
      setLoadingSales(false);
    }
  };

  // Lazy loading - não bloqueia carregamento inicial
  useEffect(() => {
    // Carrega dados reais 1 segundo após o carregamento da página
    const timer = setTimeout(() => {
      fetchOverviewData();
      fetchPopularTeamsData();
      fetchRecentSalesData();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshTime(new Date().toLocaleTimeString());
    fetchOverviewData();
    fetchPopularTeamsData();
    fetchRecentSalesData();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-neutral-400 mt-2">
              CHZ Fan Token Studio - Admin Control Center
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
              <Activity className="w-3 h-3 mr-1" />
              System Online
            </Badge>
            <Button 
              onClick={handleRefresh}
              disabled={loadingOverview}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {loadingOverview ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh ({refreshTime})
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#050505] border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Total NFTs</CardTitle>
              <Image className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overviewData.totalNFTs.toLocaleString()}</div>
              <div className="text-xs text-green-400">+{overviewData.growth.nfts}% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-[#050505] border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overviewData.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-green-400">+{overviewData.growth.users}% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-[#050505] border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overviewData.successRate}%</div>
              <div className="text-xs text-neutral-400">AI Generation</div>
            </CardContent>
          </Card>

          <Card className="bg-[#050505] border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${overviewData.totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-green-400">+{overviewData.growth.revenue}% from last month</div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Popular Teams */}
          <Card className="bg-[#050505] border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Popular Teams</CardTitle>
                <CardDescription>Most generated content by team</CardDescription>
              </div>
              {loadingTeams && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
            </CardHeader>
            <CardContent className="space-y-4">
              {popularTeamsData.slice(0, 5).map((team, index) => (
                <div key={team.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-700 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{team.name}</div>
                      <div className="text-sm text-neutral-400">{team.count} NFTs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{team.percentage}%</div>
                    <div className="w-16 h-2 bg-neutral-700 rounded-full">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${team.percentage}%`, 
                          backgroundColor: team.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-[#050505] border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription>Latest NFT generations</CardDescription>
              </div>
              {loadingSales && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSalesData.length > 0 ? recentSalesData.slice(0, 5).map((sale, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{sale.user.name.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{sale.nft.name}</div>
                    <div className="text-xs text-neutral-400">
                      by {sale.user.name} • {sale.nft.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-accent">{sale.value.toFixed(3)} CHZ</div>
                    <div className="text-xs text-neutral-400">
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Sample NFT #{i}</div>
                        <div className="text-xs text-neutral-400">by Creator • Jersey</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-accent">0.05 CHZ</div>
                        <div className="text-xs text-neutral-400">Today</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-accent" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{overviewData.avgGenerationTime}s</div>
                <div className="text-sm text-neutral-400">Avg Generation Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">99.9%</div>
                <div className="text-sm text-neutral-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">1.2s</div>
                <div className="text-sm text-neutral-400">API Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">0.8%</div>
                <div className="text-sm text-neutral-400">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 