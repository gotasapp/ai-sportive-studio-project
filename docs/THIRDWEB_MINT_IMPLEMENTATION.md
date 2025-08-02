# Thirdweb v5 Mint Implementation Guide

## 📋 Overview

Este documento contém a implementação correta do mint usando Thirdweb v5, baseado na documentação oficial e exemplos funcionais.

## 🔧 Contract Functions Analysis

### Read Functions (View)

#### DEFAULT_ADMIN_ROLE
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    params: [],
  });
}
```

#### balanceOf
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [owner],
  });
}
```

#### claimCondition
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function claimCondition() view returns (uint256 currentStartId, uint256 count)",
    params: [],
  });
}
```

#### contractURI
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function contractURI() view returns (string)",
    params: [],
  });
}
```

#### getActiveClaimConditionId
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function getActiveClaimConditionId() view returns (uint256)",
    params: [],
  });
}
```

#### getClaimConditionById
```javascript
import { useReadContract } from "thirdweb/react";

export default function Component() {
  const { data, isPending } = useReadContract({
    contract,
    method: "function getClaimConditionById(uint256 _conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata) condition)",
    params: [_conditionId],
  });
}
```

### Write Functions (Non-payable/Payable)

#### initialize
```javascript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] _trustedForwarders, address _saleRecipient, address _royaltyRecipient, uint128 _royaltyBps)",
      params: [
        _defaultAdmin,
        _name,
        _symbol,
        _contractURI,
        _trustedForwarders,
        _saleRecipient,
        _royaltyRecipient,
        _royaltyBps,
      ],
    });
    sendTransaction(transaction);
  };
}
```

#### setClaimConditions
```javascript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
      params: [_conditions, _resetClaimEligibility],
    });
    sendTransaction(transaction);
  };
}
```

#### approve
```javascript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function approve(address to, uint256 tokenId) payable",
      params: [to, tokenId],
    });
    sendTransaction(transaction);
  };
}
```

## 🎯 Correct Mint Implementation

### For NFT Collection (ERC721) - Direct Mint

```typescript
import { useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';
import { IPFSService } from './services/ipfs-service';

export function useLaunchpadMint() {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>('');
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const mintLaunchpadNFT = async (
    name: string,
    description: string,
    imageBlob: Blob,
    collectionId: string,
    price: string = "0",
    attributes: Array<{ trait_type: string; value: string }> = []
  ): Promise<LaunchpadMintResult> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!IPFSService.isConfigured()) {
      throw new Error('IPFS not configured. Please add Pinata credentials.');
    }

    setIsMinting(true);
    setError('');

    try {
      console.log('🎯 LAUNCHPAD MINT: Starting mint process...');
      console.log('📦 Name:', name);
      console.log('📝 Description:', description);
      console.log('🎯 Recipient:', account.address);
      console.log('🏗️ Collection ID:', collectionId);

      // 1. Upload image and metadata to IPFS
      console.log('📤 Uploading to IPFS...');
      const ipfsResult = await IPFSService.uploadComplete(
        imageBlob,
        name,
        description,
        'Launchpad',
        'Collection',
        collectionId,
        '1'
      );

      console.log('✅ IPFS upload completed:', ipfsResult.metadataUrl);

      // 2. Create Thirdweb client and contract
      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
      });

      const contract = getContract({
        client,
        chain: defineChain(80002), // Amoy testnet
        address: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || "",
      });

      // 3. Prepare mint transaction using mintTo (CORRECT APPROACH)
      console.log('🔧 Preparing mintTo transaction...');
      const transaction = mintTo({
        contract,
        to: account.address,
        nft: ipfsResult.metadataUrl, // ✅ Use metadata URL from IPFS
      });

      console.log('✅ Transaction prepared with metadata URL:', ipfsResult.metadataUrl);

      // 4. Send transaction using useSendTransaction hook
      console.log('📤 Sending transaction with user wallet...');
      
      return new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (txResult) => {
            console.log('✅ LAUNCHPAD MINT successful:', txResult);
            
            // 5. Save to database
            saveMintedNFTToDatabase({
              collectionId,
              tokenId: txResult.transactionHash,
              metadataUrl: ipfsResult.metadataUrl,
              imageUrl: ipfsResult.imageUrl,
              transactionHash: txResult.transactionHash,
              minterAddress: account.address,
              price
            });

            resolve({
              transactionHash: txResult.transactionHash,
              metadataUrl: ipfsResult.metadataUrl,
              imageUrl: ipfsResult.imageUrl,
              tokenId: txResult.transactionHash
            });
          },
          onError: (error) => {
            console.error('❌ LAUNCHPAD MINT failed:', error);
            setError(error.message || 'Failed to mint NFT');
            reject(error);
          }
        });
      });

    } catch (error: any) {
      console.error('❌ LAUNCHPAD MINT failed:', error);
      setError(error.message || 'Failed to mint NFT');
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  // Helper function to save minted NFT to database
  const saveMintedNFTToDatabase = async (data: {
    collectionId: string;
    tokenId: string;
    metadataUrl: string;
    imageUrl: string;
    transactionHash: string;
    minterAddress: string;
    price: string;
  }) => {
    try {
      const response = await fetch('/api/launchpad/save-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to save mint to database');
      } else {
        console.log('✅ Mint saved to database');
      }
    } catch (error) {
      console.warn('⚠️ Failed to save mint to database:', error);
    }
  };

  return {
    mintLaunchpadNFT,
    isMinting: isMinting,
    error
  };
}
```

## 🔍 Key Differences

### ❌ WRONG APPROACH (claimTo)
```typescript
// DON'T USE THIS - Requires claim conditions
const transaction = claimTo({
  contract,
  to: account.address,
  quantity: BigInt(1),
});
```

### ✅ CORRECT APPROACH (mintTo)
```typescript
// USE THIS - Direct mint without claim conditions
const transaction = mintTo({
  contract,
  to: account.address,
  nft: ipfsResult.metadataUrl, // Metadata URL from IPFS
});
```

## 📝 Important Notes

1. **mintTo** is for direct minting without claim conditions
2. **claimTo** is for claiming with claim conditions (requires setup)
3. **Use metadata URL** in the `nft` parameter for mintTo
4. **User pays gas** - no Engine needed
5. **Wallet connection required** - user must sign transaction

## 🚀 Implementation Steps

1. **Upload to IPFS** - Get metadata URL
2. **Use mintTo** - Direct mint function
3. **Pass metadata URL** - In the `nft` parameter
4. **User signs** - Transaction with wallet
5. **Save to database** - After successful mint

## 🔧 Environment Variables

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=your_contract_address
```

## ✅ Success Criteria

- ✅ Transaction prepared successfully
- ✅ Wallet popup appears for signature
- ✅ Transaction confirmed on blockchain
- ✅ NFT metadata linked correctly
- ✅ Database updated with mint data

## 🐛 Common Issues & Solutions

### Issue: "Claim condition not found"
**Solution**: Use `mintTo` instead of `claimTo`

### Issue: "Execution reverted"
**Solution**: Ensure contract is initialized and has correct permissions

### Issue: "Transaction failed"
**Solution**: Check user has sufficient gas and correct network

### Issue: "Metadata not found"
**Solution**: Ensure IPFS upload completed successfully before minting 