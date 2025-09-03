import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { polygonAmoy } from 'thirdweb/chains';
import { prepareDirectDeployTransaction } from "thirdweb/deploys";
import { upload } from "thirdweb/storage";

export async function POST(request: NextRequest) {
  try {
    const { name, symbol, description, recipient, supply } = await request.json();

    console.log('🚀 Preparing DropERC721 deploy transaction:', { name, symbol, supply });

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });
    
    const account = privateKeyToAccount({
        client,
        privateKey: process.env.BACKEND_WALLET_PRIVATE_KEY!,
    });

    const metadata = {
      name,
      description,
      image: "https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle", // placeholder
    };

    const metadataUri = await upload({ client, files: [metadata] });

    // Prepare deployment transaction for ERC721 contract (to be signed by user)
    const transaction = prepareDirectDeployTransaction({
        client,
        chain: polygonAmoy,
        bytecode: "0x", // This would need actual ERC721 bytecode
        abi: [], // This would need actual ERC721 ABI
        constructorParams: {
            defaultAdmin: account.address,
            name: name,
            symbol: symbol,
            contractURI: metadataUri,
            trustedForwarders: [],
            saleRecipient: recipient,
            royaltyRecipient: recipient,
            royaltyBps: 1000,
        },
    });

    // Return the prepared transaction for the user to sign
    return NextResponse.json({
      success: true,
      transaction: {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value?.toString() ?? "0",
      },
      message: `Deploy transaction prepared for ${name}`,
      metadataUri: metadataUri,
    });

  } catch (error: any) {
    console.error('❌ Deploy preparation failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Deploy preparation failed',
    }, { status: 500 });
  }
}
