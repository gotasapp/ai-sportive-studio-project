import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MidjourneyLayoutProps {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  actions: React.ReactNode;
  marketplace?: React.ReactNode;
  className?: string;
}

export default function MidjourneyLayout({ 
  sidebar, 
  canvas, 
  actions, 
  marketplace,
  className = '' 
}: MidjourneyLayoutProps) {
  return (
    <div className={`flex h-screen bg-transparent text-white overflow-hidden ${className}`}>
      
      {/* SIDEBAR - Estilo Midjourney */}
      <div className="w-80 bg-transparent border-r border-gray-medium/20 flex flex-col overflow-y-auto">
        <div className="p-4 space-y-3">
          {sidebar}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* CANVAS PRINCIPAL */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-transparent">
          {canvas}
        </div>

        {/* ACTIONS BAR */}
        <div className="px-6 py-4 border-t border-gray-medium/20 bg-black/90 backdrop-blur-sm">
          {actions}
        </div>

        {/* MARKETPLACE CAROUSEL */}
        {marketplace && (
          <div className="px-6 py-3 border-t border-gray-medium/10 bg-black/50">
            {marketplace}
          </div>
        )}

      </div>
    </div>
  );
}

// Sidebar section component
interface SidebarSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function SidebarSection({ 
  title, 
  icon: Icon, 
  children, 
  collapsible = false,
  defaultOpen = true,
  className = ''
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Card className={`cyber-card border-gray-medium/20 ${className}`}>
      <CardHeader 
        className={`pb-2 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <CardTitle className="text-xs font-medium text-gray-light uppercase tracking-wide flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-3 w-3" />}
            <span>{title}</span>
          </div>
          {collapsible && (
            <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0 pb-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Component for compact selection grid
interface CompactGridProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    description?: string;
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
  columns?: number;
}

export function CompactGrid({ items, selectedId, onSelect, columns = 2 }: CompactGridProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-2`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`
            p-2 rounded-lg border text-left transition-all duration-200
            ${selectedId === item.id 
              ? 'border-primary bg-primary/10 text-white' 
              : 'border-gray-medium/30 bg-gray-dark/20 text-gray-light hover:border-gray-light/40 hover:bg-gray-dark/40'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            {item.icon && <item.icon className="h-3 w-3" />}
            <span className="text-xs font-medium">{item.label}</span>
          </div>
          {item.description && (
            <p className="text-xs text-gray-medium mt-1 leading-tight">
              {item.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

// Input compacto para o sidebar
interface CompactInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'number';
}

export function CompactInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  maxLength,
  type = 'text' 
}: CompactInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-medium uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="
          w-full px-3 py-2 text-sm
          bg-gray-dark/30 border border-gray-medium/30
          rounded-lg text-white placeholder-gray-medium
          focus:border-gray-light/50 focus:bg-gray-dark/50
          focus:outline-none focus:ring-1 focus:ring-primary/20
          transition-all duration-200
        "
      />
    </div>
  );
}

// Compact upload button
interface CompactUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  children: React.ReactNode;
  className?: string;
}

export function CompactUpload({ onUpload, accept = "image/*", children, className = '' }: CompactUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full p-3 border border-dashed border-gray-medium/50 
          rounded-lg text-gray-light hover:border-gray-light/70 
          hover:bg-gray-dark/20 transition-all duration-200
          ${className}
        `}
      >
        {children}
      </button>
    </>
  );
}

// Slider compacto
interface CompactSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function CompactSlider({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1,
  unit = ''
}: CompactSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-medium uppercase tracking-wide">
          {label}
        </label>
        <span className="text-xs text-white font-medium">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full h-1 bg-gray-dark rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm
          [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none
        "
      />
    </div>
  );
} 