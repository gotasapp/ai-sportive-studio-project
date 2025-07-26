'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
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
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  CalendarDays,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin-config';
import { toast } from 'sonner';
import { Collection, LaunchpadStatus } from '@/types';
import { LAUNCHPAD_STATUSES, VISIBLE_LAUNCHPAD_STATUSES } from '@/lib/collection-config';

// Componente do Carrossel Featured (igual ao marketplace)
function FeaturedLaunchpadCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Featured collections for carousel
  const featuredCollections = [
    {
      id: 'flamengo-heritage',
      name: 'Flamengo Heritage Collection',
      collection: 'Clube de Regatas do Flamengo',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      createdAt: '2024-01-15T00:00:00Z',
      category: 'jerseys'
    },
    {
      id: 'palmeiras-badges',
      name: 'Palmeiras Championship Badges',
      collection: 'Sociedade Esportiva Palmeiras',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
      createdAt: '2024-01-10T00:00:00Z',
      category: 'badges'
    },
    {
      id: 'maracana-legends',
      name: 'Maracanã Legends Stadium',
      collection: 'Maracanã Stadium',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
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
function LaunchpadCollectionCard({ 
  collection, 
  isAdmin = false, 
  onUpdateStatus 
}: { 
  collection: Collection; 
  isAdmin?: boolean; 
  onUpdateStatus?: (collectionId: string, status: LaunchpadStatus, launchDate?: string) => void;
}) {
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LaunchpadStatus>(collection.status as LaunchpadStatus);
  const [launchDate, setLaunchDate] = useState(collection.launchDate || '');
  
  const progress = collection.minted && collection.totalSupply 
    ? (collection.minted / collection.totalSupply) * 100 
    : 0;

  const handleStatusUpdate = () => {
    if (onUpdateStatus) {
      onUpdateStatus(collection.id, selectedStatus, launchDate);
      setShowAdminControls(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'upcoming':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'pending_launchpad':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hidden':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'ended':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'upcoming':
        return <CalendarDays className="w-3 h-3" />;
      case 'pending_launchpad':
        return <Clock className="w-3 h-3" />;
      case 'hidden':
        return <EyeOff className="w-3 h-3" />;
      case 'ended':
        return <XCircle className="w-3 h-3" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-current" />;
    }
  };
  
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
          <Badge className={getStatusColor(collection.status)}>
            {getStatusIcon(collection.status)}
            <span className="ml-1">{collection.status}</span>
          </Badge>
        </div>

        {/* Admin Controls Toggle */}
        {isAdmin && (
          <div className="absolute top-3 right-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="bg-black/80 text-white hover:bg-black/90"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Timer for upcoming collections */}
        {collection.status === 'upcoming' && collection.launchDate && (
          <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(collection.launchDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Admin Controls Panel */}
        {isAdmin && showAdminControls && (
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Admin Controls</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdminControls(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LaunchpadStatus)}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
              >
                {LAUNCHPAD_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Launch Date (optional):</label>
              <input
                type="datetime-local"
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleStatusUpdate}
                className="bg-[#A20131] hover:bg-[#A20131]/90 text-white"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Update
              </Button>
              
              {/* Quick Action Buttons */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus?.(collection.id, 'active')}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                <Play className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus?.(collection.id, 'hidden')}
                className="text-gray-400 border-gray-400 hover:bg-gray-400/10"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

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
            <span className="text-[#FDFDFD]">{collection.minted || 0}/{collection.totalSupply || 0}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#FDFDFD]/70">From</p>
            <p className="font-semibold text-[#FDFDFD]">{collection.price || 'TBD'}</p>
          </div>
          <Link href={`/launchpad/${collection.id}`}>
            <Button 
              size="sm" 
              className={`${
                collection.status === 'active' 
                  ? 'bg-[#A20131] hover:bg-[#A20131]/90 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              {collection.status === 'active' ? 'Mint' : 'View'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LaunchpadPage() {
  // Thirdweb v5 hooks for wallet connection
  const account = useActiveAccount();
  
  // Use account data directly
  const address = account?.address;
  const isConnected = !!account;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (address) {
      const adminStatus = isAdmin({ address });
      setIsUserAdmin(adminStatus);
    } else {
      setIsUserAdmin(false);
    }
  }, [address]);

  // Fetch collections from backend
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        
        // Use admin endpoint if user is admin, otherwise use regular endpoint
        const endpoint = isUserAdmin 
          ? `/api/admin/collections?isAdmin=true&adminAddress=${address}&type=launchpad`
          : '/api/launchpad/collections';
          
        const response = await fetch(endpoint);
        const data = await response.json();
        
        console.log('🔍 Fetch result:', { isUserAdmin, success: data.success, collectionsCount: data.collections?.length || 0 });
        
        if (data.success) {
          // Admin gets all collections, regular users get filtered collections
          const collectionsToSet = isUserAdmin 
            ? data.launchpadCollections || data.collections || []
            : data.collections || [];
            
          setCollections(collectionsToSet);
          console.log('✅ Collections loaded:', collectionsToSet.length, 'collections');
        } else {
          console.error('Failed to fetch collections:', data.error);
          toast.error('Failed to load collections');
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        toast.error('Error loading collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [isUserAdmin, address]);

  // Function to update collection status (admin only)
  const updateCollectionStatus = async (collectionId: string, newStatus: LaunchpadStatus, launchDate?: string) => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch('/api/admin/activate-launchpad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId,
          status: newStatus,
          launchDate,
          isAdmin: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Collection ${newStatus} successfully`);
        
        // Update local state
        setCollections(prev => prev.map(collection => 
          collection.id === collectionId 
            ? { ...collection, status: newStatus, launchDate: launchDate || collection.launchDate }
            : collection
        ));
      } else {
        toast.error(data.error || 'Failed to update collection status');
      }
    } catch (error) {
      console.error('Error updating collection status:', error);
      toast.error('Error updating collection status');
    }
  };

  // Filter collections
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || collection.category === categoryFilter;
    
    // Para usuários não-admin, não mostrar coleções pending_launchpad, hidden ou ended
    const isVisibleForUser = isUserAdmin || 
      (collection.status !== 'pending_launchpad' && 
       collection.status !== 'hidden' && 
       collection.status !== 'ended');
    
    return matchesSearch && matchesStatus && matchesCategory && isVisibleForUser;
  });

  // Stats
  const stats = {
    totalCollections: filteredCollections.length,
    liveCollections: filteredCollections.filter(c => c.status === 'active').length,
    upcomingCollections: filteredCollections.filter(c => c.status === 'upcoming').length,
    totalVolume: '2.4M CHZ'
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {filteredCollections.map((collection) => (
          <LaunchpadCollectionCard 
            key={collection.id} 
            collection={collection}
            isAdmin={isUserAdmin}
            onUpdateStatus={updateCollectionStatus}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Launchpad Carousel */}
        <FeaturedLaunchpadCarousel />

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
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  {isUserAdmin && (
                    <>
                      <TabsTrigger value="pending_launchpad">Pending</TabsTrigger>
                      <TabsTrigger value="hidden">Hidden</TabsTrigger>
                      <TabsTrigger value="ended">Ended</TabsTrigger>
                    </>
                  )}
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="cyber-card overflow-hidden">
                    <div className="aspect-square w-full bg-[#FDFDFD]/10 animate-pulse" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 w-3/4 bg-[#FDFDFD]/10 animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-[#FDFDFD]/10 animate-pulse rounded" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="h-3 w-16 bg-[#FDFDFD]/10 animate-pulse rounded" />
                          <div className="h-3 w-20 bg-[#FDFDFD]/10 animate-pulse rounded" />
                        </div>
                        <div className="h-1.5 w-full bg-[#FDFDFD]/10 animate-pulse rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-3 w-8 bg-[#FDFDFD]/10 animate-pulse rounded mb-1" />
                          <div className="h-4 w-16 bg-[#FDFDFD]/10 animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-20 bg-[#FDFDFD]/10 animate-pulse rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No collections found</h2>
                <p className="text-gray-400">
                  {collections.length === 0 
                    ? "No collections available in the launchpad yet" 
                    : "Try adjusting your search or filters"
                  }
                </p>
                {isUserAdmin && collections.length === 0 && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-md">
                    <p className="text-sm text-gray-300 mb-2">💡 Admin Tip:</p>
                    <p className="text-xs text-gray-400 mb-3">
                      Use the "Enviar para Launchpad" button in the jersey generation page to add collections for approval.
                    </p>
                    <Link href="/jerseys">
                      <Button size="sm" className="bg-[#A20131] hover:bg-[#A20131]/90 text-white">
                        Go to Jersey Generator
                      </Button>
                    </Link>
                  </div>
                )}
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