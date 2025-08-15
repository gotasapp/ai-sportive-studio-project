'use client';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import CollectionUnitsTable from '@/components/marketplace/CollectionUnitsTable';
import CollectionTraits from '@/components/marketplace/CollectionTraits';

async function fetchCollectionData(collectionId: string, category: string) {
  try {
    console.log('🔍 Fetching collection data for:', { collectionId, category });
    
    // 🎯 DETECÇÃO INTELIGENTE: Verificar se category é na verdade um collectionId direto
    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
    const collectionIsObjectId = /^[0-9a-fA-F]{24}$/.test(collectionId);
    
    // Se category é um ObjectId, então estamos na rota antiga: /collection/[objectId]/[tokenId]
    if (categoryIsObjectId && !collectionIsObjectId) {
      console.log('🔄 Detected legacy route pattern, treating category as collectionId');
      // Swap: category vira collectionId, collectionId vira tokenId
      const actualCollectionId = category;
      const actualTokenId = collectionId;
      
      const res = await fetch(
        `/api/custom-collections/${actualCollectionId}`,
        { next: { revalidate: 30 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? { ...data.collection, type: 'custom', detectedTokenId: actualTokenId } : null;
    }
    
    // Verificar se é um ObjectId (24 caracteres hex) = Custom/Launchpad Collection
    const isObjectId = collectionIsObjectId;
    
    if (isObjectId) {
      // Tentar primeiro como Launchpad Collection
      try {
        console.log('🚀 Trying Launchpad collection endpoint first...');
        const lpRes = await fetch(`/api/launchpad/collections/${collectionId}`, { next: { revalidate: 30 } });
        if (lpRes.ok) {
          const lpData = await lpRes.json();
          if (lpData && (lpData.success || lpData.collection)) {
            const coll = lpData.collection || lpData.data || lpData;
            // Tratamos launchpad como "custom-like" para reutilizar layout de coleção
            return { ...coll, type: 'custom' };
          }
        }
      } catch (e) {
        console.log('Launchpad fetch failed, falling back to custom:', e);
      }
      // Fallback: Custom Collection
      console.log('🎨 Falling back to Custom Collection, using /api/custom-collections/');
      const res = await fetch(`/api/custom-collections/${collectionId}`, { next: { revalidate: 30 } });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? { ...data.collection, type: 'custom' } : null;
    } else {
      // É uma Standard Collection (jerseys, stadiums, badges)
      console.log('⚽ Detected Standard Collection, using /api/marketplace/nft-collection/stats');
      const res = await fetch(
        `/api/marketplace/nft-collection/stats?collection=${category}`,
        { next: { revalidate: 30 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      
      // Transformar dados de standard collection para formato compatível
      if (data.success) {
        return {
          type: 'standard',
          name: `${category.charAt(0).toUpperCase()}${category.slice(1)} Collection`,
          description: `Official ${category} collection`,
          image: '', // Será definido depois
          category: category,
          totalSupply: data.totalSupply || 0,
          stats: {
            totalMinted: data.mintedNFTs || 0,
            uniqueOwners: 1, // Para standard collections
            contractsUsed: 1
          },
          mintedNFTs: [], // Standard collections não mostram NFTs individuais aqui
          activity: data.activity || { salesVolume: 0, transactions: 0 }
        };
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching collection data:', error);
    return null;
  }
}

export default function CollectionDetailPage({ 
  params 
}: { 
  params: { category: string; collectionId: string } 
}) {
  const router = useRouter();
  const [collectionData, setCollectionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🚨 DETECÇÃO DE URL INCORRETA: Verificar se há um tokenId na URL que deveria ir para página individual
  useEffect(() => {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    // Se a URL tem 6 partes: ['', 'marketplace', 'collection', category, collectionId, tokenId]
    if (pathParts.length === 6 && pathParts[5]) {
      const tokenId = pathParts[5];
      console.log('🔄 Detected tokenId in collection URL, redirecting to NFT page:', tokenId);
      router.replace(`/marketplace/collection/${params.category}/${params.collectionId}/${tokenId}`);
      return;
    }
  }, [params.category, params.collectionId, router]);

  useEffect(() => {
    const loadCollectionData = async () => {
      try {
        const data = await fetchCollectionData(params.collectionId, params.category);
        if (data) {
          setCollectionData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da coleção:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [params.collectionId, params.category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="max-w-5xl mx-auto py-10 px-4">
        <Card className="mb-8 bg-transparent border-secondary/20">
          <CardContent className="flex flex-col md:flex-row gap-8 items-center p-8">
            <Skeleton className="w-64 h-64 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return notFound();
  }

  // Detectar tipo de coleção
  const isCustomCollection = collectionData?.type === 'custom';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      <main className="container mx-auto px-3 py-6">
        
        {/* Header da Coleção */}
        <div className="flex flex-col md:flex-row gap-8 w-full items-center mb-8">
          {/* Imagem grande da coleção */}
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="aspect-square w-48 md:w-64 bg-[#14101e] rounded-lg border border-[#FDFDFD]/10 overflow-hidden">
              {collectionData?.image ? (
                <img 
                  src={collectionData.image} 
                  alt={collectionData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Skeleton className="w-full h-full" />
              )}
            </div>
          </div>
          
          {/* Stats + Info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Título e descrição */}
            <div>
              <h1 className="text-2xl font-bold text-[#FDFDFD] mb-2">
                {collectionData?.name || 'Loading...'}
              </h1>
              <p className="text-[#FDFDFD]/70 text-sm mb-4">
                {collectionData?.description || 'Loading description...'}
              </p>
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary" className="bg-[#FF0052]/20 text-[#FF0052] border-[#FF0052]/30">
                  {collectionData?.category || params.category}
                </Badge>
                <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20">
                  {`${collectionData?.stats?.uniqueOwners || 1} Owner${(collectionData?.stats?.uniqueOwners || 1) > 1 ? 's' : ''}`}
                </Badge>
                {collectionData?.teamName && (
                  <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20">
                    {collectionData.teamName}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4 w-full">
              <div className="flex-1 cyber-card p-4">
                <div className="text-xs text-[#FDFDFD]/70">Total Supply</div>
                <div className="text-xl font-bold mt-1 text-[#FDFDFD]">{collectionData?.totalSupply || '--'}</div>
              </div>
              <div className="flex-1 cyber-card p-4">
                <div className="text-xs text-[#FDFDFD]/70">NFTs</div>
                <div className="text-xl font-bold mt-1 text-[#FDFDFD]">{collectionData?.stats?.totalMinted || '--'}</div>
              </div>
              <div className="flex-1 cyber-card p-4">
                <div className="text-xs text-[#FDFDFD]/70">Activity</div>
                <div className="text-xl font-bold mt-1 text-[#FDFDFD]">
                  {collectionData?.activity?.salesVolume ? 
                    `${collectionData.activity.salesVolume.toFixed(2)} CHZ` : 
                    `${collectionData?.activity?.transactions || 0} txs`
                  }
                </div>
              </div>
            </div>
            
            {/* Botão de ação */}
            <div className="mt-2">
              <Button className="cyber-button bg-[#FF0052] text-white hover:bg-[#FF0052]/80 border-[#FF0052] w-full md:w-auto">
                {isCustomCollection ? 'Ver Coleção Completa' : 'Explorar NFTs'}
              </Button>
            </div>
          </div>
        </div>

      <Separator className="my-8 bg-secondary/10" />

        {/* 🎯 LAYOUT MODERNO: Individual Units + Traits Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Individual Units - 2/3 da largura */}
          <div className="lg:col-span-2">
            <CollectionUnitsTable 
              collectionId={params.collectionId}
              category={params.category}
            />
          </div>
          
          {/* Traits Panel - 1/3 da largura */}
          <div className="lg:col-span-1">
            <CollectionTraits 
              traits={collectionData?.attributes || []}
              totalSupply={collectionData?.totalSupply || 0}
              collectionData={collectionData}
            />
          </div>
        </div>

        {/* Seção para Standard Collections */}
        {!isCustomCollection && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#FDFDFD] mb-6">
              Coleção {collectionData?.name}
            </h2>
            <div className="cyber-card p-8 text-center">
              <h3 className="text-lg font-semibold text-[#FDFDFD] mb-4">
                Esta é uma coleção oficial de {params.category}
              </h3>
              <p className="text-[#FDFDFD]/70 mb-6">
                {collectionData?.description || `Explore os NFTs disponíveis da coleção ${params.category}.`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF0052] mb-1">
                    {collectionData?.totalSupply || '--'}
                  </div>
                  <div className="text-[#FDFDFD]/70">Total Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF0052] mb-1">
                    {collectionData?.stats?.totalMinted || '--'}
                  </div>
                  <div className="text-[#FDFDFD]/70">Mintados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF0052] mb-1">
                    {collectionData?.activity?.transactions || 0}
                  </div>
                  <div className="text-[#FDFDFD]/70">Transações</div>
                </div>
              </div>
              <Button className="cyber-button bg-[#FF0052] text-white hover:bg-[#FF0052]/80 border-[#FF0052] mt-6">
                Ver NFTs no Marketplace
              </Button>
            </div>
          </div>
        )}

        {/* Collection Metadata - Movido para baixo no mobile */}
        {collectionData && (
          <div className="mb-8 lg:hidden">
            <Card className="bg-transparent border-[#FDFDFD]/10">
              <CardHeader className="p-4">
                <CardTitle className="text-[#FDFDFD] text-lg">Collection Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-[#FF0052]/20 text-[#FF0052] border-[#FF0052]/30 rounded-full px-2 py-0.5 text-xs">
                    {collectionData.category}
                  </Badge>
                  {isCustomCollection && (
                    <>
                      <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20 rounded-full px-2 py-0.5 text-xs">
                        {collectionData.teamName}
                      </Badge>
                      <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20 rounded-full px-2 py-0.5 text-xs">
                        AI Generated
                      </Badge>
                    </>
                  )}
                  {!isCustomCollection && (
                    <>
                      <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20 rounded-full px-2 py-0.5 text-xs">
                        Official
                      </Badge>
                      <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20 rounded-full px-2 py-0.5 text-xs">
                        ERC-721
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}



      </main>
    </div>
  );
}