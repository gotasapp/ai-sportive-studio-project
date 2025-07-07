'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Shirt, Search, Filter, Eye, Trash2, Copy, MoreHorizontal, Download, RefreshCw, Loader2 
} from 'lucide-react'

// Definindo o tipo de Jersey com base na API
interface Jersey {
  id: string;
  name: string;
  creator?: {
    name: string;
    wallet: string;
  };
  createdAt: string;
  status: 'Minted' | 'Pending' | 'Error';
  imageUrl: string;
  mintCount: number;
  editionSize: number;
}

const statusColors: { [key in Jersey['status']]: string } = {
  Minted: 'bg-green-500/20 text-green-400 border-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Error: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function JerseysPage() {
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const fetchJerseys = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/jerseys');
        if (!response.ok) {
          throw new Error('Failed to fetch jerseys');
        }
        const data: Jersey[] = await response.json();
        setJerseys(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJerseys();
  }, []);

  const filteredJerseys = jerseys.filter(jersey => {
    const matchesSearch = jersey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (jersey.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (jersey.creator?.wallet || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || jersey.status === filterStatus
    
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
         <td className="p-4"><div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div></td>
       </tr>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Jersey Management</h1>
          <p className="text-gray-400 mt-2">Browse, review, and manage all generated jerseys.</p>
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
                <Input placeholder="Search by name, creator, or wallet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cyber-input pl-10" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="cyber-input">
                <option value="all">All Statuses</option>
                <option value="Minted">Minted</option>
                <option value="Pending">Pending</option>
                <option value="Error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jerseys Table */}
      <Card className="cyber-card border-cyan-500/30">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-4 font-medium">Preview</th>
                  <th className="p-4 font-medium">NFT Name</th>
                  <th className="p-4 font-medium">Creator</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Mint Progress</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeleton() : filteredJerseys.map(jersey => (
                   <tr key={jersey.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                     <td className="p-4">
                       <Image src={jersey.imageUrl} alt={jersey.name} width={40} height={40} className="rounded-md" />
                     </td>
                     <td className="p-4 font-medium text-white">{jersey.name}</td>
                     <td className="p-4">
                       <div className="text-white">{jersey.creator?.name || 'Unknown'}</div>
                       <div className="text-gray-400 text-xs">{jersey.creator?.wallet || 'Unknown'}</div>
                     </td>
                     <td className="p-4">
                       <Badge className={statusColors[jersey.status]}>{jersey.status}</Badge>
                     </td>
                     <td className="p-4">
                        <div className="text-white">{jersey.mintCount} / {jersey.editionSize}</div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                            <div className="bg-cyan-400 h-1.5 rounded-full" style={{width: `${(jersey.mintCount / jersey.editionSize) * 100}%`}}></div>
                        </div>
                     </td>
                     <td className="p-4 text-gray-400">{new Date(jersey.createdAt).toLocaleDateString()}</td>
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

// Adicionando media queries para responsividade
;<style jsx>{`
  @media (max-width: 768px) {
    .flex-col {
      flex-direction: column;
    }
    .text-3xl {
      font-size: 1.5rem;
    }
    .p-4 {
      padding: 1rem;
    }
    .space-y-8 > :not([hidden]) ~ :not([hidden]) {
      --tw-space-y-reverse: 0;
      margin-top: calc(2rem * calc(1 - var(--tw-space-y-reverse)));
      margin-bottom: calc(2rem * var(--tw-space-y-reverse));
    }
  }
`}</style>