export interface Dalle3Request {
  team_name: string;
  player_name: string;
  player_number: string;
  quality?: "standard" | "hd";
}

export interface Dalle3Response {
  success: boolean;
  image_base64?: string;
  error?: string;
} 