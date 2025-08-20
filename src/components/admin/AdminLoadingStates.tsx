import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Loading for metrics
export function MetricsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="cyber-card animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 bg-gray-dark/50" />
                <Skeleton className="h-6 w-16 bg-gray-dark/70" />
              </div>
              <Skeleton className="h-5 w-5 bg-gray-dark/50 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-24 bg-gray-dark/30" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading for charts
export function ChartLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="cyber-card">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-gray-dark/50" />
              <Skeleton className="h-3 w-48 bg-gray-dark/30" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <div className="relative">
                <Skeleton className="h-32 w-32 rounded-full bg-gray-dark/50" />
                <div className="absolute inset-0 rounded-full border-2 border-gray-medium/20 border-t-primary/50 animate-spin"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading para tabelas
export function TableLoadingSkeleton() {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 bg-gray-dark/50" />
          <Skeleton className="h-3 w-64 bg-gray-dark/30" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-3 rounded-full bg-gray-dark/50" />
                <Skeleton className="h-4 w-20 bg-gray-dark/50" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-8 bg-gray-dark/30" />
                <Skeleton className="h-5 w-12 bg-gray-dark/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Generic loading state with progress
export function ProgressLoadingState({ 
  title, 
  message, 
  progress,
  className = '' 
}: { 
  title: string; 
  message: string; 
  progress?: number;
  className?: string;
}) {
  return (
    <div className={`
      flex flex-col items-center justify-center 
      min-h-[200px] space-y-4 p-8
      ${className}
    `}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-medium">{message}</p>
      </div>
      
      {progress !== undefined ? (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-medium text-center">{progress}% concluído</p>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
}

// Loading para cards de detalhes
export function DetailCardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="cyber-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 bg-gray-dark/50" />
              <Skeleton className="h-5 w-5 bg-gray-dark/50 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-12 bg-gray-dark/70" />
                <Skeleton className="h-4 w-8 bg-gray-dark/30" />
              </div>
              <div className="w-full bg-gray-dark/30 rounded-full h-2">
                <Skeleton className="h-2 w-3/4 bg-gray-dark/50 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32 bg-gray-dark/30" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading state minimalista para inline elements
export function InlineLoadingSkeleton({ width = 'w-16', height = 'h-4' }: { width?: string; height?: string }) {
  return (
    <Skeleton className={`${width} ${height} bg-gray-dark/50 animate-pulse`} />
  );
}

// Loading state para listas
export function ListLoadingSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-4 w-4 rounded-full bg-gray-dark/50" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4 bg-gray-dark/50" />
            <Skeleton className="h-3 w-1/2 bg-gray-dark/30" />
          </div>
          <Skeleton className="h-4 w-8 bg-gray-dark/30" />
        </div>
      ))}
    </div>
  );
}

// Loading state para o admin dashboard completo
export function AdminDashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-gray-dark/70" />
            <Skeleton className="h-4 w-48 bg-gray-dark/30" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20 bg-gray-dark/50 rounded" />
            <Skeleton className="h-6 w-16 bg-gray-dark/30 rounded" />
          </div>
        </div>

        {/* Metrics skeleton */}
        <MetricsLoadingSkeleton />

        {/* Charts skeleton */}
        <ChartLoadingSkeleton />

        {/* Detail cards skeleton */}
        <DetailCardLoadingSkeleton />

        {/* Table skeleton */}
        <TableLoadingSkeleton />

      </div>
    </div>
  );
}

// Hook para gerenciar loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [progress, setProgress] = React.useState(0);

  const startLoading = () => {
    setIsLoading(true);
    setProgress(0);
  };

  const updateProgress = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(0);
  };

  return {
    isLoading,
    progress,
    startLoading,
    updateProgress,
    stopLoading
  };
} 