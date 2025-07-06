import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className = ''
}: MetricCardProps) {
  return (
    <Card className={`cyber-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xs text-gray-medium font-medium uppercase tracking-wide">
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl font-semibold text-white">
              {value}
            </span>
            {trend && (
              <Badge 
                variant={trend.isPositive ? "default" : "secondary"}
                className={`text-xs px-2 py-1 ${
                  trend.isPositive 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-dark text-gray-light'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
            )}
          </div>
        </div>
        <Icon className="h-5 w-5 text-gray-medium" />
      </CardHeader>
      {(description || trend) && (
        <CardContent className="pt-0">
          {description && (
            <CardDescription className="text-xs text-gray-medium">
              {description}
            </CardDescription>
          )}
          {trend && (
            <p className="text-xs text-gray-medium mt-1">
              {trend.label}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface MetricsGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
      value: number;
      isPositive: boolean;
      label: string;
    };
  }>;
  className?: string;
}

export function MetricsGrid({ metrics, className = '' }: MetricsGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

interface ProgressMetricProps {
  title: string;
  value: number;
  maxValue?: number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function ProgressMetric({ 
  title, 
  value, 
  maxValue = 100, 
  description, 
  icon: Icon,
  className = ''
}: ProgressMetricProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <Card className={`cyber-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-gray-medium font-medium uppercase tracking-wide">
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 text-gray-medium" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-white">{value}</span>
            <span className="text-sm text-gray-medium">
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-dark rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {description && (
            <CardDescription className="text-xs text-gray-medium">
              {description}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonMetricProps {
  title: string;
  current: number;
  previous: number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function ComparisonMetric({ 
  title, 
  current, 
  previous, 
  description, 
  icon: Icon,
  className = ''
}: ComparisonMetricProps) {
  const change = current - previous;
  const changePercentage = previous > 0 ? (change / previous) * 100 : 0;
  const isPositive = change > 0;
  
  return (
    <Card className={`cyber-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-gray-medium font-medium uppercase tracking-wide">
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 text-gray-medium" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-semibold text-white">
            {current.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isPositive ? "default" : "secondary"}
              className={`text-xs px-2 py-1 ${
                isPositive 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-dark text-gray-light'
              }`}
            >
              {isPositive ? '+' : ''}{changePercentage.toFixed(1)}%
            </Badge>
            <span className="text-xs text-gray-medium">
              vs período anterior
            </span>
          </div>
          {description && (
            <CardDescription className="text-xs text-gray-medium">
              {description}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 