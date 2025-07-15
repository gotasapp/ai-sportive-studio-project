'use client'

import React from 'react';
import { ContractRoleChecker } from '@/components/debug/ContractRoleChecker';
import { RequireWallet } from '@/components/RequireWallet';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">Debug & Troubleshooting</h1>
          <p className="text-gray-400">
            Debug tools to troubleshoot contract permissions and minting issues
          </p>
        </div>

        <RequireWallet>
          <div className="flex justify-center">
            <ContractRoleChecker />
          </div>
        </RequireWallet>
      </div>
    </div>
  );
} 