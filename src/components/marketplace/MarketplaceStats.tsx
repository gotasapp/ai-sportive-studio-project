'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Gavel,
  Activity,
  DollarSign,
  Tag,
  BarChart3
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
      title: "Listings",
      value: totalListings,
      description: "For sale",
      icon: <Tag className="h-3 w-3 text-[#FF0052]" />,
      color: "text-[#FDFDFD]"
    },
    {
      title: "Auctions", 
      value: totalAuctions,
      description: "Active",
      icon: <TrendingUp className="h-3 w-3 text-[#FF0052]" />,
      color: "text-[#FDFDFD]"
    },
    {
      title: "Volume",
      value: totalVolume,
      description: "Total",
      icon: <DollarSign className="h-3 w-3 text-[#FF0052]" />,
      color: "text-[#FDFDFD]"
    },
    {
      title: "Floor",
      value: floorPrice,
      description: "Lowest",
      icon: <BarChart3 className="h-3 w-3 text-[#FF0052]" />,
      color: "text-[#FDFDFD]"
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="cyber-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
            <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
              {stat.title}
            </CardTitle>
            <div className="p-1 rounded bg-[#FF0052]/20">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className={`text-sm font-bold ${stat.color} mb-0.5`}>
              {stat.value}
            </div>
            <p className="text-xs text-[#FDFDFD]/50">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}