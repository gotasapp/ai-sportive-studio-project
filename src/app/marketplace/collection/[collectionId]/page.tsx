import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';

// TODO: importar hooks e endpoints reais

export default async function CollectionDetailPage({ params }: { params: { collectionId: string } }) {
  // TODO: buscar dados reais da coleção/NFT usando params.collectionId
  // const data = await fetchData(params.collectionId);
  // if (!data) return notFound();

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Imagem principal */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardContent className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-64 h-64 bg-[#14101e] rounded-lg flex items-center justify-center">
            {/* Placeholder da imagem */}
            <Skeleton className="w-60 h-60 rounded-lg" />
          </div>
          <div className="flex-1 space-y-4">
            <CardTitle className="text-2xl text-secondary">Nome da Coleção</CardTitle>
            <CardDescription className="text-secondary/80">Descrição curta da coleção ou NFT.</CardDescription>
            <div className="flex gap-2">
              <Badge variant="secondary">Tipo</Badge>
              <Badge variant="secondary">Status</Badge>
            </div>
            {/* Botão de ação */}
            <Button className="cyber-button bg-[#A20131] text-white">Comprar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">0</div>
            <div className="text-xs text-secondary/70">Total Supply</div>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-secondary/20">
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-secondary">0</div>
            <div className="text-xs text-secondary/70">Mintados</div>
          </CardContent>
        </Card>
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

      <Separator className="my-8 bg-secondary/10" />

      {/* Traits/Atributos */}
      <Card className="mb-8 bg-transparent border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary text-lg">Traits / Atributos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Placeholder para traits */}
            <Badge variant="secondary">Trait 1</Badge>
            <Badge variant="secondary">Trait 2</Badge>
            <Badge variant="secondary">Trait 3</Badge>
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