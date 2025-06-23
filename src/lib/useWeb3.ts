'use client'

import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';
import { IPFSService } from './services/ipfs-service';


export function useWeb3() {
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  
  const address = account?.address;
  const isConnected = connectionStatus === 'connected';

  // Thirdweb client and contract setup
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  });

  // Define Amoy testnet
  const amoy = defineChain(80002);
  
  const contract = getContract({
    client,
    chain: amoy,
    address: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || "0xfF973a4aFc5A96DEc81366461A461824c4f80254",
  });

  // 🎯 LEGACY MINT - User pays gas (Thirdweb v5 implementation)
  const mintNFTWithMetadata = async (
    name: string,
    description: string,
    imageFile: File,
    attributes: Array<{ trait_type: string; value: string }>,
    quantity: number = 1
  ) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!IPFSService.isConfigured()) {
      throw new Error('IPFS not configured. Please add Pinata credentials.');
    }

    console.log('🎯 LEGACY MINT: Starting user-paid mint process...');
    console.log('📦 Name:', name);
    console.log('📝 Description:', description);
    console.log('🎯 Recipient:', address);
    console.log('💳 User pays gas');

    try {
      // 1. Upload image and metadata to IPFS
      const ipfsResult = await IPFSService.uploadComplete(
        imageFile,
        name,
        description,
        'Legacy Mint',
        'user-paid',
        'player',
        '00'
      );

      console.log('✅ IPFS upload completed:', ipfsResult.imageUrl);

      // 2. Prepare mint transaction
      const transaction = mintTo({
        contract,
        to: address!,
        nft: ipfsResult.metadataUrl, // Use metadata URL from IPFS
      });

      console.log('✅ Transaction prepared with metadata URL:', ipfsResult.metadataUrl);

      // 3. Send transaction (user pays gas)
      console.log('📤 Sending transaction...');
      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('✅ LEGACY MINT successful:', result);

      return {
        transactionHash: result.transactionHash,
        metadataUrl: ipfsResult.metadataUrl,
        imageUrl: ipfsResult.imageUrl,
      };

    } catch (error) {
      console.error('❌ LEGACY MINT failed:', error);
      throw error;
    }
  };

  const setClaimConditions = async () => {
    throw new Error('setClaimConditions needs to be implemented with Thirdweb v5 SDK');
  };

  const setTokenURI = async (tokenId: number, metadataUrl: string) => {
    throw new Error('setTokenURI needs to be implemented with Thirdweb v5 SDK');
  };

  const lazyMint = async (quantity: number = 100, baseURI: string = '') => {
    throw new Error('lazyMint needs to be implemented with Thirdweb v5 SDK');
  };

  const uploadToIPFS = async (data: File | string) => {
    throw new Error('uploadToIPFS needs to be implemented with Thirdweb v5 SDK');
  };

  const createNFTMetadata = (
    name: string,
    description: string,
    imageUrl: string,
    attributes: Array<{ trait_type: string; value: string }>
  ) => {
    return {
      name,
      description,
      image: imageUrl,
      attributes,
      properties: {
        created_by: 'AI Sports NFT Generator',
        created_at: new Date().toISOString(),
      }
    };
  };

  const getSDK = async () => {
    throw new Error('getSDK needs to be implemented with Thirdweb v5 SDK');
  };

  const switchToChzChain = async () => {
    // For now, just log - this would switch to CHZ chain in production
    console.log('🔄 Switch to CHZ Chain requested (not implemented yet)');
    return Promise.resolve();
  };



  return {
    // Connection state
    address,
    isConnected,
    connectionStatus,
    
    // Functions
    uploadToIPFS,
    createNFTMetadata,
    mintNFTWithMetadata,
    setClaimConditions,
    setTokenURI,
    lazyMint,
    getSDK,
    switchToChzChain,
  };
} 