'use client'

import { useState } from 'react'
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

// Mock data - in production will come from APIs
const analyticsData = {
  overview: {
    totalNFTs: 15847,
    totalUsers: 3429,
    totalRevenue: 47892.34,
    avgGenerationTime: 8.4,
    successRate: 94.2,
    growth: {
      nfts: 12.5,
      users: 8.3,
      revenue: 24.7
    }
  },
  popularTeams: [
    { name: 'Flamengo', count: 2847, percentage: 18.2, color: '#ff0000' },
    { name: 'Palmeiras', count: 2156, percentage: 13.8, color: '#00aa00' },
    { name: 'Corinthians', count: 1923, percentage: 12.3, color: '#000000' },
    { name: 'São Paulo', count: 1687, percentage: 10.8, color: '#ff0000' },
    { name: 'Vasco', count: 1234, percentage: 7.9, color: '#000000' },
    { name: 'Santos', count: 1098, percentage: 7.0, color: '#ffffff' },
    { name: 'Grêmio', count: 987, percentage: 6.3, color: '#0066cc' },
    { name: 'Internacional', count: 876, percentage: 5.6, color: '#cc0000' }
  ],
  monthlyData: [
    { month: 'Jan', nfts: 1200, users: 245, revenue: 3420 },
    { month: 'Feb', nfts: 1350, users: 289, revenue: 3890 },
    { month: 'Mar', nfts: 1567, users: 334, revenue: 4567 },
    { month: 'Apr', nfts: 1789, users: 398, revenue: 5234 },
    { month: 'May', nfts: 2134, users: 445, revenue: 6789 },
    { month: 'Jun', nfts: 2456, users: 512, revenue: 7892 }
  ],
  topGenerations: [
    { id: 1, team: 'Flamengo', player: 'PEDRO', number: '9', generations: 456, success: 98.2 },
    { id: 2, team: 'Palmeiras', player: 'DUDU', number: '7', generations: 389, success: 96.7 },
    { id: 3, team: 'Corinthians', player: 'CÁSSIO', number: '12', generations: 334, success: 94.8 },
    { id: 4, team: 'São Paulo', player: 'CALLERI', number: '9', generations: 298, success: 97.1 },
    { id: 5, team: 'Vasco', player: 'VEGETTI', number: '99', generations: 267, success: 95.5 }
  ],
  userBehavior: {
    avgSessionTime: '12m 34s',
    avgGenerationsPerUser: 4.7,
    returnRate: 68.3,
    conversionRate: 23.8
  },
  systemPerformance: {
    apiResponseTime: 1.2,
    errorRate: 0.8,
    uptime: 99.97,
    queueTime: 3.4
  }
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
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total NFTs</CardTitle>
            <img src="/path/to/image.png" alt="Total NFTs" className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{analyticsData.overview.totalNFTs.toLocaleString()}</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+{analyticsData.overview.growth.nfts}% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle>
            <img src="/path/to/image.png" alt="Active Users" className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{analyticsData.overview.totalUsers.toLocaleString()}</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+{analyticsData.overview.growth.users}% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Revenue</CardTitle>
            <img src="/path/to/image.png" alt="Revenue" className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">${analyticsData.overview.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+{analyticsData.overview.growth.revenue}% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Success Rate</CardTitle>
            <img src="/path/to/image.png" alt="Success Rate" className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{analyticsData.overview.successRate}%</div>
            <div className="flex items-center space-x-1 mt-2">
              <img src="/path/to/image.png" alt="Clock" className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">Avg: {analyticsData.overview.avgGenerationTime}s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="teams" className="data-[state=active]:bg-cyan-500/20">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Rankings */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <img src="/path/to/image.png" alt="Trophy" className="h-5 w-5 text-cyan-400" />
                  <span>Team Popularity Ranking</span>
                </CardTitle>
                <CardDescription>Most generated teams in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.popularTeams.map((team, index) => (
                  <div key={team.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-600"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-cyan-300">{team.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{team.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Generations */}
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <img src="/path/to/image.png" alt="Heart" className="h-5 w-5 text-cyan-400" />
                  <span>Top Generations</span>
                </CardTitle>
                <CardDescription>Most popular player/number combinations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.topGenerations.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-sm font-bold text-cyan-400">#{gen.number}</div>
                        <div className="text-xs text-gray-500">{gen.team}</div>
                      </div>
                      <div>
                        <div className="font-medium">{gen.player}</div>
                        <div className="text-xs text-gray-400">{gen.generations} generations</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {gen.success}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
                  {analyticsData.monthlyData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <div className="font-medium">{data.month}</div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-cyan-400">{data.nfts} NFTs</div>
                        <div className="text-green-400">{data.users} Users</div>
                        <div className="text-yellow-400">${data.revenue}</div>
                      </div>
                    </div>
                  ))}
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
                    <div className="text-2xl font-bold text-cyan-300">{analyticsData.systemPerformance.apiResponseTime}s</div>
                    <div className="text-xs text-gray-400">API Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-2xl font-bold text-green-300">{analyticsData.systemPerformance.uptime}%</div>
                    <div className="text-xs text-gray-400">System Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-2xl font-bold text-red-300">{analyticsData.systemPerformance.errorRate}%</div>
                    <div className="text-xs text-gray-400">Error Rate</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-300">{analyticsData.systemPerformance.queueTime}s</div>
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
                    <div className="text-2xl font-bold text-cyan-300">{analyticsData.userBehavior.avgSessionTime}</div>
                    <div className="text-sm text-gray-400">Avg Session Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-300">{analyticsData.userBehavior.avgGenerationsPerUser}</div>
                    <div className="text-sm text-gray-400">Generations per User</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300">{analyticsData.userBehavior.returnRate}%</div>
                    <div className="text-sm text-gray-400">Return Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">{analyticsData.userBehavior.conversionRate}%</div>
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
    </div>
  )
} 