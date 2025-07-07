import { prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { getMarketplaceContract, getNFTContract, NATIVE_TOKEN_ADDRESS, priceToWei, weiToPrice } from '../marketplace-config';
import { Account } from 'thirdweb/wallets';
import { toast } from 'sonner';

// Tipos baseados na documentação Thirdweb Marketplace V3
export interface DirectListing {
  listingId: bigint;
  listingCreator: string;
  assetContract: string;
  tokenId: bigint;
  quantity: bigint;
  currency: string;
  pricePerToken: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  reserved: boolean;
  status: 'UNSET' | 'CREATED' | 'COMPLETED' | 'CANCELLED';
}

export interface Auction {
  auctionId: bigint;
  auctionCreator: string;
  assetContract: string;
  tokenId: bigint;
  quantity: bigint;
  currency: string;
  minimumBidAmount: bigint;
  buyoutBidAmount: bigint;
  timeBufferInSeconds: bigint;
  bidBufferBps: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  status: 'UNSET' | 'CREATED' | 'COMPLETED' | 'CANCELLED';
}

export interface Offer {
  offerId: bigint;
  offeror: string;
  assetContract: string;
  tokenId: bigint;
  quantity: bigint;
  currency: string;
  totalPrice: bigint;
  expirationTimestamp: bigint;
  status: 'UNSET' | 'CREATED' | 'COMPLETED' | 'CANCELLED';
}

export class MarketplaceService {
  
  // === DIRECT LISTINGS ===
  
  /**
   * Criar uma listagem direta (venda por preço fixo)
   */
  static async createDirectListing(
    account: Account,
    chainId: number,
    params: {
      assetContract: string;
      tokenId: string;
      quantity?: string;
      pricePerToken: string;
      startTimestamp?: Date;
      endTimestamp?: Date;
      reserved?: boolean;
    }
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      const price = priceToWei(params.pricePerToken);
      
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
      
      const transaction = prepareContractCall({
        contract,
        method: "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) params) returns (uint256 listingId)",
        params: [{
          assetContract: params.assetContract,
          tokenId: BigInt(params.tokenId),
          quantity: BigInt(params.quantity || '1'),
          currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken: price,
          startTimestamp: BigInt(Math.floor((params.startTimestamp || now).getTime() / 1000)),
          endTimestamp: BigInt(Math.floor((params.endTimestamp || defaultEnd).getTime() / 1000)),
          reserved: params.reserved || false,
        }]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao criar listing:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao criar listagem');
    }
  }

  /**
   * Comprar de uma listagem direta
   */
  static async buyFromListing(
    account: Account,
    chainId: number,
    params: {
      listingId: string;
      quantity?: string;
      expectedTotalPrice: string;
    }
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      const totalPrice = priceToWei(params.expectedTotalPrice);
      
      const transaction = prepareContractCall({
        contract,
        method: "function buyFromListing(uint256 listingId, address buyFor, uint256 quantity, address currency, uint256 expectedTotalPrice) payable",
        params: [
          BigInt(params.listingId),
          account.address, // buyFor
          BigInt(params.quantity || '1'),
          NATIVE_TOKEN_ADDRESS,
          totalPrice
        ],
        value: totalPrice, // Enviar CHZ/ETH/MATIC junto com a transação
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao comprar NFT:', error);
      throw new Error(error?.reason || error?.message || 'Falha na compra');
    }
  }

  /**
   * Cancelar listagem
   */
  static async cancelListing(
    account: Account,
    chainId: number,
    listingId: string
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      
      const transaction = prepareContractCall({
        contract,
        method: "function cancelListing(uint256 listingId)",
        params: [BigInt(listingId)]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao cancelar listing:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao cancelar listagem');
    }
  }

  // === AUCTIONS ===
  
  /**
   * Criar leilão
   */
  static async createAuction(
    account: Account,
    chainId: number,
    params: {
      assetContract: string;
      tokenId: string;
      quantity?: string;
      minimumBidAmount: string;
      buyoutBidAmount?: string;
      timeBufferInSeconds?: number;
      bidBufferBps?: number;
      startTimestamp?: Date;
      endTimestamp?: Date;
    }
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      const minBid = priceToWei(params.minimumBidAmount);
      const buyoutBid = params.buyoutBidAmount ? priceToWei(params.buyoutBidAmount) : BigInt(0);
      
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      
      const transaction = prepareContractCall({
        contract,
        method: "function createAuction((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp) params) returns (uint256 auctionId)",
        params: [{
          assetContract: params.assetContract,
          tokenId: BigInt(params.tokenId),
          quantity: BigInt(params.quantity || '1'),
          currency: NATIVE_TOKEN_ADDRESS,
          minimumBidAmount: minBid,
          buyoutBidAmount: buyoutBid,
          timeBufferInSeconds: BigInt(params.timeBufferInSeconds || 300), // 5 min buffer
          bidBufferBps: BigInt(params.bidBufferBps || 500), // 5% buffer
          startTimestamp: BigInt(Math.floor((params.startTimestamp || now).getTime() / 1000)),
          endTimestamp: BigInt(Math.floor((params.endTimestamp || defaultEnd).getTime() / 1000)),
        }]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao criar leilão:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao criar leilão');
    }
  }

  /**
   * Dar lance em leilão
   */
  static async bidInAuction(
    account: Account,
    chainId: number,
    params: {
      auctionId: string;
      bidAmount: string;
    }
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      const bidValue = priceToWei(params.bidAmount);
      
      const transaction = prepareContractCall({
        contract,
        method: "function bidInAuction(uint256 auctionId, uint256 bidAmount) payable",
        params: [BigInt(params.auctionId), bidValue],
        value: bidValue, // Enviar valor do lance
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao dar lance:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao dar lance');
    }
  }

  /**
   * Coletar pagamento do leilão (para vendedor)
   */
  static async collectAuctionPayout(
    account: Account,
    chainId: number,
    auctionId: string
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      
      const transaction = prepareContractCall({
        contract,
        method: "function collectAuctionPayout(uint256 auctionId)",
        params: [BigInt(auctionId)]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao coletar pagamento:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao coletar pagamento');
    }
  }

  /**
   * Coletar NFT do leilão (para comprador vencedor)
   */
  static async collectAuctionTokens(
    account: Account,
    chainId: number,
    auctionId: string
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      
      const transaction = prepareContractCall({
        contract,
        method: "function collectAuctionTokens(uint256 auctionId)",
        params: [BigInt(auctionId)]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao coletar NFT:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao coletar NFT');
    }
  }

  // === OFFERS ===
  
  /**
   * Fazer oferta
   */
  static async makeOffer(
    account: Account,
    chainId: number,
    params: {
      assetContract: string;
      tokenId: string;
      quantity?: string;
      totalPrice: string;
      expirationTimestamp?: Date;
    }
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      const offerPrice = priceToWei(params.totalPrice);
      
      const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      
      const transaction = prepareContractCall({
        contract,
        method: "function makeOffer((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 totalPrice, uint256 expirationTimestamp) params) returns (uint256 offerId)",
        params: [{
          assetContract: params.assetContract,
          tokenId: BigInt(params.tokenId),
          quantity: BigInt(params.quantity || '1'),
          currency: NATIVE_TOKEN_ADDRESS,
          totalPrice: offerPrice,
          expirationTimestamp: BigInt(Math.floor((params.expirationTimestamp || defaultExpiry).getTime() / 1000)),
        }],
        value: offerPrice, // Deposit da oferta
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao fazer oferta:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao fazer oferta');
    }
  }

  /**
   * Aceitar oferta
   */
  static async acceptOffer(
    account: Account,
    chainId: number,
    offerId: string
  ) {
    try {
      const contract = getMarketplaceContract(chainId);
      
      const transaction = prepareContractCall({
        contract,
        method: "function acceptOffer(uint256 offerId)",
        params: [BigInt(offerId)]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao aceitar oferta:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao aceitar oferta');
    }
  }

  // === READ FUNCTIONS ===
  
  /**
   * Obter informações de uma listagem
   */
  static async getListing(chainId: number, listingId: string): Promise<DirectListing> {
    const contract = getMarketplaceContract(chainId);
    
    const result = await readContract({
      contract,
      method: "function getListing(uint256 listingId) view returns ((uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status) listing)",
      params: [BigInt(listingId)]
    });

    return result as DirectListing;
  }

  /**
   * Obter informações de um leilão
   */
  static async getAuction(chainId: number, auctionId: string): Promise<Auction> {
    const contract = getMarketplaceContract(chainId);
    
    const result = await readContract({
      contract,
      method: "function getAuction(uint256 auctionId) view returns ((uint256 auctionId, address auctionCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, uint8 tokenType, uint8 status) auction)",
      params: [BigInt(auctionId)]
    });

    return result as Auction;
  }

  /**
   * Obter lance vencedor de um leilão
   */
  static async getWinningBid(chainId: number, auctionId: string) {
    const contract = getMarketplaceContract(chainId);
    
    const result = await readContract({
      contract,
      method: "function getWinningBid(uint256 auctionId) view returns (address bidder, address currency, uint256 bidAmount)",
      params: [BigInt(auctionId)]
    });

    return {
      bidder: result[0],
      currency: result[1],
      bidAmount: result[2],
    };
  }

  /**
   * Verificar se leilão expirou
   */
  static async isAuctionExpired(chainId: number, auctionId: string): Promise<boolean> {
    const contract = getMarketplaceContract(chainId);
    
    const result = await readContract({
      contract,
      method: "function isAuctionExpired(uint256 auctionId) view returns (bool)",
      params: [BigInt(auctionId)]
    });

    return result;
  }

  /**
   * Obter total de listagens
   */
  static async getTotalListings(chainId: number): Promise<bigint> {
    const contract = getMarketplaceContract(chainId);
    
    const result = await readContract({
      contract,
      method: "function totalListings() view returns (uint256)",
      params: []
    });

    return result;
  }
} 