'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  Unlock,
  Target,
  Coins,
  Timer,
  Calendar,
  Shield
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

interface CollectionMintMobileLayoutProps {
  collection: any;
  claimCondition: any;
  mintQuantity: number;
  setMintQuantity: (quantity: number) => void;
  email: string;
  setEmail: (email: string) => void;
  timeRemaining: string;
  onMint: () => void;
  onGaslessMint: () => void;
  isMinting: boolean;
  isGaslessMinting: boolean;
  isConnected: boolean;
  isUserAdmin: boolean;
  mintError: string | null;
  gaslessMintError: string | null;
  mintSuccess: string | null;
  gaslessMintSuccess: string | null;
  loading?: boolean;
}

export default function CollectionMintMobileLayout({
  collection,
  claimCondition,
  mintQuantity,
  setMintQuantity,
  email,
  setEmail,
  timeRemaining,
  onMint,
  onGaslessMint,
  isMinting,
  isGaslessMinting,
  isConnected,
  isUserAdmin,
  mintError,
  gaslessMintError,
  mintSuccess,
  gaslessMintSuccess,
  loading = false
}: CollectionMintMobileLayoutProps) {
  const [activeTab, setActiveTab] = useState('mint');

  if (loading || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518]">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A20131]"></div>
        </div>
      </div>
    );
  }

  const progress = Math.round((collection.minted / collection.totalSupply) * 100);
  const price = claimCondition?.pricePerToken 
    ? Number(claimCondition.pricePerToken) / Math.pow(10, 18) 
    : 0;

  const formatPrice = (priceWei: any) => {
    if (!priceWei || priceWei === '0') return '0 MATIC';
    const priceInMatic = Number(priceWei) / Math.pow(10, 18);
    return `${priceInMatic.toFixed(4)} MATIC`;
  };

  const copyContractAddress = () => {
    if (collection.contractAddress) {
      navigator.clipboard.writeText(collection.contractAddress);
      // Use toast without icon [[memory:3575505]]
      // toast.success('Contract address copied to clipboard');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          label: 'Live', 
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        };
      case 'upcoming':
        return { 
          label: 'Upcoming', 
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <Clock className="w-3 h-3" />
        };
      default:
        return { 
          label: 'Ended', 
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <Lock className="w-3 h-3" />
        };
    }
  };

  const statusConfig = getStatusConfig(collection.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white">
      <Header />

      {/* Back Button */}
      <div className="px-4 py-3 border-b border-[#FDFDFD]/10">
        <Link href="/launchpad">
          <Button variant="ghost" size="sm" className="text-[#FDFDFD]/80 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Launchpad
          </Button>
        </Link>
      </div>

      {/* Collection Hero - Compacto para Mobile */}
      <div className="relative">
        {/* Collection Image */}
        <div className="aspect-[3/2] relative overflow-hidden">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${statusConfig.color} border flex items-center gap-1 text-xs px-2 py-1`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>

          {/* Timer */}
          {collection.status === 'active' && timeRemaining && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/50 text-white border-white/20 text-xs px-2 py-1">
                <Timer className="w-3 h-3 mr-1" />
                {timeRemaining}
              </Badge>
            </div>
          )}
        </div>

        {/* Collection Info Overlay - Mais Compacto */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h1 className="text-xl font-bold text-white mb-1 line-clamp-1">{collection.name}</h1>
          <p className="text-[#FDFDFD]/80 text-xs mb-2 line-clamp-1">
            {collection.description}
          </p>
          
          {/* Creator */}
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-[#A20131] rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">
                {collection.creator?.name?.charAt(0) || 'C'}
              </span>
            </div>
            <span className="text-[#FDFDFD]/80 text-xs">
              by {collection.creator?.name || 'Unknown Creator'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats - Compacto */}
      <div className="px-3 py-3 bg-[#14101e]/40 border-b border-[#FDFDFD]/10">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[#A20131] font-bold text-base">
              {formatPrice(claimCondition?.pricePerToken)}
            </div>
            <div className="text-[#FDFDFD]/60 text-xs">Price</div>
          </div>
          <div>
            <div className="text-[#A20131] font-bold text-base">
              {collection.minted}/{collection.totalSupply}
            </div>
            <div className="text-[#FDFDFD]/60 text-xs">Minted</div>
          </div>
          <div>
            <div className="text-[#A20131] font-bold text-base">{progress}%</div>
            <div className="text-[#FDFDFD]/60 text-xs">Progress</div>
          </div>
        </div>

        {/* Progress Bar - Compacto */}
        <div className="mt-3">
          <Progress 
            value={progress} 
            className="h-1.5 bg-[#FDFDFD]/10"
          />
          <div className="flex justify-between text-xs text-[#FDFDFD]/60 mt-1">
            <span>{collection.minted} minted</span>
            <span>{collection.totalSupply - collection.minted} left</span>
          </div>
        </div>
      </div>

      {/* Tabs - Compactas */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 bg-[#030303]/90 backdrop-blur-md border-b border-[#FDFDFD]/10 z-10">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-10">
              <TabsTrigger 
                value="mint" 
                className="text-white data-[state=active]:bg-[#A20131] data-[state=active]:text-white text-sm py-2"
              >
                Mint
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="text-white data-[state=active]:bg-[#A20131] data-[state=active]:text-white text-sm py-2"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="text-white data-[state=active]:bg-[#A20131] data-[state=active]:text-white text-sm py-2"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-3 py-4">
            <TabsContent value="mint" className="mt-0 space-y-4">
              {/* Wallet Connection Check - Compacto */}
              {!isConnected && (
                <Card className="bg-[#14101e]/60 border-[#A20131]/30">
                  <CardContent className="p-3 text-center">
                    <Wallet className="w-6 h-6 text-[#A20131] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1 text-sm">Connect Wallet</h3>
                    <p className="text-[#FDFDFD]/60 text-xs mb-3">
                      Connect your wallet to mint from this collection
                    </p>
                    <Button 
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/80 h-9 text-sm"
                      onClick={() => {/* Wallet connection handled by Header */}}
                    >
                      Connect Wallet
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Mint Section */}
              {isConnected && (
                <>
                  {/* Quantity Selector - Ultra Compacto (40% menor) */}
                  <Card className="bg-[#14101e]/60 border-[#FDFDFD]/10">
                    <CardHeader className="pb-1 pt-2">
                      <CardTitle className="text-white flex items-center gap-1 text-sm">
                        <Target className="w-3 h-3 text-[#A20131]" />
                        Select Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-1 pb-2 space-y-2">
                      <div className="flex items-center justify-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                          disabled={mintQuantity <= 1}
                          className="h-6 w-6 rounded-full border-[#FDFDFD]/20 text-white hover:bg-[#A20131]/20 p-0"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{mintQuantity}</div>
                          <div className="text-xs text-[#FDFDFD]/60 leading-tight">
                            Total: {formatPrice(
                              claimCondition?.pricePerToken 
                                ? (Number(claimCondition.pricePerToken) * mintQuantity).toString()
                                : '0'
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMintQuantity(mintQuantity + 1)}
                          disabled={mintQuantity >= 10}
                          className="h-6 w-6 rounded-full border-[#FDFDFD]/20 text-white hover:bg-[#A20131]/20 p-0"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>

                      <div className="text-center text-xs text-[#FDFDFD]/60">
                        Max 10 per transaction
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mint Buttons - Compactos */}
                  <div className="space-y-2">
                    {/* Public Mint */}
                    <Button
                      onClick={onMint}
                      disabled={isMinting || collection.status !== 'active'}
                      className="w-full bg-[#A20131] hover:bg-[#A20131]/80 text-white font-semibold h-10 text-sm"
                    >
                      {isMinting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Minting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Coins className="w-3 h-3" />
                          Mint {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''} 
                          ({formatPrice(
                            claimCondition?.pricePerToken 
                              ? (Number(claimCondition.pricePerToken) * mintQuantity).toString()
                              : '0'
                          )})
                        </div>
                      )}
                    </Button>

                    {/* Admin Gasless Mint */}
                    {isUserAdmin && (
                      <Button
                        onClick={onGaslessMint}
                        disabled={isGaslessMinting}
                        variant="outline"
                        className="w-full border-[#A20131] text-[#A20131] hover:bg-[#A20131]/10 h-10 text-sm"
                      >
                        {isGaslessMinting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#A20131]"></div>
                            Gasless Minting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Admin Gasless Mint
                          </div>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Status Messages - Compactas */}
                  {mintError && (
                    <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {mintError}
                      </div>
                    </div>
                  )}

                  {gaslessMintError && (
                    <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {gaslessMintError}
                      </div>
                    </div>
                  )}

                  {mintSuccess && (
                    <div className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        {mintSuccess}
                      </div>
                    </div>
                  )}

                  {gaslessMintSuccess && (
                    <div className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        {gaslessMintSuccess}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-0 space-y-3">
              {/* Collection Details - Compacto */}
              <Card className="bg-[#14101e]/60 border-[#FDFDFD]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Collection Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/60 text-sm">Total Supply</span>
                      <span className="text-white font-semibold text-sm">{collection.totalSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/60 text-sm">Minted</span>
                      <span className="text-white font-semibold text-sm">{collection.minted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#FDFDFD]/60 text-sm">Remaining</span>
                      <span className="text-white font-semibold text-sm">{collection.totalSupply - collection.minted}</span>
                    </div>
                    {collection.contractAddress && (
                      <div className="pt-2 border-t border-[#FDFDFD]/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[#FDFDFD]/60 text-sm">Contract</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyContractAddress}
                            className="text-[#A20131] hover:bg-[#A20131]/10 h-auto p-1 text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {collection.contractAddress.slice(0, 6)}...{collection.contractAddress.slice(-4)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Links - Compacto */}
              {(collection.website || collection.twitter || collection.discord) && (
                <Card className="bg-[#14101e]/60 border-[#FDFDFD]/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base">Links</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      {collection.website && (
                        <a 
                          href={collection.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#A20131] hover:text-[#A20131]/80 text-sm"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {collection.twitter && (
                        <a 
                          href={collection.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#A20131] hover:text-[#A20131]/80 text-sm"
                        >
                          <Twitter className="w-3 h-3" />
                          Twitter
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {collection.discord && (
                        <a 
                          href={collection.discord} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#A20131] hover:text-[#A20131]/80 text-sm"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Discord
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <Card className="bg-[#14101e]/60 border-[#FDFDFD]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-center py-6 text-[#FDFDFD]/60">
                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}