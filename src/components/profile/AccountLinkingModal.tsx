import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User, Phone, Apple, Facebook } from 'lucide-react';
import { useAccountLinking, type AuthProvider } from '@/hooks/useAccountLinking';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountLinked: () => void;
}

const providerConfig = {
  google: {
    label: 'Google',
    icon: Mail,
    description: 'Link your Google account',
    color: 'text-red-400',
  },
  discord: {
    label: 'Discord',
    icon: User,
    description: 'Link your Discord account',
    color: 'text-blue-400',
  },
  email: {
    label: 'Email',
    icon: Mail,
    description: 'Link with email address',
    color: 'text-gray-400',
  },
  apple: {
    label: 'Apple',
    icon: Apple,
    description: 'Link your Apple ID',
    color: 'text-gray-400',
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    description: 'Link your Facebook account',
    color: 'text-blue-600',
  },
  x: {
    label: 'X (Twitter)',
    icon: User,
    description: 'Link your X account',
    color: 'text-gray-400',
  },
};

export function AccountLinkingModal({ isOpen, onClose, onAccountLinked }: AccountLinkingModalProps) {
  const { linkAccount, isLinking, linkingError, clearError } = useAccountLinking();
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);

  const handleLinkAccount = async (provider: AuthProvider) => {
    setSelectedProvider(provider);
    const success = await linkAccount(provider);
    
    if (success) {
      onAccountLinked();
      onClose();
    }
    
    setSelectedProvider(null);
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#14101e] border-gray-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Link Additional Account</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect additional accounts to enhance your profile and security.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {linkingError && (
            <Alert className="border-red-500/20 bg-red-500/10">
              <AlertDescription className="text-red-400">
                {linkingError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {Object.entries(providerConfig).map(([provider, config]) => {
              const IconComponent = config.icon;
              const isCurrentlyLinking = isLinking && selectedProvider === provider;
              
              return (
                <Button
                  key={provider}
                  variant="outline"
                  className="w-full justify-start space-x-3 border-gray-600 text-white hover:bg-gray-700/50 transition-all"
                  onClick={() => handleLinkAccount(provider as AuthProvider)}
                  disabled={isLinking}
                >
                  {isCurrentlyLinking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <IconComponent className={`h-5 w-5 ${config.color}`} />
                  )}
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{config.label}</p>
                    <p className="text-gray-400 text-xs">{config.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-600"
              onClick={handleClose}
              disabled={isLinking}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-[#A20131] hover:bg-[#8a0129]"
              onClick={handleClose}
              disabled={isLinking}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 