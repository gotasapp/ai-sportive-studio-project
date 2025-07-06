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

// Dados para gráficos
const CHART_DATA = {
  monthlyNFTs: [
    { name: 'Jan', value: 45 },
    { name: 'Fev', value: 52 },
    { name: 'Mar', value: 48 },
    { name: 'Abr', value: 61 },
    { name: 'Mai', value: 55 },
    { name: 'Jun', value: 67 }
  ],
  teamDistribution: [
    { name: 'Flamengo', value: 45 },
    { name: 'Palmeiras', value: 38 },
    { name: 'Corinthians', value: 32 },
    { name: 'São Paulo', value: 28 },
    { name: 'Vasco', value: 21 }
  ],
  userGrowth: [
    { name: 'Sem 1', value: 12 },
    { name: 'Sem 2', value: 18 },
    { name: 'Sem 3', value: 15 },
    { name: 'Sem 4', value: 23 },
    { name: 'Sem 5', value: 19 },
    { name: 'Sem 6', value: 31 }
  ]
};

export default function AdminDashboard() {
  const [refreshTime, setRefreshTime] = useState(new Date().toLocaleTimeString());
  
  // Estados para dados reais (opcionais)
  const [overviewData, setOverviewData] = useState<OverviewData>(FALLBACK_OVERVIEW);
  const [popularTeamsData, setPopularTeamsData] = useState<PopularTeam[]>(FALLBACK_TEAMS);
  const [recentSalesData, setRecentSalesData] = useState<RecentSale[]>([]);
  
  // Estados de loading premium
  const { isLoading: loadingOverview, startLoading: startOverview, stopLoading: stopOverview } = useLoadingState();
  const { isLoading: loadingTeams, startLoading: startTeams, stopLoading: stopTeams } = useLoadingState();
  const { isLoading: loadingSales, startLoading: startSales, stopLoading: stopSales } = useLoadingState();
  
  // Loading inicial
  const [initialLoading, setInitialLoading] = useState(true);

  // Função para buscar dados reais (com timeout rápido)
  const fetchOverviewData = async () => {
    startOverview();
    
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
      }
    } catch (error) {
      console.log('Using fallback overview data');
    } finally {
      stopOverview();
    }
  };

  const fetchPopularTeamsData = async () => {
    startTeams();
    
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
      stopTeams();
    }
  };

  const fetchRecentSalesData = async () => {
    startSales();
    
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
      stopSales();
    }
  };

  // Lazy loading - não bloqueia carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
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

  // Configurar métricas principais com informações adicionais
  const mainMetrics = [
    {
      title: 'Total NFTs',
      value: overviewData.totalNFTs.toLocaleString(),
      description: 'NFTs criados no total',
      icon: Image,
      trend: {
        value: overviewData.growth.nfts,
        isPositive: overviewData.growth.nfts > 0,
        label: 'vs mês anterior'
      },
      additionalInfo: 'Inclui jerseys, stadiums e badges gerados pela plataforma'
    },
    {
      title: 'Usuários Ativos',
      value: overviewData.totalUsers.toLocaleString(),
      description: 'Usuários registrados',
      icon: Users,
      trend: {
        value: overviewData.growth.users,
        isPositive: overviewData.growth.users > 0,
        label: 'vs mês anterior'
      },
      additionalInfo: 'Usuários únicos que fizeram login nos últimos 30 dias'
    },
    {
      title: 'Receita Total',
      value: `$${overviewData.totalRevenue.toLocaleString()}`,
      description: 'Receita acumulada',
      icon: DollarSign,
      trend: {
        value: overviewData.growth.revenue,
        isPositive: overviewData.growth.revenue > 0,
        label: 'vs mês anterior'
      },
      additionalInfo: 'Receita bruta de todas as transações na plataforma'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${overviewData.successRate}%`,
      description: 'Gerações bem-sucedidas',
      icon: CheckCircle,
      trend: {
        value: 2.1,
        isPositive: true,
        label: 'vs mês anterior'
      },
      additionalInfo: 'Porcentagem de gerações de NFT concluídas com sucesso'
    }
  ];

  // Mostrar loading completo na primeira carga
  if (initialLoading) {
    return <AdminDashboardLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-gray-medium mt-1">
              Controle e monitoramento do sistema
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
              Atualizar
            </Button>
            <Badge variant="secondary" className="text-xs">
              {refreshTime}
            </Badge>
          </div>
        </div>

        {/* Métricas Principais Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainMetrics.map((metric, index) => (
            <AdminEnhancedCard key={index} {...metric} />
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Gráfico de NFTs por Mês */}
          <AdminChart
            title="NFTs Criados por Mês"
            description="Evolução mensal de criações"
            data={CHART_DATA.monthlyNFTs}
            type="area"
            dataKey="value"
            xKey="name"
            height={250}
          />

          {/* Gráfico de Distribuição de Times */}
          <AdminChart
            title="Times Mais Populares"
            description="Distribuição por preferência"
            data={CHART_DATA.teamDistribution}
            type="pie"
            dataKey="value"
            xKey="name"
            height={250}
          />

          {/* Gráfico de Crescimento de Usuários */}
          <AdminChart
            title="Crescimento de Usuários"
            description="Novos usuários por semana"
            data={CHART_DATA.userGrowth}
            type="line"
            dataKey="value"
            xKey="name"
            height={250}
          />

        </div>

        {/* Métricas Detalhadas com Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Métrica de Progresso */}
          <ProgressMetric
            title="Tempo Médio de Geração"
            value={overviewData.avgGenerationTime}
            maxValue={15}
            description="Segundos para gerar NFT"
            icon={Clock}
          />

          {/* Métrica de Comparação */}
          <ComparisonMetric
            title="NFTs Este Mês"
            current={67}
            previous={55}
            description="Comparado ao mês anterior"
            icon={TrendingUp}
          />

          {/* Status do Sistema com Glass Effect */}
          <GlassMetricsCard
            title="Status do Sistema"
            value="99.9%"
            description="Sistema operacional"
            icon={Monitor}
          />

        </div>

        {/* Times Populares Premium */}
        <AdminEnhancedCard
          title="Times Mais Populares"
          value={`${popularTeamsData.length} times`}
          description="Distribuição de criações por equipe"
          icon={Trophy}
          additionalInfo="Baseado nas escolhas dos usuários nos últimos 30 dias"
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

      </div>
    </div>
  );
} 