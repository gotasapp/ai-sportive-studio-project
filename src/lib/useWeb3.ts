'use client'

import { useAddress, useConnectionStatus, useContract, useContractWrite, useStorageUpload, useSwitchChain } from '@thirdweb-dev/react';
import { thirdwebConfig } from './config';

export function useWeb3() {
  // Thirdweb hooks
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const switchChain = useSwitchChain();
  const { mutateAsync: upload } = useStorageUpload();
  
  // Get connection status
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  
  // Contract instances
  const { contract: nftDropContract } = useContract(
    thirdwebConfig.contracts.nftDrop.address,
    'nft-drop'
  );
  
  const { contract: nftEditionContract } = useContract(
    thirdwebConfig.contracts.nftEdition.address,
    'edition-drop'
  );
  
  const { contract: marketplaceContract } = useContract(
    thirdwebConfig.contracts.marketplace.address,
    'marketplace-v3'
  );
  
  // NFT Minting functions
  const { mutateAsync: claimNFT } = useContractWrite(nftDropContract, 'claim');
  const { mutateAsync: mintNFT } = useContractWrite(nftEditionContract, 'mintTo');
  
  // IPFS Upload function
  const uploadToIPFS = async (file: File | string) => {
    try {
      const uploadUrl = await upload({
        data: [file],
        options: { uploadWithGatewayUrl: true, uploadWithoutDirectory: true },
      });
      return uploadUrl[0];
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  };
  
  // NFT Metadata creation
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
  
  // Mint NFT with metadata
  const mintNFTWithMetadata = async (
    name: string,
    description: string,
    imageFile: File,
    attributes: Array<{ trait_type: string; value: string }>,
    quantity: number = 1
  ) => {
    try {
      // Upload image to IPFS
      const imageUrl = await uploadToIPFS(imageFile);
      
      // Create metadata
      const metadata = createNFTMetadata(name, description, imageUrl, attributes);
      
      // Upload metadata to IPFS
      const metadataUrl = await uploadToIPFS(JSON.stringify(metadata));
      
      // Mint NFT
      if (quantity === 1 && nftDropContract) {
        // Single NFT via Drop contract
        return await claimNFT({
          args: [address, quantity]
        });
      } else if (nftEditionContract) {
        // Edition NFT via Edition contract
        return await mintNFT({
          args: [address, quantity, metadataUrl, 0]
        });
      }
      
      throw new Error('No suitable contract available for minting');
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  };
  
  // Switch to CHZ Chain
  const switchToChzChain = async () => {
    try {
      await switchChain(88888);
    } catch (error) {
      console.error('Error switching to CHZ Chain:', error);
      throw error;
    }
  };
  
  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    connectionStatus,
    
    // Contracts
    nftDropContract,
    nftEditionContract,
    marketplaceContract,
    
    // Functions
    uploadToIPFS,
    createNFTMetadata,
    mintNFTWithMetadata,
    switchToChzChain,
    
    // Thirdweb native functions
    upload,
    switchChain,
  };
} 