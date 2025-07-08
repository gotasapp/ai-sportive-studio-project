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
      
      // 🚨 VALIDAÇÃO CRÍTICA DO PREÇO ANTES DE CONTINUAR
      console.log('🔍 VALIDANDO PREÇO ANTES DA LISTAGEM:', params.pricePerToken);
      
      const numPrice = parseFloat(params.pricePerToken);
      if (isNaN(numPrice) || numPrice <= 0) {
        throw new Error(`Preço inválido: "${params.pricePerToken}". Deve ser um número positivo.`);
      }
      
      if (numPrice > 1000) {
        throw new Error(`Preço muito alto: ${numPrice} MATIC. Máximo permitido é 1000 MATIC por segurança.`);
      }
      
      if (numPrice < 0.000001) {
        throw new Error(`Preço muito baixo: ${numPrice} MATIC. Mínimo recomendado é 0.000001 MATIC.`);
      }
      
      // Verificar se o marketplace está aprovado para transferir o NFT
      await MarketplaceService.checkAndApproveNFT(account, chainId, params.assetContract, params.tokenId);
      
      const contract = getMarketplaceContract(chainId);
      
      // Conversão segura do preço com validação adicional
      let pricePerToken: bigint;
      try {
        pricePerToken = priceToWei(params.pricePerToken);
        
        // Validação dupla do resultado
        const backToEther = Number(pricePerToken) / Math.pow(10, 18);
        if (Math.abs(backToEther - numPrice) > 0.000001) {
          throw new Error(`Erro na conversão do preço. Original: ${numPrice}, Convertido: ${backToEther}`);
        }
        
        console.log('✅ PREÇO VALIDADO E CONVERTIDO:', {
          original: params.pricePerToken,
          parsed: numPrice,
          wei: pricePerToken.toString(),
          backToEther: backToEther.toFixed(6)
        });
        
      } catch (conversionError: any) {
        throw new Error(`Falha na conversão do preço: ${conversionError.message}`);
      }
      
      // 🔍 DESCOBRIR O TOKEN ID REAL
      let numericTokenId: bigint;
      
      // Se é um ObjectId do MongoDB, precisamos descobrir o tokenId real
      if (params.tokenId.length === 24 && /^[0-9a-fA-F]{24}$/.test(params.tokenId)) {
        console.log('🔍 TokenId é ObjectId do MongoDB, descobrindo tokenId real...');
        
        try {
          // Tentar descobrir o último tokenId mintado
          const lastTokenId = await MarketplaceService.getNextTokenId(chainId, params.assetContract);
          console.log('📋 Último tokenId mintado:', lastTokenId.toString());
          
          // Verificar se o usuário é dono deste token
          const isOwner = await MarketplaceService.checkTokenOwnership(
            chainId, 
            params.assetContract, 
            lastTokenId.toString(), 
            account.address
          );
          
          if (isOwner) {
            numericTokenId = lastTokenId;
            console.log('✅ Usuário é dono do último token mintado:', numericTokenId.toString());
          } else {
            // Se não é dono do último, tentar alguns anteriores
            console.log('⚠️ Usuário não é dono do último token, verificando anteriores...');
            let found = false;
            
            for (let i = 1; i <= 5; i++) {
              const testTokenId = lastTokenId - BigInt(i);
              if (testTokenId < 0) break;
              
              const isOwnerTest = await MarketplaceService.checkTokenOwnership(
                chainId, 
                params.assetContract, 
                testTokenId.toString(), 
                account.address
              );
              
              if (isOwnerTest) {
                numericTokenId = testTokenId;
                console.log(`✅ Encontrado token do usuário: ${numericTokenId.toString()}`);
                found = true;
                break;
              }
            }
            
            if (!found) {
              // Fallback para timestamp
              const timestamp = parseInt(params.tokenId.substring(0, 8), 16);
              numericTokenId = BigInt(timestamp % 10000);
              console.log(`⚠️ Não encontrou token do usuário, usando fallback: ${numericTokenId.toString()}`);
            }
          }
          
        } catch (error) {
          console.error('❌ Erro ao descobrir tokenId real:', error);
          // Fallback para timestamp
          const timestamp = parseInt(params.tokenId.substring(0, 8), 16);
          numericTokenId = BigInt(timestamp % 10000);
          console.log(`⚠️ Erro na descoberta, usando fallback: ${numericTokenId.toString()}`);
        }
        
      } else if (/^\d+$/.test(params.tokenId)) {
        // Se é um número válido, usar diretamente
        numericTokenId = BigInt(params.tokenId);
        console.log('✅ TokenId numérico válido:', numericTokenId.toString());
      } else {
        // Fallback para 0
        numericTokenId = BigInt(0);
        console.log(`⚠️ TokenId inválido, usando 0 como fallback: ${params.tokenId}`);
      }
      
      console.log('✅ TokenId final a ser usado:', numericTokenId.toString());
      
      // Verificar uma última vez se o usuário é dono do token
      const finalOwnershipCheck = await MarketplaceService.checkTokenOwnership(
        chainId, 
        params.assetContract, 
        numericTokenId.toString(), 
        account.address
      );
      
      if (!finalOwnershipCheck) {
        throw new Error(`Você não é o dono do token ${numericTokenId.toString()}. Verifique se você realmente possui este NFT.`);
      }
      
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

      console.log('🎉 LISTAGEM CRIADA COM SUCESSO!');
      console.log('📄 Transaction Hash:', result.transactionHash);
      console.log('📋 Parâmetros da listagem:', {
        assetContract: params.assetContract,
        tokenId: numericTokenId.toString(),
        pricePerToken: params.pricePerToken,
        account: account.address,
        chainId
      });
      console.log('🔗 Ver transação no explorer:', `https://amoy.polygonscan.com/tx/${result.transactionHash}`);

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
      console.log('🛒 Comprando NFT com parâmetros:', params);
      
      // Primeiro, verificar se a listagem existe e está válida
      console.log('🔍 Verificando se listagem existe...');
      try {
        const listingInfo = await MarketplaceService.getListing(chainId, params.listingId);
        console.log('✅ Listagem encontrada:', {
          listingId: listingInfo.listingId.toString(),
          pricePerToken: listingInfo.pricePerToken.toString(),
          status: listingInfo.status,
          creator: listingInfo.listingCreator
        });
      } catch (error) {
        console.error('❌ Listagem não encontrada ou inválida:', error);
        throw new Error('Esta listagem não existe ou não está mais disponível.');
      }
      
      const contract = getMarketplaceContract(chainId);
      const expectedPrice = priceToWei(params.expectedTotalPrice);
      
      // Validar e converter listingId
      let numericListingId: bigint;
      try {
        // Se é um número válido, usar diretamente
        if (/^\d+$/.test(params.listingId)) {
          numericListingId = BigInt(params.listingId);
        } else if (params.listingId.includes('-')) {
          // Se contém hífen (ex: "listing-686bcc28550dc207b558c7c5"), extrair a parte numérica
          const numericPart = params.listingId.split('-').pop();
          if (numericPart && numericPart.length === 24) {
            // ObjectId do MongoDB
            const timestamp = parseInt(numericPart.substring(0, 8), 16);
            numericListingId = BigInt(timestamp % 10000);
            console.log(`⚠️ ListingId parece conter ObjectId, usando timestamp como fallback: ${numericListingId}`);
          } else {
            numericListingId = BigInt(0);
            console.log(`⚠️ ListingId inválido, usando 0 como fallback: ${params.listingId}`);
          }
        } else {
          // Tentar converter diretamente
          numericListingId = BigInt(0);
          console.log(`⚠️ ListingId inválido, usando 0 como fallback: ${params.listingId}`);
        }
      } catch (error) {
        numericListingId = BigInt(0);
        console.log(`❌ Erro ao converter listingId, usando 0: ${params.listingId}`, error);
      }
      
      console.log('✅ ListingId convertido para:', numericListingId.toString());
      console.log('💰 Valor a ser enviado (wei):', expectedPrice.toString());
      
      const transaction = prepareContractCall({
        contract,
        method: "function buyFromListing(uint256 listingId, address buyFor, uint256 quantity, address currency, uint256 expectedTotalPrice) payable",
        params: [
          numericListingId,
          account.address,
          BigInt(params.quantity || '1'),
          NATIVE_TOKEN_ADDRESS,
          expectedPrice
        ],
        value: expectedPrice, // Pagar com token nativo
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
      console.log('💰 Usando token para oferta:', offerCurrency);
      
      // Estrutura correta conforme documentação do Marketplace V3
      const offerParams = {
        assetContract: params.assetContract,
        tokenId: numericTokenId,
        quantity: BigInt(params.quantity || '1'),
        currency: offerCurrency, // Token ERC20 (WMATIC, WETH, etc.) ou nativo para testes
        totalPrice: offerPrice,
        expirationTimestamp: BigInt(Math.floor((params.expirationTimestamp || defaultExpiry).getTime() / 1000)),
      };
      
      console.log('📋 OfferParams final:', offerParams);
      
      // Se estiver usando token nativo (para testes), adicionar value
      const transactionParams: any = {
        contract,
        method: "function makeOffer((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 totalPrice, uint256 expirationTimestamp) params) returns (uint256 offerId)",
        params: [offerParams],
      };
      
      // Para testes com token nativo, adicionar value
      if (offerCurrency === NATIVE_TOKEN_ADDRESS) {
        transactionParams.value = offerPrice;
        console.log('🪙 Usando token nativo para oferta (modo teste)');
      } else {
        console.log('💳 Usando token ERC20 para oferta (requer aprovação)');
      }
      
      const transaction = prepareContractCall(transactionParams);

      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('🎉 OFERTA CRIADA COM SUCESSO!');
      console.log('📄 Transaction Hash:', result.transactionHash);
      console.log('📋 Parâmetros da oferta enviados:', {
        assetContract: params.assetContract,
        tokenId: numericTokenId.toString(),
        totalPrice: params.totalPrice,
        currency: offerCurrency,
        account: account.address,
        chainId
      });
      console.log('🔗 Ver transação no explorer:', `https://amoy.polygonscan.com/tx/${result.transactionHash}`);

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

  // === NFT APPROVAL FUNCTIONS ===
  
  /**
   * Verificar qual é o tokenId real do NFT no contrato
   */
  static async getNextTokenId(chainId: number, assetContract: string): Promise<bigint> {
    try {
      const nftContract = getContract({
        client: getMarketplaceContract(chainId).client,
        address: assetContract,
        chain: getMarketplaceContract(chainId).chain,
      });
      
      // Tentar obter o próximo tokenId (indica quantos foram mintados)
      const nextTokenId = await readContract({
        contract: nftContract,
        method: "function nextTokenIdToMint() view returns (uint256)",
        params: []
      });
      
      console.log('📋 Próximo tokenId a ser mintado:', nextTokenId.toString());
      console.log('📋 Isso significa que o último mintado foi:', (nextTokenId - BigInt(1)).toString());
      
      return nextTokenId - BigInt(1); // O último tokenId mintado
      
    } catch (error: any) {
      console.error('❌ Erro ao obter tokenId:', error);
      
      // Fallback: tentar totalSupply
      try {
        const nftContract = getContract({
          client: getMarketplaceContract(chainId).client,
          address: assetContract,
          chain: getMarketplaceContract(chainId).chain,
        });
        
        const totalSupply = await readContract({
          contract: nftContract,
          method: "function totalSupply() view returns (uint256)",
          params: []
        });
        
        console.log('📋 Total Supply:', totalSupply.toString());
        return totalSupply - BigInt(1); // Assumindo que tokenIds começam em 0
        
      } catch (fallbackError: any) {
        console.error('❌ Erro no fallback totalSupply:', fallbackError);
        throw new Error('Não foi possível determinar o tokenId real');
      }
    }
  }

  /**
   * Verificar se o usuário é dono de um tokenId específico
   */
  static async checkTokenOwnership(
    chainId: number, 
    assetContract: string, 
    tokenId: string, 
    ownerAddress: string
  ): Promise<boolean> {
    try {
      const nftContract = getContract({
        client: getMarketplaceContract(chainId).client,
        address: assetContract,
        chain: getMarketplaceContract(chainId).chain,
      });
      
      const owner = await readContract({
        contract: nftContract,
        method: "function ownerOf(uint256 tokenId) view returns (address)",
        params: [BigInt(tokenId)]
      });
      
      console.log(`📋 Dono do token ${tokenId}:`, owner);
      console.log(`📋 Endereço verificado:`, ownerAddress);
      console.log(`📋 É o dono?`, owner.toLowerCase() === ownerAddress.toLowerCase());
      
      return owner.toLowerCase() === ownerAddress.toLowerCase();
      
    } catch (error: any) {
      console.error(`❌ Erro ao verificar propriedade do token ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Verificar e aprovar NFT para marketplace
   */
  static async checkAndApproveNFT(
    account: Account,
    chainId: number,
    assetContract: string,
    tokenId: string
  ) {
    try {
      console.log('🔍 VERIFICANDO APROVAÇÃO DO NFT:');
      console.log('📋 Asset Contract:', assetContract);
      console.log('📋 Token ID:', tokenId);
      console.log('📋 Chain ID:', chainId);
      console.log('📋 Account:', account.address);
      
      const marketplaceContract = getMarketplaceContract(chainId);
      console.log('📋 Marketplace Contract:', marketplaceContract.address);
      
      const nftContract = getContract({
        client: marketplaceContract.client,
        address: assetContract,
        chain: marketplaceContract.chain,
      });
      
      console.log('📋 NFT Contract criado para:', assetContract);
      
      // Verificar se o marketplace já está aprovado
      console.log('🔍 Verificando se marketplace está aprovado...');
      const isApproved = await readContract({
        contract: nftContract,
        method: "function isApprovedForAll(address owner, address operator) view returns (bool)",
        params: [account.address, marketplaceContract.address]
      });
      
      console.log('📋 Status da aprovação:', { 
        isApproved, 
        owner: account.address, 
        marketplace: marketplaceContract.address 
      });
      
      if (!isApproved) {
        console.log('⚠️ NFT NÃO APROVADO! Solicitando aprovação...');
        toast.info('Aprovando NFT para marketplace... Aprove a transação na sua carteira.');
        
        const approvalTransaction = prepareContractCall({
          contract: nftContract,
          method: "function setApprovalForAll(address operator, bool approved)",
          params: [marketplaceContract.address, true]
        });
        
        console.log('📤 Enviando transação de aprovação...');
        const approvalResult = await sendTransaction({
          transaction: approvalTransaction,
          account,
        });
        
        console.log('✅ NFT APROVADO COM SUCESSO!');
        console.log('📄 Transaction Hash:', approvalResult.transactionHash);
        console.log('🔗 Ver no explorer:', `https://amoy.polygonscan.com/tx/${approvalResult.transactionHash}`);
        toast.success('NFT aprovado para marketplace! 🎉');
      } else {
        console.log('✅ NFT JÁ ESTÁ APROVADO para marketplace');
      }
      
    } catch (error: any) {
      console.error('❌ ERRO AO VERIFICAR/APROVAR NFT:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        assetContract,
        tokenId,
        chainId
      });
      throw new Error('Falha ao aprovar NFT para marketplace: ' + (error?.message || 'Erro desconhecido'));
    }
  }

  // === READ FUNCTIONS ===
  
  /**
   * Obter informações de uma listagem
   */
  static async getListing(chainId: number, listingId: string): Promise<DirectListing> {
    try {
      console.log('🔍 BUSCANDO LISTAGEM NO BLOCKCHAIN:');
      console.log('📋 Chain ID:', chainId);
      console.log('📋 Listing ID:', listingId);
      
      const contract = getMarketplaceContract(chainId);
      console.log('📋 Marketplace Contract:', contract.address);
      
      const numericListingId = BigInt(listingId);
      console.log('📋 Numeric Listing ID:', numericListingId.toString());
      
      const result = await readContract({
        contract,
        method: "function getListing(uint256 listingId) view returns ((uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status) listing)",
        params: [numericListingId]
      });

      const listing = result as DirectListing;
      
      // 🚨 VALIDAÇÕES CRÍTICAS DOS DADOS DO BLOCKCHAIN
      console.log('🔍 VALIDANDO DADOS DA LISTAGEM:');
      console.log('📋 Raw listing data:', listing);
      
      // Validar se a listagem existe (creator não pode ser zero address)
      if (!listing.listingCreator || listing.listingCreator === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Listagem ${listingId} não existe ou foi removida`);
      }
      
      // Validar preço (não pode ser zero ou astronômico)
      const priceInEther = Number(listing.pricePerToken) / Math.pow(10, 18);
      console.log('📋 Price validation:', {
        pricePerTokenWei: listing.pricePerToken.toString(),
        priceInEther: priceInEther,
        isReasonable: priceInEther > 0 && priceInEther < 1000000
      });
      
      if (priceInEther <= 0) {
        throw new Error(`Listagem ${listingId} tem preço inválido (zero)`);
      }
      
      if (priceInEther > 1000000) {
        throw new Error(`Listagem ${listingId} tem preço astronômico: ${priceInEther.toFixed(6)} MATIC`);
      }
      
      // Validar status da listagem
      const validStatuses = [1, 'CREATED']; // Status 1 = CREATED
      if (!validStatuses.includes(listing.status)) {
        throw new Error(`Listagem ${listingId} não está disponível (status: ${listing.status})`);
      }
      
      // Validar timestamps
      const now = Math.floor(Date.now() / 1000);
      const startTime = Number(listing.startTimestamp);
      const endTime = Number(listing.endTimestamp);
      
      if (startTime > now) {
        throw new Error(`Listagem ${listingId} ainda não iniciou`);
      }
      
      if (endTime < now) {
        throw new Error(`Listagem ${listingId} já expirou`);
      }
      
      console.log('✅ LISTAGEM VALIDADA COM SUCESSO:', {
        listingId: listing.listingId.toString(),
        creator: listing.listingCreator,
        priceInEther: priceInEther.toFixed(6),
        status: listing.status,
        isActive: true
      });

      return listing;
      
    } catch (error: any) {
      console.error('❌ ERRO AO BUSCAR/VALIDAR LISTAGEM:', error);
      throw new Error(`Falha ao buscar listagem ${listingId}: ${error.message}`);
    }
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

  /**
   * Obter todas as listagens válidas
   */
  static async getAllValidListings(chainId: number, startId: number = 0, endId?: number): Promise<DirectListing[]> {
    try {
      const contract = getMarketplaceContract(chainId);
      
      // Se endId não especificado, usar total de listagens
      if (!endId) {
        const total = await MarketplaceService.getTotalListings(chainId);
        endId = Number(total) - 1;
      }

      if (endId < startId) {
        console.log('📭 Nenhuma listagem encontrada');
        return [];
      }

      console.log(`🔍 Buscando listagens de ${startId} até ${endId}...`);
      
      const result = await readContract({
        contract,
        method: "function getAllValidListings(uint256 startId, uint256 endId) view returns ((uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status)[] listings)",
        params: [BigInt(startId), BigInt(endId)]
      });

      console.log(`✅ Encontradas ${result.length} listagens válidas`);
      return result as DirectListing[];
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar listagens:', error);
      return [];
    }
  }
} 