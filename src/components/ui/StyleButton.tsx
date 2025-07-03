'use client';

import React from 'react';

interface StyleButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function StyleButton({ onClick, isActive, children, className = '' }: StyleButtonProps) {
  const baseClasses = 'style-button px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all w-full';
  const activeClasses = isActive ? 'active' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} ${className}`}
    >
      {children}
    </button>
  );
} 