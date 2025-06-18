'use client'

import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';

export function useWeb3() {
  const { walletProvider, address, isConnected } = useAppKit();

  // Legacy SDK for all operations
  const getSDK = async () => {
    if (!walletProvider) {
      throw new Error('Wallet not connected');
    }
    
    const ethersProvider = new ethers.providers.Web3Provider(walletProvider);
    const signer = ethersProvider.getSigner();
    
          const sdk = new ThirdwebSDK(
        ethersProvider,
        {
          chainId: 80001, // Mumbai instead of Amoy
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
        }
      );
    
    sdk.updateSignerOrProvider(signer);
    return sdk;
  };

  // Upload file to IPFS via Thirdweb
  const uploadToIPFS = async (data: File | string) => {
    try {
      const sdk = await getSDK();
      const ipfsUrl = await sdk.storage.upload(data);
      console.log('📤 Uploaded to IPFS:', ipfsUrl);
      return ipfsUrl;
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
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

  // 🎯 SIMPLIFIED: Mint NFT with traditional contract
  const mintNFTWithMetadata = async (
    name: string,
    description: string,
    imageFile: File,
    attributes: Array<{ trait_type: string; value: string }>,
    quantity: number = 1
  ) => {
    try {
      console.log('🚀 Starting NFT mint process...');
      console.log('📝 Name:', name);
      console.log('📄 Description:', description);
      console.log('🎨 Attributes:', attributes);
      
      if (!walletProvider || !address) {
        throw new Error('Wallet not connected');
      }

      // 1. Upload image to IPFS
      console.log('📤 Uploading image to IPFS...');
      const imageUrl = await uploadToIPFS(imageFile);
      console.log('✅ Image uploaded:', imageUrl);
      
      // 2. Create metadata
      const metadata = createNFTMetadata(name, description, imageUrl, attributes);
      console.log('📋 Metadata created:', metadata);
      
      // 3. Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...');
      const metadataUrl = await uploadToIPFS(JSON.stringify(metadata));
      console.log('✅ Metadata uploaded:', metadataUrl);

      // 4. Check network
      try {
        const network = await walletProvider.request({ method: 'eth_chainId' });
        const chainId = parseInt(network, 16);
        console.log('🌐 Current network:', chainId);
        
        if (chainId !== 80001) {
          console.log('⚠️ Note: Contract is on Polygon Mumbai (80001), current network is:', chainId);
        }
      } catch (networkError) {
        console.log('⚠️ Could not check network:', networkError);
      }

      // 5. Get SDK and contract
      console.log('🔗 Connecting to SDK...');
      const sdk = await getSDK();
      
      // 6. Use environment variable for contract address (supports new contract)
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
                              '0x7822698cE3728Ccd54e36E60c413a70b665A1407'; // Fallback to current
      
      console.log('📋 Loading contract:', CONTRACT_ADDRESS);
      const contract = await sdk.getContract(CONTRACT_ADDRESS);
      console.log('✅ Contract loaded:', contract.getAddress());

      // 7. Try minting strategies in order of preference

      // STRATEGY 1: mintTo (most common in NFT Collection contracts)
      console.log('🎯 Strategy 1: Trying mintTo function...');
      try {
        const tx = await contract.call('mintTo', [address, metadataUrl]);
        console.log('✅ mintTo successful:', tx.receipt.transactionHash);
        
        // Get token ID if available
        const events = tx.receipt.events;
        const transferEvent = events?.find((event: any) => event.eventName === 'Transfer');
        const tokenId = transferEvent?.data?.tokenId || 'Unknown';
        
        return {
          ...tx,
          tokenId,
          metadataUrl,
          strategy: 'mintTo'
        };
      } catch (error) {
        console.log('⚠️ mintTo failed:', error.message);
      }

      // STRATEGY 2: safeMint (alternative in some ERC721 contracts)
      console.log('🎯 Strategy 2: Trying safeMint function...');
      try {
        const tx = await contract.call('safeMint', [address, metadataUrl]);
        console.log('✅ safeMint successful:', tx.receipt.transactionHash);
        return {
          ...tx,
          metadataUrl,
          strategy: 'safeMint'
        };
      } catch (error) {
        console.log('⚠️ safeMint failed:', error.message);
      }

      // STRATEGY 3: Try mint with tokenId
      console.log('🎯 Strategy 3: Trying mint with tokenURI...');
      try {
        // Get next token ID
        const nextTokenId = await contract.call('nextTokenIdToMint').catch(() => {
          // Fallback: try to get current supply
          return contract.call('totalSupply').catch(() => BigInt(0));
        });
        
        console.log('🆔 Next token ID:', nextTokenId.toString());
        
        const tx = await contract.call('mint', [address, nextTokenId, metadataUrl]);
        console.log('✅ mint with tokenURI successful:', tx.receipt.transactionHash);
        return {
          ...tx,
          tokenId: nextTokenId.toString(),
          metadataUrl,
          strategy: 'mint'
        };
      } catch (error) {
        console.log('⚠️ mint with tokenURI failed:', error.message);
      }

      // STRATEGY 4: For NFT Drop contracts (legacy claim)
      console.log('🎯 Strategy 4: Trying claim function (legacy)...');
      try {
        // Check token availability first
        const totalMinted = await contract.call("totalMinted").catch(() => BigInt(0));
        const nextTokenId = await contract.call("nextTokenIdToMint").catch(() => BigInt(0));
        const availableTokens = Number(nextTokenId) - Number(totalMinted);
        
        console.log(`📊 Token Status:`);
        console.log(`   - Total Minted: ${totalMinted}`);
        console.log(`   - Next Token ID: ${nextTokenId}`);
        console.log(`   - Available Tokens: ${availableTokens}`);
        
        if (availableTokens <= 0) {
          throw new Error(`❌ No tokens available for claim. Admin needs to call lazyMint() first.`);
        }
        
        // NFT Drop claim
        const tx = await contract.call('claim', [
          address,                    // _receiver
          1,                          // _quantity
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // _currency (native token)
          0,                          // _pricePerToken (free mint)
          {                          // _allowlistProof
            proof: [],
            quantityLimitPerWallet: 0,
            pricePerToken: 0,
            currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
          },
          '0x'                       // _data (empty)
        ]);
        
        console.log('✅ claim successful:', tx.receipt.transactionHash);
        
        // Note: With claim, we need to set tokenURI separately
        console.log('🔧 Setting tokenURI for claimed token...');
        try {
          const claimedTokenId = Number(totalMinted); // Next available token
          await setTokenURI(claimedTokenId, metadataUrl);
          console.log(`✅ TokenURI set for token #${claimedTokenId}`);
        } catch (uriError) {
          console.log('⚠️ Could not set tokenURI:', uriError.message);
        }
        
        return {
          ...tx,
          tokenId: totalMinted.toString(),
          metadataUrl,
          strategy: 'claim'
        };
      } catch (error) {
        console.log('⚠️ claim failed:', error.message);
      }

      throw new Error('❌ All minting strategies failed. Please deploy a new NFT Collection contract.');
      
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      throw error;
    }
  };

  const setClaimConditions = async () => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      const sdk = await getSDK();
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
                              '0x7822698cE3728Ccd54e36E60c413a70b665A1407';
      const contract = await sdk.getContract(CONTRACT_ADDRESS);
      
      console.log('🔧 Setting claim conditions...');
      
      const claimConditions = [{
        startTimestamp: Math.floor(Date.now() / 1000), 
        maxClaimableSupply: 100,
        supplyClaimed: 0,
        quantityLimitPerWallet: 10,
        merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        pricePerToken: 0,
        currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        metadata: ''
      }];
      
      const tx = await contract.call('setClaimConditions', [claimConditions, false]);
      console.log('✅ Claim conditions set:', tx.receipt.transactionHash);
      return tx;
      
    } catch (error) {
      console.error('❌ Set claim conditions failed:', error.message);
      throw error;
    }
  };

  const setTokenURI = async (tokenId: number, metadataUrl: string) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      const sdk = await getSDK();
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
                              '0x7822698cE3728Ccd54e36E60c413a70b665A1407';
      const contract = await sdk.getContract(CONTRACT_ADDRESS);
      
      console.log(`🔧 Setting tokenURI for token #${tokenId}...`);
      console.log(`📝 Metadata URL: ${metadataUrl}`);
      
      const tx = await contract.call('setTokenURI', [tokenId, metadataUrl]);
      console.log(`✅ setTokenURI successful:`, tx.receipt.transactionHash);
      return tx;
      
    } catch (error) {
      console.error('❌ Set tokenURI failed:', error.message);
      throw error;
    }
  };

  return {
    // Connection state
    address,
    isConnected,
    
    // Functions
    uploadToIPFS,
    createNFTMetadata,
    mintNFTWithMetadata,
    setClaimConditions,
    setTokenURI,
    getSDK,
  };
} 