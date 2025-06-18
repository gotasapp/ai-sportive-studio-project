# 🎯 Thirdweb ERC721 Reference Documentation

Esta documentação contém todas as funções disponíveis para contratos ERC721 no Thirdweb, especialmente focadas em **MintableERC721**.

## 📋 MintableERC721 Module Functions

### 🔧 MintableERC721.encodeInstall
Codifica os dados de instalação para o módulo MintableERC721.

**Signature:**
```typescript
function encodeInstall(
  params: EncodeBytesOnInstallParams,
): `0x${string}`;
```

**Parameters:**
- `params` - Os parâmetros para o módulo

**Returns:**
- `0x${string}` - Os dados codificados

---

### ✍️ MintableERC721.generateMintSignature
Gera um payload e signature para mintar tokens ERC721 via módulo MintableERC721.

**Example:**
```typescript
import { MintableERC721 } from "thirdweb/modules";

// Gerar payload e signature (normalmente feito no servidor)
// Requer wallet com MINTER_ROLE
const { payload, signature } = await MintableERC721.generateMintSignature({
  account,
  contract,
  nfts: [
    {
      name: "My NFT",
      description: "My NFT", 
      image: "https://example.com/image.png",
    },
  ],
  mintRequest: {
    recipient: "0x...",
  },
});

// Preparar transação (feito no cliente)
// Pode ser executado por qualquer wallet
const transaction = MintableERC721.mintWithSignature({
  contract,
  payload,
  signature,
});

// Enviar transação
await sendTransaction({ transaction, account });
```

**Signature:**
```typescript
function generateMintSignature(
  options: GenerateMintSignatureOptions,
): Promise<{
  payload: {
    amount: bigint;
    baseURI: string;
    data: `0x${string}`;
    to: `0x${string}`;
  };
  signature: `0x${string}`;
}>;
```

**Parameters:**
```typescript
let options: {
  account: Account;
  contract: ThirdwebContract;
  contractType?: "TokenERC1155" | "SignatureMintERC1155";
  mintRequest: GeneratePayloadInput;
};
```

**Returns:**
```typescript
let returnType: Promise<{
  payload: {
    amount: bigint;
    baseURI: string;
    data: `0x${string}`;
    to: `0x${string}`;
  };
  signature: `0x${string}`;
}>;
```

---

### 📋 MintableERC721.getSaleConfig
Chama a função "getSaleConfig" no contrato.

**Example:**
```typescript
import { MintableERC721 } from "thirdweb/modules";

const result = await MintableERC721.getSaleConfig({
  contract,
});
```

**Signature:**
```typescript
function getSaleConfig(
  options: BaseTransactionOptions,
): Promise<string>;
```

---

### 🛠️ MintableERC721.install
Instala o módulo MintableERC721 em um contrato core.

**Example:**
```typescript
import { MintableERC721 } from "thirdweb/modules";

const transaction = MintableERC721.install({
  contract: coreContract,
  account: account,
  params: {
    primarySaleRecipient: ...,
  },
});

await sendTransaction({
  transaction,
  account,
});
```

**Signature:**
```typescript
function install(options: {
  account: Account;
  contract: Readonly;
  params: EncodeBytesOnInstallParams & { publisher?: string };
}): PreparedTransaction;
```

---

### 🎯 MintableERC721.mintWithRole
Minta tokens ERC721 para um endereço específico via módulo MintableERC721.

**Example:**
```typescript
import { MintableERC721 } from "thirdweb/modules";

const transaction = MintableERC721.mintWithRole({
  contract,
  to: "0x...", // Endereço para mintar tokens
  nfts: [
    {
      name: "My NFT",
      description: "This is my NFT",
      image: "ipfs://...",
    },
  ],
});

// Enviar transação
await sendTransaction({ transaction, account });
```

**Signature:**
```typescript
function mintWithRole(
  options: BaseTransactionOptions<NFTMintParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;
```

**⚠️ IMPORTANTE:** Requer `MINTER_ROLE` no contrato.

---

### ✍️ MintableERC721.mintWithSignature
Minta tokens ERC721 para um endereço específico com signature via módulo MintableERC721.

**Example:**
```typescript
import { MintableERC721 } from "thirdweb/modules";

// 1. Gerar payload e signature (servidor - requer MINTER_ROLE)
const { payload, signature } = await MintableERC721.generateMintSignature({
  account,
  contract,
  nfts: [
    {
      name: "My NFT",
      description: "My NFT",
      image: "https://example.com/image.png",
    },
  ],
  mintRequest: {
    recipient: "0x...",
  },
});

// 2. Preparar transação (cliente - qualquer wallet)
const transaction = MintableERC721.mintWithSignature({
  contract,
  payload,
  signature,
});

// 3. Enviar transação
await sendTransaction({ transaction, account });
```

**Signature:**
```typescript
function mintWithSignature(
  options: BaseTransactionOptions<{
    payload: {
      amount: bigint;
      baseURI: string;
      data: `0x${string}`;
      to: `0x${string}`;
    };
    signature: `0x${string}`;
  }>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;
```

---

### 🏗️ MintableERC721.module
Função de conveniência para adicionar o módulo MintableERC721 como módulo padrão em um contrato core.

**Example:**
```typescript
import { MintableERC721, deployModularContract } from "thirdweb/modules";

const deployed = deployModularContract({
  client,
  chain,
  account,
  core: "ERC721",
  params: {
    name: "My Modular Contract",
  },
  modules: [
    MintableERC721.module({
      primarySaleRecipient: ...,
    }),
  ],
});
```

**Signature:**
```typescript
function module(
  params: EncodeBytesOnInstallParams & { publisher?: string },
): (args: {
  account: Account;
  chain: Readonly;
  client: ThirdwebClient;
}) => Promise<{ data: `0x${string}`; module: `0x${string}` }>;
```

---

### ⚙️ MintableERC721.setSaleConfig
Prepara uma transação para chamar a função "setSaleConfig" no contrato.

**Example:**
```typescript
import { sendTransaction } from "thirdweb";
import { MintableERC721 } from "thirdweb/modules";

const transaction = MintableERC721.setSaleConfig({
  contract,
  primarySaleRecipient: ...,
  overrides: {
    ...
  }
});

// Enviar transação
await sendTransaction({ transaction, account });
```

**Signature:**
```typescript
function setSaleConfig(
  options: BaseTransactionOptions<
    | SetSaleConfigParams
    | { asyncParams: () => Promise<SetSaleConfigParams> }
  >,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;
```

---

## 🎯 Análise para Resolução do Problema

### 🔍 **Problema Identificado:**
O contrato `0x7822698cE3728Ccd54e36E60c413a70b665A1407` não está respondendo aos métodos padrão de mint.

### 💡 **Soluções Possíveis:**

#### 1. **mintWithRole** (Mais Provável)
- Requer `MINTER_ROLE` no contrato
- Método direto para mintar NFTs
- **RECOMENDAÇÃO:** Verificar se nossa wallet tem `MINTER_ROLE`

#### 2. **mintWithSignature** (Alternativa)
- Requer signature de wallet com `MINTER_ROLE` 
- Permite mintar sem ter role diretamente
- **PROBLEMA:** Precisamos de um backend para gerar signatures

#### 3. **Verificar Tipo de Contrato**
- Pode ser um contrato modular que requer instalação do `MintableERC721`
- **AÇÃO:** Verificar se o módulo está instalado

### 🚀 **Próximos Passos:**
1. ✅ Verificar roles no contrato
2. ✅ Tentar `MintableERC721.mintWithRole()`
3. ✅ Se falhar, implementar `mintWithSignature()` 
4. ✅ Como última opção, fazer deploy de novo contrato

### ⚠️ **Considerações Importantes:**
- **MINTER_ROLE** é essencial para mint direto
- Contratos modulares podem precisar de instalação
- Signatures permitem mint sem roles diretos
- Verificar se estamos na rede correta (Polygon Amoy: 80002) 

ERC721.isUpdateMetadataSupported
Checks if the updateMetadata method is supported by the given contract.

Example
import { isUpdateMetadataSupported } from "thirdweb/extensions/erc721";
 
const supported = isUpdateMetadataSupported(["0x..."]);


Signature
function isUpdateMetadataSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the updateMetadata method is supported.ERC721.isGetClaimConditionsSupported
Checks if the getClaimConditions method is supported by the given contract.

Example
import { isGetClaimConditionsSupported } from "thirdweb/extensions/erc721";
 
const supported = isGetClaimConditionsSupported(["0x..."]);


Signature
function isGetClaimConditionsSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getClaimConditions method is supported.ERC721.approvalEvent
Creates an event object for the Approval event.

Example
import { getContractEvents } from "thirdweb";
import { approvalEvent } from "thirdweb/extensions/erc721";
 
const events = await getContractEvents({
contract,
events: [
 approvalEvent({
 owner: ...,
 approved: ...,
 tokenId: ...,
})
],
});


Signature
function approvalEvent(
  filters: Partial,
): PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "owner";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "approved";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "tokenId";
      readonly type: "uint256";
    },
  ];
  readonly name: "Approval";
  readonly type: "event";
}>;

Parameters

filters
Optional filters to apply to the event.

Type
let filters: Partial;

Returns

Return Type
let returnType: PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "owner";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "approved";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "tokenId";
      readonly type: "uint256";
    },
  ];
  readonly name: "Approval";
  readonly type: "event";
}>;

The prepared event object.ERC721.approvalForAllEvent
Creates an event object for the ApprovalForAll event.

Example
import { getContractEvents } from "thirdweb";
import { approvalForAllEvent } from "thirdweb/extensions/erc721";
 
const events = await getContractEvents({
contract,
events: [
 approvalForAllEvent({
 owner: ...,
 operator: ...,
})
],
});


Signature
function approvalForAllEvent(
  filters: Partial,
): PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "owner";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "operator";
      readonly type: "address";
    },
    { readonly name: "approved"; readonly type: "bool" },
  ];
  readonly name: "ApprovalForAll";
  readonly type: "event";
}>;

Parameters

filters
Optional filters to apply to the event.

Type
let filters: Partial;

Returns

Return Type
let returnType: PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "owner";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "operator";
      readonly type: "address";
    },
    { readonly name: "approved"; readonly type: "bool" },
  ];
  readonly name: "ApprovalForAll";
  readonly type: "event";
}>;

The prepared event object.ERC721.approve
Prepares a transaction to call the "approve" function on the contract.

Example
import { sendTransaction } from "thirdweb";
import { approve } from "thirdweb/extensions/erc721";
 
const transaction = approve({
 contract,
 to: ...,
 tokenId: ...,
 overrides: {
   ...
 }
});
 
// Send the transaction
await sendTransaction({ transaction, account });


Signature
function approve(
  options: BaseTransactionOptions<
    ApproveParams | { asyncParams: () => Promise<ApproveParams> }
  >,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The options for the "approve" function.

Type
let options: BaseTransactionOptions<
  ApproveParams | { asyncParams: () => Promise<ApproveParams> }
>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A prepared transaction object.ERC721.balanceOf
Calls the "balanceOf" function on the contract.

Example
import { balanceOf } from "thirdweb/extensions/erc721";
 
const result = await balanceOf({
 contract,
 owner: ...,
});


Signature
function balanceOf(
  options: BaseTransactionOptions<BalanceOfParams>,
): Promise<bigint>;

Parameters

options
The options for the balanceOf function.

Type
let options: BaseTransactionOptions<BalanceOfParams>;

Returns

Return Type
let returnType: Promise<bigint>;

The parsed result of the function call.ERC721.burn
Prepares a transaction to call the "burn" function on the contract.

Example
import { sendTransaction } from "thirdweb";
import { burn } from "thirdweb/extensions/erc721";
 
const transaction = burn({
 contract,
 tokenId: ...,
 overrides: {
   ...
 }
});
 
// Send the transaction
await sendTransaction({ transaction, account });


Signature
function burn(
  options: BaseTransactionOptions<
    BurnParams | { asyncParams: () => Promise<BurnParams> }
  >,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The options for the "burn" function.

Type
let options: BaseTransactionOptions<
  BurnParams | { asyncParams: () => Promise<BurnParams> }
>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A prepared transaction object.ERC721.canClaim
Check if a user can claim a drop.

This method is only available on the DropERC721 contract.

Example
const claimResult = await canClaim({
  contract: contract,
  claimer: "0x1234567890123456789012345678901234567890",
  quantity: "1",
});


Signature
function canClaim(
  options: BaseTransactionOptions<CanClaimParams>,
): Promise<CanClaimResult>;

Parameters

options
The options for the transaction.

Type
let options: BaseTransactionOptions<CanClaimParams>;

Returns

Return Type
let returnType: { reason?: string; result: boolean };ERC721.claimConditionsUpdatedEvent
Creates an event object for the ClaimConditionsUpdated event.

Example
import { getContractEvents } from "thirdweb";
import { claimConditionsUpdatedEvent } from "thirdweb/extensions/erc721";
 
const events = await getContractEvents({
  contract,
  events: [claimConditionsUpdatedEvent()],
});


Signature
function claimConditionsUpdatedEvent(): PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly components: readonly [
        { readonly name: "startTimestamp"; readonly type: "uint256" },
        {
          readonly name: "maxClaimableSupply";
          readonly type: "uint256";
        },
        { readonly name: "supplyClaimed"; readonly type: "uint256" },
        {
          readonly name: "quantityLimitPerWallet";
          readonly type: "uint256";
        },
        { readonly name: "merkleRoot"; readonly type: "bytes32" },
        { readonly name: "pricePerToken"; readonly type: "uint256" },
        { readonly name: "currency"; readonly type: "address" },
        { readonly name: "metadata"; readonly type: "string" },
      ];
      readonly name: "claimConditions";
      readonly type: "tuple[]";
    },
    { readonly name: "resetEligibility"; readonly type: "bool" },
  ];
  readonly name: "ClaimConditionsUpdated";
  readonly type: "event";
}>;

Returns

Return Type
let returnType: PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly components: readonly [
        { readonly name: "startTimestamp"; readonly type: "uint256" },
        {
          readonly name: "maxClaimableSupply";
          readonly type: "uint256";
        },
        { readonly name: "supplyClaimed"; readonly type: "uint256" },
        {
          readonly name: "quantityLimitPerWallet";
          readonly type: "uint256";
        },
        { readonly name: "merkleRoot"; readonly type: "bytes32" },
        { readonly name: "pricePerToken"; readonly type: "uint256" },
        { readonly name: "currency"; readonly type: "address" },
        { readonly name: "metadata"; readonly type: "string" },
      ];
      readonly name: "claimConditions";
      readonly type: "tuple[]";
    },
    { readonly name: "resetEligibility"; readonly type: "bool" },
  ];
  readonly name: "ClaimConditionsUpdated";
  readonly type: "event";
}>;

The prepared event object.ERC721.claimTo
Claim ERC721 NFTs to a specified address This method is only available on the DropERC721 contract.

Example
Basic usage
import { claimTo } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
 
const transaction = claimTo({
  contract,
  to: "0x...",
  quantity: 1n,
});
 
await sendTransaction({ transaction, account });

For Drops with allowlists
You need to specify the claimer address as the from param to avoid any issue with the allowlist

const transaction = claimTo({
  contract,
  to: "0x...",
  quantity: 1n,
  from: "0x...", // address of the one claiming
});


Signature
function claimTo(
  options: BaseTransactionOptions<ClaimToParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The options for the transaction

Type
let options: BaseTransactionOptions<ClaimToParams>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A promise that resolves with the submitted transaction hash.ERC721.claimToBatch
This extension batches multiple claimTo extensions into one single multicall. Keep in mind that there is a limit of how many NFTs you can claim per transaction. This limit varies depends on the network that you are transacting on. This method is only available on the DropERC721 contract.

You are recommended to experiment with the number to figure out the best number for your chain of choice.

Example
import { claimToBatch } from "thirdweb/extensions/erc721";
 
const transaction = claimToBatch({
  contract: nftDropContract,
  from: claimer.address, // address of the one calling this transaction
  content: [
    { to: "0x...1", quantity: 1n },
    { to: "0x...2", quantity: 12n },
    { to: "0x...3", quantity: 2n },
  ],
});


Signature
function claimToBatch(
  options: BaseTransactionOptions<ClaimToBatchParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
the transaction options

Type
let options: BaseTransactionOptions<ClaimToBatchParams>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A promise that resolves to the transaction result.ERC721.createDelayedRevealBatch
Creates a batch of encrypted NFTs that can be revealed at a later time. This method is only available on the DropERC721 contract.

Example
import { createDelayedRevealBatch } from "thirdweb/extensions/erc721";
 
const placeholderNFT = {
  name: "Hidden NFT",
  description: "Will be revealed next week!"
};
 
const realNFTs = [{
  name: "Common NFT #1",
  description: "Common NFT, one of many.",
  image: ipfs://...,
}, {
  name: "Super Rare NFT #2",
  description: "You got a Super Rare NFT!",
  image: ipfs://...,
}];
 
const transaction = createDelayedRevealBatch({
 contract,
 placeholderMetadata: placeholderNFT,
 metadata: realNFTs,
 password: "password123",
});
 
const { transactionHash } = await sendTransaction({ transaction, account });


Signature
function createDelayedRevealBatch(
  options: BaseTransactionOptions<CreateDelayedRevealBatchParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
{CreateDelayedRevealBatchParams} - The delayed reveal options.

Type
let options: BaseTransactionOptions<CreateDelayedRevealBatchParams>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

The prepared transaction to send.ERC721.generateMintSignature
Generates the payload and signature for minting an ERC721 token.

Example
import {
  mintWithSignature,
  generateMintSignature,
} from "thirdweb/extensions/erc721";
 
const { payload, signature } = await generateMintSignature({
  account,
  contract,
  mintRequest: {
    to: "0x...",
    metadata: {
      name: "My NFT",
      description: "This is my NFT",
      image: "https://example.com/image.png",
    },
  },
});
 
const transaction = mintWithSignature({
  contract,
  payload,
  signature,
});
await sendTransaction({ transaction, account });


Signature
function generateMintSignature(
  options: GenerateMintSignatureOptions<T>,
): Promise<SignPayloadResult<T>>;

Parameters

options
The options for the minting process.

Type
let options: GenerateMintSignatureOptions<T>;

Returns

Return Type
let returnType: Promise<SignPayloadResult<T>>;

A promise that resolves to the payload and signature.ERC721.getActiveClaimCondition
Retrieves the active claim condition. This method is only available on the DropERC721 contract.

Example
import { getActiveClaimCondition } from "thirdweb/extensions/erc721";
const activeClaimCondition = await getActiveClaimCondition({
  contract,
});


Signature
function getActiveClaimCondition(
  options: BaseTransactionOptions,
): Promise<ClaimCondition>;

Parameters

options
The transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<ClaimCondition>;

A promise that resolves to the active claim condition.ERC721.getActiveClaimConditionId
Calls the "getActiveClaimConditionId" function on the contract.

Example
import { getActiveClaimConditionId } from "thirdweb/extensions/erc721";
 
const result = await getActiveClaimConditionId({
  contract,
});


Signature
function getActiveClaimConditionId(
  options: BaseTransactionOptions,
): Promise<bigint>;

Parameters

options
The options for the getActiveClaimConditionId function.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<bigint>;

The parsed result of the function call.ERC721.getAllOwners
Retrieves the owners of all ERC721 tokens within a specified range.

Example
import { getAllOwners } from "thirdweb/extensions/erc721";
const owners = await getAllOwners({
  contract,
  start: 0,
  count: 10,
});


Signature
function getAllOwners(
  options: BaseTransactionOptions<GetAllOwnersParams>,
): Promise<Array<{ owner: string; tokenId: bigint }>>;

Parameters

options
The options for retrieving the owners.

Type
let options: BaseTransactionOptions<GetAllOwnersParams>;

Returns

Return Type
let returnType: Promise<Array<{ owner: string; tokenId: bigint }>>;

A promise that resolves to an array of objects containing the token ID and owner address.ERC721.getApproved
Calls the "getApproved" function on the contract.

Example
import { getApproved } from "thirdweb/extensions/erc721";
 
const result = await getApproved({
 contract,
 tokenId: ...,
});


Signature
function getApproved(
  options: BaseTransactionOptions<GetApprovedParams>,
): Promise<string>;

Parameters

options
The options for the getApproved function.

Type
let options: BaseTransactionOptions<GetApprovedParams>;

Returns

Return Type
let returnType: Promise<string>;

The parsed result of the function call.ERC721.getBatchesToReveal
Retrieves the batches available to reveal in an NFT contract.

Example
import { getBatchesToReveal } from "thirdweb/extensions/erc721";
 
const batches = await getBatchesToReveal({ contract: contract });
 
const { transactionHash } = await sendTransaction({
  transaction,
  account,
});


Signature
function getBatchesToReveal(
  options: BaseTransactionOptions,
): Promise<Array<BatchToReveal>>;

Parameters

options
{BaseTransactionOptions} - The transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: {
  batchId: bigint;
  batchUri: string;
  placeholderMetadata: undefined | NFTMetadata;
};

A promise resolving to an array of unrevealed batches.

Use the batchId and corresponding password for each batch to reveal it with reveal. revealERC721.getClaimConditionById
Calls the "getClaimConditionById" function on the contract.

Example
import { getClaimConditionById } from "thirdweb/extensions/erc721";
 
const result = await getClaimConditionById({
 contract,
 conditionId: ...,
});


Signature
function getClaimConditionById(
  options: BaseTransactionOptions<GetClaimConditionByIdParams>,
): Promise<{
  currency: string;
  maxClaimableSupply: bigint;
  merkleRoot: `0x${string}`;
  metadata: string;
  pricePerToken: bigint;
  quantityLimitPerWallet: bigint;
  startTimestamp: bigint;
  supplyClaimed: bigint;
}>;

Parameters

options
The options for the getClaimConditionById function.

Type
let options: BaseTransactionOptions<GetClaimConditionByIdParams>;

Returns

Return Type
let returnType: Promise<{
  currency: string;
  maxClaimableSupply: bigint;
  merkleRoot: `0x${string}`;
  metadata: string;
  pricePerToken: bigint;
  quantityLimitPerWallet: bigint;
  startTimestamp: bigint;
  supplyClaimed: bigint;
}>;

The parsed result of the function call.ERC721.getClaimConditions
Retrieves all claim conditions.

This method is only available on the DropERC721 contract.

Example
import { getClaimConditions } from "thirdweb/extensions/erc721";
const conditions = await getClaimConditions({ contract });


Signature
function getClaimConditions(
  options: BaseTransactionOptions,
): Promise<Array<ClaimCondition>>;

Parameters

options
The transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<Array<ClaimCondition>>;

A promise that resolves to all claim conditions.ERC721.getNFT
Retrieves information about a specific ERC721 non-fungible token (NFT).

Example
import { getNFT } from "thirdweb/extensions/erc721";
const nft = await getNFT({
  contract,
  tokenId: 1n,
});


Signature
function getNFT(
  options: BaseTransactionOptions<{
    includeOwner?: boolean;
    tokenByIndex?: boolean;
    tokenId: bigint;
    useIndexer?: boolean;
  }>,
): Promise<NFT>;

Parameters

options
The options for retrieving the NFT.

Type
let options: BaseTransactionOptions<{
  includeOwner?: boolean;
  tokenByIndex?: boolean;
  tokenId: bigint;
  useIndexer?: boolean;
}>;

Returns

Return Type
let returnType:
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC721";
    }
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      supply: bigint;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC1155";
    };

A promise that resolves to the NFT object.ERC721.getNFTs
Retrieves an array of NFTs ("ERC721") based on the provided options.

Example
import { getNFTs } from "thirdweb/extensions/erc721";
const nfts = await getNFTs({
  contract,
  start: 0,
  count: 10,
});


Signature
function getNFTs(
  options: BaseTransactionOptions<GetNFTsParams>,
): Promise<Array<NFT>>;

Parameters

options
The options for retrieving the NFTs.

Type
let options: BaseTransactionOptions<GetNFTsParams>;

Returns

Return Type
let returnType:
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC721";
    }
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      supply: bigint;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC1155";
    };

A promise that resolves to an array of NFTs.ERC721.getOwnedNFTs
Retrieves the owned NFTs for a given owner. This extension only works with ERC721 contracts that support the tokenOfOwnerByIndex method

Example
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
 
const ownedNFTs = await getOwnedNFTs({
  contract,
  owner: "0x1234...",
});


Signature
function getOwnedNFTs(
  options: BaseTransactionOptions<GetOwnedNFTsParams>,
): Promise<Array<NFT>>;

Parameters

options
The options for retrieving the owned NFTs.

Type
let options: BaseTransactionOptions<GetOwnedNFTsParams>;

Returns

Return Type
let returnType:
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC721";
    }
  | {
      chainId: number;
      id: bigint;
      metadata: NFTMetadata;
      owner: string | null;
      supply: bigint;
      tokenAddress: string;
      tokenURI: string;
      type: "ERC1155";
    };

A promise that resolves to an array of NFTs owned by the specified owner.ERC721.getOwnedTokenIds
Retrieves the token IDs owned by a specific address.

Example
import { getOwnedTokenIds } from "thirdweb/extensions/erc721";
 
const ownedTokenIds = await getOwnedTokenIds({
  contract,
  owner: "0x1234...",
});


Signature
function getOwnedTokenIds(
  options: BaseTransactionOptions<BalanceOfParams>,
): Promise<Array<bigint>>;

Parameters

options
The options for retrieving the owned token IDs.

Type
let options: BaseTransactionOptions<BalanceOfParams>;

Returns

Return Type
let returnType: Promise<Array<bigint>>;

A promise that resolves to an array of bigint representing the owned token IDs.ERC721.getTotalClaimedSupply
Retrieves the total claimed supply of ERC721 tokens.

Example
import { getTotalClaimedSupply } from "thirdweb/extensions/erc721";
 
const totalClaimedSupply = await getTotalClaimedSupply({
  contract,
});


Signature
function getTotalClaimedSupply(
  options: BaseTransactionOptions,
): Promise<bigint>;

Parameters

options
The base transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<bigint>;

A promise that resolves to the total claimed supply as a bigint.ERC721.getTotalUnclaimedSupply
Retrieves the total unclaimed supply of ERC721 tokens.

Example
import { getTotalUnclaimedSupply } from "thirdweb/extensions/erc721";
 
const totalUnclaimedSupply = await getTotalUnclaimedSupply({
  contract,
});


Signature
function getTotalUnclaimedSupply(
  options: BaseTransactionOptions,
): Promise<bigint>;

Parameters

options
The base transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<bigint>;

A promise that resolves to the total unclaimed supply as a bigint.ERC721.isApprovedForAll
Calls the "isApprovedForAll" function on the contract.

Example
import { isApprovedForAll } from "thirdweb/extensions/erc721";
 
const result = await isApprovedForAll({
 contract,
 owner: ...,
 operator: ...,
});


Signature
function isApprovedForAll(
  options: BaseTransactionOptions<IsApprovedForAllParams>,
): Promise<boolean>;

Parameters

options
The options for the isApprovedForAll function.

Type
let options: BaseTransactionOptions<IsApprovedForAllParams>;

Returns

Return Type
let returnType: Promise<boolean>;

The parsed result of the function call.ERC721.isBurnSupported
Checks if the burn method is supported by the given contract.

Example
import { isBurnSupported } from "thirdweb/extensions/erc721";
 
const supported = isBurnSupported(["0x..."]);


Signature
function isBurnSupported(availableSelectors: Array<string>): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the burn method is supported.ERC721.isClaimToSupported
Checks if the claimTo method is supported by the given contract.

Example
import { isClaimToSupported } from "thirdweb/extensions/erc721";
 
const supported = isClaimToSupported(["0x..."]);


Signature
function isClaimToSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the claimTo method is supported.ERC721.isCreateDelayedRevealBatchSupported
Checks if the createDelayedRevealBatch method is supported by the given contract.

Example
import { isCreateDelayedRevealBatchSupported } from "thirdweb/extensions/erc721";
const supported = isCreateDelayedRevealBatchSupported(["0x..."]);


Signature
function isCreateDelayedRevealBatchSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the createDelayedRevealBatch method is supported.ERC721.isERC721
Check if a contract supports the ERC721 interface.

Example
import { isERC721 } from "thirdweb/extensions/erc721";
const result = await isERC721({ contract });


Signature
function isERC721(options: BaseTransactionOptions): Promise<boolean>;

Parameters

options
The transaction options.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<boolean>;

A boolean indicating whether the contract supports the ERC721 interface.ERC721.isGetActiveClaimConditionIdSupported
Checks if the getActiveClaimConditionId method is supported by the given contract.

Example
import { isGetActiveClaimConditionIdSupported } from "thirdweb/extensions/erc721";
const supported = isGetActiveClaimConditionIdSupported(["0x..."]);


Signature
function isGetActiveClaimConditionIdSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getActiveClaimConditionId method is supported.ERC721.isGetActiveClaimConditionSupported
Checks if the getActiveClaimCondition method is supported by the given contract. This method is only available on the DropERC721 contract.

Example
import { isGetActiveClaimConditionSupported } from "thirdweb/extensions/erc721";
 
const supported = isGetActiveClaimConditionSupported(["0x..."]);


Signature
function isGetActiveClaimConditionSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getActiveClaimCondition method is supported.ERC721.isGetApprovedSupported
Checks if the getApproved method is supported by the given contract.

Example
import { isGetApprovedSupported } from "thirdweb/extensions/erc721";
const supported = isGetApprovedSupported(["0x..."]);


Signature
function isGetApprovedSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getApproved method is supported.ERC721.isGetBatchesToRevealSupported
Checks if the getBatchesToReveal method is supported by the given contract.

Example
import { isGetBatchesToRevealSupported } from "thirdweb/extensions/erc721";
 
const supported = isGetBatchesToRevealSupported(["0x..."]);


Signature
function isGetBatchesToRevealSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getBatchesToReveal method is supported.ERC721.isGetClaimConditionByIdSupported
Checks if the getClaimConditionById method is supported by the given contract.

Example
import { isGetClaimConditionByIdSupported } from "thirdweb/extensions/erc721";
const supported = isGetClaimConditionByIdSupported(["0x..."]);


Signature
function isGetClaimConditionByIdSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getClaimConditionById method is supported.ERC721.isGetClaimConditionsSupported
Checks if the getClaimConditions method is supported by the given contract.

Example
import { isGetClaimConditionsSupported } from "thirdweb/extensions/erc721";
 
const supported = isGetClaimConditionsSupported(["0x..."]);


Signature
function isGetClaimConditionsSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getClaimConditions method is supported.ERC721.isGetNFTsSupported
Checks if the getNFTs method is supported by the given contract.

Example
import { isGetNFTsSupported } from "thirdweb/extensions/erc721";
 
const supported = isGetNFTsSupported(["0x..."]);


Signature
function isGetNFTsSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the getNFTs method is supported.ERC721.isGetNFTSupported
Checks if the tokenURI method is supported by the given contract.

Example
import { isTokenURISupported } from "thirdweb/extensions/erc721";
const supported = isTokenURISupported(["0x..."]);


Signature
function isGetNFTSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the tokenURI method is supported.ERC721.isLazyMintSupported
Checks if the lazyMint method is supported by the given contract.

Example
import { isLazyMintSupported } from "thirdweb/extensions/erc721";
 
const supported = isLazyMintSupported(["0x..."]);


Signature
function isLazyMintSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the lazyMint method is supported.ERC721.isMintToSupported
Checks if the mintTo method is supported by the given contract.

Example
import { isMintToSupported } from "thirdweb/extensions/erc721";
 
const supported = isMintToSupported(["0x..."]);


Signature
function isMintToSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the mintTo method is supported.ERC721.isNextTokenIdToMintSupported
Checks if the nextTokenIdToMint method is supported by the given contract.

Example
import { isNextTokenIdToMintSupported } from "thirdweb/extensions/erc721";
const supported = isNextTokenIdToMintSupported(["0x..."]);


Signature
function isNextTokenIdToMintSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the nextTokenIdToMint method is supported.ERC721.isResetClaimEligibilitySupported
Checks if the resetClaimEligibility method is supported by the given contract.

Example
import { isResetClaimEligibilitySupported } from "thirdweb/extensions/erc721";
 
const supported = isResetClaimEligibilitySupported(["0x..."]);


Signature
function isResetClaimEligibilitySupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the resetClaimEligibility method is supported.ERC721.isRevealSupported
Checks if the reveal method is supported by the given contract.

Example
import { isRevealSupported } from "thirdweb/extensions/erc721";
 
const supported = isRevealSupported(["0x..."]);


Signature
function isRevealSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the reveal method is supported.ERC721.isSetClaimConditionsSupported
Checks if the setClaimConditions method is supported by the given contract.

Example
import { isSetClaimConditionsSupported } from "thirdweb/extensions/erc721";
 
const supported = isSetClaimConditionsSupported(["0x..."]);


Signature
function isSetClaimConditionsSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the setClaimConditions method is supported.ERC721.isSetSharedMetadataSupported
Checks if the setSharedMetadata method is supported by the given contract.

Example
import { isSetSharedMetadataSupported } from "thirdweb/extensions/erc721";
 
const supported = isSetSharedMetadataSupported(["0x..."]);


Signature
function isSetSharedMetadataSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the setSharedMetadata method is supported.ERC721.isSharedMetadataSupported
Checks if the sharedMetadata method is supported by the given contract.

Example
import { isSharedMetadataSupported } from "thirdweb/extensions/erc721";
const supported = isSharedMetadataSupported(["0x..."]);


Signature
function isSharedMetadataSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the sharedMetadata method is supported.ERC721.isTokenByIndexSupported
Checks if the tokenByIndex method is supported by the given contract.

Example
import { isTokenByIndexSupported } from "thirdweb/extensions/erc721";
const supported = isTokenByIndexSupported(["0x..."]);


Signature
function isTokenByIndexSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;ERC721.isTotalSupplySupported
Checks if the totalSupply method is supported by the given contract.

Example
import { isTotalSupplySupported } from "thirdweb/extensions/erc721";
const supported = isTotalSupplySupported(["0x..."]);


Signature
function isTotalSupplySupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the totalSupply method is supported.ERC721.isUpdateMetadataSupported
Checks if the updateMetadata method is supported by the given contract.

Example
import { isUpdateMetadataSupported } from "thirdweb/extensions/erc721";
 
const supported = isUpdateMetadataSupported(["0x..."]);


Signature
function isUpdateMetadataSupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the updateMetadata method is supported.ERC721.isUpdateTokenURISupported
Checks if the setTokenURI method is supported by the given contract.

Example
import { isSetTokenURISupported } from "thirdweb/extensions/erc721";
 
const supported = isSetTokenURISupported(["0x..."]);


Signature
function isUpdateTokenURISupported(
  availableSelectors: Array<string>,
): boolean;

Parameters

availableSelectors
An array of 4byte function selectors of the contract. You can get this in various ways, such as using "whatsabi" or if you have the ABI of the contract available you can use it to generate the selectors.

Type
let availableSelectors: Array<string>;

Returns

Return Type
let returnType: boolean;

A boolean indicating if the setTokenURI method is supported.ERC721.lazyMint
Lazily mints ERC721 tokens. This method is only available on the DropERC721 contract.

Example
import { lazyMint } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
 
const transaction = lazyMint({
  contract,
  nfts: [
    {
      name: "My NFT",
      description: "This is my NFT",
      image: "https://example.com/image.png",
    },
  ],
});
 
await sendTransaction({ transaction, account });


Signature
function lazyMint(
  options: BaseTransactionOptions<LazyMintParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The options for the lazy minting process.

Type
let options: BaseTransactionOptions<LazyMintParams>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A promise that resolves to the prepared contract call.ERC721.mintTo
Mints a new ERC721 token and assigns it to the specified address. This method is only available on the TokenERC721 contract.

If the nft parameter is a string, it will be used as the token URI. If the nft parameter is a file, it will be uploaded to the storage server and the resulting URI will be used as the token URI.

Example
import { mintTo } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
 
const transaction = mintTo({
  contract,
  to: "0x...",
  nft: {
    name: "My NFT",
    description: "This is my NFT",
    image: "https://example.com/image.png",
  },
});
 
await sendTransaction({ transaction, account });


Signature
function mintTo(
  options: BaseTransactionOptions<MintToParams>,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The transaction options.

Type
let options: BaseTransactionOptions<MintToParams>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A promise that resolves to the transaction result.ERC721.mintWithSignature
Mints a new ERC721 token with the given minter signature This method is only available on the TokenERC721 contract.

Example
import { mintWithSignature, generateMintSignature } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
 
const { payload, signature } = await generateMintSignature(...)
 
const transaction = mintWithSignature({
  contract,
  payload,
  signature,
});
 
await sendTransaction({ transaction, account });


Signature
function mintWithSignature(
  options: BaseTransactionOptions<
    | {
        payload: {
          currency: string;
          pricePerToken: bigint;
          primarySaleRecipient: string;
          quantity: bigint;
          royaltyBps: bigint;
          royaltyRecipient: string;
          to: string;
          uid: `0x${string}`;
          uri: string;
          validityEndTimestamp: bigint;
          validityStartTimestamp: bigint;
        };
        signature: `0x${string}`;
      }
    | {
        payload: {
          currency: string;
          price: bigint;
          primarySaleRecipient: string;
          royaltyBps: bigint;
          royaltyRecipient: string;
          to: string;
          uid: `0x${string}`;
          uri: string;
          validityEndTimestamp: bigint;
          validityStartTimestamp: bigint;
        };
        signature: `0x${string}`;
      }
  >,
): PreparedTransaction<any, AbiFunction, PrepareTransactionOptions>;

Parameters

options
The transaction options.

Type
let options: BaseTransactionOptions<
  | {
      payload: {
        currency: string;
        pricePerToken: bigint;
        primarySaleRecipient: string;
        quantity: bigint;
        royaltyBps: bigint;
        royaltyRecipient: string;
        to: string;
        uid: `0x${string}`;
        uri: string;
        validityEndTimestamp: bigint;
        validityStartTimestamp: bigint;
      };
      signature: `0x${string}`;
    }
  | {
      payload: {
        currency: string;
        price: bigint;
        primarySaleRecipient: string;
        royaltyBps: bigint;
        royaltyRecipient: string;
        to: string;
        uid: `0x${string}`;
        uri: string;
        validityEndTimestamp: bigint;
        validityStartTimestamp: bigint;
      };
      signature: `0x${string}`;
    }
>;

Returns

Return Type
let returnType: PreparedTransaction<
  any,
  AbiFunction,
  PrepareTransactionOptions
>;

A promise that resolves to the transaction result.ERC721.nextTokenIdToMint
Calls the "nextTokenIdToMint" function on the contract.

Example
import { nextTokenIdToMint } from "thirdweb/extensions/erc721";
 
const result = await nextTokenIdToMint({
  contract,
});


Signature
function nextTokenIdToMint(
  options: BaseTransactionOptions,
): Promise<bigint>;

Parameters

options
The options for the nextTokenIdToMint function.

Type
let options: { contract: ThirdwebContract<abi> } & T;

Returns

Return Type
let returnType: Promise<bigint>;

The parsed result of the function call.