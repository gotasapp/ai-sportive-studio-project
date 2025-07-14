'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Image,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Heart,
  Share2,
  Clock,
  Trophy
} from 'lucide-react'

// Tipos para os dados que virão da API
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
    user: {
        name: string;
        avatar: string;
    };
    nft: {
        name: string;
        type: 'Jersey' | 'Stadium' | 'Badge';
    };
    value: number;
    timestamp: string;
}

const timeRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last year', value: '1y' }
]

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [popularTeamsData, setPopularTeamsData] = useState<PopularTeam[]>([]);
  const [loadingPopularTeams, setLoadingPopularTeams] = useState(true);
  const [recentSalesData, setRecentSalesData] = useState<RecentSale[]>([]);
  const [loadingRecentSales, setLoadingRecentSales] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoadingOverview(true);
      try {
        const response = await fetch(`/api/admin/analytics?metric=overview&timeRange=${selectedTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics overview');
        const data: OverviewData = await response.json();
        setOverviewData(data);
      } catch (error) {
        console.error(error);
        setOverviewData(null);
      } finally {
        setLoadingOverview(false);
      }
    };
    
    const fetchPopularTeamsData = async () => {
        setLoadingPopularTeams(true);
        try {
            const response = await fetch(`/api/admin/analytics?metric=popularTeams&timeRange=${selectedTimeRange}`);
            if (!response.ok) throw new Error('Failed to fetch popular teams');
            const data: PopularTeam[] = await response.json();
            setPopularTeamsData(data);
        } catch (error) {
            console.error(error);
            setPopularTeamsData([]);
        } finally {
            setLoadingPopularTeams(false);
        }
    }

    const fetchRecentSalesData = async () => {
        setLoadingRecentSales(true);
        try {
            const response = await fetch(`/api/admin/analytics?metric=recentSales&timeRange=${selectedTimeRange}`);
            if (!response.ok) throw new Error('Failed to fetch recent sales');
            const data: RecentSale[] = await response.json();
            setRecentSalesData(data);
        } catch (error) {
            console.error(error);
            setRecentSalesData([]);
        } finally {
            setLoadingRecentSales(false);
        }
    }

    fetchOverviewData();
    fetchPopularTeamsData();
    fetchRecentSalesData();
  }, [selectedTimeRange]);

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const handleExport = (type: string) => {
    alert(`Exporting ${type} report...`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Analytics & Insights</h1>
          <p className="text-gray-400 mt-2">Performance metrics and business intelligence</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                onClick={() => setSelectedTimeRange(range.value)}
                variant={selectedTimeRange === range.value ? "default" : "outline"}
                size="sm"
                className={selectedTimeRange === range.value ? "cyber-button" : "border-cyan-500/30"}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-cyan-500/30"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleExport('full')} className="cyber-button">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingOverview || !overviewData ? (
          // Skeletons para os cards
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="cyber-card border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <div className="h-5 w-2/3 bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/2 bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Total NFTs</CardTitle>
                <Trophy className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-300">{overviewData.totalNFTs.toLocaleString()}</div>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{overviewData.growth.nfts}% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle>
                <Users className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-300">{overviewData.totalUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{overviewData.growth.users}% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-300">${overviewData.totalRevenue.toLocaleString()}</div>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+{overviewData.growth.revenue}% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Success Rate</CardTitle>
                <Heart className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-300">{overviewData.successRate}%</div>
                <div className="flex items-center space-x-1 mt-2">
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400">Avg: {overviewData.avgGenerationTime}s</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500/20">
            <Users className="w-4 h-4 mr-2" />
            Popular Teams
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-500/20">
            Performance
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20">
            User Behavior
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-cyan-500/20">
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Popular Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Most Generated Teams</CardTitle>
              <CardDescription>Breakdown of the most popular teams by generation count.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingPopularTeams ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-6 w-6 rounded-full bg-gray-700"></div>
                      <div className="h-6 flex-1 bg-gray-700 rounded"></div>
                    </div>
                  ))
                ) : (
                  popularTeamsData.map((team) => (
                    <div key={team.name} className="flex items-center">
                      <span className="w-1/3 text-gray-300 font-medium">{team.name}</span>
                      <div className="w-2/3 bg-gray-700 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${team.percentage}%`, backgroundColor: team.color }}
                        />
                      </div>
                      <span className="w-16 text-right text-gray-400 text-sm">{team.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>NFT generations and user growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Data will be fetched from API */}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical metrics for system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <div className="text-2xl font-bold text-cyan-300">API Response Time</div>
                    <div className="text-xs text-gray-400">API Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-2xl font-bold text-green-300">System Uptime</div>
                    <div className="text-xs text-gray-400">System Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-2xl font-bold text-red-300">Error Rate</div>
                    <div className="text-xs text-gray-400">Error Rate</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-300">Avg Queue Time</div>
                    <div className="text-xs text-gray-400">Avg Queue Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>How users interact with the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-300">Avg Session Time</div>
                    <div className="text-sm text-gray-400">Avg Session Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-300">Generations per User</div>
                    <div className="text-sm text-gray-400">Generations per User</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300">Return Rate</div>
                    <div className="text-sm text-gray-400">Return Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">Conversion Rate</div>
                    <div className="text-sm text-gray-400">Conversion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download detailed reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExport('teams')} 
                  variant="outline" 
                  className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <img src="/path/to/image.png" alt="Download" className="w-4 h-4 mr-2" />
                  Export Team Analytics
                </Button>
                <Button 
                  onClick={() => handleExport('users')} 
                  variant="outline" 
                  className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <img src="/path/to/image.png" alt="Download" className="w-4 h-4 mr-2" />
                  Export User Report
                </Button>
                <Button 
                  onClick={() => handleExport('performance')} 
                  variant="outline" 
                  className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <img src="/path/to/image.png" alt="Download" className="w-4 h-4 mr-2" />
                  Export Performance Report
                </Button>
                <Button 
                  onClick={() => handleExport('revenue')} 
                  variant="outline" 
                  className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <img src="/path/to/image.png" alt="Download" className="w-4 h-4 mr-2" />
                  Export Revenue Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
              <CardDescription>Real-time system monitoring and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img src="/path/to/image.png" alt="Eye" className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-xl font-bold text-green-300">Excellent</div>
                  <div className="text-sm text-gray-400">Overall Health</div>
                </div>
                <div className="text-center p-6 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img src="/path/to/image.png" alt="Bar Chart" className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-blue-300">Optimal</div>
                  <div className="text-sm text-gray-400">Performance</div>
                </div>
                <div className="text-center p-6 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img src="/path/to/image.png" alt="Share" className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-cyan-300">Stable</div>
                  <div className="text-sm text-gray-400">Connectivity</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Sales */}
      <Card className="cyber-card border-cyan-500/30 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-gray-200">Recent Sales</CardTitle>
          <CardDescription className="text-gray-400">You made 265 sales this month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingRecentSales ? (
            // Skeletons para vendas recentes
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-5 w-1/4 bg-gray-600 rounded animate-pulse"></div>
              </div>
            ))
          ) : (
            recentSalesData.map((sale, index) => (
              <div key={index} className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-medium text-gray-200">{sale.nft.name}</p>
                  <p className="text-xs text-gray-400">{sale.user.name}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-semibold text-cyan-300">${sale.value.toFixed(2)}</p>
                   <p className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
} 