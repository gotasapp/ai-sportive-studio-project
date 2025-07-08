import { AccountProvider, AccountName as ThirdwebAccountName } from "thirdweb/react";
import { client } from '@/lib/ThirdwebProvider';
import { useActiveAccount } from 'thirdweb/react';

interface AccountNameProps {
  address?: string;
  className?: string;
  fallbackToAddress?: boolean;
  loadingText?: string;
  formatFn?: (name: string) => string;
}

function AccountAddress({ address, className }: { address?: string; className?: string }) {
  if (!address) return <span className={className}>Unknown</span>;
  
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return <span className={className}>{shortAddress}</span>;
}

export function AccountName({ 
  address, 
  className, 
  fallbackToAddress = true,
  loadingText = "Loading...",
  formatFn 
}: AccountNameProps) {
  const account = useActiveAccount();
  const walletAddress = address || account?.address;

  if (!walletAddress) {
    return <span className={className}>Not Connected</span>;
  }

  const LoadingComponent = () => (
    <span className={className}>{loadingText}</span>
  );

  const FallbackComponent = fallbackToAddress ? () => (
    <AccountAddress address={walletAddress} className={className} />
  ) : undefined;

  return (
    <AccountProvider address={walletAddress} client={client}>
      <ThirdwebAccountName
        className={className}
        loadingComponent={<LoadingComponent />}
        fallbackComponent={FallbackComponent ? <FallbackComponent /> : undefined}
        formatFn={formatFn}
      />
    </AccountProvider>
  );
}

// Component for just the address (utility)
export { AccountAddress }; 