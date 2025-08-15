'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Coins
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

interface LaunchpadCollection {
  _id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  totalSupply: number;
  minted: number;
  status: 'upcoming' | 'active' | 'hidden';
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
}

const STATUS_LABELS = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  hidden: { label: 'Ended', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
};

export default function LaunchpadMobileLayout({
  collections,
  stats,
  onSearch,
  onFilterChange,
  searchTerm,
  activeFilter,
  loading = false
}: LaunchpadMobileLayoutProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Filter collections based on active tab
  const filteredCollections = collections.filter(collection => {
    if (activeTab === 'live') return collection.status === 'active';
    if (activeTab === 'upcoming') return collection.status === 'upcoming';
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
    const statusConfig = STATUS_LABELS[collection.status];
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
              {collection.status === 'active' && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-black/50 text-white border-white/20 text-xs">
                    <Timer className="w-3 h-3 mr-1" />
                    {timeRemaining}
                  </Badge>
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
      <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518]">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF0052]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white">
      <Header />
      
      {/* Mobile Stats Bar - Igual ao Marketplace */}
      <div className="py-2">
        <Card className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181828] border-none shadow-sm w-full max-w-full mx-auto">
          {/* Total Collections */}
          <div className="flex flex-col items-start min-w-[90px]">
            <span className="text-xs text-white/70 font-medium">Collections</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#FF0052]">{stats.totalCollections}</span>
            </div>
          </div>
          {/* Live Drops */}
          <div className="flex flex-col items-end min-w-[90px]">
            <span className="text-xs text-white/70 font-medium">Live Now</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#FF0052]">{stats.activeDrops}</span>
              {stats.activeDrops > 0 && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros - Igual ao Marketplace */}
      <div className="flex items-center gap-2 mt-4 mb-2 w-full justify-center">
        {['All', 'Live', 'Upcoming', 'Ended'].map((filter) => (
          <button
            key={filter}
            onClick={() => {
              if (filter === 'All') setActiveTab('all');
              else if (filter === 'Live') setActiveTab('live');
              else if (filter === 'Upcoming') setActiveTab('upcoming');
              else setActiveTab('all');
            }}
            className={
              ((filter === 'All' && activeTab === 'all') ||
               (filter === 'Live' && activeTab === 'live') ||
               (filter === 'Upcoming' && activeTab === 'upcoming')
                ? 'bg-[#FF0052] text-white'
                : 'text-white/80') +
              ' px-4 py-1.5 rounded-lg font-semibold text-xs border-none min-w-[60px] transition-all duration-150'
            }
            style={!((filter === 'All' && activeTab === 'all') ||
                    (filter === 'Live' && activeTab === 'live') ||
                    (filter === 'Upcoming' && activeTab === 'upcoming')) ? { background: 'rgba(20,16,30,0.4)' } : {}}
          >
            {filter}
          </button>
        ))}
      </div>
      
      {/* Search Bar - Igual ao Marketplace */}
      <div className="flex items-center gap-2 mt-4 mb-2">
        <div className="relative w-[90%] mx-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            <Search className="w-5 h-5" />
          </span>
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-3 py-3 rounded-xl bg-[#14101e]/60 border-[#FDFDFD]/10 text-white placeholder:text-[#FDFDFD]/40 focus:border-[#FF0052] w-full"
          />
        </div>
      </div>

      {/* Collections Grid - Mantendo o layout atual do Launchpad */}
      <div className="px-4 pt-4">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#FDFDFD]/40 mb-2">No collections found</div>
            <div className="text-[#FDFDFD]/60 text-sm">
              {activeTab === 'live' && 'No live drops at the moment'}
              {activeTab === 'upcoming' && 'No upcoming drops scheduled'}
              {activeTab === 'all' && 'No collections available'}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {filteredCollections.map(renderCollectionCard)}
          </div>
        )}
      </div>
    </div>
  );
}