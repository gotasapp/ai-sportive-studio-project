'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Shield,
  Eye,
  Check,
  X,
  Flag,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Image,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

// Mock data - em produção virá de APIs
const moderationData = {
  stats: {
    pendingReview: 23,
    approvedToday: 156,
    rejectedToday: 12,
    flaggedContent: 5,
    avgReviewTime: '2.3 min'
  },
  pendingNFTs: [
    {
      id: 1,
      imageUrl: '/api/placeholder/300/400',
      team: 'Flamengo',
      playerName: 'PEDRO',
      playerNumber: '9',
      userId: 'pedro_gamer',
      userEmail: 'pedro@email.com',
      submittedAt: '2024-01-20 14:30',
      priority: 'normal',
      aiConfidence: 0.94,
      flags: ['appropriate_content', 'correct_team_colors'],
      potentialIssues: []
    },
    {
      id: 2,
      imageUrl: '/api/placeholder/300/400',
      team: 'Palmeiras',
      playerName: 'DUDU',
      playerNumber: '7',
      userId: 'maria_palmeiras',
      userEmail: 'maria@email.com',
      submittedAt: '2024-01-20 14:25',
      priority: 'normal',
      aiConfidence: 0.87,
      flags: ['appropriate_content'],
      potentialIssues: ['minor_color_variation']
    },
    {
      id: 3,
      imageUrl: '/api/placeholder/300/400',
      team: 'Corinthians',
      playerName: 'INAPPROPRIATE',
      playerNumber: '69',
      userId: 'suspicious_user',
      userEmail: 'fake@spam.com',
      submittedAt: '2024-01-20 14:20',
      priority: 'high',
      aiConfidence: 0.23,
      flags: ['flagged_content'],
      potentialIssues: ['inappropriate_name', 'suspicious_user_pattern', 'low_quality_prompt']
    }
  ],
  flaggedContent: [
    {
      id: 4,
      type: 'inappropriate_text',
      content: 'Player name: BADWORD123',
      reportedBy: 'system',
      reportedAt: '2024-01-20 13:45',
      status: 'pending',
      severity: 'high'
    },
    {
      id: 5,
      type: 'spam_behavior',
      content: 'User generated 50+ NFTs in 10 minutes',
      reportedBy: 'automated_system',
      reportedAt: '2024-01-20 13:30',
      status: 'pending',
      severity: 'medium'
    }
  ],
  recentDecisions: [
    {
      id: 101,
      team: 'Flamengo',
      player: 'GABIGOL',
      decision: 'approved',
      moderator: 'admin_user',
      reviewedAt: '2024-01-20 14:15',
      reviewTime: '1.2 min'
    },
    {
      id: 102,
      team: 'Santos',
      player: 'PELÉ',
      decision: 'rejected',
      moderator: 'admin_user',
      reviewedAt: '2024-01-20 14:10',
      reviewTime: '3.1 min',
      reason: 'Copyright concerns'
    }
  ]
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  normal: 'bg-green-500/20 text-green-400 border-green-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30'
}

const severityColors = {
  low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function ModerationPage() {
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')

  const handleApprove = (nftId: number) => {
    alert(`Approved NFT ${nftId}`)
  }

  const handleReject = (nftId: number, reason: string) => {
    alert(`Rejected NFT ${nftId} - Reason: ${reason}`)
  }

  const handleFlag = (nftId: number, issue: string) => {
    alert(`Flagged NFT ${nftId} for: ${issue}`)
  }

  const filteredNFTs = moderationData.pendingNFTs.filter(nft => {
    const matchesSearch = nft.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.userId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || nft.priority === filterPriority
    
    return matchesSearch && matchesPriority
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">Content Moderation</h1>
          <p className="text-gray-400 mt-2">Review and moderate NFT generations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Queue
          </Button>
          <Button className="cyber-button">
            <Shield className="w-4 h-4 mr-2" />
            Moderation Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="cyber-card border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{moderationData.stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{moderationData.stats.approvedToday}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">{moderationData.stats.rejectedToday}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Flagged Content</CardTitle>
            <Flag className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">{moderationData.stats.flaggedContent}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Avg Review Time</CardTitle>
            <Eye className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{moderationData.stats.avgReviewTime}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 cyber-card border-cyan-500/30">
          <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500/20">
            Pending Review ({moderationData.stats.pendingReview})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="data-[state=active]:bg-cyan-500/20">
            Flagged Content ({moderationData.stats.flaggedContent})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20">
            Review History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20">
            Auto-Moderation
          </TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-6">
          {/* Filters */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by team, player, or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 cyber-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Review Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredNFTs.map((nft) => (
              <Card key={nft.id} className="cyber-card border-cyan-500/30 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-800 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute top-4 left-4 z-20">
                    <Badge className={priorityColors[nft.priority as keyof typeof priorityColors]}>
                      {nft.priority} priority
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      AI: {Math.round(nft.aiConfidence * 100)}%
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                    <div className="text-lg font-bold">{nft.playerName} #{nft.playerNumber}</div>
                    <div className="text-sm opacity-75">{nft.team}</div>
                  </div>
                  {/* Placeholder for NFT image */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Image className="w-16 h-16 text-gray-600" />
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{nft.userId}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{nft.submittedAt}</span>
                    </div>

                    {/* Flags and Issues */}
                    <div className="space-y-2">
                      {nft.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nft.flags.map((flag, index) => (
                            <Badge key={index} className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              ✓ {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {nft.potentialIssues.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nft.potentialIssues.map((issue, index) => (
                            <Badge key={index} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              ⚠ {issue.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(nft.id)}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReject(nft.id, 'Manual review required')}
                        className="flex-1 border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFlag(nft.id, 'Needs further review')}
                        className="border-yellow-500/30 hover:bg-yellow-500/10"
                      >
                        <Flag className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNFTs.length === 0 && (
            <Card className="cyber-card border-cyan-500/30">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold text-green-300 mb-2">All Clear!</h3>
                <p className="text-gray-400">No NFTs pending review at the moment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Flagged Content Tab */}
        <TabsContent value="flagged" className="space-y-6">
          <Card className="cyber-card border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span>Flagged Content</span>
              </CardTitle>
              <CardDescription>Content flagged by automated systems or users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {moderationData.flaggedContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={severityColors[item.severity as keyof typeof severityColors]}>
                        {item.severity} severity
                      </Badge>
                      <span className="text-sm text-gray-400">Reported by {item.reportedBy}</span>
                    </div>
                    <div className="font-medium mb-1">{item.type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-300">{item.content}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.reportedAt}</div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline" className="border-green-500/30 text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-500/30 text-red-400">
                      <Ban className="w-3 h-3 mr-1" />
                      Take Action
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Recent Moderation Decisions</CardTitle>
              <CardDescription>History of approved and rejected content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {moderationData.recentDecisions.map((decision) => (
                <div key={decision.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      decision.decision === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {decision.decision === 'approved' ? 
                        <Check className="w-4 h-4 text-green-400" /> : 
                        <X className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <div className="font-medium">{decision.team} - {decision.player}</div>
                      <div className="text-sm text-gray-400">
                        {decision.decision === 'approved' ? 'Approved' : 'Rejected'} by {decision.moderator}
                        {decision.reason && ` • ${decision.reason}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>{decision.reviewedAt}</div>
                    <div>Review time: {decision.reviewTime}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Moderation Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Auto-Moderation Settings</CardTitle>
              <CardDescription>Configure automated content filtering and approval thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">AI Confidence Thresholds</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Auto-approve above:</label>
                      <span className="text-cyan-300 font-medium">95%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Manual review below:</label>
                      <span className="text-yellow-300 font-medium">80%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Auto-reject below:</label>
                      <span className="text-red-300 font-medium">30%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-300">Content Filters</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Inappropriate language detection</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Spam pattern detection</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Team color validation</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 