export interface Dalle3Request {
  prompt: string;
  quality?: "standard" | "hd";
}

export interface Dalle3Response {
  success: boolean;
  image_base64?: string;
  cost_usd?: number;
  error?: string;
} 