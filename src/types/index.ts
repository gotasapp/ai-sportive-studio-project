export interface ImageGenerationRequest {
  model_id: string; // Ex: "corinthians_2022"
  player_name: string;
  player_number: string;
  quality?: "standard" | "hd";
}

export interface Dalle3Response {
  success: boolean;
  image_base64?: string;
  cost_usd?: number;
  error?: string;
} 