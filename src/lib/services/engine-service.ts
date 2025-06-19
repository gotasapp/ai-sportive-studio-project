// Thirdweb Engine Cloud Service
export class EngineService {
  private static baseUrl = process.env.NEXT_PUBLIC_ENGINE_URL || "https://engine.thirdweb.com";
  private static clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
  private static secretKey = process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY || "";
  private static serverWalletAddress = process.env.BACKEND_WALLET_ADDRESS || "";

  // 🔐 Get headers for Engine Cloud authentication
  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-id': this.clientId,
      'Authorization': `Bearer ${this.secretKey}`
    };

    return headers;
  }

  // ✅ USER MINT - Generate signature for user to sign
  static async mintWithUserWallet(params: {
    chain: string;
    contractAddress: string;
    to: string;
    metadata: any;
    userWalletAddress: string;
  }) {
    try {
      console.log('🎯 Engine: Preparing user mint transaction');
      console.log('📋 Contract:', params.contractAddress);
      console.log('👤 To:', params.to);
      console.log('💳 User wallet:', params.userWalletAddress);
      
      // 📋 CORRECT ENGINE API FOR USER SIGNATURE GENERATION
      const response = await fetch(`${this.baseUrl}/v1/contract/${params.chain}/${params.contractAddress}/erc721/signature/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          to: params.to,
          metadata: params.metadata,
          mintRequest: {
            to: params.to,
            royaltyRecipient: params.to,
            royaltyBps: 0,
            primarySaleRecipient: params.to,
            uri: JSON.stringify(params.metadata),
            price: "0",
            currency: "0x0000000000000000000000000000000000000000",
            validityStartTimestamp: Math.floor(Date.now() / 1000),
            validityEndTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            uid: `0x${Math.random().toString(16).substr(2, 32).padStart(64, '0')}`
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Engine API Error Response:', errorText);
        throw new Error(`Engine API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Engine: Signature generated:', result);
      
      return {
        success: true,
        signature: result.result,
        type: 'user-paid'
      };
      
    } catch (error) {
      console.error('❌ Engine: User mint failed:', error);
      throw new Error(`User mint failed: ${error.message}`);
    }
  }

  /*
  // 🎁 ADMIN GIFT - Server wallet pays gas (gasless for user)
  static async mintAsGift(params: {
    chain: string;
    contractAddress: string;
    to: string;
    metadata: any;
    backendWalletAddress: string;
  }) {
    try {
      console.log('🎁 Engine: Admin gift mint (gasless)');
      console.log('🔗 Chain:', params.chain);
      console.log('📋 Contract:', params.contractAddress);
      console.log('🎯 Recipient:', params.to);
      console.log('🔐 Backend wallet:', params.backendWalletAddress);
      
      // Prepara os headers, incluindo o da carteira de backend
      const headers = {
        ...this.getHeaders(),
        'x-backend-wallet-address': params.backendWalletAddress,
      };

      // URL CORRIGIDA: Adicionado o prefixo /v1/ para a API do Engine Cloud
      const requestUrl = `${this.baseUrl}/v1/contract/${params.chain}/${params.contractAddress}/erc721/mint-to`;
      const requestBody = {
        receiver: params.to,
        metadata: params.metadata,
      };

      console.log('📡 [engine-service] Enviando requisição para o Thirdweb Engine...');
      console.log('   URL:', requestUrl);
      console.log('   HEADERS:', JSON.stringify(headers, null, 2));
      console.log('   BODY:', JSON.stringify(requestBody, null, 2));

      // 📋 CORRECT ENGINE API ENDPOINT FOR NFT MINT
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('📬 [engine-service] Resposta recebida do Engine. Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Engine API Error Response:', errorText);
        throw new Error(`Engine API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Engine API Response:', result);
      
      return {
        success: true,
        queueId: result.result?.queueId,
        type: 'admin-gift',
        recipient: params.to,
        ...result
      };
      
    } catch (error) {
      console.error('❌ Engine: Gift mint failed:', error);
      throw new Error(`Gift mint failed: ${error.message}`);
    }
  }
  */

  // 📊 Check transaction status
  static async getTransactionStatus(queueId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/transaction/status/${queueId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Engine API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('❌ Engine: Status check failed:', error);
      throw error;
    }
  }

  // 🔧 Get Engine configuration info
  static async getEngineInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/configuration/backend-wallets`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Engine API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('ℹ️ Engine backend wallets:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Engine: Get info failed:', error);
      throw error;
    }
  }

  // 🎯 Upload metadata to IPFS via Engine
  static async uploadToIPFS(data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ipfs/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Engine API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('📤 Engine: IPFS upload successful:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Engine: IPFS upload failed:', error);
      throw error;
    }
  }

  // 🔄 Bulk gift minting (admin feature)
  static async bulkGiftMint(params: {
    contractAddress: string;
    recipients: string[];
    metadata: any[];
  }) {
    const results = [];
    
    try {
      console.log(`🎁 Engine: Bulk gift mint to ${params.recipients.length} recipients`);
      
      for (let i = 0; i < params.recipients.length; i++) {
        const recipient = params.recipients[i];
        const metadata = params.metadata[i] || params.metadata[0];
        
        const result = await this.mintAsGift({
          contractAddress: params.contractAddress,
          to: recipient,
          metadata
        });
        
        results.push({
          recipient,
          queueId: result.queueId,
          success: result.success
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Engine: Bulk gift mint completed for ${results.length} recipients`);
      return results;
      
    } catch (error) {
      console.error('❌ Engine: Bulk gift mint failed:', error);
      throw error;
    }
  }

  // 🧪 Test Engine connection
  static async testConnection() {
    try {
      console.log('🧪 Testing Engine connection...');
      console.log('🔗 Engine URL:', this.baseUrl);
      console.log('🔑 Has Access Token:', !!this.secretKey);
      console.log('👤 Server Wallet:', this.serverWalletAddress);

      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Engine health check failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Engine connection successful:', result);
      return result;

    } catch (error) {
      console.error('❌ Engine connection test failed:', error);
      throw error;
    }
  }
} 