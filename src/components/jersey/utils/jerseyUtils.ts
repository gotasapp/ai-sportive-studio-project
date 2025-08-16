import { SPORTS_OPTIONS, VIEW_OPTIONS } from '../constants/jerseyConstants';

// Utility functions extracted from original JerseyEditor.tsx

// Get sport-specific labels (from original code)
export const getSportLabel = (selectedSport: string) => {
  const sport = SPORTS_OPTIONS.find(s => s.id === selectedSport)
  return sport ? sport.name : 'Soccer'
}

export const getViewLabel = (selectedView: string) => {
  const view = VIEW_OPTIONS.find(v => v.id === selectedView)
  return view ? view.name : 'Back View'
}

// Image processing utilities
export const convertBase64ToBlob = async (base64: string, contentType: string = 'image/png'): Promise<Blob> => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Validation utilities
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please upload an image file (JPG, PNG, WebP)' };
  }
  
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'Image too large. Please upload an image smaller than 10MB' };
  }
  
  return { isValid: true };
};

// Session storage utilities for analysis
export const saveAnalysisToSession = (analysis: any, sport: string, view: string) => {
  if (analysis) {
    sessionStorage.setItem('chz_vision_analysis', JSON.stringify({
      analysis,
      timestamp: Date.now(),
      sport,
      view,
    }));
  }
};

export const loadAnalysisFromSession = (): any => {
  try {
    const stored = sessionStorage.getItem('chz_vision_analysis');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};