'use client'

import { ReactNode } from 'react';
import { ThirdwebProvider as Provider } from 'thirdweb/react';

interface ThirdwebProviderProps {
  children: ReactNode;
}

export function ThirdwebProvider({ children }: ThirdwebProviderProps) {
  return (
    <Provider>
      {children}
    </Provider>
  );
} 