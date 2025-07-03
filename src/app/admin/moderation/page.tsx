'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, Clock, CheckCircle, XCircle, RefreshCw, User, Shirt, Building, Award, Info
} from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Tipos de dados da API
interface PendingItem {
  id: string;
  type: 'Jersey' | 'Stadium' | 'Badge';
  name: string;
  creator: {
    name: string;
    wallet: string;
  };
  submittedAt: string;
  status: 'Pending';
  imageUrl: string;
  details: Record<string, any>;
}

const typeConfig = {
  Jersey: { icon: Shirt, color: 'text-blue-400' },
  Stadium: { icon: Building, color: 'text-green-400' },
  Badge: { icon: Award, color: 'text-yellow-400' },
}

export default function ModerationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/moderation');
      if (!response.ok) {
        throw new Error('Failed to fetch items for moderation');
      }
      const data: PendingItem[] = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDecision = (itemId: string, decision: 'approved' | 'rejected') => {
    console.log(`Item ${itemId} has been ${decision}.`);
    // Remove o item da lista para dar feedback na UI
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    // Futuramente, aqui seria enviada uma requisição POST/PATCH para a API
  };

  const renderSkeleton = () => (
    Array.from({ length: 4 }).map((_, i) => (
      <Card key={`skel-${i}`} className="cyber-card animate-pulse">
        <CardHeader>
          <div className="h-24 w-full bg-gray-700 rounded-lg"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-5 w-3/4 bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
          <div className="h-4 w-1/3 bg-gray-700 rounded"></div>
        </CardContent>
        <div className="flex justify-around p-4">
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
        </div>
      </Card>
    ))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Content Moderation Queue</h1>
          <p className="text-gray-400 mt-2">
            {loading ? 'Loading items...' : `You have ${items.length} items to review.`}
          </p>
        </div>
        <Button variant="outline" className="border-cyan-500/30" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {/* Grid de Moderação */}
      {error && <p className="p-4 text-red-500 text-center">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? renderSkeleton() : items.map(item => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <Card key={item.id} className="cyber-card flex flex-col justify-between">
              <CardHeader className="p-0">
                <Image src={item.imageUrl} alt={item.name} width={400} height={400} className="rounded-t-lg aspect-square object-cover" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="flex items-center gap-1.5" variant="outline">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    {item.type}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <Info className="w-4 h-4 text-gray-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-words">
                        <pre className="text-xs">{JSON.stringify(item.details, null, 2)}</pre>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardTitle className="text-lg text-white">{item.name}</CardTitle>
                <div className="text-sm text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{item.creator.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(item.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-around p-4 border-t border-gray-800">
                <Button className="w-2/5 bg-green-500/20 hover:bg-green-500/30 text-green-400" onClick={() => handleDecision(item.id, 'approved')}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button className="w-2/5 bg-red-500/20 hover:bg-red-500/30 text-red-400" onClick={() => handleDecision(item.id, 'rejected')}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
      {!loading && items.length === 0 && !error &&
        <div className="text-center py-20">
          <Shield className="mx-auto w-16 h-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-semibold text-white">All Clear!</h2>
          <p className="mt-2 text-gray-400">The moderation queue is empty. Great job!</p>
        </div>
      }
    </div>
  )
} 