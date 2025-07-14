import CollectionDetailHeader from '@/components/marketplace/CollectionDetailHeader';
import CollectionPriceHistory from '@/components/marketplace/CollectionPriceHistory';
import CollectionTraits from '@/components/marketplace/CollectionTraits';

export default function CollectionDetailPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      {/* Top Card: Imagem + Stats + Botão */}
      <CollectionDetailHeader />
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Esquerda: Gráfico */}
        <div className="flex-1 min-w-[320px]">
          <CollectionPriceHistory />
        </div>
        {/* Direita: Traits */}
        <div className="w-full md:w-1/3">
          <CollectionTraits />
        </div>
      </div>
    </div>
  );
} 