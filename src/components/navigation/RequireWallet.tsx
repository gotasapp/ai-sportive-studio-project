import { useActiveAccount } from 'thirdweb/react'
import { ReactNode } from 'react'
import { ConnectButton } from 'thirdweb/react'
import { client, supportedChains, wallets } from '@/lib/ThirdwebProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Sparkles } from 'lucide-react'

interface RequireWalletProps {
  children: ReactNode
  message?: string
  title?: string
  feature?: string
}

export function RequireWallet({ 
  children, 
  message = "Connect your wallet to access this feature",
  title = "Wallet Required",
  feature = "this feature"
}: RequireWalletProps) {
  const account = useActiveAccount()

  // If wallet is connected, show the protected content
  if (account) {
    return <>{children}</>
  }

  // If not connected, show beautiful connect prompt
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="bg-[#14101e] border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#FF0052]/20 p-4 rounded-full">
              <Wallet className="h-8 w-8 text-[#FF0052]" />
            </div>
          </div>
          <CardTitle className="text-white text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-400">
            {message}
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>Connect with wallet or social account</span>
            <Sparkles className="h-4 w-4" />
          </div>
          
          <ConnectButton
            client={client}
            wallets={wallets}
            chains={supportedChains}
            theme="dark"
            connectButton={{
              className: "!bg-[#FF0052] hover:!bg-[#8a0129] !text-white !font-medium !px-6 !py-3 !rounded-lg !transition-colors"
            }}
            connectModal={{
              size: "wide",
              title: "Connect to Fan Token Studio",
              titleIcon: "🏆"
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
} 