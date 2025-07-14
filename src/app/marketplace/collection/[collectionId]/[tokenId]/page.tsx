import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';

async function fetchNFTDetail(tokenId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/marketplace/nft-collection?action=getNFT&tokenId=${tokenId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function NFTDetailPage({ params }: { params: { collectionId: string, tokenId: string } }) {
  const data = await fetchNFTDetail(params.tokenId);
  if (!data || !data.success || !data.nft) return notFound();
  const nft = data.nft;
  const metadata = nft.metadata || {};
  const attributes = metadata.attributes || [];

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

      {/* Supply e Owners (futuro: múltiplos exemplares) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">1</div>
            <div className="text-xs text-secondary/70">Supply (mintados)</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">1</div>
            <div className="text-xs text-secondary/70">Owners</div>
          </CardContent>
        </Card>
        {/* Placeholders para volume/transações */}
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">0</div>
            <div className="text-xs text-secondary/70">Volume</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">0</div>
            <div className="text-xs text-secondary/70">Transações</div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de preço (placeholder) */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Histórico de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-40 rounded" />
        </CardContent>
      </Card>

      {/* Atividade recente (placeholder) */}
      <Card className="bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
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