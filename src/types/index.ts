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