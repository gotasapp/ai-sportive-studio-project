export interface JerseyEditorState {
  // Team and basic settings
  availableTeams: string[];
  selectedTeam: string;
  playerName: string;
  playerNumber: string;
  quality: 'standard' | 'hd';
  selectedStyle: string;
  
  // Generation state
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  apiStatus: boolean;
  generationCost: number | null;
  
  // NFT settings
  royalties: number;
  editionSize: number;
  generatedImageBlob: Blob | null;
  
  // IPFS state
  ipfsUrl: string | null;
  isUploadingToIPFS: boolean;
  ipfsError: string | null;
  
  // Minting state
  isMinting: boolean;
  mintError: string | null;
  mintSuccess: string | null;
  mintedTokenId: string | null;
  mintStatus: 'idle' | 'pending' | 'success' | 'error';
  transactionHash: string | null;
  
  // Save to DB state
  isSaving: boolean;
  saveSuccess: string | null;
  saveError: string | null;
  
  // Vision Analysis state
  isVisionMode: boolean;
  referenceImage: string | null;
  referenceImageBlob: Blob | null;
  customPrompt: string;
  isAnalyzing: boolean;
  analysisResult: any;
  selectedSport: string;
  selectedView: string;
}

export interface VisionAnalysisState {
  isVisionMode: boolean;
  referenceImage: string | null;
  referenceImageBlob: Blob | null;
  customPrompt: string;
  isAnalyzing: boolean;
  analysisResult: any;
  selectedSport: string;
  selectedView: string;
  selectedVisionModel: string;
}

export interface GenerationState {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  apiStatus: boolean;
  generationCost: number | null;
  generatedImageBlob: Blob | null;
}

export interface MintingState {
  isMinting: boolean;
  mintError: string | null;
  mintSuccess: string | null;
  mintedTokenId: string | null;
  mintStatus: 'idle' | 'pending' | 'success' | 'error';
  transactionHash: string | null;
  royalties: number;
  editionSize: number;
}

export interface IPFSState {
  ipfsUrl: string | null;
  isUploadingToIPFS: boolean;
  ipfsError: string | null;
}

export interface SaveState {
  isSaving: boolean;
  saveSuccess: string | null;
  saveError: string | null;
}

