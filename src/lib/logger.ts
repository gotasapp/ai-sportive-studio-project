import clientPromise from './mongodb';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  actor: {
    type: 'user' | 'system';
    id: string;
    name?: string;
  };
  context: Record<string, any>;
  category: 'nft' | 'marketplace' | 'user' | 'jersey' | 'stadium' | 'badge';
  tags?: string[];
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private async saveToDB(entry: LogEntry) {
    try {
      const client = await clientPromise;
      const db = client.db('chz-app-db');
      const logs = db.collection('logs');
      
      await logs.insertOne({
        ...entry,
        id: entry.timestamp + '_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      });
    } catch (error) {
      // Fallback para console se MongoDB falhar
      console.error('❌ Failed to save log to DB:', error);
    }
  }

  private createEntry(
    level: LogEntry['level'], 
    message: string, 
    context: Record<string, any>,
    actor: LogEntry['actor'],
    category: LogEntry['category'],
    tags?: string[]
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      actor,
      context,
      category,
      tags: tags || []
    };
  }

  // Métodos públicos para diferentes tipos de logs
  async info(message: string, context: Record<string, any> = {}, category: LogEntry['category'] = 'nft', actor?: Partial<LogEntry['actor']>) {
    const entry = this.createEntry('info', message, context, {
      type: 'system',
      id: 'system',
      ...actor
    }, category);
    
    if (this.isDevelopment) {
      console.log(`ℹ️ [${category.toUpperCase()}] ${message}`, context);
    }
    
    await this.saveToDB(entry);
  }

  async success(message: string, context: Record<string, any> = {}, category: LogEntry['category'] = 'nft', actor?: Partial<LogEntry['actor']>) {
    const entry = this.createEntry('success', message, context, {
      type: 'system',
      id: 'system',
      ...actor
    }, category);
    
    if (this.isDevelopment) {
      console.log(`✅ [${category.toUpperCase()}] ${message}`, context);
    }
    
    await this.saveToDB(entry);
  }

  async warning(message: string, context: Record<string, any> = {}, category: LogEntry['category'] = 'nft', actor?: Partial<LogEntry['actor']>) {
    const entry = this.createEntry('warning', message, context, {
      type: 'system',
      id: 'system',
      ...actor
    }, category);
    
    if (this.isDevelopment) {
      console.warn(`⚠️ [${category.toUpperCase()}] ${message}`, context);
    }
    
    await this.saveToDB(entry);
  }

  async error(message: string, context: Record<string, any> = {}, category: LogEntry['category'] = 'nft', actor?: Partial<LogEntry['actor']>) {
    const entry = this.createEntry('error', message, context, {
      type: 'system',
      id: 'system',
      ...actor
    }, category);
    
    if (this.isDevelopment) {
      console.error(`❌ [${category.toUpperCase()}] ${message}`, context);
    }
    
    await this.saveToDB(entry);
  }

  async debug(message: string, context: Record<string, any> = {}, category: LogEntry['category'] = 'nft', actor?: Partial<LogEntry['actor']>) {
    const entry = this.createEntry('debug', message, context, {
      type: 'system',
      id: 'system',
      ...actor
    }, category);
    
    if (this.isDevelopment) {
      console.debug(`🔍 [${category.toUpperCase()}] ${message}`, context);
    }
    
    await this.saveToDB(entry);
  }

  // Método específico para criação de usuários
  async userCreated(walletAddress: string, username: string, context: Record<string, any> = {}) {
    await this.success(`New user registered: ${username}`, {
      walletAddress,
      username,
      ...context
    }, 'user', {
      type: 'user',
      id: walletAddress,
      name: username
    });
  }

  // Métodos específicos para NFTs e marketplace
  async nftMinted(tokenId: string, collection: string, user: string, context: Record<string, any> = {}) {
    await this.success(`NFT minted: ${collection} #${tokenId}`, {
      tokenId,
      collection,
      user,
      ...context
    }, 'nft', {
      type: 'user',
      id: user,
      name: user
    });
  }

  async marketplaceListing(tokenId: string, collection: string, price: string, user: string, context: Record<string, any> = {}) {
    await this.info(`NFT listed on marketplace: ${collection} #${tokenId} for ${price}`, {
      tokenId,
      collection,
      price,
      user,
      ...context
    }, 'marketplace', {
      type: 'user',
      id: user,
      name: user
    });
  }

  // Método para tempo de mint de NFTs
  async nftMintTime(tokenId: string, collection: string, mintDuration: number, context: Record<string, any> = {}) {
    await this.info(`NFT mint completed: ${collection} #${tokenId} (${mintDuration}ms)`, {
      tokenId,
      collection,
      mintDuration,
      ...context
    }, 'nft', {
      type: 'system',
      id: 'mint-system',
      name: 'NFT Mint System'
    });
  }

  // Método para vendas de NFTs
  async nftSale(tokenId: string, collection: string, price: string, seller: string, buyer: string, context: Record<string, any> = {}) {
    await this.success(`NFT sold: ${collection} #${tokenId} for ${price}`, {
      tokenId,
      collection,
      price,
      seller,
      buyer,
      ...context
    }, 'marketplace', {
      type: 'user',
      id: seller,
      name: seller
    });
  }

  // Método para compras de NFTs
  async nftPurchase(tokenId: string, collection: string, price: string, buyer: string, context: Record<string, any> = {}) {
    await this.success(`NFT purchased: ${collection} #${tokenId} for ${price}`, {
      tokenId,
      collection,
      price,
      buyer,
      ...context
    }, 'marketplace', {
      type: 'user',
      id: buyer,
      name: buyer
    });
  }
}

// Singleton instance
const logger = new Logger();
export default logger;

// Utility function para extrair informações de erro
export function extractErrorContext(error: any): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // Primeiras 5 linhas do stack
    };
  }
  
  if (typeof error === 'string') {
    return { error };
  }
  
  return { error: String(error) };
}

// Types para export
export type { LogEntry }; 