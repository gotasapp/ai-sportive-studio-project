'use client';

import { useContract, useListing } from '@thirdweb-dev/react';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import ListingControls from '@/components/marketplace/ListingControls'; // Importando o novo componente

// Definindo um tipo básico para os detalhes do NFT que vem do nosso DB
interface NftDetails {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  tokenId: string;
  collection: string;
  category: string;
}

export default function ListingPage({ params }: { params: { listingId: string } }) {
  const { listingId } = params;

  const { contract: marketplaceContract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    'marketplace-v3'
  );

  const { data: listing, isLoading: isLoadingListing, error } = useListing(marketplaceContract as any, listingId);
  const [nftDetails, setNftDetails] = useState<NftDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchNftDetails = async () => {
      if (!listing) return;
      setIsLoadingDetails(true);
      try {
        // Tenta buscar de múltiplos endpoints até encontrar o correto
        const endpoints = ['jerseys', 'stadiums', 'badges'];
        let data: NftDetails | null = null;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(`/api/${endpoint}/token/${listing.asset.id}`);
            if (res.ok) {
              data = await res.json();
              break; 
            }
          } catch (e) {
            // Ignora erros individuais e tenta o próximo
          }
        }

        if (data) {
          setNftDetails(data);
        } else {
          throw new Error(`NFT com tokenId ${listing.asset.id} não encontrado em nenhuma categoria.`);
        }

      } catch (e) {
        console.error("Falha ao buscar metadados do NFT", e);
        setNftDetails(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchNftDetails();
  }, [listing]);
  
  if (isLoadingListing || isLoadingDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <Loader2 className="h-16 w-16 animate-spin text-accent" />
        <p className="ml-4 text-xl">Loading details...</p>
      </div>
    );
  }

  if (error || !listing || !nftDetails) {
    notFound();
  }

  const isAuction = listing.type === 1;

  return (
    <div className="flex min-h-screen flex-col bg-background text-white">
      <Header />
      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 px-4">
        <div className="aspect-square relative w-full h-full overflow-hidden rounded-xl border border-secondary/20 shadow-lg shadow-black/20">
           <Image
              src={nftDetails.imageUrl}
              alt={`Imagem de ${nftDetails.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-accent font-semibold mb-2">{nftDetails.collection || 'Coleção'}</p>
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">{nftDetails.name}</h1>
          <p className="text-secondary mb-6">Token ID: {listing.asset.id}</p>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">{nftDetails.description}</p>
          
          <div className="bg-card p-6 rounded-lg border border-secondary/20">
             <h2 className="text-2xl font-bold mb-4">{isAuction ? 'Auction Details' : 'Sale Details'}</h2>
             {marketplaceContract && <ListingControls listing={listing} marketplaceContract={marketplaceContract}/>}
          </div>
        </div>
      </main>
    </div>
  );
} 