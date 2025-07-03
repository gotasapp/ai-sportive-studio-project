import React from 'react';

interface EditorPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function EditorPanel({ title, children }: EditorPanelProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-style text-xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 