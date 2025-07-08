import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { getProfiles } from 'thirdweb/wallets';
import { client } from '@/lib/ThirdwebProvider';

export interface ThirdwebProfile {
  type: string;
  details: {
    address?: string;
    email?: string;
    id?: string;
    phone?: string;
  };
}

export function useThirdwebProfiles() {
  const account = useActiveAccount();
  const [profiles, setProfiles] = useState<ThirdwebProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      if (!account) {
        setProfiles([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userProfiles = await getProfiles({
          client,
        });
        
        setProfiles(userProfiles);
      } catch (err) {
        console.error('Error fetching thirdweb profiles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [account]);

  // Helper functions to get specific profile types
  const getEmailProfile = () => profiles.find(p => p.type === 'email');
  const getPhoneProfile = () => profiles.find(p => p.type === 'phone');
  const getGoogleProfile = () => profiles.find(p => p.type === 'google');
  const getDiscordProfile = () => profiles.find(p => p.type === 'discord');
  const getWalletProfile = () => profiles.find(p => p.type === 'wallet');

  // Get primary contact info
  const primaryEmail = getEmailProfile()?.details.email || getGoogleProfile()?.details.email;
  const primaryPhone = getPhoneProfile()?.details.phone;

  return {
    profiles,
    loading,
    error,
    // Helper getters
    getEmailProfile,
    getPhoneProfile,
    getGoogleProfile,
    getDiscordProfile,
    getWalletProfile,
    // Primary contact info
    primaryEmail,
    primaryPhone,
    // Counts
    totalProfiles: profiles.length,
    hasEmail: !!primaryEmail,
    hasPhone: !!primaryPhone,
  };
} 