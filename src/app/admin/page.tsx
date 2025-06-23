'use client'

import AdminProtection from '@/components/AdminProtection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity,
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Image,
  Database,
  Cpu,
  Wifi
} from 'lucide-react'

// Mock data - in production will come from APIs
const metrics = {
  nftsGenerated: {
    today: 47,
    week: 312,
    month: 1247,
    total: 8934
  },
  users: {
    active: 156,
    new: 23,
    total: 2847
  },
  system: {
    successRate: 94.2,
    avgGenerationTime: 8.4,
    uptime: 99.8,
    apiCalls: 15847
  },
  revenue: {
    today: 1247.89,
    month: 18394.56
  }
}

const recentActivity = [
  { type: 'generation', user: 'user_0x1a2b', item: 'Flamengo Jersey', time: '2 min ago', status: 'success' },
  { type: 'mint', user: 'user_0x3c4d', item: 'Palmeiras Logo', time: '5 min ago', status: 'success' },
  { type: 'generation', user: 'user_0x5e6f', item: 'Stadium Modern', time: '8 min ago', status: 'pending' },
  { type: 'error', user: 'system', item: 'API Rate Limit', time: '12 min ago', status: 'warning' },
  { type: 'mint', user: 'user_0x7g8h', item: 'Vasco Jersey', time: '15 min ago', status: 'success' }
]

const systemAlerts = [
  { type: 'info', message: 'DALL-E API usage at 78% of daily limit', time: '1 hour ago' },
  { type: 'warning', message: 'High generation queue - 23 pending requests', time: '2 hours ago' },
  { type: 'success', message: 'System backup completed successfully', time: '6 hours ago' }
]

export default function AdminDashboard() {
  return (
    <AdminProtection>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-2">Chiliz Fan NFT - Control Center</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            <Activity className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button className="bg-accent hover:bg-accent/90 text-white">
            <Zap className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      <div className="space-y-4">
        {systemAlerts.map((alert, index) => (
          <div key={index} className={`
            border-l-4 bg-[#050505] p-4 rounded-r-lg
            ${alert.type === 'success' ? 'border-green-500' :
              alert.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'}
          `}>
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`h-4 w-4 ${
                alert.type === 'success' ? 'text-green-500' :
                alert.type === 'warning' ? 'text-yellow-500' :
                'text-blue-500'
              }`} />
              <div className="flex items-center justify-between w-full">
                <span className="text-neutral-200">{alert.message}</span>
                <span className="text-xs text-neutral-500">{alert.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* NFTs Generated */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">NFTs Generated</CardTitle>
            <Image className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.nftsGenerated.today}</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>Today: {metrics.nftsGenerated.today}</div>
              <div>This Week: {metrics.nftsGenerated.week}</div>
              <div>This Month: {metrics.nftsGenerated.month}</div>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Active Users</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.users.active}</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>Online Now: {metrics.users.active}</div>
              <div>New Today: {metrics.users.new}</div>
              <div>Total Users: {metrics.users.total}</div>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+8% this week</span>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.system.successRate}%</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>Avg Generation: {metrics.system.avgGenerationTime}s</div>
              <div>System Uptime: {metrics.system.uptime}%</div>
              <div>API Calls: {metrics.system.apiCalls.toLocaleString()}</div>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">Excellent performance</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics.revenue.today}</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>Today: ${metrics.revenue.today}</div>
              <div>This Month: ${metrics.revenue.month}</div>
              <div>Gas Fees Saved: $2,847</div>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+24% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-accent" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Real-time system monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-neutral-300">DALL-E API</span>
              </div>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-neutral-300">IPFS Storage</span>
              </div>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-neutral-300">Thirdweb Engine</span>
              </div>
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-neutral-300">Generation Queue</span>
              </div>
              <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">23 Pending</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#050505] border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-accent" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'warning' ? 'bg-yellow-400' :
                      activity.status === 'pending' ? 'bg-blue-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-neutral-200">{activity.item}</div>
                      <div className="text-xs text-neutral-500">
                        {activity.type} by <span className="font-semibold text-neutral-400">{activity.user}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#050505] border-neutral-800">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2 border-neutral-800 hover:bg-neutral-800">
              <Database className="h-6 w-6 text-accent" />
              <span className="text-xs">Backup System</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-neutral-800 hover:bg-neutral-800">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span className="text-xs">Clear Cache</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-neutral-800 hover:bg-neutral-800">
              <Wifi className="h-6 w-6 text-green-400" />
              <span className="text-xs">Test APIs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-neutral-800 hover:bg-neutral-800">
              <Clock className="h-6 w-6 text-blue-400" />
              <span className="text-xs">Schedule Maintenance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminProtection>
  )
} 