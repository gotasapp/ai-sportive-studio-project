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
      icon: <Tag className="h-3 w-3 text-[#A20131]" />,
      color: "text-blue-400"
    },
    {
      title: "Auctions", 
      value: totalAuctions,
      description: "Active",
      icon: <TrendingUp className="h-3 w-3 text-[#A20131]" />,
      color: "text-green-400"
    },
    {
      title: "Volume",
      value: totalVolume,
      description: "Total",
      icon: <DollarSign className="h-3 w-3 text-[#A20131]" />,
      color: "text-purple-400"
    },
    {
      title: "Floor",
      value: floorPrice,
      description: "Lowest",
      icon: <BarChart3 className="h-3 w-3 text-[#A20131]" />,
      color: "text-orange-400"
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-transparent border-[#FDFDFD]/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1">
            <CardTitle className="text-xs font-medium text-[#FDFDFD]/70">
              {stat.title}
            </CardTitle>
            <div className="p-1 rounded bg-[#A20131]/20">
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