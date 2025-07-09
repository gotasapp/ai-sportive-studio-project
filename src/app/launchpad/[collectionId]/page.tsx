'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Mock data for collections
const collectionsData = {
  'flamengo-heritage': {
    id: 'flamengo-heritage',
    name: 'Flamengo Heritage Collection',
    description: 'Historic jerseys celebrating the legendary 1981 World Championship victory. Each NFT features unique designs inspired by iconic moments and legendary players.',
    image: '/api/placeholder/600/600',
    bannerImage: '/api/placeholder/1200/400',
    status: 'live',
    category: 'jerseys',
    totalSupply: 1981,
    minted: 1456,
    creator: 'Clube de Regatas do Flamengo',
    creatorAvatar: '/api/placeholder/40/40',
    contractAddress: '0x1234...5678',
    launchDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-15T23:59:59Z',
    website: 'https://flamengo.com.br',
    twitter: 'https://twitter.com/flamengo',
    discord: 'https://discord.gg/flamengo',
    mintStages: [
      {
        id: 'gtd',
        name: 'GTD',
        description: 'Guaranteed allowlist',
        price: '0.00013 CHZ',
        walletLimit: 1,
        status: 'ended',
        startTime: '2024-01-10T00:00:00Z',
        endTime: '2024-01-12T23:59:59Z'
      },
      {
        id: 'fcfs',
        name: 'FCFS',
        description: 'First come, first served',
        price: '0.00013 CHZ',
        walletLimit: 2,
        status: 'ended',
        startTime: '2024-01-12T00:00:00Z',
        endTime: '2024-01-14T23:59:59Z'
      },
      {
        id: 'public',
        name: 'Public',
        description: 'Open to everyone',
        price: '0.00015 CHZ',
        walletLimit: 3,
        status: 'live',
        startTime: '2024-01-14T00:00:00Z',
        endTime: '2024-02-15T23:59:59Z'
      }
    ],
    vision: 'The Flamengo Heritage Collection aims to preserve and celebrate the rich history of one of Brazil\'s most beloved football clubs. Through AI-generated art, we capture the essence of legendary moments, iconic players, and the passionate spirit that defines Flamengo.',
    utility: [
      'Exclusive access to Flamengo events and experiences',
      'Priority access to future Flamengo NFT drops',
      'Special discounts on official Flamengo merchandise',
      'Access to holder-only Discord channels',
      'Voting rights on future collection decisions'
    ],
    team: [
      {
        name: 'Gabriel Barbosa',
        role: 'Creative Director',
        avatar: '/api/placeholder/60/60',
        bio: 'Leading striker and creative vision behind the collection'
      },
      {
        name: 'Bruno Henrique',
        role: 'Community Manager',
        avatar: '/api/placeholder/60/60',
        bio: 'Connecting fans with the digital revolution'
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1',
        title: 'Collection Launch',
        description: 'Launch of 1981 unique jersey NFTs',
        status: 'completed'
      },
      {
        phase: 'Phase 2',
        title: 'Utility Activation',
        description: 'Activate exclusive holder benefits',
        status: 'in-progress'
      },
      {
        phase: 'Phase 3',
        title: 'Stadium Access',
        description: 'Physical stadium experiences for holders',
        status: 'upcoming'
      },
      {
        phase: 'Phase 4',
        title: 'Global Expansion',
        description: 'International partnerships and events',
        status: 'upcoming'
      }
    ]
  },
  'palmeiras-badges': {
    id: 'palmeiras-badges',
    name: 'Palmeiras Championship Badges',
    description: 'Exclusive badges commemorating championship victories and historic moments of Sociedade Esportiva Palmeiras.',
    image: '/api/placeholder/600/600',
    bannerImage: '/api/placeholder/1200/400',
    status: 'live',
    category: 'badges',
    totalSupply: 500,
    minted: 342,
    creator: 'Sociedade Esportiva Palmeiras',
    creatorAvatar: '/api/placeholder/40/40',
    contractAddress: '0x5678...9012',
    launchDate: '2024-01-10T00:00:00Z',
    endDate: '2024-02-10T23:59:59Z',
    website: 'https://palmeiras.com.br',
    twitter: 'https://twitter.com/palmeiras',
    discord: 'https://discord.gg/palmeiras',
    mintStages: [
      {
        id: 'gtd',
        name: 'GTD',
        description: 'Season ticket holders',
        price: '0.00036 CHZ',
        walletLimit: 1,
        status: 'ended',
        startTime: '2024-01-08T00:00:00Z',
        endTime: '2024-01-10T23:59:59Z'
      },
      {
        id: 'fcfs',
        name: 'FCFS',
        description: 'Fan token holders',
        price: '0.00036 CHZ',
        walletLimit: 2,
        status: 'ended',
        startTime: '2024-01-10T00:00:00Z',
        endTime: '2024-01-12T23:59:59Z'
      },
      {
        id: 'public',
        name: 'Public',
        description: 'Public mint',
        price: '0.00036 CHZ',
        walletLimit: 3,
        status: 'live',
        startTime: '2024-01-12T00:00:00Z',
        endTime: '2024-02-10T23:59:59Z'
      }
    ],
    vision: 'Celebrating the championship legacy of Palmeiras through digital collectibles that honor our victories and achievements.',
    utility: [
      'Access to exclusive Palmeiras championship events',
      'Priority seating for major matches',
      'Exclusive merchandise discounts',
      'Voting rights on fan initiatives'
    ],
    team: [
      {
        name: 'Leila Pereira',
        role: 'President',
        avatar: '/api/placeholder/60/60',
        bio: 'Leading Palmeiras into the digital age'
      }
    ],
    roadmap: [
      {
        phase: 'Phase 1',
        title: 'Badge Collection',
        description: 'Launch championship badge NFTs',
        status: 'in-progress'
      },
      {
        phase: 'Phase 2',
        title: 'Stadium Integration',
        description: 'Digital badges for stadium access',
        status: 'upcoming'
      }
    ]
  }
};

export default function CollectionMintPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;
  
  const [mintQuantity, setMintQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRemaining, setTimeRemaining] = useState('');

  const collection = collectionsData[collectionId as keyof typeof collectionsData];

  // Countdown timer
  useEffect(() => {
    if (!collection) return;
    
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

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Collection not found</h1>
          <Link href="/launchpad">
            <Button>Back to Launchpad</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = (collection.minted / collection.totalSupply) * 100;
  const currentStage = collection.mintStages.find(stage => stage.status === 'live');
  const currentPrice = currentStage?.price || collection.mintStages[collection.mintStages.length - 1].price;
  const maxQuantity = currentStage?.walletLimit || 1;

  const handleQuantityChange = (change: number) => {
    const newQuantity = mintQuantity + change;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setMintQuantity(newQuantity);
    }
  };

  const handleMint = () => {
    // TODO: Implement minting logic
    console.log('Minting:', mintQuantity, 'NFTs');
  };

  const copyContractAddress = () => {
    navigator.clipboard.writeText(collection.contractAddress);
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
                        src={collection.creatorAvatar}
                        alt={collection.creator}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{collection.creator}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyContractAddress}
                      className="text-gray-300 hover:text-white p-0 h-auto"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy token address
                    </Button>
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
                    <div className="text-2xl font-bold text-white">{collection.minted}</div>
                    <div className="text-sm text-gray-400">Total Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{collection.totalSupply}</div>
                    <div className="text-sm text-gray-400">Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{timeRemaining}</div>
                    <div className="text-sm text-gray-400">Time Left</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{collection.minted} / {collection.totalSupply}</span>
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
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Vision</h3>
                      <p className="text-gray-400 leading-relaxed">{collection.vision}</p>
                    </div>
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
                      {collection.roadmap.map((phase, index) => (
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
                      {collection.team.map((member, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <img
                            src={member.avatar}
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
                      {collection.utility.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-400">{benefit}</p>
                        </div>
                      ))}
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
                  {collection.mintStages.map((stage) => (
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
                </CardContent>
              </Card>

              {/* Mint Interface */}
              <Card className="bg-[#14101e] border-gray-700">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">{currentPrice}</div>
                    <div className="text-sm text-gray-400">($16.33)</div>
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
                      By clicking "mint", you agree to the Magic Eden Terms of Service.
                    </div>

                    <Button 
                      onClick={handleMint}
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
                      size="lg"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet to mint
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