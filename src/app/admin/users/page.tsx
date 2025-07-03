'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, Search, Filter, UserCheck, UserX, Eye, Ban, Mail, Calendar, Activity, 
  Crown, Shield, AlertTriangle, Download, RefreshCw, MoreHorizontal, Loader2 
} from 'lucide-react'

// Definindo o tipo de usuário com base na API
interface User {
  id: string;
  walletAddress: string;
  name: string;
  email: string;
  joinedAt: string;
  nftsCreated: number;
  lastActivity: string;
  status: 'Active' | 'Inactive' | 'Banned';
}

const statusColors: { [key in User['status']]: string } = {
  Active: 'bg-green-500/20 text-green-400 border-green-500/30',
  Inactive: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Banned: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
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
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">User Management</h1>
          <p className="text-gray-400 mt-2">Manage users, permissions and activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button className="cyber-button" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards - Manteremos estáticos por enquanto */}
       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="cyber-card border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle><Users className="h-4 w-4 text-cyan-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-cyan-300">3,429</div></CardContent>
        </Card>
        <Card className="cyber-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-200">Active Users</CardTitle><UserCheck className="h-4 w-4 text-green-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-300">2,847</div></CardContent>
        </Card>
        <Card className="cyber-card border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-200">New Users</CardTitle><Activity className="h-4 w-4 text-blue-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-300">156</div></CardContent>
        </Card>
        <Card className="cyber-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-200">Premium Users</CardTitle><Crown className="h-4 w-4 text-purple-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-300">89</div></CardContent>
        </Card>
        <Card className="cyber-card border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-200">Banned Users</CardTitle><Ban className="h-4 w-4 text-red-400" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-300">23</div></CardContent>
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
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input">
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
                      <th className="p-4 font-medium">NFTs Created</th>
                      <th className="p-4 font-medium">Joined</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? renderSkeleton() : filteredUsers.map(user => (
                       <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                         <td className="p-4"><input type="checkbox" className="cyber-checkbox" /></td>
                         <td className="p-4">
                           <div className="font-medium text-white">{user.name}</div>
                           <div className="text-gray-400">{user.walletAddress}</div>
                         </td>
                         <td className="p-4">
                           <Badge className={statusColors[user.status]}>{user.status}</Badge>
                         </td>
                         <td className="p-4 text-white text-center">{user.nftsCreated}</td>
                         <td className="p-4 text-gray-400">{new Date(user.joinedAt).toLocaleDateString()}</td>
                         <td className="p-4">
                           <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <p>Recent activity feed coming soon.</p>
        </TabsContent>
        <TabsContent value="reports">
          <p>Reports and moderation tools coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
} 