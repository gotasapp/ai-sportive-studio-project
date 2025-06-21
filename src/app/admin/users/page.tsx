'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Ban,
  Mail,
  Calendar,
  Activity,
  Crown,
  Shield,
  AlertTriangle,
  Download,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react'

// Mock data - in production will come from APIs
const usersData = {
  stats: {
    totalUsers: 3429,
    activeUsers: 2847,
    newUsers: 156,
    bannedUsers: 23,
    premiumUsers: 89
  },
  users: [
    {
      id: 1,
      username: 'pedro_gamer',
      email: 'pedro@email.com',
      walletAddress: '0x1234...5678',
      joinDate: '2024-01-15',
      lastActive: '2024-01-20',
      nftsGenerated: 47,
      status: 'active',
      tier: 'premium',
      totalSpent: 234.56,
      country: 'Brazil',
      avatar: '🔥'
    },
    {
      id: 2,
      username: 'maria_flamengo',
      email: 'maria@email.com',
      walletAddress: '0xabcd...efgh',
      joinDate: '2024-01-10',
      lastActive: '2024-01-19',
      nftsGenerated: 23,
      status: 'active',
      tier: 'free',
      totalSpent: 45.30,
      country: 'Brazil',
      avatar: '⚽'
    },
    {
      id: 3,
      username: 'carlos_santos',
      email: 'carlos@email.com',
      walletAddress: '0x9876...5432',
      joinDate: '2024-01-08',
      lastActive: '2024-01-18',
      nftsGenerated: 89,
      status: 'inactive',
      tier: 'premium',
      totalSpent: 567.89,
      country: 'Brazil',
      avatar: '🏆'
    },
    {
      id: 4,
      username: 'ana_palmeiras',
      email: 'ana@email.com',
      walletAddress: '0xfedc...ba98',
      joinDate: '2024-01-12',
      lastActive: '2024-01-20',
      nftsGenerated: 12,
      status: 'active',
      tier: 'free',
      totalSpent: 12.50,
      country: 'Brazil',
      avatar: '🌟'
    },
    {
      id: 5,
      username: 'spam_user_001',
      email: 'spam@fake.com',
      walletAddress: '0x0000...0000',
      joinDate: '2024-01-18',
      lastActive: '2024-01-18',
      nftsGenerated: 0,
      status: 'banned',
      tier: 'free',
      totalSpent: 0,
      country: 'Unknown',
      avatar: '❌'
    }
  ],
  recentActivity: [
    { user: 'pedro_gamer', action: 'Generated NFT', team: 'Flamengo', time: '5 min ago' },
    { user: 'maria_flamengo', action: 'Joined platform', team: null, time: '12 min ago' },
    { user: 'carlos_santos', action: 'Upgraded to Premium', team: null, time: '1 hour ago' },
    { user: 'ana_palmeiras', action: 'Generated NFT', team: 'Palmeiras', time: '2 hours ago' }
  ]
}

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  banned: 'bg-red-500/20 text-red-400 border-red-500/30'
}

const tierColors = {
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  const filteredUsers = usersData.users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    const matchesTier = filterTier === 'all' || user.tier === filterTier
    
    return matchesSearch && matchesStatus && matchesTier
  })

  const handleUserAction = (userId: number, action: string) => {
    alert(`${action} user ${userId}`)
  }

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedUsers.length} selected users`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text">User Management</h1>
          <p className="text-gray-400 mt-2">Manage users, permissions and activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export Users
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
            <CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">{usersData.stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{usersData.stats.activeUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">New Users</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">{usersData.stats.newUsers}</div>
            <div className="text-xs text-gray-400">This month</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">{usersData.stats.premiumUsers}</div>
          </CardContent>
        </Card>

        <Card className="cyber-card border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">{usersData.stats.bannedUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20">
            All Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500/20">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-cyan-500/20">
            Reports & Moderation
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by username or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 cyber-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                  <select 
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-cyan-500/30 rounded-md text-sm"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              {selectedUsers.length > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <span className="text-sm text-cyan-300">{selectedUsers.length} users selected</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('Send Email')}>
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('Ban')}>
                    <Ban className="w-3 h-3 mr-1" />
                    Ban
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-800">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">User</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Wallet</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Tier</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">NFTs</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Spent</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Last Active</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-600"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                              {user.avatar}
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {user.walletAddress}
                          </code>
                        </td>
                        <td className="p-4">
                          <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={tierColors[user.tier as keyof typeof tierColors]}>
                            {user.tier}
                          </Badge>
                        </td>
                        <td className="p-4 text-cyan-300 font-medium">{user.nftsGenerated}</td>
                        <td className="p-4 text-green-300 font-medium">${user.totalSpent}</td>
                        <td className="p-4 text-sm text-gray-400">{user.lastActive}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'View')}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'Email')}>
                              <Mail className="w-3 h-3" />
                            </Button>
                            {user.status !== 'banned' && (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'Ban')}>
                                <Ban className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest user actions and platform interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium">{activity.user}</div>
                      <div className="text-sm text-gray-400">
                        {activity.action} {activity.team && `• ${activity.team}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="cyber-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span>Moderation Queue</span>
              </CardTitle>
              <CardDescription>Users reported for suspicious activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No pending moderation reports</p>
                <p className="text-sm">All users are following community guidelines</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 