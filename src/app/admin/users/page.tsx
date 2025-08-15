'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, Search, Filter, UserCheck, UserX, Eye, Ban, Mail, Calendar, Activity, 
  Crown, Shield, AlertTriangle, Download, RefreshCw, MoreHorizontal, Loader2,
  Link, Zap, Database, TrendingUp
} from 'lucide-react'

// Definindo o tipo de usuário com base na API real (MongoDB + Blockchain)
interface User {
  _id: string;
  wallet?: string;
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  nftsCreated: number;
  lastActivity?: string;
  status: 'Active' | 'Inactive' | 'Banned';
  displayName: string;
  hasLinkedAccounts: boolean;
  joinedAt: string;
  
  // 🔗 DADOS DA BLOCKCHAIN (Thirdweb)
  blockchain?: {
    onChainNFTs: number;
    contractInteractions: number;
    isOnChainActive: boolean;
  };
  
  stats: {
    nftsCreated: number;
    onChainNFTs: number;
    totalNFTs: number; // MongoDB + Blockchain
    contractInteractions: number;
    daysSinceJoined: number;
    daysSinceActivity: number;
  };
  
  // Campos adicionais vindos do MongoDB
  linkedAccounts?: {
    email?: string;
    discord?: string;
    twitter?: string;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  usersWithNFTs: number;
  usersWithLinkedAccounts: number;
  totalNFTsCreated: number;
  newUsers: number;
  
  // 🔗 ESTATÍSTICAS DA BLOCKCHAIN
  usersWithOnChainNFTs: number;
  totalOnChainNFTs: number;
  totalContractInteractions: number;
  usersWithOnChainActivity: number;
  totalNFTsAllSources: number; // MongoDB + Blockchain
}

interface ApiResponse {
  users: User[];
  stats: UserStats;
  timestamp: string;
}

const statusColors: { [key in User['status']]: string } = {
  Active: 'bg-green-500/20 text-green-400 border-green-500/30',
  Inactive: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Banned: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching users data...');
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data: ApiResponse = await response.json();
        console.log('✅ Users data received:', data);
        
        setUsers(data.users || []);
        setUserStats(data.stats);
      } catch (err: any) {
        console.error('❌ Error fetching users:', err);
        setError(err.message);
        // Fallback to empty data
        setUsers([]);
        setUserStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    // Use os campos já processados pela API
    const userName = user.displayName;
    const userEmail = user.linkedAccounts?.email || '';
    const userWallet = user.wallet || '';
    const userStatus = user.status;
    
    const matchesSearch = searchTerm === '' || 
                         userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userWallet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || userStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  })

  const handleUserAction = (userId: string, action: string) => {
    alert(`${action} user ${userId}`)
  }

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedUsers.length} selected users`)
  }

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
       <tr key={`skel-${i}`} className="border-b border-gray-800">
         <td className="p-4"><div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-12 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div></td>
       </tr>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-200">User Management</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Manage users, permissions and activity
            {userStats && (
              <span className="ml-2 text-cyan-400">
                • {userStats.totalUsers} total users • {userStats.usersWithNFTs} creators
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" className="border-cyan-500/30 w-full sm:w-auto" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button 
            className="cyber-button w-full sm:w-auto" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards - Dados Reais (MongoDB + Blockchain) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-6">
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.totalUsers || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.activeUsers || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">New Users</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.newUsers || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">NFT Creators</CardTitle>
            <Crown className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.usersWithNFTs || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="cyber-card border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Inactive Users</CardTitle>
            <Ban className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.inactiveUsers || 0)}
            </div>
          </CardContent>
        </Card>

        {/* 🔗 NOVOS CARDS DA BLOCKCHAIN */}
        <Card className="cyber-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">On-Chain Users</CardTitle>
            <Link className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.usersWithOnChainNFTs || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">With blockchain NFTs</p>
          </CardContent>
        </Card>

        <Card className="cyber-card border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">On-Chain NFTs</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.totalOnChainNFTs || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total on blockchain</p>
          </CardContent>
        </Card>

        <Card className="cyber-card border-indigo-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total NFTs</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-300">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.totalNFTsAllSources || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">DB + Blockchain</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 cyber-card border-cyan-500/30">
          <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20">All Users</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500/20">Recent Activity</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-cyan-500/20">Reports & Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by name, email, or wallet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-10" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input w-full md:w-auto">
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card border-cyan-500/30">
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="p-4 font-medium"><input type="checkbox" className="cyber-checkbox" /></th>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">NFTs (DB/Chain)</th>
                      <th className="p-4 font-medium hidden md:table-cell">Joined</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? renderSkeleton() : (
                      filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">
                            {error ? `Error: ${error}` : 'No users found'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => {
                          const userWallet = user.wallet || 'Not connected';
                          const joinDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown';
                          
                          return (
                            <tr key={user._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="p-4"><input type="checkbox" className="cyber-checkbox" /></td>
                              <td className="p-4">
                                <div className="font-medium text-white">{user.displayName}</div>
                                <div className="text-gray-400 text-xs">
                                  {userWallet !== 'Not connected' && userWallet.length > 20 
                                    ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}` 
                                    : userWallet}
                                </div>
                                {user.linkedAccounts?.email && (
                                  <div className="text-cyan-400 text-xs flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user.linkedAccounts.email}
                                  </div>
                                )}
                                {user.linkedAccounts?.discord && (
                                  <div className="text-purple-400 text-xs">Discord linked</div>
                                )}
                                {user.linkedAccounts?.twitter && (
                                  <div className="text-blue-400 text-xs">Twitter linked</div>
                                )}
                              </td>
                              <td className="p-4">
                                <Badge className={statusColors[user.status]}>{user.status}</Badge>
                                {user.stats.daysSinceActivity > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {user.stats.daysSinceActivity}d ago
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-white text-center">
                                <div className="font-medium">
                                  {user.stats?.totalNFTs || user.nftsCreated}
                                </div>
                                <div className="text-xs space-y-1">
                                  {user.nftsCreated > 0 && (
                                    <div className="text-cyan-400">DB: {user.nftsCreated}</div>
                                  )}
                                  {user.blockchain?.onChainNFTs > 0 && (
                                    <div className="text-orange-400">Chain: {user.blockchain.onChainNFTs}</div>
                                  )}
                                  {user.blockchain?.isOnChainActive && (
                                    <div className="text-green-400 flex items-center justify-center gap-1">
                                      <Link className="w-3 h-3" />
                                      <span>Active</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-gray-400 hidden md:table-cell">
                                <div>{joinDate}</div>
                                {user.stats.daysSinceJoined > 0 && (
                                  <div className="text-xs text-gray-500">
                                    {user.stats.daysSinceJoined} days ago
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-10 h-10"
                                  onClick={() => handleUserAction(user._id, 'view')}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent User Activity</CardTitle>
              <CardDescription className="text-gray-400">
                Latest user actions and NFT creations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : (
                  filteredUsers
                    .filter(user => user.lastActivity)
                    .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime())
                    .slice(0, 10)
                    .map((user, index) => (
                      <div key={user._id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold text-white">
                            {user.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.displayName}</div>
                            <div className="text-sm text-gray-400">
                              {user.nftsCreated > 0 && `Created ${user.nftsCreated} NFTs`}
                              {user.blockchain?.onChainNFTs > 0 && ` • ${user.blockchain.onChainNFTs} on-chain`}
                            </div>
                            {user.wallet && (
                              <div className="text-xs text-gray-500">
                                {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {new Date(user.lastActivity!).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.stats.daysSinceActivity === 0 ? 'Today' : `${user.stats.daysSinceActivity}d ago`}
                          </div>
                          {user.blockchain?.isOnChainActive && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mt-1">
                              <Link className="w-3 h-3 mr-1" />
                              On-Chain
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                )}
                {!loading && filteredUsers.filter(user => user.lastActivity).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No recent activity found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <p>Reports and moderation tools coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
} 