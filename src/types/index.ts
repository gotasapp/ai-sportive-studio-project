export interface ImageGenerationRequest {
  model_id: string; // Ex: "corinthians_2022"
  team?: string; // Opcional para manter compatibilidade
  player_name: string;
  player_number: string;
  style?: string; // Para manter compatibilidade
  quality?: "standard" | "hd";
}

export interface Dalle3Response {
  success: boolean;
  image_base64?: string;
  image_url?: string; // Para compatibilidade
  cost?: number; // Para compatibilidade
  cost_usd?: number;
  error?: string;
}

export interface StadiumGenerationRequest {
  stadium_id?: string;
  reference_type?: string;
  generation_style?: string;
  perspective?: string;
  atmosphere?: string;
  time_of_day?: string;
  weather?: string;
  quality?: string;
  custom_prompt?: string;
  custom_reference_base64?: string;
  // Para compatibilidade com código existente
  reference_image_base64?: string;
  prompt?: string;
}

export interface StadiumResponse {
  success: boolean;
  analysis?: any;
  generated_image_base64?: string;
  reference_used?: string;
  reference_source?: string;
  error?: string;
  cost_usd?: number;
  prompt_used?: string;
}

export interface MarketplaceNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  imageUrl?: string; // For backward compatibility
  price: string;
  currency: string;
  owner: string;
  creator: string;
  category: string;
  type: string;
  attributes: any[];
  isListed: boolean;
  isVerified: boolean;
  blockchain: any;
  marketplace?: any;
  contractAddress: string;
  createdAt?: string;
  updatedAt?: string;
  listingId?: string;
  auctionId?: string;
  isAuction?: boolean;
  currentBid?: string;
  endTime?: Date;
  activeOffers?: number;
}

// 🎯 NOVAS INTERFACES PARA SISTEMA DE COLECIONABILIDADE

// Status específicos para Launchpad
export type LaunchpadStatus = 'draft' | 'pending_launchpad' | 'upcoming' | 'active' | 'hidden' | 'ended' | 'rejected';

// Status específicos para Marketplace
export type MarketplaceStatus = 'draft' | 'active' | 'hidden';

// Interface base para todas as coleções
export interface Collection {
  _id?: string;
  name: string;
  description: string;
  image: string;
  bannerImage?: string;
  category: 'jerseys' | 'stadiums' | 'badges';
  
  // 🎯 CAMPOS CRÍTICOS PARA SEPARAÇÃO DE FLUXOS
  type: 'marketplace' | 'launchpad'; // Determina o fluxo
  status: LaunchpadStatus | MarketplaceStatus;
  
  // 📅 DATAS DE CONTROLE
  launchDate?: Date; // Data/hora de lançamento no Launchpad
  endDate?: Date; // Data de término do mint
  approvedAt?: Date; // Quando foi aprovada
  approvedBy?: string; // Quem aprovou
  
  // 📊 SUPPLY E MINTING
  totalSupply: number;
  minted: number;
  price: string; // "50 CHZ"
  
  // 👤 CRIADOR
  creator: {
    wallet: string;
    name: string;
    avatar?: string;
  };
  
  // ⛓️ BLOCKCHAIN
  contractAddress?: string;
  
  // 🏪 MARKETPLACE FLAGS (apenas para coleções que migram)
  marketplaceEnabled: boolean; // Se aparece no marketplace após mint
  marketplaceListedAt?: Date; // Quando foi listada no marketplace
  
  // 📊 MINT STAGES (para launchpad)
  mintStages?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    walletLimit: number;
    status: 'upcoming' | 'live' | 'ended';
    startTime: Date;
    endTime: Date;
  }>;
  
  // 🔗 LINKS SOCIAIS
  website?: string;
  twitter?: string;
  discord?: string;
  
  // 📝 CONTEÚDO
  vision?: string;
  utility?: string[];
  team?: Array<{
    name: string;
    role: string;
    avatar: string;
    bio: string;
  }>;
  roadmap?: Array<{
    phase: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
  }>;
  
  // ⏰ TIMESTAMPS
  createdAt: Date;
  updatedAt: Date;
}

// Interface específica para coleções do Launchpad
export interface LaunchpadCollection extends Collection {
  type: 'launchpad';
  status: LaunchpadStatus;
}

// Interface específica para coleções do Marketplace
export interface MarketplaceCollection extends Collection {
  type: 'marketplace';
  status: MarketplaceStatus;
}

// Interface para criação de nova coleção
export interface CreateCollectionRequest {
  name: string;
  description: string;
  image: string;
  bannerImage?: string;
  category: 'jerseys' | 'stadiums' | 'badges';
  type: 'marketplace' | 'launchpad';
  totalSupply: number;
  price: string;
  creator: {
    wallet: string;
    name: string;
    avatar?: string;
  };
  contractAddress?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  vision?: string;
  utility?: string[];
  team?: Array<{
    name: string;
    role: string;
    avatar: string;
    bio: string;
  }>;
  roadmap?: Array<{
    phase: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
  }>;
}

// Interface para atualização de coleção
export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  status?: LaunchpadStatus | MarketplaceStatus;
  type?: string;
  launchDate?: Date;
  endDate?: Date;
  price?: string;
  marketplaceEnabled?: boolean;
  mintStages?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    walletLimit: number;
    status: 'upcoming' | 'live' | 'ended';
    startTime: Date;
    endTime: Date;
  }>;
  website?: string;
  twitter?: string;
  discord?: string;
  vision?: string;
  utility?: string[];
  team?: Array<{
    name: string;
    role: string;
    avatar: string;
    bio: string;
  }>;
  roadmap?: Array<{
    phase: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
  }>;
} 