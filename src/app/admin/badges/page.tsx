'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge as UiBadge } from '@/components/ui/badge' // Renomeado para evitar conflito
import { Input } from '@/components/ui/input'
import { 
  Award, Search, Filter, MoreHorizontal, Download, RefreshCw 
} from 'lucide-react'

// Definindo o tipo de Badge com base na API
interface Badge {
  id: string;
  name: string;
  creator: {
    name: string;
    wallet: string;
  };
  createdAt: string;
  status: 'Claimable' | 'Expired';
  imageUrl: string;
  mintCount: number;
  editionSize: number;
}

const statusColors: { [key in Badge['status']]: string } = {
  Claimable: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/badges');
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        const data: Badge[] = await response.json();
        setBadges(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || badge.status === filterStatus
    
    return matchesSearch && matchesStatus;
  })

  const renderSkeleton = () => (
    Array.from({ length: 4 }).map((_, i) => (
       <tr key={`skel-${i}`} className="border-b border-gray-800">
         <td className="p-4"><div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-40 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div></td>
         <td className="p-4"><div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div></td>
       </tr>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Badge Management</h1>
          <p className="text-gray-400 mt-2">Manage and distribute community and achievement badges.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-cyan-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export Data
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
                <Input placeholder="Search by name or creator..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-10" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input">
                <option value="all">All Statuses</option>
                <option value="Claimable">Claimable</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Table */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-4 font-medium">Preview</th>
                  <th className="p-4 font-medium">Badge Name</th>
                  <th className="p-4 font-medium">Creator</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Claim Progress</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeleton() : filteredBadges.map(badge => (
                   <tr key={badge.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                     <td className="p-4">
                       <Image src={badge.imageUrl} alt={badge.name} width={40} height={40} className="rounded-full" />
                     </td>
                     <td className="p-4 font-medium text-white">{badge.name}</td>
                     <td className="p-4">
                       <div className="text-white">{badge.creator.name}</div>
                       <div className="text-gray-400 text-xs">{badge.creator.wallet}</div>
                     </td>
                     <td className="p-4">
                       <UiBadge className={statusColors[badge.status]}>{badge.status}</UiBadge>
                     </td>
                     <td className="p-4">
                        <div className="text-white">{badge.mintCount} / {badge.editionSize}</div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                            <div className="bg-cyan-400 h-1.5 rounded-full" style={{width: `${(badge.mintCount / badge.editionSize) * 100}%`}}></div>
                        </div>
                     </td>
                     <td className="p-4 text-gray-400">{new Date(badge.createdAt).toLocaleDateString()}</td>
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
    </div>
  )
} 