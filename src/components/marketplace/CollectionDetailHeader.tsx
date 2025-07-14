import { Button } from '@/components/ui/button';

export default function CollectionDetailHeader() {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-center">
      {/* Imagem grande da coleção/NFT */}
      <div className="w-full md:w-1/3 flex justify-center">
        <div className="aspect-square w-48 md:w-64 bg-secondary/10 rounded-lg" />
      </div>
      {/* Stats + Botão */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          {/* Stats Cards */}
          <div className="flex-1 bg-secondary/10 rounded-lg p-4">
            <div className="text-xs text-secondary/70">Total Supply</div>
            <div className="text-xl font-bold mt-1">--</div>
          </div>
          <div className="flex-1 bg-secondary/10 rounded-lg p-4">
            <div className="text-xs text-secondary/70">NFTs</div>
            <div className="text-xl font-bold mt-1">--</div>
          </div>
          <div className="flex-1 bg-secondary/10 rounded-lg p-4">
            <div className="text-xs text-secondary/70">Activity</div>
            <div className="text-xl font-bold mt-1">--</div>
          </div>
        </div>
        {/* Botão de ação */}
        <div className="mt-2">
          <Button className="w-full md:w-auto">Connect Wallet</Button>
        </div>
      </div>
    </div>
  );
} 