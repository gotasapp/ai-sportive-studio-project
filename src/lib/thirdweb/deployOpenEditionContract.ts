import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";

export async function deployOpenEditionContract({
  name,
  symbol,
  image,
  description,
  primarySaleRecipient,
  platformFeeRecipient,
  royaltyRecipient,
  chainId = 80002, // Amoy testnet
}: {
  name: string;
  symbol: string;
  image: string;
  description: string;
  primarySaleRecipient: string;
  platformFeeRecipient: string;
  royaltyRecipient: string;
  chainId?: number;
}): Promise<string | null> {
  try {
    console.log('🚀 Iniciando deploy do contrato OpenEditionERC721...');
    
    // Create Thirdweb SDK instance
    const sdk = new ThirdwebSDK("amoy", {
      secretKey: process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY,
    });

    // 1. Deploy OpenEditionERC721 contract
    const contract = await sdk.deployer.deployBuiltInContract("open-edition", {
      name,
      symbol,
      primary_sale_recipient: primarySaleRecipient,
      platform_fee_recipient: platformFeeRecipient,
      platform_fee_basis_points: 0,
    });

    const contractAddress = await contract.getAddress();
    console.log('✅ Contrato deployado:', contractAddress);

    // 2. Update contract metadata
    await contract.metadata.update({
      name,
      description,
      image,
    });

    // 3. Configure basic claim conditions
    await contract.erc721.claimConditions.set([{
      startTime: new Date(),
      price: "0.1",
      currencyAddress: NATIVE_TOKEN_ADDRESS,
      quantityLimitPerWallet: 1,
      maxClaimableSupply: 100,
    }]);

    console.log('✅ Claim conditions básicas configuradas');
    return contractAddress;
    
  } catch (error: any) {
    console.error("❌ Erro ao fazer deploy:", error);
    return null;
  }
} 