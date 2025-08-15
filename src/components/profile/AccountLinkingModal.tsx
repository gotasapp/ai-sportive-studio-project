import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User } from 'lucide-react';
import { useAccountLinking, type AuthProvider } from '@/hooks/useAccountLinking';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountLinked: () => void;
}

const providerConfig = {
  email: {
    label: 'Email',
    icon: Mail,
    description: 'Link with email address',
    color: 'text-gray-400',
  },
  discord: {
    label: 'Discord',
    icon: User,
    description: 'Link your Discord account',
    color: 'text-indigo-400',
  },
  x: {
    label: 'X (Twitter)',
    icon: User,
    description: 'Link your X account',
    color: 'text-gray-400',
  },
};

export function AccountLinkingModal({ isOpen, onClose, onAccountLinked }: AccountLinkingModalProps) {
  const { 
    sendEmailVerification, 
    verifyEmailCode, 
    linkSocialAccount, 
    isLinking, 
    linkingError, 
    pendingEmail,
    clearError 
  } = useAccountLinking();
  
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'select' | 'email-input' | 'email-verify'>('select');

  const handleSocialLink = async (provider: 'discord' | 'x') => {
    setSelectedProvider(provider);
    const success = await linkSocialAccount(provider);
    
    if (success) {
      onAccountLinked();
      onClose();
    }
    
    setSelectedProvider(null);
  };

  const handleEmailStart = () => {
    setSelectedProvider('email');
    setStep('email-input');
  };

  const handleSendVerification = async () => {
    if (!email) return;
    
    const result = await sendEmailVerification(email);
    if (result === 'verification_sent') {
      setStep('email-verify');
    }
  };

  const handleVerifyCode = async () => {
    if (!email || !verificationCode) return;
    
    const success = await verifyEmailCode(email, verificationCode);
    if (success) {
      onAccountLinked();
      onClose();
    }
  };

  const handleClose = () => {
    clearError();
    setStep('select');
    setEmail('');
    setVerificationCode('');
    setSelectedProvider(null);
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'select':
  return (
          <>
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
                {/* Email Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-3 border-gray-600 text-white hover:bg-gray-700/50 transition-all"
                  onClick={handleEmailStart}
                  disabled={isLinking}
                >
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">Email</p>
                    <p className="text-gray-400 text-xs">Link with email address</p>
                  </div>
                </Button>

                {/* Discord Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-3 border-gray-600 text-white hover:bg-gray-700/50 transition-all"
                  onClick={() => handleSocialLink('discord')}
                  disabled={isLinking}
                >
                  {isLinking && selectedProvider === 'discord' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <User className="h-5 w-5 text-indigo-400" />
                  )}
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">Discord</p>
                    <p className="text-gray-400 text-xs">Link your Discord account</p>
                  </div>
                </Button>

                {/* Twitter/X Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start space-x-3 border-gray-600 text-white hover:bg-gray-700/50 transition-all"
                  onClick={() => handleSocialLink('x')}
                  disabled={isLinking}
                >
                  {isLinking && selectedProvider === 'x' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">X (Twitter)</p>
                    <p className="text-gray-400 text-xs">Link your X account</p>
                  </div>
                </Button>
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
              </div>
            </div>
          </>
        );

      case 'email-input':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Link Email Account</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your email address to receive a verification code.
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

              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#1a1625] border-gray-600 text-white"
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-600"
                  onClick={() => setStep('select')}
                  disabled={isLinking}
                >
                  Back
                </Button>
            <Button 
              className="flex-1 bg-[#FF0052] hover:bg-[#8a0129]"
                  onClick={handleSendVerification}
                  disabled={isLinking || !email}
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send Code'
                  )}
                </Button>
              </div>
            </div>
          </>
        );

      case 'email-verify':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Verify Email</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the verification code sent to {pendingEmail || email}.
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

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="bg-[#1a1625] border-gray-600 text-white"
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-600"
                  onClick={() => setStep('email-input')}
              disabled={isLinking}
            >
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-[#FF0052] hover:bg-[#8a0129]"
                  onClick={handleVerifyCode}
                  disabled={isLinking || !verificationCode}
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify & Link'
                  )}
            </Button>
          </div>
        </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#14101e] border-gray-600 text-white max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
} 