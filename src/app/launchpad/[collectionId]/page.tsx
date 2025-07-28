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
import { useEngine } from '@/lib/useEngine';
import { IPFSService } from '@/lib/services/ipfs-service';

// Remover dados mockados - agora vamos buscar do banco de dados

export default function CollectionMintPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;
  
  // Thirdweb hooks
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  
  // Engine hooks for minting
  const { 
    mintGasless,
    isLoading: isEngineLoading,
    error: engineError,
  } = useEngine();
  
  const [mintQuantity, setMintQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Minting states
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);

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
  const currentStage = collection.mintStages?.find(stage => stage.status === 'live');
  const currentPrice = currentStage?.price || collection.mintStages?.[0]?.price || collection.price || '0.1 CHZ';
  const maxQuantity = currentStage?.walletLimit || 1;

  const handleQuantityChange = (change: number) => {
    const newQuantity = mintQuantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setMintQuantity(newQuantity);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to mint');
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
    
    setIsMinting(true);
    setMintError(null);
    setMintSuccess(null);
    
    try {
      console.log('🚀 Starting Launchpad mint process...', {
        collectionId: collection._id,
        collectionName: collection.name,
        mintQuantity,
        userAddress: address
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
        { trait_type: 'Total Supply', value: collection.totalSupply.toString() }
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
      // In a real implementation, you might want to generate unique variations
      const imageUrl = collection.image;
      
      // Download the image and convert to blob
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Upload to IPFS
      const ipfsResult = await IPFSService.uploadComplete(
        imageBlob,
        nftName,
        nftDescription,
        collection.name,
        collection.category,
        collection.creator,
        (collection.minted + 1).toString()
      );
      
      console.log('✅ IPFS upload completed:', ipfsResult.metadataUrl);
      
      // Mint using the engine
      const result = await mintGasless({
        to: address!,
        metadataUri: ipfsResult.metadataUrl,
        chainId: 80002, // Polygon Amoy
      });
      
      console.log('✅ Mint successful:', result);
      
      // Update collection mint count in database
      const updateResponse = await fetch(`/api/collections/${collection._id}`, {
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
      
      setMintSuccess(`🎉 Successfully minted ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}! Queue ID: ${result.queueId}`);
      toast.success(`Successfully minted ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}!`);
      
    } catch (error: any) {
      console.error('❌ Mint failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      setMintError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const copyContractAddress = () => {
    navigator.clipboard.writeText(collection.contractAddress);
    toast.success('Contract address copied to clipboard');
  };

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
                      {collection.roadmap?.map((phase, index) => (
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
                      {collection.team?.map((member, index) => (
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
                      {collection.utility?.map((benefit, index) => (
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
                  {collection.mintStages?.map((stage) => (
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
                    <div className="text-2xl font-bold text-white mb-1">{currentPrice}</div>
                    <div className="text-sm text-gray-400">
                      {collection.price && collection.price !== '0.1 CHZ' ? `(${collection.price})` : ''}
                    </div>
                  </div>

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
                      disabled={!isConnected || isMinting || collection.status !== 'active' || collection.minted >= collection.totalSupply}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {isMinting ? 'Minting...' : 
                       !isConnected ? 'Connect Wallet to mint' : 
                       collection.status !== 'active' ? 'Minting not available' :
                       collection.minted >= collection.totalSupply ? 'All NFTs minted' :
                       `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''}`}
                    </Button>
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