'use client';

import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

export function SimpleDeployButton() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const account = useActiveAccount();
  
  const handleDeploy = async () => {
    if (!account) {
      setError('Please connect your wallet first.');
      return;
    }

    setIsDeploying(true);
    setError('');
    setDeployedAddress('');

    try {
      console.log('🚀 Starting new contract deploy from frontend...');
      console.log('📋 Account address:', account.address);
      console.log('📋 Client ID configured:', !!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID);
      
      const client = createThirdwebClient({
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      });
      console.log('✅ Thirdweb client created');

      // Define Polygon Amoy chain com RPC Ankr
      const amoyChain = defineChain({
        id: 80002,
        name: 'Polygon Amoy Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpc: 'https://rpc.ankr.com/polygon_amoy/5b2d60918c8135da4798d0d735c2b2d483d3e3d8992ab6cf34c53b0fd81803ef',
        blockExplorers: [
          {
            name: 'PolygonScan',
            url: 'https://amoy.polygonscan.com',
          },
        ],
      });
      console.log('✅ Chain configured:', amoyChain.id);

      console.log('🔄 Calling deployERC721Contract...');
      
      // Add timeout to prevent infinite hanging
      const deployPromise = deployERC721Contract({
        client,
        chain: amoyChain,
        account,
        type: "DropERC721",
        params: {
          name: 'Simple Frontend Drop',
          symbol: 'SFD',
          description: 'Contract deployed directly from a button.',
          image: 'https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle',
          primary_sale_recipient: account.address,
          royalty_recipient: account.address,
          royalty_bps: 500, // 5%
        },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Deploy timeout after 2 minutes')), 120000);
      });

      console.log('⏰ Deploy started with 2-minute timeout...');
      const newContractAddress = await Promise.race([deployPromise, timeoutPromise]);

      console.log('✅ Contract deployed at:', newContractAddress);
      setDeployedAddress(newContractAddress as string);
    } catch (e: any) {
      console.error('❌ Deploy failed:', e);
      setError('Deploy failed: ' + e.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-gray-800/20 text-white rounded border border-gray-700">
      <h3 className="font-bold">Test Deploy Button</h3>
      <div className="space-y-2">
        <Button
          onClick={handleDeploy}
          disabled={isDeploying || !account}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {isDeploying ? 'Deploying...' : 'Deploy New DropERC721 Contract'}
        </Button>
        
        {isDeploying && (
          <Button
            onClick={() => {
              setIsDeploying(false);
              setError('Deploy cancelled by user');
              console.log('🛑 Deploy cancelled by user');
            }}
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Cancel Deploy
          </Button>
        )}
      </div>

      {deployedAddress && (
        <p className="break-all text-sm text-green-400">
          ✅ Deployed to: {deployedAddress}
        </p>
      )}
      {error && (
        <p className="break-all text-sm text-red-400">
          ❌ Error: {error}
        </p>
      )}
      {!account && (
        <p className="text-sm text-yellow-400">Please connect wallet to deploy.</p>
      )}
    </div>
  );
}
