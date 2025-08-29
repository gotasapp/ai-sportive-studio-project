'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp, 
  Calendar,
  Star,
  ChevronRight,
  Timer,
  Target,
  Coins,
  Settings,
  Eye,
  EyeOff,
  Edit,
  Tag
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import { isAdmin } from '@/lib/admin-config';
import { useActiveAccount } from 'thirdweb/react';

interface LaunchpadCollection {
  _id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  totalSupply: number;
  minted: number;
  status: 'upcoming' | 'active' | 'hidden' | 'pending_launchpad' | 'ended';
  launchDate?: string;
  endDate?: string;
  creator: {
    name: string;
    wallet: string;
  };
  contractAddress?: string;
}

interface LaunchpadMobileLayoutProps {
  collections: LaunchpadCollection[];
  stats: {
    totalCollections: number;
    activeDrops: number;
    totalVolume: string;
    topCreator: string;
  };
  onSearch: (term: string) => void;
  onFilterChange: (filter: string) => void;
  searchTerm: string;
  activeFilter: string;
  loading?: boolean;
  // 🎯 ADICIONAR PROP DE ADMIN
  isUserAdmin?: boolean;
  // 🎯 ADICIONAR PROPS PARA IMAGENS PENDENTES
  pendingImages?: any[];
  pendingLoading?: boolean;
  onApproveImage?: (imageId: string) => void;
  onRejectImage?: (imageId: string) => void;
}

const STATUS_LABELS = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  hidden: { label: 'Hidden', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pending_launchpad: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ended: { label: 'Ended', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

export default function LaunchpadMobileLayout({
  collections,
  stats,
  onSearch,
  onFilterChange,
  searchTerm,
  activeFilter,
  loading = false,
  isUserAdmin = false,
  // 🎯 ADICIONAR PROPS PARA IMAGENS PENDENTES
  pendingImages = [],
  pendingLoading = false,
  onApproveImage,
  onRejectImage
}: LaunchpadMobileLayoutProps) {
  const account = useActiveAccount();
  const address = account?.address;
  
  // 🎯 VERIFICAÇÃO DE ADMIN LOCAL (fallback)
  const [localIsAdmin, setLocalIsAdmin] = useState(false);
  
  // Verificar admin status localmente se não foi passado
  useEffect(() => {
    if (address && !isUserAdmin) {
      const adminStatus = isAdmin({ address });
      setLocalIsAdmin(adminStatus);
    } else {
      setLocalIsAdmin(isUserAdmin);
    }
  }, [address, isUserAdmin]);

  const [activeTab, setActiveTab] = useState('all');

  // 🎯 FILTROS COMPLETOS INCLUINDO ADMIN
  const filteredCollections = collections.filter(collection => {
    if (activeTab === 'live') return collection.status === 'active';
    if (activeTab === 'upcoming') return collection.status === 'upcoming';
    if (activeTab === 'pending' && (isUserAdmin || localIsAdmin)) return collection.status === 'pending_launchpad';
    if (activeTab === 'hidden' && (isUserAdmin || localIsAdmin)) return collection.status === 'hidden';
    if (activeTab === 'ended' && (isUserAdmin || localIsAdmin)) return collection.status === 'ended';
    return true; // 'all' tab
  });

  const calculateProgress = (minted: number, total: number) => {
    return Math.round((minted / total) * 100);
  };

  const formatTimeRemaining = (endDate?: string) => {
    if (!endDate) return 'No limit';
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const renderCollectionCard = (collection: LaunchpadCollection) => {
    const progress = calculateProgress(collection.minted, collection.totalSupply);
    const statusConfig = STATUS_LABELS[collection.status] || STATUS_LABELS.upcoming;
    const timeRemaining = formatTimeRemaining(collection.endDate);
    
    return (
      <Link href={`/launchpad/${collection._id}`} key={collection._id}>
        <Card className="bg-[#14101e]/60 border-[#FDFDFD]/10 hover:border-[#FF0052]/50 transition-all duration-300 overflow-hidden">
          <div className="relative">
            {/* Collection Image */}
            <div className="aspect-[4/3] relative overflow-hidden">
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                unoptimized
              />
              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <Badge className={`${statusConfig.color} border text-xs font-medium px-2 py-1`}>
                  {collection.status === 'active' && <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />}
                  {statusConfig.label}
                </Badge>
              </div>
              
              {/* Time Remaining */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-black/80 text-white text-xs font-medium px-2 py-1 border border-white/30">
                  <Timer className="w-3 h-3 mr-1" />
                  {timeRemaining}
                </Badge>
              </div>
              
              {/* 🎯 ADMIN CONTROLS */}
              {(isUserAdmin || localIsAdmin) && (
                <div className="absolute bottom-3 right-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-black/80 text-white hover:bg-black/90 p-1 h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Implement edit functionality
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-black/80 text-white hover:bg-black/90 p-1 h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Implement admin controls functionality
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Content */}
            <CardContent className="p-4 space-y-3">
              {/* Title and Creator */}
              <div>
                <h3 className="font-bold text-white text-lg leading-tight mb-1 line-clamp-2">
                  {collection.name}
                </h3>
                <p className="text-[#FDFDFD]/60 text-sm">
                  by {collection.creator.name}
                </p>
              </div>

              {/* Price and Supply */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-[#FF0052] font-bold">
                  <Coins className="w-4 h-4" />
                  <span>{collection.price}</span>
                </div>
                <div className="text-[#FDFDFD]/60 text-sm">
                  {collection.minted}/{collection.totalSupply} minted
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={progress} 
                  className="h-2 bg-[#FDFDFD]/10"
                />
                <div className="flex justify-between text-xs text-[#FDFDFD]/60">
                  <span>{progress}% completed</span>
                  <span>{collection.totalSupply - collection.minted} left</span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full bg-[#FF0052] hover:bg-[#FF0052]/80 text-white font-semibold"
                disabled={collection.status !== 'active'}
              >
                {collection.status === 'upcoming' && 'Coming Soon'}
                {collection.status === 'active' && 'Mint Now'}
                {collection.status === 'hidden' && 'Ended'}
                {collection.status === 'pending_launchpad' && 'Pending Approval'}
                {collection.status === 'ended' && 'Ended'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#14101e]/60 rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="cyber-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#FDFDFD]/70">Collections</p>
                  <p className="text-lg font-bold text-[#FDFDFD]">{stats.totalCollections}</p>
                </div>
                <Tag className="h-4 w-4 text-[#FF0052]" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cyber-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#FDFDFD]/70">Live</p>
                  <p className="text-lg font-bold text-[#FDFDFD]">{stats.activeDrops}</p>
                </div>
                <Zap className="h-4 w-4 text-[#FF0052]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search collections..."
              className="pl-10 bg-[#14101e]/60 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder-[#FDFDFD]/50"
            />
          </div>
        </div>

        {/* 🎯 FILTROS COMPLETOS INCLUINDO ADMIN */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${(isUserAdmin || localIsAdmin) ? 'grid-cols-6' : 'grid-cols-3'}`}>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              {(isUserAdmin || localIsAdmin) && (
                <>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="hidden">Hidden</TabsTrigger>
                  <TabsTrigger value="ended">Ended</TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* 🎯 SEÇÃO DE IMAGENS PENDENTES PARA ADMIN */}
        {(isUserAdmin || localIsAdmin) && pendingImages.length > 0 && (
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-2">Pending Images for Approval</h2>
              <p className="text-[#FDFDFD]/60 text-sm">Review and approve images for Launchpad collections</p>
            </div>
            
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-[#14101e]/60 rounded-lg h-48"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pendingImages.map((image) => (
                  <Card key={image._id} className="bg-[#14101e]/60 border-[#FDFDFD]/10 overflow-hidden">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={image.imageUrl}
                        alt={image.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{image.name}</h3>
                        <p className="text-sm text-[#FDFDFD]/60">{image.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="bg-[#FF0052]/20 text-[#FF0052] border-[#FF0052]/30">
                          {image.category}
                        </Badge>
                        <span className="text-[#FDFDFD]/60">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onApproveImage?.(image._id)}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => onRejectImage?.(image._id)}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collections Grid */}
        <div className="space-y-4">
          {filteredCollections.length > 0 ? (
            filteredCollections.map(renderCollectionCard)
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#14101e]/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#FF0052]" />
              </div>
              <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">No collections found</h3>
              <p className="text-[#FDFDFD]/60">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}