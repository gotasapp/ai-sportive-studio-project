import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';

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

export default async function NFTDetailPage({ params }: { params: { collectionId: string, tokenId: string } }) {
  try {
    // Debug logs para diagnóstico
    console.log('NFTDetailPage params:', params);
    let nftDetail, nftsByCollection, sales;
    try {
      [nftDetail, nftsByCollection, sales] = await Promise.all([
        fetchNFTDetail(params.tokenId),
        fetchNFTsByCollection(params.collectionId),
        fetchSales(params.collectionId, params.tokenId)
      ]);
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
      return (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>
          Erro ao buscar dados do NFT. Veja logs do servidor.<br />
          <pre>{String(e)}</pre>
        </div>
      );
    }
    console.log('nftDetail:', nftDetail);
    console.log('nftsByCollection:', nftsByCollection);
    console.log('sales:', sales);

    if (!nftDetail) {
      return (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>
          NFT não encontrado (nftDetail vazio).
        </div>
      );
    }
    if (!nftDetail.success) {
      return (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>
          NFT não encontrado (success = false).
        </div>
      );
    }
    if (!nftDetail.nft) {
      return (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>
          NFT não encontrado (nft vazio).
        </div>
      );
    }

    const nft = nftDetail.nft;
    const metadata = nft.metadata || {};
    const attributes = metadata.attributes || [];

    // Filtrar todas as instâncias mintadas desse tokenId
    const mintedNFTs = (nftsByCollection || []).filter((item: any) => String(item.tokenId) === String(params.tokenId));
    const supply = mintedNFTs.length;
    const owners = Array.from(new Set(mintedNFTs.map((item: any) => item.owner))).filter(Boolean);

    // Volume e transações reais
    const volume = sales.reduce((sum: number, sale: any) => sum + (Number(sale.price) || 0), 0);
    const transactions = sales.length;

    // Preparar histórico de preço (data, valor)
    const priceHistory = sales.map((sale: any) => ({
      date: sale.timestamp || sale.date || sale.createdAt,
      price: Number(sale.price) || 0
    }));

    // Atividade recente (últimos eventos)
    const recentActivity = sales.slice(0, 5);

    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Imagem principal */}
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
              <CardTitle className="text-2xl text-secondary">{metadata.name || `NFT #${nft.tokenId}`}</CardTitle>
              <CardDescription className="text-secondary/80">{metadata.description || 'Sem descrição.'}</CardDescription>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{params.collectionId}</Badge>
                <Badge variant="secondary">Token ID: {nft.tokenId}</Badge>
                <Badge variant="secondary">Owner: {nft.owner?.slice(0, 8)}...</Badge>
              </div>
              {/* Botão de ação */}
              <Button className="cyber-button bg-[#A20131] text-white">Comprar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Traits/Atributos */}
        <Card className="mb-8 bg-transparent border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary text-lg">Traits / Atributos</CardTitle>
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
                <span className="text-secondary/60 text-sm">Sem atributos.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8 bg-secondary/10" />

        {/* Supply, Owners, Volume, Transações reais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-transparent border-secondary/20">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-secondary">{supply}</div>
              <div className="text-xs text-secondary/70">Supply (mintados)</div>
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
              <div className="text-xs text-secondary/70">Transações</div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de preço (placeholder para gráfico) */}
        <Card className="mb-8 bg-transparent border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary text-lg">Histórico de Preço</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Aqui pode ser integrado um gráfico real usando priceHistory */}
            <Skeleton className="w-full h-40 rounded" />
          </CardContent>
        </Card>

        {/* Atividade recente (eventos reais) */}
        <Card className="bg-transparent border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.length > 0 ? recentActivity.map((event: any, idx: number) => (
                <div key={idx} className="flex justify-between text-secondary/80">
                  <span>{event.buyer || event.seller || 'Usuário'} {event.type || 'comprou'} NFT</span>
                  <span>{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</span>
                </div>
              )) : (
                <span className="text-secondary/60 text-sm">Sem atividade recente.</span>
              )}
            </div>
          </CardContent>
        </Card>
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