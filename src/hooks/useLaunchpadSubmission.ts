import { useState, useCallback } from 'react';

interface PendingImageData {
  imageUrl: string;
  category: 'jerseys' | 'stadiums' | 'badges';
  metadata: any;
  description?: string;
  price?: string;
  maxSupply?: number;
  creator?: {
    name: string;
    wallet: string;
  };
}

interface PendingImageResponse {
  success: boolean;
  pendingImageId?: string;
  message?: string;
  error?: string;
}

export function useLaunchpadSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Enviar imagem para aprovação do Launchpad
  const submitToLaunchpad = useCallback(async (data: PendingImageData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const response = await fetch('/api/launchpad/pending-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result: PendingImageResponse = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
        return result;
      } else {
        throw new Error(result.error || 'Failed to submit image to launchpad');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSubmitError(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Reset estados
  const resetSubmission = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    submitToLaunchpad,
    isSubmitting,
    submitError,
    submitSuccess,
    resetSubmission
  };
} 