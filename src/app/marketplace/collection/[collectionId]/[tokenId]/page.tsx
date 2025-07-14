import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getMintedNFTAndOwner } from '@/lib/services/thirdweb-nft-utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jersey-generator-ai2.vercel.app';

async function fetchNFTDetail(tokenId: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/marketplace/nft-collection?action=getNFT&tokenId=${tokenId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('fetchNFTDetail error:', e);
    return null;
  }
}

async function fetchNFTsByCollection(collectionId: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/marketplace/nfts?type=${collectionId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Corrigir: garantir que sempre retorna um array
    return Array.isArray(data) ? data : (data.data || []);
  } catch (e) {
    console.error('fetchNFTsByCollection error:', e);
    return [];
  }
}

async function fetchSales(collectionId: string, tokenId: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/marketplace/sales?collection=${collectionId}&tokenId=${tokenId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.sales || [];
  } catch (e) {
    console.error('fetchSales error:', e);
    return [];
  }
}

const PriceHistoryChart = dynamic(() => import("@/components/marketplace/PriceHistoryChart"), { ssr: false, loading: () => <div className='w-full h-40 bg-gray-900 rounded animate-pulse' /> });

function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = serializeBigInt(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export default async function NFTDetailPage({ params }: { params: { collectionId: string, tokenId: string } }) {
  try {
    // Buscar dados reais do NFT e owner via Thirdweb
    const { nft: mintedNFT, owner: realOwner } = await getMintedNFTAndOwner(params.tokenId);

    // Fetch NFT detail (metadata, description, etc) - pode ser redundante, mas mantido para compatibilidade
    let nftDetail = null;
    try {
      nftDetail = await fetchNFTDetail(params.tokenId);
    } catch (e) {
      console.error('Erro ao buscar dados do NFT:', e);
    }

    // Simular sales vazios (ou integrar real se disponível)
    const sales: any[] = [];

    // Traits/attributes
    const metadata = mintedNFT?.metadata || nftDetail?.nft?.metadata || {};
    const attributes = metadata.attributes || [];

    // Supply: se o NFT existe, supply = 1
    const supply = mintedNFT ? 1 : 0;
    // Owners: array com o owner real se existir
    const owners = mintedNFT && realOwner ? [realOwner] : [];

    // Volume e transações reais (placeholder)
    const volume = sales.reduce((sum: number, sale: any) => sum + (Number(sale.price) || 0), 0);
    const transactions = sales.length;

    // Price history e activity (placeholder)
    const priceHistory = sales.map((sale: any) => ({
      date: sale.timestamp || sale.date || sale.createdAt,
      price: Number(sale.price) || 0
    }));
    const recentActivity = sales.slice(0, 5);

    const safeMintedNFT = serializeBigInt(mintedNFT);

    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* DEBUG PANEL: show raw data for troubleshooting */}
        <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <strong>DEBUG DATA</strong>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            <div><b>mintedNFT:</b> <pre>{JSON.stringify(safeMintedNFT, null, 2)}</pre></div>
            <div><b>realOwner:</b> <pre>{JSON.stringify(realOwner, null, 2)}</pre></div>
            <div><b>sales:</b> <pre>{JSON.stringify(sales, null, 2)}</pre></div>
          </div>
        </div>
        {/* Main content */}
        <div className="max-w-5xl mx-auto py-10 px-4">
          {/* Main Image */}
          <Card className="mb-8 bg-transparent border-secondary/20">
            <CardContent className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-64 h-64 bg-[#14101e] rounded-lg flex items-center justify-center overflow-hidden">
                {metadata.image ? (
                  <img src={metadata.image} alt={metadata.name} className="w-60 h-60 object-cover rounded-lg" />
                ) : (
                  <Skeleton className="w-60 h-60 rounded-lg" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <CardTitle className="text-2xl text-secondary">{metadata.name || `NFT #${params.tokenId}`}</CardTitle>
                <CardDescription className="text-secondary/80">{metadata.description || 'No description.'}</CardDescription>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{params.collectionId}</Badge>
                  <Badge variant="secondary">Token ID: {params.tokenId}</Badge>
                  <Badge variant="secondary">Owner: {realOwner?.slice(0, 8)}...</Badge>
                </div>
                {/* Action Button */}
                <Button className="cyber-button bg-[#A20131] text-white">Buy</Button>
              </div>
            </CardContent>
          </Card>

          {/* Traits/Attributes */}
          <Card className="mb-8 bg-transparent border-secondary/20">
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Traits / Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {attributes.length > 0 ? (
                  attributes.map((attr: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {attr.trait_type ? `${attr.trait_type}: ` : ''}{attr.value}
                    </Badge>
                  ))
                ) : (
                  <span className="text-secondary/60 text-sm">No attributes.</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8 bg-secondary/10" />

          {/* Supply, Owners, Volume, Transactions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-transparent border-secondary/20">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-secondary">{supply}</div>
                <div className="text-xs text-secondary/70">Supply (minted)</div>
              </CardContent>
            </Card>
            <Card className="bg-transparent border-secondary/20">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-secondary">{owners.length}</div>
                <div className="text-xs text-secondary/70">Owners</div>
              </CardContent>
            </Card>
            <Card className="bg-transparent border-secondary/20">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-secondary">{volume}</div>
                <div className="text-xs text-secondary/70">Volume</div>
              </CardContent>
            </Card>
            <Card className="bg-transparent border-secondary/20">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-secondary">{transactions}</div>
                <div className="text-xs text-secondary/70">Transactions</div>
              </CardContent>
            </Card>
          </div>

          {/* Price History (chart) */}
          <Card className="mb-8 bg-transparent border-secondary/20">
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Price History</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className='w-full h-40 bg-gray-900 rounded animate-pulse' />}> 
                <PriceHistoryChart data={priceHistory} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Recent Activity (real events) */}
          <Card className="bg-transparent border-secondary/20">
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.length > 0 ? recentActivity.map((event: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-secondary/80">
                    <span>{event.buyer || event.seller || 'User'} {event.type || 'bought'} NFT</span>
                    <span>{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</span>
                  </div>
                )) : (
                  <span className="text-secondary/60 text-sm">No recent activity.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Erro global na página de detalhe:', err);
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>
        Erro inesperado na renderização da página.<br />
        <pre>{String(err)}</pre>
      </div>
    );
  }
} 