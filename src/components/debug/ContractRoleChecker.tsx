import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createThirdwebClient, getContract, readContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { useActiveAccount } from 'thirdweb/react';
import { ExternalLink, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

// Thirdweb role constants
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

export function ContractRoleChecker() {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [granting, setGranting] = useState(false);

  const contract = getContract({
    client,
    chain: polygonAmoy,
    address: NFT_CONTRACT_ADDRESS,
  });

  const checkRoles = async () => {
    if (!account?.address) return;
    
    setLoading(true);
    try {
      console.log('🔍 Checking roles for address:', account.address);
      
      // Check if user has DEFAULT_ADMIN_ROLE
      const hasAdminRole = await readContract({
        contract,
        method: "function hasRole(bytes32 role, address account) view returns (bool)",
        params: [DEFAULT_ADMIN_ROLE, account.address]
      });

      // Check if user has MINTER_ROLE
      const hasMinterRole = await readContract({
        contract,
        method: "function hasRole(bytes32 role, address account) view returns (bool)",
        params: [MINTER_ROLE, account.address]
      });

      // Get contract owner
      let contractOwner = null;
      try {
        contractOwner = await readContract({
          contract,
          method: "function owner() view returns (address)",
          params: []
        });
      } catch (error) {
        console.log('ℹ️ No owner() function - checking DEFAULT_ADMIN_ROLE members');
      }

      // Check total supply for reference
      const totalSupply = await readContract({
        contract,
        method: "function totalSupply() view returns (uint256)",
        params: []
      });

      setResults({
        userAddress: account.address,
        hasAdminRole,
        hasMinterRole,
        contractOwner,
        totalSupply: totalSupply.toString(),
        canGrantRoles: hasAdminRole
      });

    } catch (error) {
      console.error('❌ Error checking roles:', error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const grantMinterRole = async () => {
    if (!account?.address || !results?.hasAdminRole) return;
    
    setGranting(true);
    try {
      console.log('🎯 Granting MINTER_ROLE to:', account.address);
      
      const transaction = prepareContractCall({
        contract,
        method: "function grantRole(bytes32 role, address account)",
        params: [MINTER_ROLE, account.address]
      });

      const result = await sendTransaction({
        transaction,
        account
      });

      console.log('✅ MINTER_ROLE granted:', result);
      
      // Recheck roles after granting
      setTimeout(() => {
        checkRoles();
      }, 2000);

    } catch (error) {
      console.error('❌ Error granting role:', error);
    } finally {
      setGranting(false);
    }
  };

  useEffect(() => {
    if (account?.address) {
      checkRoles();
    }
  }, [account?.address]);

  if (!account?.address) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contract Role Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to check contract roles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Contract Role Checker
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Contract: {NFT_CONTRACT_ADDRESS}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkRoles} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Checking...' : 'Check Roles'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href={`https://amoy.polygonscan.com/address/${NFT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              View Contract <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>

        {results && !results.error && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Your Address</div>
                <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {results.userAddress}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Total Supply</div>
                <Badge variant="secondary">
                  {results.totalSupply} NFTs
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Role Permissions</div>
              
              <div className="flex items-center gap-2">
                {results.hasAdminRole ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  DEFAULT_ADMIN_ROLE: {results.hasAdminRole ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {results.hasMinterRole ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  MINTER_ROLE: {results.hasMinterRole ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {results.contractOwner && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Contract Owner</div>
                <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {results.contractOwner}
                </div>
              </div>
            )}

            {/* Grant MINTER_ROLE button */}
            {results.hasAdminRole && !results.hasMinterRole && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div>You have admin rights but not MINTER_ROLE. You can grant yourself minting permissions.</div>
                  <Button 
                    onClick={grantMinterRole}
                    disabled={granting}
                    size="sm"
                    variant="destructive"
                  >
                    {granting ? 'Granting...' : 'Grant MINTER_ROLE to Myself'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {!results.hasAdminRole && !results.hasMinterRole && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issue Found:</strong> You don't have MINTER_ROLE permissions. 
                  Contact the contract owner to grant you MINTER_ROLE, or deploy a new contract where you are the owner.
                </AlertDescription>
              </Alert>
            )}

            {results.hasMinterRole && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>All Good!</strong> You have MINTER_ROLE permissions. Minting should work properly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {results?.error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {results.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 