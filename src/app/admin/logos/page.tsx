'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  LucideImage, Search, Filter, MoreHorizontal, Download, RefreshCw, Eye, Trash2, Copy, Plus
} from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Tipos de dados da API
interface Logo {
  id: string;
  name: string;
  creator?: {
    name: string;
    wallet: string;
  };
  createdAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  imageUrl: string;
  usageCount: number;
  tags: string[];
}

const statusColors: { [key in Logo['status']]: string } = {
  Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function LogosPage() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchLogos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/logos');
      if (!response.ok) {
        throw new Error('Failed to fetch logos');
      }
      const data: Logo[] = await response.json();
      setLogos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogos();
  }, []);

  const filteredLogos = logos.filter(logo => {
    const matchesSearch = logo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (logo.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         logo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || logo.status === filterStatus
    
    return matchesSearch && matchesStatus;
  })

  const renderSkeleton = () => (
    Array.from({ length: 4 }).map((_, i) => (
       <tr key={`skel-${i}`} className="border-b border-gray-800">
         <td className="p-4"><div className="h-10 w-10 bg-gray-700 rounded-md animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-40 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-28 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div></td>
       </tr>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Logo Management</h1>
          <p className="text-gray-400 mt-2">Browse, manage, and upload team and community logos.</p>
        </div>
        <div className="flex items-center space-x-4">
           <Button variant="outline" className="border-cyan-500/30">
            <Plus className="w-4 h-4 mr-2" />
            Upload Logo
          </Button>
          <Button className="cyber-button" onClick={fetchLogos} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                <Input placeholder="Search by name, creator, or tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-10" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input">
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos Table */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-4 font-medium">Preview</th>
                  <th className="p-4 font-medium">Logo Name</th>
                  <th className="p-4 font-medium">Creator</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Usage</th>
                  <th className="p-4 font-medium">Tags</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeleton() : filteredLogos.map(logo => (
                   <tr key={logo.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                     <td className="p-4">
                       <Image src={logo.imageUrl} alt={logo.name} width={40} height={40} className="rounded-md bg-gray-700 p-1" />
                     </td>
                     <td className="p-4 font-medium text-white">{logo.name}</td>
                     <td className="p-4">
                       <div className="text-white">{logo.creator?.name || 'Unknown'}</div>
                       <div className="text-gray-400 text-xs">{logo.creator?.wallet || 'Unknown'}</div>
                     </td>
                     <td className="p-4">
                       <Badge className={statusColors[logo.status]}>{logo.status}</Badge>
                     </td>
                     <td className="p-4 text-white">{logo.usageCount} times</td>
                     <td className="p-4">
                       <div className="flex flex-wrap gap-1">
                         {logo.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                       </div>
                     </td>
                     <td className="p-4 text-gray-400">{new Date(logo.createdAt).toLocaleDateString()}</td>
                     <td className="p-4">
                       <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
            {error && <p className="p-4 text-red-500">{error}</p>}
            {!loading && filteredLogos.length === 0 && <p className="p-4 text-gray-400">No logos found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 