'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketplaceLoadingProps {
  view?: 'grid' | 'list' | 'table';
  itemCount?: number;
}

export default function MarketplaceLoading({ 
  view = 'grid', 
  itemCount = 8 
}: MarketplaceLoadingProps) {
  
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {Array.from({ length: itemCount }).map((_, index) => (
          <Card key={index} className="cyber-card overflow-hidden">
            <Skeleton className="aspect-square w-full bg-[#FDFDFD]/10" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4 bg-[#FDFDFD]/10" />
              <Skeleton className="h-3 w-1/2 bg-[#FDFDFD]/10" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16 bg-[#FDFDFD]/10" />
                <Skeleton className="h-8 w-20 bg-[#FDFDFD]/10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: itemCount }).map((_, index) => (
          <Card key={index} className="cyber-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg bg-[#FDFDFD]/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-3 w-1/2 bg-[#FDFDFD]/10" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-3 w-12 bg-[#FDFDFD]/10" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Table view
  return (
    <div className="p-6">
      <Card className="cyber-card">
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 border-b border-[#FDFDFD]/10 last:border-b-0">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg bg-[#FDFDFD]/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-[#FDFDFD]/10" />
                    <Skeleton className="h-3 w-24 bg-[#FDFDFD]/10" />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <Skeleton className="h-4 w-16 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-4 w-12 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-4 w-16 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-8 w-20 bg-[#FDFDFD]/10" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para loading das estatísticas
export function MarketplaceStatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="bg-transparent border-[#FDFDFD]/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-20 bg-[#FDFDFD]/10" />
              <Skeleton className="h-8 w-8 rounded-lg bg-[#FDFDFD]/10" />
            </div>
            <Skeleton className="h-8 w-16 bg-[#FDFDFD]/10 mb-2" />
            <Skeleton className="h-3 w-24 bg-[#FDFDFD]/10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 