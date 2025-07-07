import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { getMarketplaceContract, getNFTContract, NATIVE_TOKEN_ADDRESS, getOfferCurrency, priceToWei, weiToPrice } from '../marketplace-config';
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
   * Criar listagem direta
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
      console.log('🎯 Criando listagem com parâmetros:', params);
      
      const contract = getMarketplaceContract(chainId);
      const pricePerToken = priceToWei(params.pricePerToken);
      
      // Validar e converter tokenId
      let numericTokenId: bigint;
      try {
        // Se é um número válido, usar diretamente
        if (/^\d+$/.test(params.tokenId)) {
          numericTokenId = BigInt(params.tokenId);
        } else if (params.tokenId.length === 24) {
          // Se é um ObjectId do MongoDB (24 caracteres hex), extrair timestamp como fallback
          const timestamp = parseInt(params.tokenId.substring(0, 8), 16);
          numericTokenId = BigInt(timestamp % 10000); // Usar últimos 4 dígitos como tokenId
          console.log(`⚠️ TokenId parece ser ObjectId, usando timestamp como fallback: ${numericTokenId}`);
        } else {
          // Tentar converter diretamente ou usar 0 como fallback
          numericTokenId = BigInt(0);
          console.log(`⚠️ TokenId inválido, usando 0 como fallback: ${params.tokenId}`);
        }
      } catch (error) {
        numericTokenId = BigInt(0);
        console.log(`❌ Erro ao converter tokenId, usando 0: ${params.tokenId}`, error);
      }
      
      console.log('✅ TokenId convertido para:', numericTokenId.toString());
      
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const transaction = prepareContractCall({
        contract,
        method: "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) params) returns (uint256 listingId)",
        params: [{
          assetContract: params.assetContract,
          tokenId: numericTokenId,
          quantity: BigInt(params.quantity || '1'),
          currency: NATIVE_TOKEN_ADDRESS,
          pricePerToken,
          startTimestamp: BigInt(Math.floor((params.startTimestamp || now).getTime() / 1000)),
          endTimestamp: BigInt(Math.floor((params.endTimestamp || oneWeekLater).getTime() / 1000)),
          reserved: params.reserved || false,
        }],
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
      console.log('🎯 Criando leilão com parâmetros:', params);
      
      const contract = getMarketplaceContract(chainId);
      const minimumBid = priceToWei(params.minimumBidAmount);
      const buyoutBid = params.buyoutBidAmount ? priceToWei(params.buyoutBidAmount) : minimumBid * BigInt(10);
      
      // Validar e converter tokenId
      let numericTokenId: bigint;
      try {
        // Se é um número válido, usar diretamente
        if (/^\d+$/.test(params.tokenId)) {
          numericTokenId = BigInt(params.tokenId);
        } else if (params.tokenId.length === 24) {
          // Se é um ObjectId do MongoDB (24 caracteres hex), extrair timestamp como fallback
          const timestamp = parseInt(params.tokenId.substring(0, 8), 16);
          numericTokenId = BigInt(timestamp % 10000); // Usar últimos 4 dígitos como tokenId
          console.log(`⚠️ TokenId parece ser ObjectId, usando timestamp como fallback: ${numericTokenId}`);
        } else {
          // Tentar converter diretamente ou usar 0 como fallback
          numericTokenId = BigInt(0);
          console.log(`⚠️ TokenId inválido, usando 0 como fallback: ${params.tokenId}`);
        }
      } catch (error) {
        numericTokenId = BigInt(0);
        console.log(`❌ Erro ao converter tokenId, usando 0: ${params.tokenId}`, error);
      }
      
      console.log('✅ TokenId convertido para:', numericTokenId.toString());
      
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
      
      const transaction = prepareContractCall({
        contract,
        method: "function createAuction((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp) params) returns (uint256 auctionId)",
        params: [{
          assetContract: params.assetContract,
          tokenId: numericTokenId,
          quantity: BigInt(params.quantity || '1'),
          currency: NATIVE_TOKEN_ADDRESS,
          minimumBidAmount: minimumBid,
          buyoutBidAmount: buyoutBid,
          timeBufferInSeconds: BigInt(params.timeBufferInSeconds || 300), // 5 min buffer
          bidBufferBps: BigInt(params.bidBufferBps || 500), // 5% bid buffer
          startTimestamp: BigInt(Math.floor((params.startTimestamp || now).getTime() / 1000)),
          endTimestamp: BigInt(Math.floor((params.endTimestamp || defaultEnd).getTime() / 1000)),
        }],
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

  // === TOKEN APPROVAL (para ofertas ERC20) ===
  
  /**
   * Verificar se o usuário já aprovou o token ERC20 para ofertas
   */
  static async checkOfferTokenAllowance(
    account: Account,
    chainId: number,
    amount: string
  ): Promise<{ isApproved: boolean; currentAllowance: bigint }> {
    try {
      const tokenAddress = getOfferCurrency(chainId);
      const marketplaceContract = getMarketplaceContract(chainId);
      const requiredAmount = priceToWei(amount);
      
      // Criar contrato do token ERC20
      const tokenContract = getContract({
        client: marketplaceContract.client,
        address: tokenAddress,
        chain: marketplaceContract.chain,
      });
      
      // Verificar allowance atual
      const currentAllowance = await readContract({
        contract: tokenContract,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, marketplaceContract.address]
      });
      
      const isApproved = currentAllowance >= requiredAmount;
      
      console.log(`💰 Allowance atual: ${currentAllowance.toString()}, Requerido: ${requiredAmount.toString()}, Aprovado: ${isApproved}`);
      
      return { isApproved, currentAllowance };
    } catch (error: any) {
      console.error('❌ Erro ao verificar allowance:', error);
      throw new Error('Falha ao verificar aprovação do token');
    }
  }
  
  /**
   * Aprovar token ERC20 para fazer ofertas
   */
  static async approveOfferToken(
    account: Account,
    chainId: number,
    amount: string
  ) {
    try {
      const tokenAddress = getOfferCurrency(chainId);
      const marketplaceContract = getMarketplaceContract(chainId);
      const approvalAmount = priceToWei(amount);
      
      console.log(`🔓 Aprovando ${amount} tokens para ofertas...`);
      
      // Criar contrato do token ERC20
      const tokenContract = getContract({
        client: marketplaceContract.client,
        address: tokenAddress,
        chain: marketplaceContract.chain,
      });
      
      const transaction = prepareContractCall({
        contract: tokenContract,
        method: "function approve(address spender, uint256 amount) returns (bool)",
        params: [marketplaceContract.address, approvalAmount]
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('✅ Token aprovado com sucesso:', result.transactionHash);
      return { success: true, transactionHash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Erro ao aprovar token:', error);
      throw new Error(error?.reason || error?.message || 'Falha ao aprovar token');
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
      console.log('🎯 Fazendo oferta com parâmetros:', params);
      
      const contract = getMarketplaceContract(chainId);
      const offerPrice = priceToWei(params.totalPrice);
      
      // Validar e converter tokenId
      let numericTokenId: bigint;
      try {
        // Se é um número válido, usar diretamente
        if (/^\d+$/.test(params.tokenId)) {
          numericTokenId = BigInt(params.tokenId);
        } else if (params.tokenId.length === 24) {
          // Se é um ObjectId do MongoDB (24 caracteres hex), extrair timestamp como fallback
          const timestamp = parseInt(params.tokenId.substring(0, 8), 16);
          numericTokenId = BigInt(timestamp % 10000); // Usar últimos 4 dígitos como tokenId
          console.log(`⚠️ TokenId parece ser ObjectId, usando timestamp como fallback: ${numericTokenId}`);
        } else {
          // Tentar converter diretamente ou usar 0 como fallback
          numericTokenId = BigInt(0);
          console.log(`⚠️ TokenId inválido, usando 0 como fallback: ${params.tokenId}`);
        }
      } catch (error) {
        numericTokenId = BigInt(0);
        console.log(`❌ Erro ao converter tokenId, usando 0: ${params.tokenId}`, error);
      }
      
      console.log('✅ TokenId convertido para:', numericTokenId.toString());
      
      const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      
      // Obter token ERC20 correto para ofertas (ofertas não podem usar tokens nativos)
      const offerCurrency = getOfferCurrency(chainId);
      console.log('💰 Usando token ERC20 para oferta:', offerCurrency);
      
      // Estrutura correta conforme documentação do Marketplace V3
      const offerParams = {
        assetContract: params.assetContract,
        tokenId: numericTokenId,
        quantity: BigInt(params.quantity || '1'),
        currency: offerCurrency, // Token ERC20 (WMATIC, WETH, etc.)
        totalPrice: offerPrice,
        expirationTimestamp: BigInt(Math.floor((params.expirationTimestamp || defaultExpiry).getTime() / 1000)),
      };
      
      console.log('📋 OfferParams final:', offerParams);
      
      const transaction = prepareContractCall({
        contract,
        method: "function makeOffer((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 totalPrice, uint256 expirationTimestamp) params) returns (uint256 offerId)",
        params: [offerParams],
        // Não usar 'value' para ofertas ERC20 - o usuário deve ter aprovado o token antes
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