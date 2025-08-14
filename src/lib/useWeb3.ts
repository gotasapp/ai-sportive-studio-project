'use client'

import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { createThirdwebClient, getContract, sendTransaction, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';
import { claimTo as claimToERC1155 } from 'thirdweb/extensions/erc1155';
import { claimTo, getActiveClaimCondition } from 'thirdweb/extensions/erc721';
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

  // Define chains
  const amoy = defineChain(80002);
  const chzMainnet = defineChain(88888);
  
  // Configuração simplificada - usar diretamente as variáveis configuradas no Vercel
  const activeChain = amoy; // Polygon Amoy testnet
    
  // Usar diretamente a variável configurada no Vercel para NFT Collection (ERC721)
  const contractAddress = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || "0xfF973a4aFc5A96DEc81366461A461824c4f80254";
  
  // Edition Drop Contract - usar o mesmo por simplicidade
  const editionDropContractAddress = contractAddress;
  
  // Launchpad Contract (OpenEditionERC721) - usar o novo endereço correto
  const launchpadContractAddress = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || "0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639";
  
  // NFT Collection contract (ERC721) for unique individual NFTs
  const contract = getContract({
    client,
    chain: activeChain,
    address: contractAddress,
  });

  // Edition Drop contract (ERC1155) for collections with multiple quantities and claim conditions
  const editionDropContract = getContract({
    client,
    chain: activeChain,
    address: editionDropContractAddress,
  });

  // Launchpad contract (OpenEditionERC721) for public mint with claim conditions
  const launchpadContract = getContract({
    client,
    chain: activeChain,
    address: launchpadContractAddress,
  });

  // 🎯 LEGACY MINT - User pays gas (Thirdweb v5 implementation with NFT Drop)
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

  // 🎯 EDITION DROP CLAIM - User pays gas (ERC1155 Edition Drop for collections with claim conditions)
  const mintEditionWithMetadata = async (
    name: string,
    description: string,
    imageFile: File,
    tokenId: string = "0", // Edition Drop Token ID (0 for first edition)
    quantity: number = 1, // Number of copies to claim
    attributes: any[] = []
  ) => {
    if (!account?.address) throw new Error('No wallet connected');

    try {
      console.log(`🎯 Edition Drop Claim: ${quantity} copies of token ${tokenId}`);
      console.log('📦 Name:', name);
      console.log('📝 Description:', description);
      console.log('🎯 Recipient:', account.address);
      console.log('💳 User pays gas');

      // For Edition Drop, we don't need to upload metadata - it's already lazy minted
      // We just claim existing tokens

      // Prepare claim transaction for Edition Drop (ERC1155) - using claimTo
      const transaction = claimToERC1155({
        contract: editionDropContract,
        to: account.address,
        tokenId: BigInt(tokenId),
        quantity: BigInt(quantity),
      });

      console.log('✅ Transaction prepared for Edition Drop claim');

      // 3. Send transaction (user pays gas)
      console.log('📤 Sending transaction...');
      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('✅ EDITION DROP CLAIM successful:', result);

      return {
        success: true,
        transactionHash: result.transactionHash,
        tokenId: tokenId,
        quantity: quantity,
        metadata: {
          name,
          description,
          image: 'https://example.com/placeholder.png', // Metadata is already on-chain
          imageHttp: 'https://example.com/placeholder.png',
          attributes,
          metadataUrl: '', // Already lazy minted
          created_at: new Date().toISOString(),
        }
      };

    } catch (error: any) {
      console.error('❌ Edition Drop claim failed:', error);
      throw error;
    }
  };

  // 🎯 LAUNCHPAD MINT - Public mint using claim conditions (OpenEditionERC721)
  const claimLaunchpadNFT = async (quantity: number = 1) => {
    if (!account?.address) throw new Error('No wallet connected');

    try {
      console.log(`🎯 Launchpad Claim: ${quantity} NFTs`);
      console.log('🎯 Recipient:', account.address);
      console.log('💳 User pays gas based on claim conditions');

      // Get active claim condition to determine price
      const claimCondition = await getActiveClaimCondition({
        contract: launchpadContract,
      });

      console.log('📋 Active claim condition:', claimCondition);

      // Calculate total cost
      const totalCost = claimCondition.pricePerToken * BigInt(quantity);
      
      // Prepare claim transaction
      const baseTx = claimTo({
        contract: launchpadContract,
        to: account.address,
        quantity: BigInt(quantity),
      });

      console.log('✅ Transaction prepared for Launchpad claim');
      console.log('💰 Total cost:', totalCost.toString(), 'wei');

      // Send transaction (user pays gas + price)
      console.log('📤 Sending transaction...');
      const result = await sendTransaction({ transaction: baseTx, account, value: totalCost });

      console.log('✅ LAUNCHPAD CLAIM successful:', result);

      return {
        success: true,
        transactionHash: result.transactionHash,
        quantity: quantity,
        totalCost: totalCost.toString(),
        claimCondition,
      };

    } catch (error: any) {
      console.error('❌ Launchpad claim failed:', error);
      throw error;
    }
  };

  // 🎯 Get Launchpad claim condition info
  const getLaunchpadClaimCondition = async () => {
    try {
      const claimCondition = await getActiveClaimCondition({
        contract: launchpadContract,
      });
      
      return claimCondition;
    } catch (error: any) {
      console.error('❌ Failed to get claim condition:', error);
      throw error;
    }
  };

  return {
    // Connection state
    address,
    isConnected,
    connectionStatus,
    
    // Functions
    uploadToIPFS,
    createNFTMetadata,
    mintNFTWithMetadata, // Legacy mint (NFT Collection ERC721)
    mintEditionWithMetadata, // Edition Drop claim (ERC1155)
    claimLaunchpadNFT, // Launchpad mint (OpenEditionERC721)
    getLaunchpadClaimCondition, // Get claim condition info
    setClaimConditions,
    setTokenURI,
    lazyMint,
    getSDK,
    switchToChzChain,

    // Contracts
    contract, // Legacy NFT Collection contract
    editionDropContract, // Edition Drop contract
    launchpadContract, // Launchpad contract (OpenEditionERC721)
  };
} 