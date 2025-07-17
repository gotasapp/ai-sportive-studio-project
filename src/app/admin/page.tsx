'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
  Image,
  Database,
  Trophy,
  Clock,
  RefreshCw,
  Eye,
  Loader2,
  BarChart3,
  PieChart,
  Monitor
} from 'lucide-react'

// Importar componentes premium
import { MetricsGrid, ProgressMetric, ComparisonMetric } from '@/components/admin/AdminMetrics'
import { AdminEnhancedCard, GlassMetricsCard } from '@/components/admin/AdminEnhancedCard'
import { AdminDashboardLoadingSkeleton, useLoadingState } from '@/components/admin/AdminLoadingStates'
import AdminChart from '@/components/admin/AdminChart'
import { ContractRoleChecker } from '@/components/debug/ContractRoleChecker'

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

// Dados fallback otimizados
// Remover FALLBACK_OVERVIEW e FALLBACK_TEAMS

// Chart data interfaces
interface ChartData {
  monthlyNFTs: Array<{ name: string; value: number }>;
  teamDistribution: Array<{ name: string; value: number }>;
  userGrowth: Array<{ name: string; value: number }>;
}



export default function AdminDashboard() {
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());
  
  // Estados para dados reais
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [popularTeamsData, setPopularTeamsData] = useState<PopularTeam[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<RecentSale[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    monthlyNFTs: [],
    teamDistribution: [],
    userGrowth: []
  });
  const [error, setError] = useState<string | null>(null);
  
  // Estados de loading premium
  const { isLoading: loadingOverview, startLoading: startOverview, stopLoading: stopOverview } = useLoadingState();
  const { isLoading: loadingTeams, startLoading: startTeams, stopLoading: stopTeams } = useLoadingState();
  const { isLoading: loadingSales, startLoading: startSales, stopLoading: stopSales } = useLoadingState();
  const { isLoading: loadingCharts, startLoading: startCharts, stopLoading: stopCharts } = useLoadingState();
  
  // Estados de erro por seção
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  // Loading inicial
  const [initialLoading, setInitialLoading] = useState(true);

  // Funções de fetch individuais com erro por seção
  const fetchOverviewData = useCallback(async () => {
    startOverview();
    setOverviewError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('/api/admin/analytics?metric=overview', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      } else {
        setOverviewData(null);
        setOverviewError('Error fetching overview data.');
      }
    } catch (error) {
      setOverviewData(null);
      setOverviewError('Error fetching overview data.');
    } finally {
      stopOverview();
    }
  }, [startOverview, stopOverview]);

  const fetchPopularTeamsData = useCallback(async () => {
    startTeams();
    setTeamsError(null);
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
      } else {
        setPopularTeamsData([]);
        setTeamsError('Error fetching popular teams data.');
      }
    } catch (error) {
      setPopularTeamsData([]);
      setTeamsError('Error fetching popular teams data.');
    } finally {
      stopTeams();
    }
  }, [startTeams, stopTeams]);

  const fetchRecentSalesData = useCallback(async () => {
    startSales();
    setSalesError(null);
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
      } else {
        setRecentSalesData([]);
        setSalesError('Error fetching recent sales data.');
      }
    } catch (error) {
      setRecentSalesData([]);
      setSalesError('Error fetching recent sales data.');
    } finally {
      stopSales();
    }
  }, [startSales, stopSales]);

  const fetchChartData = useCallback(async () => {
    startCharts();
    setChartError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('/api/admin/analytics?metric=chartData', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      } else {
        setChartData({ monthlyNFTs: [], teamDistribution: [], userGrowth: [] });
        setChartError('Error fetching chart data.');
      }
    } catch (error) {
      setChartData({ monthlyNFTs: [], teamDistribution: [], userGrowth: [] });
      setChartError('Error fetching chart data.');
    } finally {
      stopCharts();
    }
  }, [startCharts, stopCharts]);

  // Chamada robusta: Promise.allSettled
  const fetchAllData = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    await Promise.allSettled([
      fetchOverviewData(),
      fetchPopularTeamsData(),
      fetchRecentSalesData(),
      fetchChartData()
    ]);
    setInitialLoading(false);
  }, [fetchOverviewData, fetchPopularTeamsData, fetchRecentSalesData, fetchChartData]);

  // useEffect inicial usando fetchAllData
  useEffect(() => {
    setInitialLoading(true);
    const minTime = new Promise(resolve => setTimeout(resolve, 1500)); // 1,5 segundos
    Promise.allSettled([
      fetchOverviewData(),
      fetchPopularTeamsData(),
      fetchRecentSalesData(),
      fetchChartData()
    ]).then(() => {
      minTime.then(() => setInitialLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loader global: só some quando todos os fetches terminarem
  useEffect(() => {
    if (
      !loadingOverview &&
      !loadingTeams &&
      !loadingSales &&
      !loadingCharts &&
      chartData !== undefined
    ) {
      setInitialLoading(false);
    }
  }, [loadingOverview, loadingTeams, loadingSales, loadingCharts, chartData]);

  const handleRefresh = () => {
    setRefreshTime(new Date().toLocaleTimeString());
    fetchOverviewData();
    fetchPopularTeamsData();
    fetchRecentSalesData();
    fetchChartData();
  };

  // Configurar métricas principais com informações adicionais
  const mainMetrics = [
    {
      title: 'Total NFTs',
      value: overviewData?.totalNFTs.toLocaleString() || 'N/A',
      description: 'Total NFTs created',
      icon: Image,
      trend: {
        value: overviewData?.growth.nfts || 0,
        isPositive: (overviewData?.growth.nfts || 0) > 0,
        label: 'vs last month'
      },
      additionalInfo: 'Includes jerseys, stadiums and badges generated by the platform'
    },
    {
      title: 'Active Users',
      value: overviewData?.totalUsers.toLocaleString() || 'N/A',
      description: 'Registered users',
      icon: Users,
      trend: {
        value: overviewData?.growth.users || 0,
        isPositive: (overviewData?.growth.users || 0) > 0,
        label: 'vs last month'
      },
      additionalInfo: 'Unique users who logged in in the last 30 days'
    },

    {
      title: 'Success Rate',
      value: `${overviewData?.successRate || 0}%`,
      description: 'Successful generations',
      icon: CheckCircle,
      trend: {
        value: Math.round(((overviewData?.successRate || 0) - 93) * 10) / 10 || 0, // Simulate growth based on current rate
        isPositive: true,
        label: 'vs last month'
      },
      additionalInfo: 'Percentage of NFT generations completed successfully'
    }
  ];

  // Mostrar loading completo na primeira carga
  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A20131] mx-auto"></div>
          <p className="text-white mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Renderização condicional para dados reais
  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!overviewData) {
    return <div className="text-yellow-500 text-center mt-10">No real data found for the admin dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-gray-medium mt-1">
              System control and monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleRefresh}
              disabled={loadingOverview}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loadingOverview ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
              )}
              Refresh
            </Button>
            <Badge variant="secondary" className="text-xs">
              {refreshTime}
            </Badge>
          </div>
        </div>

        {/* Métricas Principais Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainMetrics.map((metric, index) => (
            <AdminEnhancedCard key={index} {...metric} />
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Gráfico de NFTs por Mês */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>NFTs Created per Month</CardTitle>
          
            </CardHeader>
            <CardContent className="p-0 min-h-[250px]">
              {loadingCharts ? (
                <div className="h-56 w-full bg-gray-800 animate-pulse rounded" />
              ) : chartError ? (
                <div className="text-red-400 text-sm">Error loading chart.</div>
              ) : (
                <div className="w-full h-full">
                  <AdminChart
                    data={chartData.monthlyNFTs}
                    type="area"
                    dataKey="value"
                    xKey="name"
                    height={250}
                    title=" "
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição de Times */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Most Popular Teams</CardTitle>
            
            </CardHeader>
            <CardContent className="p-0 min-h-[250px]">
              {loadingCharts ? (
                <div className="h-56 w-full bg-gray-800 animate-pulse rounded" />
              ) : chartError ? (
                <div className="text-red-400 text-sm">Error loading chart.</div>
              ) : (
                <div className="w-full h-full">
                  <AdminChart
                    data={chartData.teamDistribution}
                    type="pie"
                    dataKey="value"
                    xKey="name"
                    height={250}
                    title=" "
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Crescimento de Usuários */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
          
            </CardHeader>
            <CardContent className="p-0 min-h-[250px]">
              {loadingCharts ? (
                <div className="h-56 w-full bg-gray-800 animate-pulse rounded" />
              ) : chartError ? (
                <div className="text-red-400 text-sm">Error loading chart.</div>
              ) : (
                <div className="w-full h-full">
                  <AdminChart
                    data={chartData.userGrowth}
                    type="line"
                    dataKey="value"
                    xKey="name"
                    height={250}
                    title=" "
                  />
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Métricas Detalhadas com Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Métrica de Progresso */}
          <ProgressMetric
            title="Average Generation Time"
            value={overviewData.avgGenerationTime}
            maxValue={15}
            description="Seconds to generate NFT"
            icon={Clock}
          />

          {/* Métrica de Comparação */}
          <ComparisonMetric
            title="NFTs This Month"
            current={chartData.monthlyNFTs.length > 0 ? chartData.monthlyNFTs[chartData.monthlyNFTs.length - 1]?.value || 0 : 67}
            previous={chartData.monthlyNFTs.length > 1 ? chartData.monthlyNFTs[chartData.monthlyNFTs.length - 2]?.value || 0 : 55}
            description="Compared to last month"
            icon={TrendingUp}
          />

          {/* Status do Sistema com Glass Effect */}
          <GlassMetricsCard
            title="System Status"
            value={`${overviewData.successRate}%`}
            description="System operational"
            icon={Monitor}
          />

        </div>

        {/* Times Populares Premium */}
        <AdminEnhancedCard
          title="Most Popular Teams"
          value={`${popularTeamsData.length} teams`}
          description="Distribution of creations by team"
          icon={Trophy}
          additionalInfo="Based on user choices in the last 30 days"
        >
          <div className="space-y-3">
            {popularTeamsData.map((team, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: team.color }} 
                  />
                  <span className="text-sm text-white group-hover:text-gray-light transition-colors">
                    {team.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-light">{team.count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {team.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </AdminEnhancedCard>

        {/* Vendas Recentes */}
        {recentSalesData.length > 0 && (
          <AdminEnhancedCard
            title="Recent Activity"
            value={`${recentSalesData.length} transactions`}
            description="Latest NFT creations"
            icon={Activity}
            additionalInfo="Most recent activity on the platform"
          >
            <div className="space-y-4">
              {recentSalesData.map((sale, index) => (
                <div key={index} className="flex items-center justify-between group hover:bg-gray-800/30 p-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold">
                      {sale.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">
                        {sale.nft.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {sale.user.name} • {sale.nft.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {new Date(sale.timestamp).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminEnhancedCard>
        )}

        {/* Contract Role Checker */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ContractRoleChecker />
        </div>

      </div>
    </div>
  );
} 