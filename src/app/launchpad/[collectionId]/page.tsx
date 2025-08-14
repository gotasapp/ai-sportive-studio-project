'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Copy, 
  ExternalLink,
  Plus,
  Minus,
  Wallet,
  Globe,
  Twitter,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { claimTo, getActiveClaimCondition } from 'thirdweb/extensions/erc721';
import { sendTransaction } from 'thirdweb/transaction';
import { IPFSService } from '@/lib/services/ipfs-service';
import { isAdmin } from '@/lib/admin-config';
import { useIsMobile } from '@/hooks/useIsMobile';
import CollectionMintMobileLayout from '@/components/launchpad/CollectionMintMobileLayout';

// Remover dados mockados - agora vamos buscar do banco de dados

export default function CollectionMintPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;
  const isMobile = useIsMobile();
  
  // Thirdweb hooks
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  
  // Admin check
  const isUserAdmin = isAdmin(account);
  
  // Collection-specific claim functions state
  const [collectionClaimFunctions, setCollectionClaimFunctions] = useState<{
    claimLaunchpadNFT: ((quantity: number) => Promise<any>) | null;
    getLaunchpadClaimCondition: (() => Promise<any>) | null;
  }>({ claimLaunchpadNFT: null, getLaunchpadClaimCondition: null });
  
  // Engine hook for gasless admin mint
  const { 
    mintGasless,
    isLoading: isGaslessMintingEngine
  } = useEngine();
  
  const [mintQuantity, setMintQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Claim conditions state
  const [claimCondition, setClaimCondition] = useState<any>(null);
  const [isLoadingClaimCondition, setIsLoadingClaimCondition] = useState(true);
  
  // Minting states
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  
  // Gasless mint states for admin
  const [isGaslessMinting, setIsGaslessMinting] = useState(false);
  const [gaslessMintError, setGaslessMintError] = useState<string | null>(null);
  const [gaslessMintSuccess, setGaslessMintSuccess] = useState<string | null>(null);

  // Buscar dados da coleção do banco de dados
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/launchpad/collections/${collectionId}`);
        const data = await response.json();
        
        if (data.success) {
          setCollection(data.collection);
        } else {
          setError(data.error || 'Failed to load collection');
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  // Create collection-specific claim functions when collection loads
  useEffect(() => {
    if (!collection?.contractAddress || !account) {
      setCollectionClaimFunctions({ claimLaunchpadNFT: null, getLaunchpadClaimCondition: null });
      return;
    }

    const client = createThirdwebClient({ 
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '' 
    });
    
    const amoy = defineChain({
      id: 80002,
      name: 'Polygon Amoy Testnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    });
    
    const collectionContract = getContract({
      client,
      chain: amoy,
      address: collection.contractAddress,
    });
    
    const claimCollectionNFT = async (quantity: number) => {
      if (!account) throw new Error('Wallet not connected');
      
      const claimCondition = await getActiveClaimCondition({ contract: collectionContract });
      const totalCost = claimCondition.pricePerToken * BigInt(quantity);
      
      const baseTx = claimTo({
        contract: collectionContract,
        to: account.address,
        quantity: BigInt(quantity),
      });
      
      const transaction = {
        ...baseTx,
        value: totalCost,
      };
      
      return await sendTransaction({ transaction, account });
    };
    
    const getCollectionClaimCondition = async () => {
      return await getActiveClaimCondition({ contract: collectionContract });
    };
    
    setCollectionClaimFunctions({
      claimLaunchpadNFT: claimCollectionNFT,
      getLaunchpadClaimCondition: getCollectionClaimCondition
    });

    console.log(`🎯 Created collection-specific functions for contract: ${collection.contractAddress}`);
  }, [collection, account]);

  // Carregar claim conditions quando a collection estiver disponível
  useEffect(() => {
    const loadClaimConditions = async () => {
      if (!collection || !collectionClaimFunctions.getLaunchpadClaimCondition) return;
      
      try {
        setIsLoadingClaimCondition(true);
        const condition = await collectionClaimFunctions.getLaunchpadClaimCondition();
        setClaimCondition(condition);
        console.log('📋 Claim condition loaded successfully for contract:', collection.contractAddress);
      } catch (error) {
        console.error('❌ Failed to load claim conditions:', error);
        setClaimCondition(null);
      } finally {
        setIsLoadingClaimCondition(false);
      }
    };

    loadClaimConditions();
  }, [collection, collectionClaimFunctions]);

  // Countdown timer
  useEffect(() => {
    if (!collection || !collection.endDate) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(collection.endDate).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('ENDED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [collection]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A20131] mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-white">Loading collection...</h1>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Collection not found'}
          </h1>
          <Link href="/launchpad">
            <Button>Back to Launchpad</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = collection.minted && collection.totalSupply 
    ? (collection.minted / collection.totalSupply) * 100 
    : 0;
  
  // Helper para formatar preço das claim conditions
  const formatPrice = (priceWei: bigint) => {
    if (priceWei === BigInt(0)) return '0 MATIC';
    
    // Converter de wei para MATIC (18 decimais)
    const priceInMatic = Number(priceWei) / Math.pow(10, 18);
    return `${priceInMatic.toFixed(4)} MATIC`;
  };
  
  // Usar claim conditions para determinar preço e limites
  const currentPrice = claimCondition ? formatPrice(claimCondition.pricePerToken) : (collection.price || '0 MATIC');
  const maxQuantity = claimCondition ? Math.min(
    Number(claimCondition.quantityLimitPerWallet),
    Number(claimCondition.maxClaimableSupply - claimCondition.supplyClaimed),
    10 // Máximo absoluto
  ) : 1;

  const handleQuantityChange = (change: number) => {
    const newQuantity = mintQuantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setMintQuantity(newQuantity);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Por favor conecte sua wallet para mintar');
      return;
    }
    
    if (!claimCondition) {
      toast.error('Claim conditions não carregadas. Tente novamente.');
      return;
    }
    
    if (!collection || collection.status !== 'active') {
      toast.error('Esta coleção não está disponível para mint');
      return;
    }
    
    const remaining = Number(claimCondition.maxClaimableSupply - claimCondition.supplyClaimed);
    if (remaining <= 0) {
      toast.error('Todos os NFTs desta coleção já foram mintados');
      return;
    }
    
    if (mintQuantity > remaining) {
      toast.error(`Apenas ${remaining} NFTs restantes`);
      return;
    }
    
    setIsMinting(true);
    setMintError(null);
    setMintSuccess(null);
    
    try {
      console.log('🚀 Starting public mint with claim conditions...', {
        collectionId: collection._id,
        collectionName: collection.name,
        mintQuantity,
        userAddress: address,
        pricePerToken: claimCondition.pricePerToken.toString(),
        totalCost: (claimCondition.pricePerToken * BigInt(mintQuantity)).toString()
      });
      
      // Mint público usando claim conditions (usuário paga gas + preço)
      if (!collectionClaimFunctions.claimLaunchpadNFT) {
        throw new Error('Collection-specific claim function not available');
      }
      const result = await collectionClaimFunctions.claimLaunchpadNFT(mintQuantity);
      
      console.log('✅ Public mint successful:', result);
      
      // Atualizar claim conditions após o mint
      try {
        if (collectionClaimFunctions.getLaunchpadClaimCondition) {
          const updatedCondition = await collectionClaimFunctions.getLaunchpadClaimCondition();
          setClaimCondition(updatedCondition);
        }
      } catch (error) {
        console.warn('Failed to refresh claim conditions:', error);
      }
      
      // ✅ Coleção aparecerá automaticamente no marketplace
      // baseado no contador 'minted' que será atualizado abaixo
      console.log('✅ Collection will appear in marketplace automatically');

      // Atualizar dados da coleção no banco (launchpad_collections)
      if (collection._id) {
        fetch(`/api/launchpad/collections/${collection._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            minted: (collection.minted || 0) + mintQuantity
          })
        }).then(async (updateResponse) => {
          if (updateResponse.ok) {
            console.log('✅ Collection minted count updated in launchpad_collections');
            // Refresh collection data
            const refreshResponse = await fetch(`/api/launchpad/collections/${collectionId}`);
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setCollection(refreshData.collection);
            }
          } else {
            console.warn('❌ Failed to update collection minted count');
          }
        }).catch(console.warn);
      }
      
      setMintSuccess(`🎉 Successfully minted ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}!`);
      toast.success(`Mint successful`);
      
    } catch (error: any) {
      console.error('❌ Public mint failed:', error);
      const errorMessage = error?.reason || error?.message || 'Mint failed';
      setMintError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  // Gasless mint function for admin
  const handleGaslessMint = async () => {
    if (!isUserAdmin) {
      toast.error('Admin access required for gasless mint');
      return;
    }
    
    if (!address) {
      toast.error('Please connect your wallet to receive the NFT');
      return;
    }
    
    if (!collection || collection.status !== 'active') {
      toast.error('This collection is not available for minting');
      return;
    }
    
    if (collection.minted >= collection.totalSupply) {
      toast.error('All NFTs in this collection have been minted');
      return;
    }
    
    setIsGaslessMinting(true);
    setGaslessMintError(null);
    setGaslessMintSuccess(null);
    
    try {
      console.log('🚀 Starting Admin Gasless mint process...', {
        collectionId: collection._id,
        collectionName: collection.name,
        mintQuantity,
        adminAddress: address
      });
      
      // Create metadata for the NFT
      const nftName = `${collection.name} #${collection.minted + 1}`;
      const nftDescription = `${collection.description} - Part of the ${collection.name} collection.`;
      
      const attributes = [
        { trait_type: 'Collection', value: collection.name },
        { trait_type: 'Category', value: collection.category },
        { trait_type: 'Creator', value: collection.creator },
        { trait_type: 'Status', value: collection.status },
        { trait_type: 'Mint Number', value: (collection.minted + 1).toString() },
        { trait_type: 'Total Supply', value: collection.totalSupply.toString() },
        { trait_type: 'Mint Type', value: 'Admin Gasless' }
      ];
      
      // Add collection-specific traits if available
      if (collection.traits && Array.isArray(collection.traits)) {
        collection.traits.forEach((trait: any) => {
          if (trait.trait_type && trait.value) {
            attributes.push({ trait_type: trait.trait_type, value: trait.value });
          }
        });
      }
      
      // For Launchpad collections, we'll use the collection image
      const imageUrl = collection.image;
      
      // Download the image and convert to blob
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Criar metadados simplificados
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageUrl,
        attributes
      };
      
      // Upload metadata to IPFS
      const metadataUrl = await IPFSService.uploadMetadata(metadata);
      
      console.log('✅ IPFS upload completed for gasless mint:', metadataUrl);
      
      // Gasless mint via dedicated Launchpad endpoint (ensures correct contract)
      if (!collection.contractAddress) {
        throw new Error('Contract address not configured for this collection');
      }

      const resp = await fetch('/api/launchpad/admin-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: address,
          metadataUri: metadataUrl,
          contractAddress: collection.contractAddress,
          quantity: mintQuantity,
        }),
      });
      const result = await resp.json();
      if (!resp.ok || !result.success) {
        throw new Error(result.error || 'Admin gasless mint failed');
      }
      console.log('✅ Gasless mint enqueued:', result);
      setGaslessMintSuccess(`🎉 Successfully gasless minted ${mintQuantity} NFT(s)! Queue ID: ${result.queueId}`);
      
      // Atualizar claim conditions após o mint
      try {
        if (collectionClaimFunctions.getLaunchpadClaimCondition) {
          const updatedCondition = await collectionClaimFunctions.getLaunchpadClaimCondition();
          setClaimCondition(updatedCondition);
        }
      } catch (error) {
        console.warn('Failed to refresh claim conditions:', error);
      }
      
      // Update collection mint count in database (launchpad_collections)
      const updateResponse = await fetch(`/api/launchpad/collections/${collection._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minted: (collection.minted || 0) + mintQuantity
        })
      });
      
      if (updateResponse.ok) {
        // Refresh collection data
        const refreshResponse = await fetch(`/api/launchpad/collections/${collectionId}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setCollection(refreshData.collection);
        }
      }
      
      setGaslessMintSuccess(`🎉 Successfully gasless minted ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}! Queue ID: ${result.queueId}`);
      toast.success(`Successfully gasless minted ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}!`);
      
    } catch (error: any) {
      console.error('❌ Gasless mint failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gasless minting failed';
      setGaslessMintError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGaslessMinting(false);
    }
  };

  const copyContractAddress = () => {
    navigator.clipboard.writeText(collection.contractAddress);
    // toast.success('Contract address copied to clipboard'); // Removed icon as per memory
  };

  // Mobile layout check
  if (isMobile) {
    return (
      <CollectionMintMobileLayout
        collection={collection}
        claimCondition={claimCondition}
        mintQuantity={mintQuantity}
        setMintQuantity={setMintQuantity}
        email={email}
        setEmail={setEmail}
        timeRemaining={timeRemaining}
        onMint={handleMint}
        onGaslessMint={handleGaslessMint}
        isMinting={isMinting}
        isGaslessMinting={isGaslessMinting}
        isConnected={isConnected}
        isUserAdmin={isUserAdmin}
        mintError={mintError}
        gaslessMintError={gaslessMintError}
        mintSuccess={mintSuccess}
        gaslessMintSuccess={gaslessMintSuccess}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Collection Header */}
            <div className="relative">
              <div className="aspect-[3/1] rounded-xl overflow-hidden">
                <Image
                  src={collection.bannerImage}
                  alt={collection.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              
              <div className="absolute bottom-6 left-6 flex items-end gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src={collection.creatorAvatar || '/api/placeholder/40/40'}
                        alt={collection.creator}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{collection.creator}</span>
                    </div>
                    {collection.contractAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyContractAddress}
                        className="text-gray-300 hover:text-white p-0 h-auto"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy token address
                      </Button>
                    )}
                    <Link href="#" className="text-gray-300 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="absolute top-6 right-6 flex gap-2">
                {collection.website && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={collection.website} target="_blank">
                      <Globe className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                {collection.twitter && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={collection.twitter} target="_blank">
                      <Twitter className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                {collection.discord && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={collection.discord} target="_blank">
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Progress and Stats */}
            <Card className="bg-[#14101e] border-gray-700">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{Math.round(progress)}%</div>
                    <div className="text-sm text-gray-400">Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{collection.minted || 0}</div>
                    <div className="text-sm text-gray-400">Total Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{collection.totalSupply || 0}</div>
                    <div className="text-sm text-gray-400">Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{timeRemaining || 'N/A'}</div>
                    <div className="text-sm text-gray-400">Time Left</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{collection.minted || 0} / {collection.totalSupply || 0}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[#14101e] border-gray-700 w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="roadmap" className="flex-1">Roadmap</TabsTrigger>
                <TabsTrigger value="team" className="flex-1">Team</TabsTrigger>
                <TabsTrigger value="utility" className="flex-1">Utility</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-[#14101e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">About {collection.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 leading-relaxed">{collection.description}</p>
                    <Separator className="my-6 bg-gray-700" />
                    {collection.vision && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Vision</h3>
                        <p className="text-gray-400 leading-relaxed">{collection.vision}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roadmap" className="mt-6">
                <Card className="bg-[#14101e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Roadmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {collection.roadmap?.map((phase: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            phase.status === 'completed' ? 'bg-green-500' :
                            phase.status === 'in-progress' ? 'bg-[#A20131]' : 'bg-gray-600'
                          }`}>
                            {phase.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : phase.status === 'in-progress' ? (
                              <Clock className="w-4 h-4 text-white" />
                            ) : (
                              <Lock className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{phase.phase}: {phase.title}</h4>
                            <p className="text-gray-400 text-sm">{phase.description}</p>
                          </div>
                        </div>
                      ))}
                      {!collection.roadmap || collection.roadmap.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No roadmap available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <Card className="bg-[#14101e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {collection.team?.map((member: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <img
                            src={member.avatar || '/api/placeholder/60/60'}
                            alt={member.name}
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <h4 className="font-semibold text-white">{member.name}</h4>
                            <p className="text-[#A20131] text-sm font-medium">{member.role}</p>
                            <p className="text-gray-400 text-sm mt-1">{member.bio}</p>
                          </div>
                        </div>
                      ))}
                      {!collection.team || collection.team.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No team information available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="utility" className="mt-6">
                <Card className="bg-[#14101e] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Utility & Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {collection.utility?.map((benefit: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-400">{benefit}</p>
                        </div>
                      ))}
                      {!collection.utility || collection.utility.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No utility information available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Mint Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Mint Stages */}
              <Card className="bg-[#14101e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Mint Stages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {collection.mintStages?.map((stage: any) => (
                    <div 
                      key={stage.id}
                      className={`p-4 rounded-lg border ${
                        stage.status === 'live' 
                          ? 'border-[#A20131] bg-[#A20131]/10' 
                          : 'border-gray-600 bg-gray-800/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {stage.status === 'live' ? (
                            <Unlock className="w-4 h-4 text-[#A20131]" />
                          ) : stage.status === 'ended' ? (
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-white">{stage.name}</span>
                        </div>
                        <Badge 
                          className={`${
                            stage.status === 'live' 
                              ? 'bg-[#A20131]/20 text-[#A20131] border-[#A20131]/50' 
                              : stage.status === 'ended'
                              ? 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                          }`}
                        >
                          {stage.status === 'live' && timeRemaining !== 'ENDED' && (
                            <span className="mr-1">ENDS IN {timeRemaining.split(' ').slice(0, 2).join(' ')}</span>
                          )}
                          {stage.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{stage.description}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Wallet Limit {stage.walletLimit} • Price {stage.price}</span>
                      </div>
                    </div>
                  ))}
                  {!collection.mintStages || collection.mintStages.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No mint stages available</p>
                  )}
                </CardContent>
              </Card>

              {/* Mint Interface */}
              <Card className="bg-[#14101e] border-gray-700">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoadingClaimCondition ? 'Loading...' : currentPrice}
                    </div>
                    <div className="text-sm text-gray-400">
                      {claimCondition && (
                        <div className="space-y-1">
                          <div>Price per NFT</div>
                          {mintQuantity > 1 && (
                            <div className="text-xs">
                              Total: {formatPrice(claimCondition.pricePerToken * BigInt(mintQuantity))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Claim Condition Info */}
                  {claimCondition && (
                    <div className="grid grid-cols-2 gap-3 text-xs bg-gray-800/50 p-3 rounded-lg">
                      <div className="text-center">
                        <div className="text-gray-400">Available</div>
                        <div className="text-white font-medium">
                          {Number(claimCondition.maxClaimableSupply - claimCondition.supplyClaimed)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">Max per Wallet</div>
                        <div className="text-white font-medium">
                          {Number(claimCondition.quantityLimitPerWallet)}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-gray-700" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Quantity</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={mintQuantity <= 1}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center text-white font-medium">{mintQuantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(1)}
                          disabled={mintQuantity >= maxQuantity}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Email Address (Optional)</label>
                      <Input
                        type="email"
                        placeholder="hello@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#0b0518] border-gray-600 text-white"
                      />
                    </div>

                    <div className="text-xs text-gray-400 text-center">
                      By clicking &quot;mint&quot;, you agree to the Magic Eden Terms of Service.
                    </div>

                    {/* Mint Status Messages */}
                    {mintError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{mintError}</span>
                        </div>
                      </div>
                    )}

                    {mintSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">{mintSuccess}</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleMint}
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
                      size="lg"
                      disabled={!isConnected || isMinting || isLoadingClaimCondition || !claimCondition || collection.status !== 'active' || maxQuantity <= 0}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {isMinting ? 'Minting...' : 
                       isLoadingClaimCondition ? 'Loading...' :
                       !isConnected ? 'Connect Wallet to mint' : 
                       !claimCondition ? 'Claim conditions not available' :
                       collection.status !== 'active' ? 'Minting not available' :
                       maxQuantity <= 0 ? 'All NFTs minted' :
                       `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''} - ${claimCondition ? formatPrice(claimCondition.pricePerToken * BigInt(mintQuantity)) : '...'}`}
                    </Button>

                    {/* Admin Gasless Mint Button */}
                    {isUserAdmin && (
                      <>
                        <Separator className="bg-gray-700" />
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-2">Admin Only</div>
                        </div>

                        {/* Gasless Mint Status Messages */}
                        {gaslessMintError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">{gaslessMintError}</span>
                            </div>
                          </div>
                        )}

                        {gaslessMintSuccess && (
                          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">{gaslessMintSuccess}</span>
                            </div>
                          </div>
                        )}

                        <Button 
                          onClick={handleGaslessMint}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          size="lg"
                          disabled={!isConnected || isGaslessMinting || isGaslessMintingEngine || collection.status !== 'active'}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {isGaslessMinting || isGaslessMintingEngine ? 'Gasless Minting...' : 
                           !isConnected ? 'Connect Wallet for gasless mint' : 
                           collection.status !== 'active' ? 'Gasless mint not available' :
                           `Gasless Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}`}
                        </Button>
                        
                        <div className="text-xs text-gray-400 text-center mt-2">
                          Backend pays gas fees
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 