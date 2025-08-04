'use client';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

async function fetchCollectionData(collectionId: string) {
  try {
    // Usar o endpoint mais completo de custom collections
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/custom-collections/${collectionId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.collection : null;
  } catch {
    return null;
  }
}

export default function CollectionDetailPage({ 
  params 
}: { 
  params: { category: string; collectionId: string } 
}) {
  const [collectionData, setCollectionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollectionData = async () => {
      try {
        const data = await fetchCollectionData(params.collectionId);
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
  }, [params.collectionId]);

  if (loading) {
    return (
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
    );
  }

  if (!collectionData) {
    return notFound();
  }

  // Esta é uma custom collection
  const isCustomCollection = true;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Imagem principal */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardContent className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-64 h-64 bg-[#14101e] rounded-lg flex items-center justify-center overflow-hidden">
            {isCustomCollection && collectionData?.image ? (
              <img 
                src={collectionData.image} 
                alt={collectionData.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Skeleton className="w-60 h-60 rounded-lg" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <CardTitle className="text-2xl text-secondary">
              {isCustomCollection ? collectionData?.name : 'Nome da Coleção'}
            </CardTitle>
            <CardDescription className="text-secondary/80">
              {isCustomCollection ? collectionData?.description : 'Descrição curta da coleção ou NFT.'}
            </CardDescription>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {isCustomCollection ? collectionData?.category : params.category}
              </Badge>
              <Badge variant="secondary">
                {`${collectionData.stats?.uniqueOwners || 1} Owner${(collectionData.stats?.uniqueOwners || 1) > 1 ? 's' : ''}`}
              </Badge>
              {isCustomCollection && collectionData?.teamName && (
                <Badge variant="secondary">{collectionData.teamName}</Badge>
              )}
            </div>
            {/* Botão de ação */}
            <Button className="cyber-button bg-[#A20131] text-white">
              {isCustomCollection ? 'Ver NFTs' : 'Comprar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">{collectionData.totalSupply ?? 0}</div>
            <div className="text-xs text-secondary/70">Total Supply</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">{collectionData.stats?.totalMinted ?? 0}</div>
            <div className="text-xs text-secondary/70">Mintados</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">0.00</div>
            <div className="text-xs text-secondary/70">Volume</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">{collectionData.stats?.totalMinted ?? 0}</div>
            <div className="text-xs text-secondary/70">Transações</div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-secondary/10" />

      {/* NFTs da Coleção - Apenas para Custom Collections */}
      {isCustomCollection && collectionData?.mintedNFTs && collectionData.mintedNFTs.length > 0 && (
        <Card className="mb-8 bg-transparent border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary text-lg">
              NFTs da Coleção ({collectionData.mintedNFTs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectionData.mintedNFTs.map((nft: any, index: number) => (
                <Card key={nft.tokenId} className="bg-secondary/5 border-secondary/10 hover:border-secondary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-secondary/10 rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={collectionData.image} 
                        alt={`${collectionData.name} #${nft.tokenId}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-secondary text-sm">
                        {collectionData.name} #{nft.tokenId}
                      </h3>
                      <div className="flex justify-between text-xs text-secondary/70">
                        <span>Token ID</span>
                        <span>{nft.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-xs text-secondary/70">
                        <span>Owner</span>
                        <span>{nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-secondary/70">
                        <span>Mintado</span>
                        <span>{new Date(nft.mintedAt).toLocaleDateString()}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2 text-xs"
                        onClick={() => window.open(`https://amoy.polygonscan.com/address/${nft.contractAddress}`, '_blank')}
                      >
                        Ver no Explorer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traits/Atributos */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Traits / Atributos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {isCustomCollection && collectionData ? (
              <>
                <Badge variant="secondary">Category: {collectionData.category}</Badge>
                <Badge variant="secondary">Team: {collectionData.teamName}</Badge>
                    <Badge variant="secondary">Unique Owners: {collectionData.stats?.uniqueOwners}</Badge>
    <Badge variant="secondary">Contracts Used: {collectionData.stats?.contractsUsed}</Badge>
              </>
            ) : (
              <>
                <Badge variant="secondary">Trait 1</Badge>
                <Badge variant="secondary">Trait 2</Badge>
                <Badge variant="secondary">Trait 3</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de preço (gráfico) */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Histórico de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder para gráfico */}
          <Skeleton className="w-full h-40 rounded" />
        </CardContent>
      </Card>

      {/* Atividade recente */}
      <Card className="bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder para lista de atividades */}
          <div className="space-y-2">
            <div className="flex justify-between text-secondary/80">
              <span>Usuário X comprou NFT</span>
              <span>há 2h</span>
            </div>
            <div className="flex justify-between text-secondary/80">
              <span>Usuário Y listou NFT</span>
              <span>há 5h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}