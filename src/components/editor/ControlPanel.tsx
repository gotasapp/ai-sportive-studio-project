import React from 'react';

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function ControlPanel({ title, children }: ControlPanelProps) {
  return (
    <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-2xl border border-secondary/10 shadow-lg h-full">
      <h2 className="text-2xl font-bold mb-6 text-secondary">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 