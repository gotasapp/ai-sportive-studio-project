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
      title: "Total Listings",
      value: totalListings,
      description: "NFTs for sale",
      icon: <Tag className="h-5 w-5 text-[#A20131]" />,
      color: "text-blue-400"
    },
    {
      title: "Total Auctions", 
      value: totalAuctions,
      description: "Active auctions",
      icon: <TrendingUp className="h-5 w-5 text-[#A20131]" />,
      color: "text-green-400"
    },
    {
      title: "Total Volume",
      value: totalVolume,
      description: "Trading volume",
      icon: <DollarSign className="h-5 w-5 text-[#A20131]" />,
      color: "text-purple-400"
    },
    {
      title: "Floor Price",
      value: floorPrice,
      description: "Lowest price",
      icon: <BarChart3 className="h-5 w-5 text-[#A20131]" />,
      color: "text-orange-400"
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="cyber-card border-[#FDFDFD]/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#FDFDFD]/70">
              {stat.title}
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#A20131]/20">
              {stat.icon}
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
      ))}
    </div>
  );
}