import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Bitcoin } from "lucide-react";

export type LaunchpadItem = {
  id: string;
  name: string;
  imageUrl: string;
  status: 'Live' | 'Ended';
  endDate: string;
  blockchain: 'bitcoin' | 'eth' | 'chz';
};

export type LaunchpadCarouselMobileProps = {
  launchpadItems: LaunchpadItem[];
};

export default function LaunchpadCarouselMobile({ launchpadItems }: LaunchpadCarouselMobileProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex gap-3 px-4">
        {launchpadItems.map(item => (
          <Card key={item.id} className="relative w-56 min-w-[220px] max-w-[240px] bg-[#181828] rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
            {/* Status badge */}
            <Badge className={`absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold rounded ${item.status === 'Live' ? 'bg-green-600/90 text-white' : 'bg-gray-700/80 text-white'}`}>{item.status}</Badge>
            {/* Blockchain icon */}
            <span className="absolute top-2 right-2 z-10">
              {item.blockchain === 'bitcoin' && <Bitcoin className="w-5 h-5 text-orange-400" />}
              {/* Adicione outros ícones se necessário */}
            </span>
            {/* Imagem */}
            <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-t-2xl bg-[#222]" />
            {/* Conteúdo */}
            <div className="p-3 flex flex-col gap-1">
              <div className="font-semibold text-white text-base truncate">{item.name}</div>
              <div className="text-xs text-white/60">ends: {item.endDate}</div>
            </div>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
} 