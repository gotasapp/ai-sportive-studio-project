/**
 * Serviço IPFS usando Pinata
 */
import { PinataSDK } from "pinata";

// Configuração do Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud"
});

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    created_by: string;
    created_at: string;
    team: string;
    style: string;
  };
}

export class IPFSService {
  /**
   * Upload de imagem para IPFS
   */
  static async uploadImage(imageBlob: Blob, filename: string): Promise<string> {
    try {
      console.log('📤 Uploading image to IPFS...');
      
      // Converter blob para File
      const file = new File([imageBlob], filename, { type: 'image/png' });
      
      // Upload para Pinata
      const upload = await pinata.upload.public.file(file).name(filename).keyvalues({
        type: 'jersey-image',
        uploaded_at: new Date().toISOString()
      });

      const ipfsUrl = `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${upload.cid}`;
      
      console.log('✅ Image uploaded to IPFS:', ipfsUrl);
      return ipfsUrl;
      
    } catch (error) {
      console.error('❌ Error uploading image to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload de metadata JSON para IPFS
   */
  static async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      console.log('📤 Uploading metadata to IPFS...');
      
      // Upload metadata JSON
      const upload = await pinata.upload.public.json(metadata).name(`${metadata.name}-metadata.json`).keyvalues({
        type: 'nft-metadata',
        nft_name: metadata.name,
        uploaded_at: new Date().toISOString()
      });

      const metadataUrl = `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${upload.cid}`;
      
      console.log('✅ Metadata uploaded to IPFS:', metadataUrl);
      return metadataUrl;
      
    } catch (error) {
      console.error('❌ Error uploading metadata to IPFS:', error);
      throw new Error(`Metadata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Criar metadata NFT completa
   */
  static createNFTMetadata(
    name: string,
    description: string,
    imageUrl: string,
    team: string,
    style: string,
    playerName?: string,
    playerNumber?: string
  ): NFTMetadata {
    const attributes = [
      { trait_type: 'Team', value: team },
      { trait_type: 'Style', value: style },
      { trait_type: 'Type', value: 'Jersey' },
      { trait_type: 'Generator', value: 'AI Sports NFT' }
    ];

    // Adicionar atributos do jogador se fornecidos
    if (playerName) {
      attributes.push({ trait_type: 'Player Name', value: playerName });
    }
    if (playerNumber) {
      attributes.push({ trait_type: 'Player Number', value: playerNumber });
    }

    return {
      name,
      description,
      image: imageUrl,
      attributes,
      properties: {
        created_by: 'AI Sports NFT Generator',
        created_at: new Date().toISOString(),
        team,
        style
      }
    };
  }

  /**
   * Upload completo: imagem + metadata
   */
  static async uploadComplete(
    imageBlob: Blob,
    name: string,
    description: string,
    team: string,
    style: string,
    playerName?: string,
    playerNumber?: string
  ): Promise<{ imageUrl: string; metadataUrl: string; metadata: NFTMetadata }> {
    try {
      // 1. Upload da imagem
      const filename = `${team}-${playerName || 'player'}-${playerNumber || '0'}.png`;
      const imageUrl = await this.uploadImage(imageBlob, filename);

      // 2. Criar metadata
      const metadata = this.createNFTMetadata(
        name,
        description,
        imageUrl,
        team,
        style,
        playerName,
        playerNumber
      );

      // 3. Upload da metadata
      const metadataUrl = await this.uploadMetadata(metadata);

      return {
        imageUrl,
        metadataUrl,
        metadata
      };
      
    } catch (error) {
      console.error('❌ Complete upload failed:', error);
      throw error;
    }
  }

  /**
   * Verificar se o serviço IPFS está configurado
   */
  static isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_PINATA_JWT && process.env.NEXT_PUBLIC_PINATA_GATEWAY);
  }
} 