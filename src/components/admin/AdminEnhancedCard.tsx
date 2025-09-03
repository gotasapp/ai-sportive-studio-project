import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LucideIcon, Info } from 'lucide-react';

interface EnhancedCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  additionalInfo?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AdminEnhancedCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  additionalInfo,
  children,
  className = ''
}: EnhancedCardProps) {
  return (
    <TooltipProvider>
      <Card className={`
        group relative overflow-hidden
        bg-black/40 backdrop-blur-sm
        border border-gray-medium/20
        hover:border-gray-light/40 hover:bg-black/60
        transition-all duration-300 ease-out
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        hover:translate-y-[-2px]
        cyber-card ${className}
      `}>
        
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xs text-gray-medium font-medium uppercase tracking-wide">
                  {title}
                </CardTitle>
                {additionalInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-medium hover:text-gray-light cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">{additionalInfo}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-xl md:text-2xl font-semibold text-white group-hover:text-gray-light transition-colors">
                  {value}
                </span>
                {trend && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Badge 
                        variant={trend.isPositive ? "default" : "secondary"}
                        className={`
                          text-xs px-2 py-1 cursor-help
                          ${trend.isPositive 
                            ? 'bg-primary hover:bg-primary/80 text-white' 
                            : 'bg-gray-dark hover:bg-gray-dark/80 text-gray-light'
                          }
                          transition-colors duration-200
                        `}
                      >
                        {trend.isPositive ? '+' : ''}{trend.value}%
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Detalhes da Tendência</h4>
                        <Separator className="bg-gray-medium/20" />
                        <p className="text-xs text-gray-light">
                          {trend.label}
                        </p>
                        <p className="text-xs text-gray-medium">
                          {trend.isPositive ? '↗️ Crescimento' : '↘️ Declínio'} de {Math.abs(trend.value)}% comparado ao período anterior
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <div className="p-2 rounded-lg bg-gray-dark/30 group-hover:bg-gray-dark/50 transition-colors">
                <Icon className="h-5 w-5 text-gray-medium group-hover:text-gray-light transition-colors" />
              </div>
            </div>
          </div>
        </CardHeader>
        
        {(description || children) && (
          <>
            <Separator className="bg-gray-medium/10" />
            <CardContent className="relative pt-3">
              {description && (
                <CardDescription className="text-xs text-gray-medium group-hover:text-gray-light transition-colors">
                  {description}
                </CardDescription>
              )}
              {children && (
                <div className="mt-2">
                  {children}
                </div>
              )}
            </CardContent>
          </>
        )}
        
        {/* Subtle border glow on hover */}
        <div className="absolute inset-0 rounded-lg border border-primary/0 group-hover:border-primary/10 transition-all duration-300 pointer-events-none" />
        
      </Card>
    </TooltipProvider>
  );
}

// Metrics component with glass effect
export function GlassMetricsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  className = ''
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`
      relative group
      p-4 rounded-lg
      bg-gradient-to-br from-black/20 via-black/40 to-black/60
      backdrop-blur-md
      border border-gray-medium/20
      hover:border-gray-light/30
      transition-all duration-300
      hover:shadow-[0_8px_30px_rgb(162,1,49,0.1)]
      ${className}
    `}>
      
      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-gray-medium uppercase tracking-wide">
            {title}
          </h3>
          <Icon className="h-4 w-4 text-gray-medium group-hover:text-gray-light transition-colors" />
        </div>
        
        <div className="text-2xl font-semibold text-white group-hover:text-gray-light transition-colors mb-1">
          {value}
        </div>
        
        {description && (
          <p className="text-xs text-gray-medium group-hover:text-gray-light transition-colors">
            {description}
          </p>
        )}
      </div>
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-lg border border-primary/0 group-hover:border-primary/20 transition-all duration-300" />
      
    </div>
  );
} 