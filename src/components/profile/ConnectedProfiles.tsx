import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useThirdwebProfiles } from '@/hooks/useThirdwebProfiles';
import { AccountLinkingModal } from './AccountLinkingModal';
import { Mail, Phone, User, Wallet, Plus, ExternalLink, Trash2 } from 'lucide-react';

const profileTypeIcons = {
  email: Mail,
  phone: Phone,
  google: Mail,
  discord: User,
  apple: User,
  facebook: User,
  wallet: Wallet,
  guest: User,
  passkey: User,
  telegram: User,
  farcaster: User,
  line: User,
  jwt: User,
  auth_endpoint: User,
};

const profileTypeLabels = {
  email: 'Email',
  phone: 'Phone',
  google: 'Google',
  discord: 'Discord',
  apple: 'Apple',
  facebook: 'Facebook',
  wallet: 'Wallet',
  guest: 'Guest',
  passkey: 'Passkey',
  telegram: 'Telegram',
  farcaster: 'Farcaster',
  line: 'Line',
  jwt: 'JWT',
  auth_endpoint: 'Auth Endpoint',
};

export function ConnectedProfiles() {
  const { profiles, loading, error, totalProfiles, refetch } = useThirdwebProfiles();
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

  const handleAccountLinked = () => {
    // Reload profiles after linking
    if (refetch) {
      refetch();
    }
  };

  if (loading) {
    return (
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-white">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-white">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-sm">Failed to load connected accounts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cyber-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Connected Accounts</CardTitle>
        <Badge variant="secondary" className="bg-[#FF0052] text-white">
          {totalProfiles} connected
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {profiles.length === 0 ? (
          <div className="text-center py-6">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">No connected accounts found</p>
            <Button 
              variant="outline" 
              size="sm"
              className="cyber-button"
              onClick={() => setIsLinkingModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Link Account
            </Button>
          </div>
        ) : (
          <>
            {profiles.map((profile, index) => {
              const IconComponent = profileTypeIcons[profile.type as keyof typeof profileTypeIcons] || User;
              const label = profileTypeLabels[profile.type as keyof typeof profileTypeLabels] || profile.type;
              
              // Get display value based on profile type
              let displayValue = '';
              if (profile.details.email) {
                displayValue = profile.details.email;
              } else if (profile.details.phone) {
                displayValue = profile.details.phone;
              } else if (profile.details.address) {
                displayValue = `${profile.details.address.slice(0, 6)}...${profile.details.address.slice(-4)}`;
              } else if (profile.details.id) {
                displayValue = profile.details.id.slice(0, 12) + '...';
              } else {
                displayValue = 'Connected';
              }

              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg cyber-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <IconComponent className="h-4 w-4 text-[#FF0052]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-gray-400 text-xs">{displayValue}</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white h-8 w-8 p-0"
                    onClick={() => {
                      // TODO: Implement profile management
                      console.log('Manage profile:', profile);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full cyber-button mt-4"
              onClick={() => setIsLinkingModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Link Additional Account
            </Button>
          </>
        )}
      </CardContent>
      
      <AccountLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        onAccountLinked={handleAccountLinked}
      />
    </Card>
  );
} 