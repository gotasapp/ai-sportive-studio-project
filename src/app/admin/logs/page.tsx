'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  User,
  Activity,
  Database,
  Shield,
  Zap,
  Eye,
  Calendar,
  Settings,
  Trash2,
  BarChart3
} from 'lucide-react'

// Mock data - em produção virá de APIs
const logsData = {
  stats: {
    totalLogs: 12847,
    errorsToday: 23,
    warningsToday: 156,
    infoToday: 2847,
    avgResponseTime: 1.2,
    lastError: '2024-01-20 14:30:15'
  },
  logs: [
    {
      id: 1,
      timestamp: '2024-01-20 14:30:15',
      level: 'error',
      category: 'api',
      message: 'OpenAI API rate limit exceeded',
      source: 'dalle-service.ts:45',
      userId: 'pedro_gamer',
      requestId: 'req_abc123',
      metadata: {
        endpoint: '/api/generate',
        statusCode: 429,
        responseTime: 5000,
        userAgent: 'Mozilla/5.0...'
      }
    },
    {
      id: 2,
      timestamp: '2024-01-20 14:29:45',
      level: 'info',
      category: 'mint',
      message: 'NFT minted successfully',
      source: 'engine-service.ts:123',
      userId: 'maria_flamengo',
      requestId: 'req_def456',
      metadata: {
        tokenId: '156',
        contractAddress: '0x7822698cE3728Ccd54e36E60c413a70b665A1407',
        transactionHash: '0x868e6aef580de310264519d2e11b5044a803f96bf6d76a058694ab69cf2f765c',
        gasUsed: 125000
      }
    },
    {
      id: 3,
      timestamp: '2024-01-20 14:28:30',
      level: 'warning',
      category: 'auth',
      message: 'Multiple failed login attempts detected',
      source: 'auth-middleware.ts:67',
      userId: 'suspicious_user',
      requestId: 'req_ghi789',
      metadata: {
        attempts: 5,
        ipAddress: '192.168.1.100',
        userAgent: 'curl/7.68.0'
      }
    },
    {
      id: 4,
      timestamp: '2024-01-20 14:27:12',
      level: 'info',
      category: 'system',
      message: 'Database connection pool initialized',
      source: 'database.ts:12',
      userId: null,
      requestId: null,
      metadata: {
        poolSize: 10,
        maxConnections: 100,
        timeout: 30000
      }
    },
    {
      id: 5,
      timestamp: '2024-01-20 14:26:45',
      level: 'debug',
      category: 'api',
      message: 'Processing image generation request',
      source: 'dalle-service.ts:78',
      userId: 'carlos_santos',
      requestId: 'req_jkl012',
      metadata: {
        prompt: 'Flamengo jersey with PEDRO 9',
        model: 'dall-e-3',
        quality: 'hd',
        size: '1024x1024'
      }
    }
  ],
  auditLogs: [
    {
      id: 1,
      timestamp: '2024-01-20 14:25:30',
      action: 'user_created',
      actor: 'admin_user',
      target: 'pedro_gamer',
      details: 'New user account created',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0...'
    },
    {
      id: 2,
      timestamp: '2024-01-20 14:20:15',
      action: 'settings_updated',
      actor: 'admin_user',
      target: 'system_settings',
      details: 'Updated OpenAI API key',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0...'
    },
    {
      id: 3,
      timestamp: '2024-01-20 14:15:45',
      action: 'user_banned',
      actor: 'moderator_user',
      target: 'spam_user_001',
      details: 'User banned for inappropriate content',
      ipAddress: '192.168.1.75',
      userAgent: 'Mozilla/5.0...'
    }
  ]
}

const levelColors = {
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  debug: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const levelIcons = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  debug: Settings
}

const categoryColors = {
  api: 'bg-green-500/20 text-green-400 border-green-500/30',
  mint: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  auth: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  system: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const filteredLogs = logsData.logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  const handleExportLogs = () => {
    alert('Exporting logs...')
  }

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear old logs? This action cannot be undone.')) {
      alert('Logs cleared successfully')
    }
  }

  const toggleLogExpansion = (logId: number) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">System Logs</h1>
          <p className="text-gray-400 mt-2">Monitor system activity and audit trails</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleExportLogs} className="border-cyan-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={handleClearLogs} className="border-red-500/30 text-red-400">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Old Logs
          </Button>
          <Button className="cyber-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{logsData.stats.totalLogs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Errors Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">{logsData.stats.errorsToday}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Warnings Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{logsData.stats.warningsToday}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Info Today</CardTitle>
            <Info className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">{logsData.stats.infoToday}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{logsData.stats.avgResponseTime}s</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="system" className="data-[state=active]:bg-cyan-500/20">
            System Logs
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-cyan-500/20">
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500/20">
            Log Analytics
          </TabsTrigger>
        </TabsList>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* Filters */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs by message, source, or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 cyber-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="api">API</option>
                    <option value="mint">Mint</option>
                    <option value="auth">Auth</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredLogs.map((log) => {
                  const LevelIcon = levelIcons[log.level as keyof typeof levelIcons]
                  const isExpanded = expandedLog === log.id
                  
                  return (
                    <div key={log.id} className="border-b border-gray-800 last:border-0">
                      <div 
                        className="p-4 hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center space-x-2 mt-1">
                              <LevelIcon className="w-4 h-4" />
                              <Badge className={levelColors[log.level as keyof typeof levelColors]}>
                                {log.level}
                              </Badge>
                              <Badge className={categoryColors[log.category as keyof typeof categoryColors]}>
                                {log.category}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-200 mb-1">{log.message}</div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{log.timestamp}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{log.source}</span>
                                </div>
                                {log.userId && (
                                  <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{log.userId}</span>
                                  </div>
                                )}
                                {log.requestId && (
                                  <div className="flex items-center space-x-1">
                                    <Activity className="w-3 h-3" />
                                    <span>{log.requestId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                            <h4 className="font-semibold text-cyan-300 mb-3">Log Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium text-gray-300 mb-2">Basic Information</h5>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-gray-400">Timestamp:</span> {log.timestamp}</div>
                                  <div><span className="text-gray-400">Level:</span> {log.level}</div>
                                  <div><span className="text-gray-400">Category:</span> {log.category}</div>
                                  <div><span className="text-gray-400">Source:</span> {log.source}</div>
                                  {log.userId && <div><span className="text-gray-400">User:</span> {log.userId}</div>}
                                  {log.requestId && <div><span className="text-gray-400">Request ID:</span> {log.requestId}</div>}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-300 mb-2">Metadata</h5>
                                <div className="bg-gray-900 p-3 rounded text-xs font-mono">
                                  <pre className="text-gray-300 whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <span>Audit Trail</span>
              </CardTitle>
              <CardDescription>Track administrative actions and user activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logsData.auditLogs.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium text-cyan-300">{audit.action.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-gray-400">{audit.details}</div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Actor: {audit.actor}</span>
                        <span>Target: {audit.target}</span>
                        <span>IP: {audit.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>{audit.timestamp}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>Error frequency over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>Error trend chart would be displayed here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyan-500/30">
              <CardHeader>
                <CardTitle>Top Error Sources</CardTitle>
                <CardDescription>Most common error origins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">dalle-service.ts</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">12 errors</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">engine-service.ts</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">8 errors</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">auth-middleware.ts</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">3 errors</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 