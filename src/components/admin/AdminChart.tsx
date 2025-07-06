import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

// Configuração minimalista para gráficos
const chartConfig = {
  primary: {
    label: "Primary",
    color: "#510019", // Chart primary
  },
  secondary: {
    label: "Secondary", 
    color: "#ADADAD", // Chart secondary
  },
  tertiary: {
    label: "Tertiary",
    color: "#707070", // Chart tertiary
  },
  quaternary: {
    label: "Quaternary",
    color: "#333333", // Chart quaternary
  },
  accent: {
    label: "Accent",
    color: "#A20131", // Chart accent
  }
};

interface AdminChartProps {
  title: string;
  description?: string;
  data: any[];
  type: 'bar' | 'line' | 'area' | 'pie';
  dataKey?: string;
  xKey?: string;
  height?: number;
  className?: string;
}

export default function AdminChart({ 
  title, 
  description, 
  data, 
  type, 
  dataKey = 'value', 
  xKey = 'name',
  height = 300,
  className = ''
}: AdminChartProps) {
  
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <YAxis 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <ChartTooltip 
              cursor={{ fill: 'rgba(81, 0, 25, 0.1)' }}
              content={<ChartTooltipContent />}
            />
            <Bar 
              dataKey={dataKey} 
              fill="var(--color-primary)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );
        
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <YAxis 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <ChartTooltip 
              cursor={{ stroke: '#510019', strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-primary)', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'var(--color-accent)' }}
            />
          </LineChart>
        );
        
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <YAxis 
              tick={{ fill: '#ADADAD', fontSize: 12 }}
              axisLine={{ stroke: '#707070' }}
            />
            <ChartTooltip 
              cursor={{ stroke: '#510019', strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="var(--color-primary)"
              fillOpacity={0.1}
            />
          </AreaChart>
        );
        
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={Object.values(chartConfig)[index % Object.values(chartConfig).length].color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        );
        
      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <Card className={`cyber-card ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs text-gray-medium">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-full">
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 