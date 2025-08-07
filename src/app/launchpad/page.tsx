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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  XCircle,
  Trash2,
  Edit,
  Plus,
  Minus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin-config';
import { toast } from 'sonner';
import { Collection, LaunchpadStatus } from '@/types';
import { LAUNCHPAD_STATUSES, VISIBLE_LAUNCHPAD_STATUSES } from '@/lib/collection-config';
import { getCurrentUTC, getCurrentLocalFormatted, addDaysToUTC, isUTCDatePassed } from '@/lib/collection-utils';

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
  onUpdateStatus,
  onEdit
}: { 
  collection: Collection; 
  isAdmin?: boolean; 
  onUpdateStatus?: (collectionId: string, status: LaunchpadStatus, launchDate?: string) => void;
  onEdit?: (collection: any) => void;
}) {
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LaunchpadStatus>(collection.status as LaunchpadStatus);
  const [launchDate, setLaunchDate] = useState(
    collection.launchDate instanceof Date 
      ? collection.launchDate.toISOString().slice(0, 16)
      : collection.launchDate || ''
  );
  
  const progress = collection.minted && collection.totalSupply 
    ? (collection.minted / collection.totalSupply) * 100 
    : 0;

  const handleStatusUpdate = () => {
    if (onUpdateStatus && collection._id) {
      onUpdateStatus(collection._id, selectedStatus, launchDate);
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

        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit?.(collection)}
              className="bg-black/80 text-white hover:bg-black/90"
              title="Edit Collection"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="bg-black/80 text-white hover:bg-black/90"
              title="Admin Controls"
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
                onClick={() => collection._id && onUpdateStatus?.(collection._id, 'active')}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                <Play className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => collection._id && onUpdateStatus?.(collection._id, 'hidden')}
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
          <Link href={`/launchpad/${collection._id || 'unknown'}`}>
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
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPendingImage, setSelectedPendingImage] = useState<any>(null);
  const [approvalLaunchDate, setApprovalLaunchDate] = useState('');
  const [approvalForm, setApprovalForm] = useState({
    // Basic info
    name: '',
    description: '',
    price: '0.1 CHZ',
    maxSupply: 100,
    status: 'upcoming' as LaunchpadStatus,
    
    // Creator info
    creatorName: '',
    creatorAvatar: '/api/placeholder/40/40',
    contractAddress: '0x1234...5678',
    
    // Social links
    website: '',
    twitter: '',
    discord: '',
    
    // Collection details
    vision: '',
    utility: ['Exclusive access to community events'],
    team: [{ name: '', role: '', avatar: '/api/placeholder/60/60', bio: '' }],
    roadmap: [
      { phase: 'Phase 1', title: '', description: '', status: 'completed' },
      { phase: 'Phase 2', title: '', description: '', status: 'in-progress' },
      { phase: 'Phase 3', title: '', description: '', status: 'upcoming' }
    ],
    mintStages: [
      { 
        id: 'vip', 
        name: 'VIP Sale', 
        description: 'Exclusive early access for VIP members', 
        price: '0.05 MATIC', 
        walletLimit: 5, 
        status: 'upcoming',
        startTime: '',
        endTime: ''
      },
      { 
        id: 'whitelist', 
        name: 'Whitelist Sale', 
        description: 'Early access for whitelisted wallets', 
        price: '0.08 MATIC', 
        walletLimit: 3, 
        status: 'upcoming',
        startTime: '',
        endTime: ''
      },
      { 
        id: 'public', 
        name: 'Public Sale', 
        description: 'Open to everyone', 
        price: '0.1 MATIC', 
        walletLimit: 2, 
        status: 'upcoming',
        startTime: '',
        endTime: ''
      }
    ],
    
    // ✨ NOVOS CAMPOS PARA CLAIM CONDITIONS
    autoConfigureClaimConditions: false,
    claimCurrency: 'MATIC',
    maxSupplyPerPhase: 100
    });

  // Estados para private wallets
  const [privateWallets, setPrivateWallets] = useState<string[]>(['']);
  const [privateWalletStage, setPrivateWalletStage] = useState('vip');

  // Estados para modal de edição de coleção
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    vision: '',
    creatorAvatar: '',
    contractAddress: '',
    website: '',
    twitter: '',
    discord: '',
    utility: [''],
    team: [{ name: '', role: '', avatar: '', bio: '' }],
    roadmap: [{ phase: '', title: '', description: '', status: 'upcoming' }],
    mintStages: [{ id: 'public', name: 'Public', description: '', price: '', walletLimit: 3, status: 'upcoming', startTime: '', endTime: '' }]
  });

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

  // Fetch pending images (admin only)
  useEffect(() => {
    const fetchPendingImages = async () => {
      if (!isUserAdmin) return;
      
      try {
        setPendingLoading(true);
        const response = await fetch('/api/launchpad/pending-images');
        const data = await response.json();
        
        if (data.success) {
          setPendingImages(data.pendingImages || []);
          console.log('✅ Pending images loaded:', data.count, 'images');
        } else {
          console.error('Failed to fetch pending images:', data.error);
        }
      } catch (error) {
        console.error('Error fetching pending images:', error);
      } finally {
        setPendingLoading(false);
      }
    };

    fetchPendingImages();
  }, [isUserAdmin]);

  // Auto-update collection statuses based on launch dates
  useEffect(() => {
    const checkAndUpdateStatuses = async () => {
      if (!isUserAdmin) return;
      
      try {
        // ✅ CORRIGIDO: Usar funções utilitárias UTC
        console.log('🔄 Verificando status em (local):', getCurrentLocalFormatted())
        console.log('🔄 Verificando status em (UTC):', getCurrentUTC().toISOString())
        
        const collectionsToUpdate = collections.filter(collection => {
          if (collection.status === 'upcoming' && collection.launchDate) {
            const dateString = collection.launchDate instanceof Date 
              ? collection.launchDate.toISOString() 
              : collection.launchDate;
            return isUTCDatePassed(dateString);
          }
          return false;
        });

        if (collectionsToUpdate.length > 0) {
          console.log('🔄 Auto-updating status for', collectionsToUpdate.length, 'collections');
          
          for (const collection of collectionsToUpdate) {
            // ✅ CORRIGIDO: Usar _id em vez de id
            const collectionId = collection._id;
            if (collectionId) {
              await updateCollectionStatus(collectionId, 'active');
            } else {
              console.error('❌ Collection sem ID válido:', collection);
            }
          }
        }
      } catch (error) {
        console.error('Error auto-updating collection statuses:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndUpdateStatuses, 5 * 60 * 1000);
    
    // Also check immediately when component mounts
    checkAndUpdateStatuses();

    return () => clearInterval(interval);
  }, [collections, isUserAdmin]);

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
        
        // Update local state - ✅ CORRIGIDO: Usar _id em vez de id
        setCollections(prev => prev.map(collection => {
          const currentId = collection._id;
          return currentId === collectionId 
            ? { ...collection, status: newStatus, launchDate: launchDate ? new Date(launchDate) : collection.launchDate }
            : collection;
        }));
      } else {
        toast.error(data.error || 'Failed to update collection status');
      }
    } catch (error) {
      console.error('Error updating collection status:', error);
      toast.error('Error updating collection status');
    }
  };

  // Function to approve pending image (admin only)
  const approvePendingImage = async (pendingImageId: string, approvalData: any) => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch(`/api/launchpad/pending-images/${pendingImageId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Collection approved and created!');
        
        // Save private wallets if any are provided
        const validWallets = privateWallets.filter(wallet => 
          wallet && wallet.length === 42 && wallet.startsWith('0x')
        );
        
        if (validWallets.length > 0 && data.collectionId) {
          try {
            await savePrivateWallets(data.collectionId);
          } catch (error) {
            console.error('Error saving private wallets:', error);
            // Don't fail the approval if private wallets fail to save
          }
        }
        
        // Remove from pending images
        setPendingImages(prev => prev.filter(img => img._id !== pendingImageId));
        
        // Refresh collections
        const collectionsResponse = await fetch('/api/launchpad/collections');
        const collectionsData = await collectionsResponse.json();
        if (collectionsData.success) {
          setCollections(collectionsData.collections || []);
        }
      } else {
        toast.error(data.error || 'Failed to approve collection');
      }
    } catch (error) {
      console.error('Error approving pending image:', error);
      toast.error('Error approving collection');
    }
  };

  // Function to open approval modal
  const openApprovalModal = (image: any) => {
    setSelectedPendingImage(image);
    
    // ✅ CORRIGIDO: Usar funções utilitárias UTC
    const defaultDate = addDaysToUTC(7);
    setApprovalLaunchDate(defaultDate.toISOString().slice(0, 16)); // Default 7 days from now
    
    // Initialize approval form with pending image data
    setApprovalForm({
      // Basic info from pending image
      name: image.name || '',
      description: image.description || '',
      price: image.price || '0.1 CHZ',
      maxSupply: image.maxSupply || 100,
      status: 'upcoming' as LaunchpadStatus,
      
      // Creator info
      creatorName: image.creator?.name || '',
      creatorAvatar: '/api/placeholder/40/40',
      contractAddress: '0x1234...5678',
      
      // Social links
      website: '',
      twitter: '',
      discord: '',
      
      // Collection details
      vision: image.description || '',
      utility: ['Exclusive access to community events'],
      team: [{ 
        name: image.creator?.name || 'Creator', 
        role: 'Creator', 
        avatar: '/api/placeholder/60/60', 
        bio: 'Creator of this unique collection' 
      }],
      roadmap: [
        { phase: 'Phase 1', title: 'Collection Launch', description: 'Launch of unique NFT collection', status: 'completed' },
        { phase: 'Phase 2', title: 'Utility Activation', description: 'Activate exclusive holder benefits', status: 'in-progress' },
        { phase: 'Phase 3', title: 'Community Expansion', description: 'Expand community and partnerships', status: 'upcoming' }
      ],
      mintStages: [
        { 
          id: 'public', 
          name: 'Public', 
          description: 'Open to everyone', 
          price: image.price || '0.1 CHZ', 
          walletLimit: 3, 
          status: 'upcoming',
          startTime: defaultDate.toISOString(),
          endTime: new Date(defaultDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      autoConfigureClaimConditions: false,
      claimCurrency: 'MATIC',
      maxSupplyPerPhase: 100
    });
    
    setShowApprovalModal(true);
  };

  // Function to confirm approval with custom date
  const confirmApproval = async () => {
    if (!selectedPendingImage) return;
    
    try {
      // Validate required fields
      if (!approvalForm.name || !approvalForm.description || !approvalForm.vision) {
        toast.error('Please fill in all required fields (Name, Description, Vision)');
        return;
      }
      
      // Prepare approval data with form data
      const approvalData = {
        launchDate: approvalLaunchDate,
        ...approvalForm
      };
      
      await approvePendingImage(selectedPendingImage._id, approvalData);
      
      setShowApprovalModal(false);
      setSelectedPendingImage(null);
      setApprovalLaunchDate('');
      setApprovalForm({
        name: '',
        description: '',
        price: '0.1 CHZ',
        maxSupply: 100,
        status: 'upcoming' as LaunchpadStatus,
        creatorName: '',
        creatorAvatar: '/api/placeholder/40/40',
        contractAddress: '0x1234...5678',
        website: '',
        twitter: '',
        discord: '',
        vision: '',
        utility: ['Exclusive access to community events'],
        team: [{ name: '', role: '', avatar: '/api/placeholder/60/60', bio: '' }],
        roadmap: [
          { phase: 'Phase 1', title: '', description: '', status: 'completed' },
          { phase: 'Phase 2', title: '', description: '', status: 'in-progress' },
          { phase: 'Phase 3', title: '', description: '', status: 'upcoming' }
        ],
        mintStages: [
          { 
            id: 'public', 
            name: 'Public', 
            description: 'Open to everyone', 
            price: '0.1 CHZ', 
            walletLimit: 3, 
            status: 'upcoming',
            startTime: '',
            endTime: ''
          }
        ],
        autoConfigureClaimConditions: false,
        claimCurrency: 'MATIC',
        maxSupplyPerPhase: 100
      });
    } catch (error) {
      console.error('Error confirming approval:', error);
    }
  };

  // Function to manually trigger auto-update
  const triggerAutoUpdate = async () => {
    try {
      const response = await fetch('/api/launchpad/auto-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Auto-updated ${data.updatedCount} collections`);
        
        // Refresh collections
        const collectionsResponse = await fetch('/api/launchpad/collections');
        const collectionsData = await collectionsResponse.json();
        if (collectionsData.success) {
          setCollections(collectionsData.collections || []);
        }
      } else {
        toast.error(data.error || 'Failed to auto-update');
      }
    } catch (error) {
      console.error('Error triggering auto-update:', error);
      toast.error('Error triggering auto-update');
    }
  };

  // Function to reject pending image (admin only)
  const rejectPendingImage = async (pendingImageId: string) => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch(`/api/launchpad/pending-images/${pendingImageId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image rejected');
        
        // Remove from pending images
        setPendingImages(prev => prev.filter(img => img._id !== pendingImageId));
      } else {
        toast.error(data.error || 'Failed to reject image');
      }
    } catch (error) {
      console.error('Error rejecting pending image:', error);
      toast.error('Error rejecting image');
    }
  };

  // Function to clean mock collections (admin only)
  const cleanMockCollections = async () => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch('/api/debug/clean-mock-collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Cleaned ${data.deletedCount} mock collections`);
        
        // Refresh collections
        const collectionsResponse = await fetch('/api/launchpad/collections');
        const collectionsData = await collectionsResponse.json();
        if (collectionsData.success) {
          setCollections(collectionsData.collections || []);
        }
      } else {
        toast.error(data.error || 'Failed to clean mock collections');
      }
    } catch (error) {
      console.error('Error cleaning mock collections:', error);
      toast.error('Error cleaning mock collections');
    }
  };



  // Function to investigate active collections (admin only)
  const investigateCollections = async () => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch('/api/debug/investigate-collections?type=launchpad&status=active');
      const data = await response.json();
      
      if (data.success) {
        console.log('🔍 Investigação das coleções ativas:', data);
        toast.success(`Analisadas ${data.count} coleções ativas`);
        
        // Mostrar detalhes no console
        if (data.problematicCollections && data.problematicCollections.length > 0) {
          console.log('⚠️ Coleções problemáticas encontradas:', data.problematicCollections);
          toast.error(`${data.problematicCollections.length} coleções com problemas encontradas`);
        }
        
        // Mostrar estatísticas
        console.log('📊 Estatísticas:', data.stats);
      } else {
        toast.error('Failed to investigate collections');
      }
    } catch (error) {
      console.error('Error investigating collections:', error);
      toast.error('Error investigating collections');
    }
  };

  // Function to clean problematic collections (admin only)
  const cleanProblematicCollections = async () => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch('/api/debug/investigate-collections?action=clean&type=launchpad&status=active', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Cleaned ${data.deletedCount} problematic collections`);
        // Recarregar coleções
        window.location.reload();
      } else {
        toast.error('Failed to clean problematic collections');
      }
    } catch (error) {
      console.error('Error cleaning problematic collections:', error);
      toast.error('Error cleaning problematic collections');
    }
  };

  // Function to check launchpad collections debug (admin only)
  const checkLaunchpadCollections = async () => {
    if (!isUserAdmin) return;

    try {
      const response = await fetch('/api/debug/check-launchpad-collections');
      const data = await response.json();

      if (data.success) {
        console.log('🔍 Launchpad Collections Analysis:', data);
        toast.success(`Analysis complete: ${data.stats.total} collections, ${data.stats.withIssues} with issues`);
        
        // Log detailed analysis to console
        console.log('📊 Statistics:', data.stats);
        console.log('🚨 Common Issues:', data.commonIssues);
        console.log('📋 Collections with Issues:', data.collections.filter((c: any) => c.hasIssues));
      } else {
        toast.error(data.error || 'Failed to analyze launchpad collections');
      }
    } catch (error) {
      console.error('Error analyzing launchpad collections:', error);
      toast.error('Error analyzing launchpad collections');
    }
  };

  // Private wallets management functions
  const addPrivateWallet = () => {
    setPrivateWallets(prev => [...prev, '']);
  };

  const removePrivateWallet = (index: number) => {
    setPrivateWallets(prev => prev.filter((_, i) => i !== index));
  };

  const updatePrivateWallet = (index: number, value: string) => {
    setPrivateWallets(prev => prev.map((wallet, i) => i === index ? value : wallet));
  };

  const savePrivateWallets = async (collectionId: string) => {
    try {
      const validWallets = privateWallets.filter(wallet => 
        wallet && wallet.length === 42 && wallet.startsWith('0x')
      );

      if (validWallets.length === 0) {
        toast.error('No valid wallet addresses provided');
        return;
      }

      const response = await fetch('/api/launchpad/private-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId,
          wallets: validWallets,
          stage: privateWalletStage
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Added ${data.addedCount} private wallets`);
        setPrivateWallets(['']); // Reset form
      } else {
        toast.error(data.error || 'Failed to save private wallets');
      }
    } catch (error) {
      console.error('❌ Error saving private wallets:', error);
      toast.error('Failed to save private wallets');
    }
  };

  const fetchPrivateWallets = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/launchpad/private-wallets?collectionId=${collectionId}`);
      const data = await response.json();

      if (data.success) {
        const walletAddresses = data.privateWallets.map((wallet: any) => wallet.walletAddress);
        setPrivateWallets(walletAddresses.length > 0 ? walletAddresses : ['']);
      }
    } catch (error) {
      console.error('❌ Error fetching private wallets:', error);
    }
  };

  // Funções para modal de edição
  const openEditModal = (collection: any) => {
    setSelectedCollection(collection);
    setEditForm({
      name: collection.name || '',
      description: collection.description || '',
      vision: collection.vision || '',
      creatorAvatar: collection.creatorAvatar || '',
      contractAddress: collection.contractAddress || '',
      website: collection.website || '',
      twitter: collection.twitter || '',
      discord: collection.discord || '',
      utility: collection.utility?.length > 0 ? collection.utility : [''],
      team: collection.team?.length > 0 ? collection.team : [{ name: '', role: '', avatar: '', bio: '' }],
      roadmap: collection.roadmap?.length > 0 ? collection.roadmap : [{ phase: '', title: '', description: '', status: 'upcoming' }],
      mintStages: collection.mintStages?.length > 0 ? collection.mintStages : [{ id: 'public', name: 'Public', description: '', price: '', walletLimit: 3, status: 'upcoming', startTime: '', endTime: '' }]
    });
    
    // Fetch existing private wallets for this collection
    if (collection._id) {
      fetchPrivateWallets(collection._id);
    }
    
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCollection(null);
    setEditForm({
      name: '',
      description: '',
      vision: '',
      creatorAvatar: '',
      contractAddress: '',
      website: '',
      twitter: '',
      discord: '',
      utility: [''],
      team: [{ name: '', role: '', avatar: '', bio: '' }],
      roadmap: [{ phase: '', title: '', description: '', status: 'upcoming' }],
      mintStages: [{ id: 'public', name: 'Public', description: '', price: '', walletLimit: 3, status: 'upcoming', startTime: '', endTime: '' }]
    });
  };

  const updateEditForm = (field: string, value: any, index?: number) => {
    if (index !== undefined) {
      setEditForm(prev => ({
        ...prev,
        [field]: (prev as any)[field].map((item: any, i: number) => 
          i === index ? { ...item, ...value } : item
        )
      }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Functions for approval form management
  const updateApprovalForm = (field: string, value: any, index?: number) => {
    if (index !== undefined) {
      setApprovalForm(prev => ({
        ...prev,
                [field]: (prev as any)[field].map((item: any, i: number) =>
          i === index ? value : item
        )
      }));
    } else {
      setApprovalForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const addApprovalArrayItem = (field: string, template: any) => {
    setApprovalForm(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], template]
    }));
  };

  const removeApprovalArrayItem = (field: string, index: number) => {
    setApprovalForm(prev => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const addArrayItem = (field: string, template: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], template]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const saveCollectionEdit = async () => {
    if (!selectedCollection) return;

    try {
      const response = await fetch(`/api/collections/${selectedCollection._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Collection updated successfully');
        closeEditModal();
        // Collections will be refreshed automatically
      } else {
        toast.error(data.error || 'Failed to update collection');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Error updating collection');
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
        {filteredCollections.map((collection, index) => (
          <LaunchpadCollectionCard 
            key={collection._id || `collection-${index}`} 
            collection={collection}
            isAdmin={isUserAdmin}
            onUpdateStatus={updateCollectionStatus}
            onEdit={openEditModal}
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

        {/* Pending Images Section - Admin Only */}
        {isUserAdmin && pendingImages.length > 0 && (
          <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
            <div className="max-w-7xl mx-auto">
                             <div className="mb-6 flex items-center justify-between">
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-2">Pending Images for Approval</h2>
                   <p className="text-gray-400">Review and approve images for Launchpad collections</p>
                 </div>
                 
                 <Button
                   onClick={triggerAutoUpdate}
                   size="sm"
                   variant="outline"
                   className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                 >
                   <Zap className="w-4 h-4 mr-2" />
                   Auto-Update Status
                 </Button>
                 
                 <Button
                   onClick={cleanMockCollections}
                   size="sm"
                   variant="outline"
                   className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                 >
                   <XCircle className="w-4 h-4 mr-2" />
                   Clean Mock Collections
                 </Button>
                 
                 
                 
                 <Button
                   onClick={investigateCollections}
                   size="sm"
                   variant="outline"
                   className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                 >
                   <Search className="w-4 h-4 mr-2" />
                   Investigate Collections
                 </Button>
                 
                 <Button
                   onClick={cleanProblematicCollections}
                   size="sm"
                   variant="outline"
                   className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Clean Problematic
                 </Button>
                 
                 <Button
                   onClick={checkLaunchpadCollections}
                   size="sm"
                   variant="outline"
                   className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                 >
                   <Search className="w-4 h-4 mr-2" />
                   Check Launchpad
                 </Button>
               </div>
              
              {pendingLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="cyber-card overflow-hidden">
                      <div className="aspect-square w-full bg-[#FDFDFD]/10 animate-pulse" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 w-3/4 bg-[#FDFDFD]/10 animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-[#FDFDFD]/10 animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingImages.map((image) => (
                    <Card key={image._id} className="cyber-card overflow-hidden">
                      <div className="aspect-square w-full relative overflow-hidden">
                        <Image
                          src={image.imageUrl}
                          alt={image.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{image.name}</h3>
                          <p className="text-sm text-gray-400">{image.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="secondary" className="cyber-badge">
                            {image.category}
                          </Badge>
                          <span className="text-gray-400">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                                                 <div className="flex gap-2">
                           <Button
                             onClick={() => openApprovalModal(image)}
                             size="sm"
                             className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                           >
                             <CheckCircle className="w-4 h-4 mr-1" />
                             Approve
                           </Button>
                          <Button
                            onClick={() => rejectPendingImage(image._id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                      Use the &quot;Enviar para Launchpad&quot; button in the jersey generation page to add collections for approval.
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

       {/* Approval Modal */}
       {showApprovalModal && selectedPendingImage && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
           <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Configure Collection: {selectedPendingImage.name}</h3>
               <Button
                 onClick={() => setShowApprovalModal(false)}
                 variant="ghost"
                 className="text-gray-400 hover:text-white"
               >
                 <XCircle className="w-5 h-5" />
               </Button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Basic Information */}
               <div className="space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h4>
                 
                 <div>
                   <Label htmlFor="approval-name" className="text-gray-300">Name *</Label>
                   <Input
                     id="approval-name"
                     value={approvalForm.name}
                     onChange={(e) => updateApprovalForm('name', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     placeholder="Collection name"
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="approval-description" className="text-gray-300">Description *</Label>
                   <Textarea
                     id="approval-description"
                     value={approvalForm.description}
                     onChange={(e) => updateApprovalForm('description', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     rows={3}
                     placeholder="Collection description"
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="approval-price" className="text-gray-300">Price</Label>
                     <Input
                       id="approval-price"
                       value={approvalForm.price}
                       onChange={(e) => updateApprovalForm('price', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="0.1 CHZ"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="approval-maxSupply" className="text-gray-300">Max Supply</Label>
                     <Input
                       id="approval-maxSupply"
                       type="number"
                       value={approvalForm.maxSupply}
                       onChange={(e) => updateApprovalForm('maxSupply', parseInt(e.target.value))}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="100"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <Label htmlFor="approval-status" className="text-gray-300">Status</Label>
                   <select
                     id="approval-status"
                     value={approvalForm.status}
                     onChange={(e) => updateApprovalForm('status', e.target.value)}
                     className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#A20131]"
                   >
                     <option value="upcoming">Upcoming</option>
                     <option value="active">Active</option>
                     <option value="hidden">Hidden</option>
                   </select>
                 </div>
                 
                 <div>
                   <Label htmlFor="approval-launchDate" className="text-gray-300">Launch Date & Time *</Label>
                   <input
                     type="datetime-local"
                     id="approval-launchDate"
                     value={approvalLaunchDate}
                     onChange={(e) => setApprovalLaunchDate(e.target.value)}
                     className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#A20131]"
                     min={new Date().toISOString().slice(0, 16)}
                   />
                   <p className="text-xs text-gray-400 mt-1">
                     When this date arrives, the collection will automatically become active
                   </p>
                 </div>
               </div>
               
               {/* Creator Information */}
               <div className="space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Creator Information</h4>
                 
                 <div>
                   <Label htmlFor="approval-creatorName" className="text-gray-300">Creator Name</Label>
                   <Input
                     id="approval-creatorName"
                     value={approvalForm.creatorName}
                     onChange={(e) => updateApprovalForm('creatorName', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     placeholder="Creator name"
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="approval-creatorAvatar" className="text-gray-300">Creator Avatar URL</Label>
                   <Input
                     id="approval-creatorAvatar"
                     value={approvalForm.creatorAvatar}
                     onChange={(e) => updateApprovalForm('creatorAvatar', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     placeholder="/api/placeholder/40/40"
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="approval-contractAddress" className="text-gray-300">Contract Address</Label>
                   <Input
                     id="approval-contractAddress"
                     value={approvalForm.contractAddress}
                     onChange={(e) => updateApprovalForm('contractAddress', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     placeholder="0x1234...5678"
                   />
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <Label htmlFor="approval-website" className="text-gray-300">Website</Label>
                     <Input
                       id="approval-website"
                       value={approvalForm.website}
                       onChange={(e) => updateApprovalForm('website', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="https://..."
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="approval-twitter" className="text-gray-300">Twitter</Label>
                     <Input
                       id="approval-twitter"
                       value={approvalForm.twitter}
                       onChange={(e) => updateApprovalForm('twitter', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="https://twitter.com/..."
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="approval-discord" className="text-gray-300">Discord</Label>
                     <Input
                       id="approval-discord"
                       value={approvalForm.discord}
                       onChange={(e) => updateApprovalForm('discord', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="https://discord.gg/..."
                     />
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Collection Details */}
             <div className="mt-8 space-y-6">
               <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Collection Details</h4>
               
               <div>
                 <Label htmlFor="approval-vision" className="text-gray-300">Vision *</Label>
                 <Textarea
                   id="approval-vision"
                   value={approvalForm.vision}
                   onChange={(e) => updateApprovalForm('vision', e.target.value)}
                   className="mt-1 bg-gray-800 border-gray-600 text-white"
                   rows={3}
                   placeholder="Collection vision and goals"
                 />
               </div>
               
               {/* Utility */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <Label className="text-gray-300">Utility & Benefits</Label>
                   <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     onClick={() => addApprovalArrayItem('utility', 'New benefit')}
                     className="text-xs"
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add Benefit
                   </Button>
                 </div>
                 {approvalForm.utility.map((benefit, index) => (
                   <div key={index} className="flex gap-2 mb-2">
                     <Input
                       value={benefit || ''}
                       onChange={(e) => updateApprovalForm('utility', e.target.value, index)}
                       className="flex-1 bg-gray-800 border-gray-600 text-white"
                       placeholder="Exclusive access to community events"
                     />
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={() => removeApprovalArrayItem('utility', index)}
                       className="text-red-400 hover:text-red-300"
                     >
                       <Minus className="w-3 h-3" />
                     </Button>
                   </div>
                 ))}
               </div>
               
               {/* Team */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <Label className="text-gray-300">Team Members</Label>
                   <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     onClick={() => addApprovalArrayItem('team', { name: '', role: '', avatar: '/api/placeholder/60/60', bio: '' })}
                     className="text-xs"
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add Member
                   </Button>
                 </div>
                 {approvalForm.team.map((member, index) => (
                   <div key={index} className="border border-gray-700 rounded p-3 mb-3">
                     <div className="grid grid-cols-2 gap-3 mb-2">
                       <Input
                         value={member.name}
                         onChange={(e) => updateApprovalForm('team', { ...member, name: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Member name"
                       />
                       <Input
                         value={member.role}
                         onChange={(e) => updateApprovalForm('team', { ...member, role: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Role"
                       />
                     </div>
                     <Input
                       value={member.avatar}
                       onChange={(e) => updateApprovalForm('team', { ...member, avatar: e.target.value }, index)}
                       className="bg-gray-800 border-gray-600 text-white mb-2"
                       placeholder="Avatar URL"
                     />
                     <Textarea
                       value={member.bio}
                       onChange={(e) => updateApprovalForm('team', { ...member, bio: e.target.value }, index)}
                       className="bg-gray-800 border-gray-600 text-white"
                       rows={2}
                       placeholder="Member bio"
                     />
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={() => removeApprovalArrayItem('team', index)}
                       className="text-red-400 hover:text-red-300 mt-2"
                     >
                       <Minus className="w-3 h-3 mr-1" />
                       Remove Member
                     </Button>
                   </div>
                 ))}
               </div>
               
               {/* Roadmap */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <Label className="text-gray-300">Roadmap</Label>
                   <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     onClick={() => addApprovalArrayItem('roadmap', { phase: '', title: '', description: '', status: 'upcoming' })}
                     className="text-xs"
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add Phase
                   </Button>
                 </div>
                 {approvalForm.roadmap.map((phase, index) => (
                   <div key={index} className="border border-gray-700 rounded p-3 mb-3">
                     <div className="grid grid-cols-2 gap-3 mb-2">
                       <Input
                         value={phase.phase}
                         onChange={(e) => updateApprovalForm('roadmap', { ...phase, phase: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Phase name"
                       />
                       <select
                         value={phase.status}
                         onChange={(e) => updateApprovalForm('roadmap', { ...phase, status: e.target.value }, index)}
                         className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
                       >
                         <option value="completed">Completed</option>
                         <option value="in-progress">In Progress</option>
                         <option value="upcoming">Upcoming</option>
                       </select>
                     </div>
                     <Input
                       value={phase.title}
                       onChange={(e) => updateApprovalForm('roadmap', { ...phase, title: e.target.value }, index)}
                       className="bg-gray-800 border-gray-600 text-white mb-2"
                       placeholder="Phase title"
                     />
                     <Textarea
                       value={phase.description}
                       onChange={(e) => updateApprovalForm('roadmap', { ...phase, description: e.target.value }, index)}
                       className="bg-gray-800 border-gray-600 text-white"
                       rows={2}
                       placeholder="Phase description"
                     />
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={() => removeApprovalArrayItem('roadmap', index)}
                       className="text-red-400 hover:text-red-300 mt-2"
                     >
                       <Minus className="w-3 h-3 mr-1" />
                       Remove Phase
                     </Button>
                   </div>
                 ))}
               </div>
               
               {/* Mint Stages */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <Label className="text-gray-300">Mint Stages</Label>
                   <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     onClick={() => addApprovalArrayItem('mintStages', { 
                       id: 'public', 
                       name: 'Public Sale', 
                       description: 'Open to everyone', 
                       price: '0.1 MATIC', 
                       walletLimit: 2, 
                       status: 'upcoming',
                       startTime: '',
                       endTime: ''
                     })}
                     className="text-xs"
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add Stage
                   </Button>
                 </div>
                 {approvalForm.mintStages.map((stage, index) => (
                   <div key={index} className="border border-gray-700 rounded p-3 mb-3">
                     <div className="grid grid-cols-3 gap-3 mb-2">
                       <Input
                         value={stage.name}
                         onChange={(e) => updateApprovalForm('mintStages', { ...stage, name: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Stage name"
                       />
                       <Input
                         value={stage.price}
                         onChange={(e) => updateApprovalForm('mintStages', { ...stage, price: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Price"
                       />
                       <Input
                         type="number"
                         value={stage.walletLimit}
                         onChange={(e) => updateApprovalForm('mintStages', { ...stage, walletLimit: parseInt(e.target.value) }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Wallet limit"
                       />
                     </div>
                     <Textarea
                       value={stage.description}
                       onChange={(e) => updateApprovalForm('mintStages', { ...stage, description: e.target.value }, index)}
                       className="bg-gray-800 border-gray-600 text-white mb-2"
                       rows={2}
                       placeholder="Stage description"
                     />
                     <div className="grid grid-cols-2 gap-3 mb-2">
                       <Input
                         type="datetime-local"
                         value={stage.startTime ? stage.startTime.slice(0, 16) : ''}
                         onChange={(e) => updateApprovalForm('mintStages', { ...stage, startTime: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Start time"
                       />
                       <Input
                         type="datetime-local"
                         value={stage.endTime ? stage.endTime.slice(0, 16) : ''}
                         onChange={(e) => updateApprovalForm('mintStages', { ...stage, endTime: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="End time"
                       />
                     </div>
                     <select
                       value={stage.status}
                       onChange={(e) => updateApprovalForm('mintStages', { ...stage, status: e.target.value }, index)}
                       className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 mb-2 w-full"
                     >
                       <option value="upcoming">Upcoming</option>
                       <option value="live">Live</option>
                       <option value="ended">Ended</option>
                     </select>
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={() => removeApprovalArrayItem('mintStages', index)}
                       className="text-red-400 hover:text-red-300"
                     >
                       <Minus className="w-3 h-3 mr-1" />
                       Remove Stage
                     </Button>
                   </div>
                 ))}
               </div>

               {/* Claim Conditions Configuration */}
               <div className="mt-8 space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                   ⚙️ Claim Conditions Configuration
                 </h4>
                 <p className="text-sm text-gray-400 mb-4">
                   Configure automatic claim conditions based on mint stages. This will set up on-chain conditions for your contract.
                 </p>
                 
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h5 className="text-white font-medium">Auto-Configure Claim Conditions</h5>
                       <p className="text-xs text-gray-400">Map mint stages to blockchain claim conditions</p>
                     </div>
                     <div className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         id="autoConfigureClaimConditions"
                         checked={approvalForm.autoConfigureClaimConditions || false}
                         onChange={(e) => updateApprovalForm('autoConfigureClaimConditions', e.target.checked)}
                         className="rounded"
                       />
                       <Label htmlFor="autoConfigureClaimConditions" className="text-gray-300 text-sm">
                         Enable Auto-Configuration
                       </Label>
                     </div>
                   </div>
                   
                   {approvalForm.autoConfigureClaimConditions && (
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label className="text-gray-300 text-sm">Default Currency</Label>
                           <select
                             value={approvalForm.claimCurrency || 'MATIC'}
                             onChange={(e) => updateApprovalForm('claimCurrency', e.target.value)}
                             className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                           >
                             <option value="MATIC">MATIC (Native - Polygon Amoy)</option>
                             <option value="USDC_AMOY">USDC (Polygon Amoy Testnet)</option>
                             <option value="USDT_AMOY">USDT (Polygon Amoy Testnet)</option>
                             <option value="WETH_AMOY">WETH (Polygon Amoy Testnet)</option>
                             <option value="FREE">Free Mint (0 cost)</option>
                           </select>
                         </div>
                         
                         <div>
                           <Label className="text-gray-300 text-sm">Max Supply per Phase</Label>
                           <Input
                             type="number"
                             value={approvalForm.maxSupplyPerPhase || ''}
                             onChange={(e) => updateApprovalForm('maxSupplyPerPhase', parseInt(e.target.value))}
                             className="mt-1 bg-gray-800 border-gray-600 text-white text-sm"
                             placeholder="100"
                           />
                         </div>
                       </div>
                       
                       <div className="border-t border-gray-600 pt-4">
                         <h6 className="text-white text-sm font-medium mb-3">🔄 Auto-Generated Claim Conditions Preview</h6>
                         <div className="space-y-2">
                           {approvalForm.mintStages && approvalForm.mintStages.length > 0 ? (
                             approvalForm.mintStages.map((stage, index) => (
                               <div key={index} className="bg-gray-900/50 border border-gray-600 rounded p-3">
                                 <div className="flex justify-between items-start">
                                   <div>
                                     <div className="text-white text-sm font-medium">{stage.name || `Phase ${index + 1}`}</div>
                                     <div className="text-xs text-gray-400 mt-1">
                                       Price: {approvalForm.claimCurrency === 'FREE' ? 'Free Mint' : `${stage.price || '0'} ${(approvalForm.claimCurrency || 'MATIC').replace('_AMOY', '')}`} • 
                                       Limit: {stage.walletLimit || 'Unlimited'} per wallet
                                     </div>
                                     <div className="text-xs text-gray-500 mt-1">
                                       {stage.startTime ? `Start: ${new Date(stage.startTime).toLocaleDateString()}` : 'Start: Not set'} • 
                                       {stage.endTime ? `End: ${new Date(stage.endTime).toLocaleDateString()}` : 'End: Not set'}
                                     </div>
                                   </div>
                                   <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                     Auto-configured
                                   </div>
                                 </div>
                               </div>
                             ))
                           ) : (
                             <div className="text-gray-400 text-sm italic">
                               Add mint stages above to see claim conditions preview
                             </div>
                           )}
                         </div>
                       </div>
                       
                       <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                         <div className="flex items-start space-x-2">
                           <div className="text-yellow-400 mt-0.5">⚠️</div>
                           <div>
                             <div className="text-yellow-400 text-sm font-medium">Important</div>
                             <div className="text-yellow-300 text-xs mt-1">
                               Claim conditions will be automatically configured on your contract when this collection is approved.
                               Make sure your contract address is correct and you have admin permissions.
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Private Wallets Section */}
               <div className="mt-8 space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Private Wallets</h4>
                 <p className="text-sm text-gray-400 mb-4">
                   Add wallet addresses that will be enabled for private minting phases
                 </p>
                 
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <Label className="text-gray-300">Wallet Addresses</Label>
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                       onClick={addPrivateWallet}
                       className="text-xs"
                     >
                       <Plus className="w-3 h-3 mr-1" />
                       Add Wallet
                     </Button>
                   </div>
                   
                   {privateWallets.map((wallet, index) => (
                     <div key={index} className="flex gap-2">
                       <Input
                         value={wallet}
                         onChange={(e) => updatePrivateWallet(index, e.target.value)}
                         className="flex-1 bg-gray-800 border-gray-600 text-white"
                         placeholder="0x1234...5678"
                       />
                       <Button
                         type="button"
                         size="sm"
                         variant="outline"
                         onClick={() => removePrivateWallet(index)}
                         className="text-red-400 hover:text-red-300"
                       >
                         <Minus className="w-3 h-3" />
                       </Button>
                     </div>
                   ))}
                   
                   <div>
                     <Label htmlFor="private-wallet-stage" className="text-gray-300">Stage</Label>
                     <select
                       id="private-wallet-stage"
                       value={privateWalletStage}
                       onChange={(e) => setPrivateWalletStage(e.target.value)}
                       className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#A20131]"
                     >
                       <option value="vip">VIP (Earliest Access)</option>
                       <option value="whitelist">Whitelist (Early Access)</option>
                       <option value="public">Public (Open to All)</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-3 mt-8">
               <Button
                 onClick={() => setShowApprovalModal(false)}
                 variant="outline"
                 className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
               >
                 Cancel
               </Button>
               <Button
                 onClick={confirmApproval}
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white"
               >
                 <CheckCircle className="w-4 h-4 mr-2" />
                 Approve Collection
               </Button>
             </div>
           </div>
         </div>
       )}

       {/* Edit Collection Modal */}
       {showEditModal && selectedCollection && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
           <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Edit Collection: {selectedCollection.name}</h3>
               <Button
                 onClick={closeEditModal}
                 variant="ghost"
                 className="text-gray-400 hover:text-white"
               >
                 <XCircle className="w-5 h-5" />
               </Button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Basic Information */}
               <div className="space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h4>
                 
                 <div>
                   <Label htmlFor="name" className="text-gray-300">Name</Label>
                   <Input
                     id="name"
                     value={editForm.name}
                     onChange={(e) => updateEditForm('name', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="description" className="text-gray-300">Description</Label>
                   <Textarea
                     id="description"
                     value={editForm.description}
                     onChange={(e) => updateEditForm('description', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     rows={3}
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="vision" className="text-gray-300">Vision</Label>
                   <Textarea
                     id="vision"
                     value={editForm.vision}
                     onChange={(e) => updateEditForm('vision', e.target.value)}
                     className="mt-1 bg-gray-800 border-gray-600 text-white"
                     rows={3}
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="creatorAvatar" className="text-gray-300">Creator Avatar URL</Label>
                     <Input
                       id="creatorAvatar"
                       value={editForm.creatorAvatar}
                       onChange={(e) => updateEditForm('creatorAvatar', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="contractAddress" className="text-gray-300">Contract Address</Label>
                     <Input
                       id="contractAddress"
                       value={editForm.contractAddress}
                       onChange={(e) => updateEditForm('contractAddress', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                     />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <Label htmlFor="website" className="text-gray-300">Website</Label>
                     <Input
                       id="website"
                       value={editForm.website}
                       onChange={(e) => updateEditForm('website', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="twitter" className="text-gray-300">Twitter</Label>
                     <Input
                       id="twitter"
                       value={editForm.twitter}
                       onChange={(e) => updateEditForm('twitter', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="discord" className="text-gray-300">Discord</Label>
                     <Input
                       id="discord"
                       value={editForm.discord}
                       onChange={(e) => updateEditForm('discord', e.target.value)}
                       className="mt-1 bg-gray-800 border-gray-600 text-white"
                     />
                   </div>
                 </div>
               </div>
               
               {/* Advanced Information */}
               <div className="space-y-4">
                 <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Advanced Information</h4>
                 
                 {/* Utility */}
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <Label className="text-gray-300">Utility & Benefits</Label>
                     <Button
                       size="sm"
                       onClick={() => addArrayItem('utility', '')}
                       className="bg-[#A20131] hover:bg-[#A20131]/90"
                     >
                       <Plus className="w-4 h-4" />
                     </Button>
                   </div>
                   {editForm.utility.map((item, index) => (
                     <div key={index} className="flex gap-2 mb-2">
                       <Input
                         value={item}
                         onChange={(e) => updateEditForm('utility', e.target.value, index)}
                         className="flex-1 bg-gray-800 border-gray-600 text-white"
                         placeholder="Enter utility benefit"
                       />
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => removeArrayItem('utility', index)}
                         className="text-red-400 hover:text-red-300"
                       >
                         <Minus className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
                 
                 {/* Team */}
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <Label className="text-gray-300">Team Members</Label>
                     <Button
                       size="sm"
                       onClick={() => addArrayItem('team', { name: '', role: '', avatar: '', bio: '' })}
                       className="bg-[#A20131] hover:bg-[#A20131]/90"
                     >
                       <Plus className="w-4 h-4" />
                     </Button>
                   </div>
                   {editForm.team.map((member, index) => (
                     <div key={index} className="border border-gray-700 rounded p-3 mb-3">
                       <div className="grid grid-cols-2 gap-2 mb-2">
                         <Input
                           value={member.name}
                           onChange={(e) => updateEditForm('team', { name: e.target.value }, index)}
                           className="bg-gray-800 border-gray-600 text-white"
                           placeholder="Name"
                         />
                         <Input
                           value={member.role}
                           onChange={(e) => updateEditForm('team', { role: e.target.value }, index)}
                           className="bg-gray-800 border-gray-600 text-white"
                           placeholder="Role"
                         />
                       </div>
                       <Input
                         value={member.avatar}
                         onChange={(e) => updateEditForm('team', { avatar: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white mb-2"
                         placeholder="Avatar URL"
                       />
                       <Textarea
                         value={member.bio}
                         onChange={(e) => updateEditForm('team', { bio: e.target.value }, index)}
                         className="bg-gray-800 border-gray-600 text-white"
                         placeholder="Bio"
                         rows={2}
                       />
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => removeArrayItem('team', index)}
                         className="text-red-400 hover:text-red-300 mt-2"
                       >
                         <Minus className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                 </div>

                 {/* Private Wallets Section */}
                 <div className="mt-6 space-y-4">
                   <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Private Wallets</h4>
                   <p className="text-sm text-gray-400 mb-4">
                     Manage wallet addresses enabled for private minting phases
                   </p>
                   
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <Label className="text-gray-300">Wallet Addresses</Label>
                       <Button
                         size="sm"
                         onClick={addPrivateWallet}
                         className="bg-[#A20131] hover:bg-[#A20131]/90"
                       >
                         <Plus className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     {privateWallets.map((wallet, index) => (
                       <div key={index} className="flex gap-2">
                         <Input
                           value={wallet}
                           onChange={(e) => updatePrivateWallet(index, e.target.value)}
                           className="flex-1 bg-gray-800 border-gray-600 text-white"
                           placeholder="0x1234...5678"
                         />
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => removePrivateWallet(index)}
                           className="text-red-400 hover:text-red-300"
                         >
                           <Minus className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                     
                     <div>
                       <Label htmlFor="edit-private-wallet-stage" className="text-gray-300">Stage</Label>
                       <select
                         id="edit-private-wallet-stage"
                         value={privateWalletStage}
                         onChange={(e) => setPrivateWalletStage(e.target.value)}
                         className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#A20131]"
                       >
                         <option value="vip">VIP (Earliest Access)</option>
                         <option value="whitelist">Whitelist (Early Access)</option>
                         <option value="public">Public (Open to All)</option>
                       </select>
                     </div>
                     
                     <Button
                       onClick={() => selectedCollection?._id && savePrivateWallets(selectedCollection._id)}
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                     >
                       Save Private Wallets
                     </Button>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
               <Button
                 onClick={closeEditModal}
                 variant="outline"
                 className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
               >
                 Cancel
               </Button>
               <Button
                 onClick={saveCollectionEdit}
                 className="flex-1 bg-[#A20131] hover:bg-[#A20131]/90 text-white"
               >
                 <CheckCircle className="w-4 h-4 mr-2" />
                 Save Changes
               </Button>
             </div>
           </div>
         </div>
       )}
     </main>
   );
 } 