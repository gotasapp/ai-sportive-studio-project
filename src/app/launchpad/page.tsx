'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  Users, 
  Filter, 
  Search, 
  Grid3X3, 
  List, 
  Star, 
  TrendingUp, 
  Zap,
  Tag,
  DollarSign,
  BarChart3
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Componente do Carrossel Featured (igual ao marketplace)
function FeaturedLaunchpadCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Featured collections for carousel
  const featuredCollections = [
    {
      id: 'flamengo-heritage',
      name: 'Flamengo Heritage Collection',
      collection: 'Clube de Regatas do Flamengo',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
      createdAt: '2024-01-15T00:00:00Z',
      category: 'jerseys'
    },
    {
      id: 'palmeiras-badges',
      name: 'Palmeiras Championship Badges',
      collection: 'Sociedade Esportiva Palmeiras',
      imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop',
      createdAt: '2024-01-10T00:00:00Z',
      category: 'badges'
    },
    {
      id: 'maracana-legends',
      name: 'Maracanã Legends Stadium',
      collection: 'Maracanã Stadium',
      imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=400&fit=crop',
      createdAt: '2024-02-01T00:00:00Z',
      category: 'stadiums'
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredCollections.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredCollections.length]);

  return (
    <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
      {/* Container das imagens */}
      <div
        className="flex h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {featuredCollections.map((collection, index) => (
          <div
            key={index}
            className="relative w-full h-full flex-shrink-0"
          >
            <Image
              src={collection.imageUrl}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300"
              loading="eager"
              priority={index < 2}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            {/* Featured Badge */}
            <div className="absolute top-6 left-8 md:left-16 lg:left-24 z-10">
              <div className="bg-[#A20131]/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Featured</span>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:px-16 lg:px-24 text-white">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 text-white">{collection.name}</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#A20131]/20 rounded-full flex items-center justify-center border border-[#A20131]/30">
                    <span className="text-[#A20131] font-bold text-sm">
                      {collection.collection.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{collection.collection}</p>
                    <p className="text-sm text-gray-300">
                      Created {new Date(collection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {featuredCollections.length > 1 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {index + 1} of {featuredCollections.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente dos Stats (pequenos e discretos como no marketplace)
function LaunchpadStats({ stats }: { stats: any }) {
  const statsData = [
    {
      title: "Collections",
      value: stats.totalCollections,
      description: "Total",
      icon: <Tag className="h-3 w-3 text-[#A20131]" />,
      color: "text-blue-400"
    },
    {
      title: "Live", 
      value: stats.liveCollections,
      description: "Active",
      icon: <Zap className="h-3 w-3 text-[#A20131]" />,
      color: "text-green-400"
    },
    {
      title: "Upcoming",
      value: stats.upcomingCollections,
      description: "Soon",
      icon: <Clock className="h-3 w-3 text-[#A20131]" />,
      color: "text-orange-400"
    },
    {
      title: "Volume",
      value: stats.totalVolume,
      description: "Total",
      icon: <DollarSign className="h-3 w-3 text-[#A20131]" />,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {statsData.map((stat, index) => (
        <Card key={index} className="cyber-card border-[#FDFDFD]/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
            <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
              {stat.title}
            </CardTitle>
            <div className="p-1 rounded bg-[#A20131]/20">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className={`text-sm font-bold ${stat.color} mb-0.5`}>
              {stat.value}
            </div>
            <p className="text-xs text-[#FDFDFD]/50">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente do Card da Coleção (exatamente igual ao marketplace)
function LaunchpadCollectionCard({ collection }: { collection: any }) {
  const progress = (collection.minted / collection.totalSupply) * 100;
  
  return (
    <Card className="cyber-card rounded-xl overflow-hidden group transition-all hover:border-[#FDFDFD]/20 hover:shadow-lg hover:shadow-[#A20131]/10">
      <div className="relative aspect-square">
        <Image 
          src={collection.image} 
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`${
              collection.status === 'live' 
                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                : collection.status === 'upcoming'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current mr-1" />
            {collection.status}
          </Badge>
        </div>

        {/* Timer for upcoming collections */}
        {collection.status === 'upcoming' && collection.launchDate && (
          <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(collection.launchDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-[#FDFDFD] text-lg mb-1 group-hover:text-[#A20131] transition-colors">
            {collection.name}
          </h3>
          <p className="text-[#FDFDFD]/70 text-sm line-clamp-2">
            {collection.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#FDFDFD]/70">Supply</span>
            <span className="text-[#FDFDFD]">{collection.minted}/{collection.totalSupply}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#FDFDFD]/70">From</p>
            <p className="font-semibold text-[#FDFDFD]">{collection.price}</p>
          </div>
          <Link href={`/launchpad/${collection.id}`}>
            <Button 
              size="sm" 
              className={`${
                collection.status === 'live' 
                  ? 'bg-[#A20131] hover:bg-[#A20131]/90 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              {collection.status === 'live' ? 'Mint' : 'View'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LaunchpadPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data for launchpad collections
  const allCollections = [
    {
      id: 'flamengo-heritage',
      name: 'Flamengo Heritage Collection',
      description: 'Historic jerseys celebrating the legendary 1981 World Championship victory',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop',
      status: 'live',
      category: 'jerseys',
      totalSupply: 1981,
      minted: 1456,
      price: '50 CHZ',
      creator: 'Clube de Regatas do Flamengo',
      launchDate: '2024-01-15T00:00:00Z',
      endDate: '2024-02-15T23:59:59Z'
    },
    {
      id: 'palmeiras-badges',
      name: 'Palmeiras Championship Badges',
      description: 'Exclusive badges commemorating championship victories and historic moments',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
      status: 'live',
      category: 'badges',
      totalSupply: 500,
      minted: 342,
      price: '75 CHZ',
      creator: 'Sociedade Esportiva Palmeiras',
      launchDate: '2024-01-10T00:00:00Z',
      endDate: '2024-02-10T23:59:59Z'
    },
    {
      id: 'maracana-legends',
      name: 'Maracanã Legends Stadium',
      description: 'Legendary stadium collection with exclusive access to historic matches',
      image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=400&fit=crop',
      status: 'upcoming',
      category: 'stadiums',
      totalSupply: 200,
      minted: 0,
      price: '150 CHZ',
      creator: 'Maracanã Stadium',
      launchDate: '2024-02-01T00:00:00Z',
      endDate: '2024-03-01T23:59:59Z'
    },
    {
      id: 'vasco-retro',
      name: 'Vasco da Gama Retro Collection',
      description: 'Vintage jerseys from the historic 1898 founding era',
      image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop',
      status: 'upcoming',
      category: 'jerseys',
      totalSupply: 1898,
      minted: 0,
      price: '40 CHZ',
      creator: 'Club de Regatas Vasco da Gama',
      launchDate: '2024-02-20T00:00:00Z',
      endDate: '2024-03-20T23:59:59Z'
    }
  ];

  // Filter collections
  const filteredCollections = allCollections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || collection.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const stats = {
    totalCollections: allCollections.length,
    liveCollections: allCollections.filter(c => c.status === 'live').length,
    upcomingCollections: allCollections.filter(c => c.status === 'upcoming').length,
    totalVolume: '2.4M CHZ'
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {filteredCollections.map((collection) => (
          <LaunchpadCollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Carousel - Full width like marketplace */}
        <div className="w-full">
          <FeaturedLaunchpadCarousel />
        </div>

        {/* Launchpad Stats - Small and discrete like marketplace */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          <LaunchpadStats stats={stats} />
        </div>

        {/* Search and Filters */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 cyber-input"
                />
              </div>
              
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                <TabsList className="cyber-card">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="live">Live</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="ended">Ended</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto">
                <TabsList className="cyber-card">
                  <TabsTrigger value="all">All Categories</TabsTrigger>
                  <TabsTrigger value="jerseys">Jerseys</TabsTrigger>
                  <TabsTrigger value="stadiums">Stadiums</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Content - Collections Grid */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-8">
          <div className="max-w-7xl mx-auto">
            {filteredCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No collections found</h2>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              renderGridView()
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 