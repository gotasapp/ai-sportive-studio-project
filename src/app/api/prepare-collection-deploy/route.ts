import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { amoy } from 'thirdweb/chains';
import { prepareDeploy } from "thirdweb/deploys";
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
        privateKey: process.env.NEXT_PUBLIC_BACKEND_WALLET_PRIVATE_KEY!,
    });

    const metadata = {
      name,
      description,
      image: "https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle", // placeholder
    };

    const metadataUri = await upload({ client, files: [metadata] });

    const transaction = prepareDeploy({
        client,
        chain: amoy,
        contractMetadata: {
            ...metadata,
            symbol,
            primary_sale_recipient: recipient,
            royalty_recipient: recipient,
            royalty_bps: 500,
        },
        contractType: "DropERC721",
        constructorParams: [
            account.address, // defaultAdmin
            name, // name
            symbol, // symbol
            metadataUri, // contractURI
            [], // trustedForwarders
            recipient, // saleRecipient
            recipient, // royaltyRecipient
            1000, // royaltyBps
        ],
    });

    // Return the transaction data to the frontend to be signed by the user
    return NextResponse.json({
      success: true,
      transaction: {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value?.toString() ?? "0",
      },
      message: `Deploy transaction prepared for ${name}`,
    });

  } catch (error: any) {
    console.error('❌ Deploy preparation failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Deploy preparation failed',
    }, { status: 500 });
  }
}
