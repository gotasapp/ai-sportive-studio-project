import { Skeleton } from '@/components/ui/skeleton';

interface MarketplacePageSkeletonProps {
  showCarousel?: boolean;
  showStats?: boolean;
  showGrid?: boolean;
  itemCount?: number;
}

export default function MarketplacePageSkeleton({ 
  showCarousel = true, 
  showStats = true, 
  showGrid = true,
  itemCount = 8 
}: MarketplacePageSkeletonProps) {
  return (
    <div className="flex-1">
      {/* Featured Carousel Skeleton */}
      {showCarousel && (
        <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] bg-gradient-to-r from-[#030303]/20 to-[#0b0518]/20 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div className="absolute bottom-8 left-8 md:left-16 lg:left-24 z-10">
            <Skeleton className="h-8 w-24 mb-4 bg-[#FDFDFD]/10" />
            <Skeleton className="h-8 w-64 mb-3 bg-[#FDFDFD]/10" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full bg-[#FDFDFD]/10" />
              <div>
                <Skeleton className="h-5 w-32 mb-1 bg-[#FDFDFD]/10" />
                <Skeleton className="h-4 w-24 bg-[#FDFDFD]/10" />
              </div>
            </div>
          </div>
          {/* Indicators */}
          <div className="absolute bottom-8 right-8">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/30"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        {/* Stats Skeleton */}
        {showStats && (
          <div className="py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="cyber-card p-4">
                  <Skeleton className="h-4 w-20 mb-2 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-6 w-16 bg-[#FDFDFD]/10" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32 bg-[#FDFDFD]/10" />
            <Skeleton className="h-10 w-24 bg-[#FDFDFD]/10" />
            <Skeleton className="h-10 w-20 bg-[#FDFDFD]/10" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 bg-[#FDFDFD]/10" />
            <Skeleton className="h-10 w-10 bg-[#FDFDFD]/10" />
          </div>
        </div>

        {/* Grid Skeleton */}
        {showGrid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className="cyber-card rounded-xl overflow-hidden animate-pulse">
                <Skeleton className="aspect-square w-full bg-[#FDFDFD]/10" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-[#FDFDFD]/10" />
                  <Skeleton className="h-5 w-full bg-[#FDFDFD]/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1 bg-[#FDFDFD]/10" />
                      <Skeleton className="h-4 w-20 bg-[#FDFDFD]/10" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full bg-[#FDFDFD]/10" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Specific component for carousel
export function CarouselSkeleton() {
  return <MarketplacePageSkeleton showCarousel={true} showStats={false} showGrid={false} />;
}

// Componente específico para stats
export function StatsSkeleton() {
  return <MarketplacePageSkeleton showCarousel={false} showStats={true} showGrid={false} />;
}

// Componente específico para grid
export function GridSkeleton({ itemCount = 8 }: { itemCount?: number }) {
  return <MarketplacePageSkeleton showCarousel={false} showStats={false} showGrid={true} itemCount={itemCount} />;
} 