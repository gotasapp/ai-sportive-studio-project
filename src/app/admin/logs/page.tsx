'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, Info, Clock, User, Server
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Tipos de dados da API
interface LogActor {
  type: 'user' | 'system';
  id: string;
  name?: string;
}

interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  actor: LogActor;
  context: Record<string, any>;
}

const levelConfig = {
  info: { icon: Info, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  success: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  error: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data: Log[] = await response.json();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.actor.name && log.actor.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  })

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <div key={`skel-${i}`} className="flex items-start space-x-4 p-4 border-b border-gray-800">
        <div className="w-5 h-5 bg-gray-700 rounded-full animate-pulse mt-1"></div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    ))
  );

  const ActorIcon = ({ type }: { type: 'user' | 'system' }) => {
    const Icon = type === 'user' ? User : Server;
    return <Icon className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">System Logs</h1>
          <p className="text-gray-400 mt-2">View real-time events from across the platform.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button className="cyber-button" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search logs by message or actor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-10" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="cyber-input">
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {loading ? renderSkeleton() : filteredLogs.map(log => {
              const config = levelConfig[log.level];
              const Icon = config.icon;
              return (
                <div key={log.id}>
                  <div 
                    className="flex items-start space-x-4 p-4 cursor-pointer hover:bg-gray-800/50"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <Icon className={`w-5 h-5 ${config.color.split(' ')[1]} mt-1`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-white">{log.message}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{new Date(log.timestamp).toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <Badge className={`${config.color} uppercase`}>{log.level}</Badge>
                        <ActorIcon type={log.actor.type} />
                        <span>{log.actor.name || log.actor.id}</span>
                      </div>
                    </div>
                  </div>
                  {expandedLog === log.id && (
                    <div className="p-4 bg-black/50 border-t border-gray-800">
                      <h4 className="font-semibold text-white mb-2">Context Details</h4>
                      <pre className="text-xs bg-gray-900 p-3 rounded-md text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {error && <p className="p-4 text-red-500">{error}</p>}
          {!loading && filteredLogs.length === 0 && <p className="p-4 text-gray-400">No logs found.</p>}
        </CardContent>
      </Card>
    </div>
  )
} 