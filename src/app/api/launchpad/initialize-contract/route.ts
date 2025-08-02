import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !LAUNCHPAD_CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    console.log('🎯 Initializing OpenEditionERC721 contract...');
    console.log('📄 Contract:', LAUNCHPAD_CONTRACT_ADDRESS);

    // Create Thirdweb client with secret key
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });

    // Get contract
    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });

    // Prepare initialize transaction
    const transaction = prepareContractCall({
      contract,
      method: "function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] memory _trustedForwarders, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps, uint128 _platformFeeBps, address _platformFeeRecipient) external",
      params: [
        BACKEND_WALLET_ADDRESS, // defaultAdmin
        "AI Sports NFT Collection", // name
        "AISNFT", // symbol
        "https://gateway.pinata.cloud/ipfs/bafkreibddya7q52tbbzixqpktpq3l7yjzvrzqrb6gayl6p2gmyysxcit5u", // contractURI
        [], // trustedForwarders (empty array)
        BACKEND_WALLET_ADDRESS, // primarySaleRecipient
        BACKEND_WALLET_ADDRESS, // royaltyRecipient
        BigInt(1000), // royaltyBps (10%)
        BigInt(250), // platformFeeBps (2.5%)
        BACKEND_WALLET_ADDRESS // platformFeeRecipient
      ]
    });

    console.log('✅ Initialize transaction prepared');

    // Send transaction
    const result = await sendTransaction({
      transaction,
      account: { address: BACKEND_WALLET_ADDRESS },
    });
    
    console.log(`✅ Contract initialized successfully! Transaction: ${result.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      contractAddress: LAUNCHPAD_CONTRACT_ADDRESS,
      message: 'Contract initialized successfully'
    });

  } catch (error: any) {
    console.error('❌ Error initializing contract:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initialize contract' 
    }, { status: 500 });
  }
} 