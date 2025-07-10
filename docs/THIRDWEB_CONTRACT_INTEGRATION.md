# Thirdweb Contract Integration Documentation

## SDK Installation & Setup

### Installation
```bash
npm i thirdweb
```

### Initialize SDK and Contract
```typescript
import {
  createThirdwebClient,
  getContract,
  resolveMethod,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebProvider } from "thirdweb/react";

// create the client with your clientId, or secretKey if in a server environment
export const client = createThirdwebClient({
  clientId: "YOUR_CLIENT_ID",
});

// connect to your contract
export const contract = getContract({
  client,
  chain: defineChain(80002),
  address: "0xfF973a4aFc5A96DEc81366461A461824c4f80254",
});

function App() {
  return (
    <ThirdwebProvider>
      <Component />
    </ThirdwebProvider>
  );
}
```

**Note**: You will need to pass a client ID/secret key to use thirdweb's infrastructure services. If you don't have any API keys yet you can create one by creating a project for free from the dashboard.

## Reading Contract State ⭐

### Get All NFTs from Collection
```typescript
import { readContract } from "thirdweb";

// Get total supply
const totalSupply = await readContract({
  contract: nftContract,
  method: "function totalSupply() view returns (uint256)",
  params: []
});

// Get specific NFT owner
const owner = await readContract({
  contract: nftContract,
  method: "function ownerOf(uint256) view returns (address)",
  params: [BigInt(tokenId)]
});

// Get NFT metadata URI
const tokenUri = await readContract({
  contract: nftContract,
  method: "function tokenURI(uint256) view returns (string)",
  params: [BigInt(tokenId)]
});
```

### Our Implementation (Already Working!)
```typescript
// API: /api/marketplace/nft-collection?action=getAllNFTs
// Returns: All minted NFTs with metadata and ownership info

const response = await fetch('/api/marketplace/nft-collection?action=getAllNFTs&limit=50');
const data = await response.json();

// Returns:
{
  success: true,
  nfts: [
    {
      tokenId: "0",
      owner: "0x123...",
      tokenUri: "ipfs://...",
      metadata: {
        name: "NFT Name",
        description: "Description",
        image: "ipfs://...",
        attributes: [...]
      },
      contractAddress: "0xfF973a4aFc5A96DEc81366461A461824c4f80254"
    },
    // ... more NFTs
  ],
  totalSupply: 20,
  fetched: 20
}
```

## NFT Collection Contract Functions

### 1. Grant Role (approve)
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function grantRole(bytes32 role, address account)",
      params: [role, account],
    });
    sendTransaction(transaction);
  };
}
```

### 2. Burn Token
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function burn(uint256 tokenId)",
      params: [tokenId],
    });
    sendTransaction(transaction);
  };
}
```

### 3. Freeze Metadata
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function burn(uint256 tokenId)",
      params: [tokenId],
    });
    sendTransaction(transaction);
  };
}
```

### 4. Set Token URI
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function setTokenURI(uint256 _tokenId, string _uri)",
      params: [_tokenId, _uri],
    });
    sendTransaction(transaction);
  };
}
```

### 5. Transfer From
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function transferFrom(address from, address to, uint256 tokenId)",
      params: [from, to, tokenId],
    });
    sendTransaction(transaction);
  };
}
```

### 6. Mint To
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function burn(uint256 tokenId)",
      params: [tokenId],
    });
    sendTransaction(transaction);
  };
}
```

### 7. Mint With Signature ⭐
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function mintWithSignature((address to, address royaltyRecipient, uint256 royaltyBps, address primarySaleRecipient, string uri, uint256 price, address currency, uint128 validityStartTimestamp, uint128 validityEndTimestamp, bytes32 uid) _req, bytes _signature) payable returns (uint256 tokenIdMinted)",
      params: [_req, _signature],
    });
    sendTransaction(transaction);
  };
}
```

## Marketplace Contract Functions

### 1. Initialize
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function initialize(address _defaultAdmin, string _contractURI, address[] _trustedForwarders, address _platformFeeRecipient, uint16 _platformFeeBps)",
      params: [
        _defaultAdmin,
        _contractURI,
        _trustedForwarders,
        _platformFeeRecipient,
        _platformFeeBps,
      ],
    });
    sendTransaction(transaction);
  };
}
```

### 2. Multicall
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function multicall(bytes[] data) returns (bytes[] results)",
      params: [data],
    });
    sendTransaction(transaction);
  };
}
```

### 3. Create Listing ⭐
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) returns (uint256 listingId)",
      params: [_params],
    });
    sendTransaction(transaction);
  };
}
```

### 4. Update Listing
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function updateListing(uint256 _listingId, (address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params)",
      params: [_listingId, _params],
    });
    sendTransaction(transaction);
  };
}
```

### 5. Cancel Listing
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function cancelListing(uint256 _listingId)",
      params: [_listingId],
    });
    sendTransaction(transaction);
  };
}
```

### 6. Buy From Listing ⭐
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function buyFromListing(uint256 _listingId, address _buyFor, uint256 _quantity, address _currency, uint256 _expectedTotalPrice) payable",
      params: [
        _listingId,
        _buyFor,
        _quantity,
        _currency,
        _expectedTotalPrice,
      ],
    });
    sendTransaction(transaction);
  };
}
```

### 7. Add Extension
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method: "function addExtension(((string name, string metadataURI, address implementation) metadata, (bytes4 functionSelector, string functionSignature)[] functions) _extension)",
      params: [_extension],
    });
    sendTransaction(transaction);
  };
}
```

## Contract Addresses & Chain Info
- **NFT Collection Contract**: `0xfF973a4aFc5A96DEc81366461A461824c4f80254`
- **Chain ID**: `80002` (Polygon Amoy Testnet)

## Key Functions for Our Implementation
1. **`mintWithSignature`** - Returns `tokenIdMinted` ⭐
2. **`createListing`** - Returns `listingId` ⭐
3. **`buyFromListing`** - For purchasing NFTs ⭐
4. **`totalSupply()`** - Get total minted NFTs ⭐
5. **`ownerOf(tokenId)`** - Get NFT owner ⭐
6. **`tokenURI(tokenId)`** - Get NFT metadata URI ⭐

## Current Implementation Status ✅

### ✅ ALREADY WORKING:
- **Getting all minted NFTs** from blockchain contract
- **Combining blockchain + MongoDB data** 
- **Complete metadata resolution** (IPFS → HTTP)
- **Ownership verification**

### 🎯 SOLUTION FOR MARKETPLACE:
Our existing API already provides exactly what we need:
```typescript
// This already works and returns ONLY minted NFTs!
const mintedNFTs = await fetch('/api/marketplace/nft-collection?action=getAllNFTs&limit=50');
```

---

*Ready for webhook implementation to auto-sync MongoDB with tokenIds...* 