import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

/**
 * Registro dinâmico de contratos detectados automaticamente
 * Este sistema identifica TODOS os contratos que têm NFTs listados no marketplace
 */
export class DynamicContractRegistry {
  private static detectedContracts: Set<string> = new Set();
  private static lastUpdate: Date | null = null;
  private static updateInterval = 5 * 60 * 1000; // 5 minutos

  /**
   * Detecta automaticamente todos os contratos com NFTs listados no marketplace
   */
  static async detectContractsFromMarketplace(): Promise<string[]> {
    try {
      console.log('🔍 Detectando contratos a partir do marketplace...');
      
      const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';
      
      const marketplaceContract = getContract({
        client,
        chain: polygonAmoy,
        address: marketplaceAddress,
      });

      // Buscar TODAS as listagens válidas sem filtro
      const allListings = await getAllValidListings({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(1000), // Buscar até 1000 listagens
      });

      // Extrair contratos únicos de todas as listagens
      const contractsFromListings = new Set<string>();
      
      allListings.forEach(listing => {
        if (listing.assetContractAddress) {
          contractsFromListings.add(listing.assetContractAddress.toLowerCase());
        }
      });

      // Atualizar registro interno
      contractsFromListings.forEach(contract => {
        this.detectedContracts.add(contract);
      });

      this.lastUpdate = new Date();
      
      const contractArray = Array.from(contractsFromListings);
      console.log(`✅ Detectados ${contractArray.length} contratos únicos no marketplace:`, contractArray);
      
      return contractArray;
    } catch (error) {
      console.error('❌ Erro ao detectar contratos do marketplace:', error);
      return [];
    }
  }

  /**
   * Obtém todos os contratos detectados (com cache)
   */
  static async getAllDetectedContracts(forceUpdate = false): Promise<string[]> {
    const now = new Date();
    
    // Verificar se precisa atualizar
    if (forceUpdate || 
        !this.lastUpdate || 
        (now.getTime() - this.lastUpdate.getTime()) > this.updateInterval) {
      await this.detectContractsFromMarketplace();
    }
    
    return Array.from(this.detectedContracts);
  }

  /**
   * Adiciona um contrato manualmente ao registro
   */
  static addContract(contractAddress: string): void {
    if (contractAddress && contractAddress !== '') {
      this.detectedContracts.add(contractAddress.toLowerCase());
      console.log(`➕ Contrato adicionado ao registro: ${contractAddress}`);
    }
  }

  /**
   * Verifica se um contrato está registrado
   */
  static isContractRegistered(contractAddress: string): boolean {
    return this.detectedContracts.has(contractAddress.toLowerCase());
  }

  /**
   * Limpa o cache para forçar nova detecção
   */
  static clearCache(): void {
    this.detectedContracts.clear();
    this.lastUpdate = null;
    console.log('🧹 Cache de contratos limpo');
  }
}

/**
 * Helper para obter TODOS os contratos suportados combinando várias fontes
 */
export async function getAllSupportedContractsUnified(
  chainId: number,
  mongoDb?: any
): Promise<string[]> {
  const contracts = new Set<string>();
  
  // 1. Contratos estáticos (legacy + launchpad base)
  const staticContracts = [
    process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
    process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
  ].filter(addr => addr && addr !== '');
  
  staticContracts.forEach(addr => contracts.add(addr.toLowerCase()));
  
  // 2. Contratos do MongoDB (coleções launchpad + custom collections)
  if (mongoDb) {
    try {
      // Buscar coleções launchpad
      const launchpadCollections = await mongoDb.collection('collections').find({
        type: 'launchpad',
        contractAddress: { $exists: true, $ne: null }
      }).toArray();
      
      launchpadCollections.forEach((col: any) => {
        if (col.contractAddress) {
          contracts.add(col.contractAddress.toLowerCase());
        }
      });

      // ✅ BUSCAR CUSTOM COLLECTIONS TAMBÉM
      const customCollections = await mongoDb.collection('custom_collections').find({
        contractAddress: { $exists: true, $ne: null }
      }).toArray();
      
      customCollections.forEach((col: any) => {
        if (col.contractAddress) {
          contracts.add(col.contractAddress.toLowerCase());
        }
      });

      console.log(`📊 Contratos do MongoDB: ${launchpadCollections.length} launchpad + ${customCollections.length} custom = ${launchpadCollections.length + customCollections.length} total`);
    } catch (error) {
      console.error('⚠️ Erro ao buscar contratos do MongoDB:', error);
    }
  }
  
  // 3. Contratos detectados automaticamente do marketplace
  const detectedContracts = await DynamicContractRegistry.getAllDetectedContracts();
  detectedContracts.forEach(addr => contracts.add(addr));
  
  const allContracts = Array.from(contracts);
  console.log(`📋 Total de contratos suportados (unificado): ${allContracts.length}`);
  
  return allContracts;
}

/**
 * Verifica se QUALQUER contrato é válido (não precisa estar pré-registrado)
 */
export function isAnyContractValid(contractAddress: string): boolean {
  // Aceita qualquer endereço de contrato válido (42 caracteres, começa com 0x)
  if (!contractAddress || 
      !contractAddress.startsWith('0x') || 
      contractAddress.length !== 42) {
    return false;
  }
  
  // Verifica se é um endereço hexadecimal válido
  const hexRegex = /^0x[a-fA-F0-9]{40}$/;
  return hexRegex.test(contractAddress);
}