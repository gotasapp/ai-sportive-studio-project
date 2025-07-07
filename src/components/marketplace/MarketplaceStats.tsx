'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Gavel,
  Activity,
  DollarSign
} from 'lucide-react';

interface MarketplaceStatsProps {
  totalListings: number;
  totalAuctions: number;
  totalVolume: string;
  floorPrice: string;
  className?: string;
}

export default function MarketplaceStats({
  totalListings,
  totalAuctions,
  totalVolume,
  floorPrice,
  className = "",
}: MarketplaceStatsProps) {
  const stats = [
    {
      title: "Total Listado",
      value: totalListings.toString(),
      description: "NFTs à venda",
      icon: ShoppingBag,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Leilões Ativos",
      value: totalAuctions.toString(),
      description: "Em andamento",
      icon: Gavel,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      title: "Volume Total",
      value: totalVolume,
      description: "Últimas 24h",
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      title: "Preço Mínimo",
      value: floorPrice,
      description: "Menor preço",
      icon: DollarSign,
      color: "text-[#A20131]",
      bgColor: "bg-[#A20131]/20",
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className="cyber-card border-[#FDFDFD]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#FDFDFD]/70">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <p className="text-xs text-[#FDFDFD]/50">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 