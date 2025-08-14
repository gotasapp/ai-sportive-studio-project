import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

const amoy = defineChain({
	id: 80002,
	rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
});

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
	try {
		if ((!THIRDWEB_SECRET_KEY && !ENGINE_ACCESS_TOKEN) || !BACKEND_WALLET_ADDRESS) {
			const missing = [
				(!THIRDWEB_SECRET_KEY && !ENGINE_ACCESS_TOKEN) && 'THIRDWEB_SECRET_KEY or ENGINE_ACCESS_TOKEN',
				!BACKEND_WALLET_ADDRESS && 'BACKEND_WALLET_ADDRESS',
			].filter(Boolean).join(', ');
			return NextResponse.json({ success: false, error: `Missing env vars: ${missing}` }, { status: 500 });
		}

		const body = await request.json();
		const to: string | undefined = body?.to;
		const contractAddress: string | undefined = body?.contractAddress;
		const metadataUri: string | undefined = body?.metadataUri;
		const quantity: number = typeof body?.quantity === 'number' && body.quantity > 0 ? body.quantity : 1;

		if (!to || !contractAddress || !metadataUri) {
			return NextResponse.json({ success: false, error: 'Required: to, contractAddress, metadataUri' }, { status: 400 });
		}

		const client = createThirdwebClient({ secretKey: ENGINE_ACCESS_TOKEN || THIRDWEB_SECRET_KEY || '' });
		const contract = getContract({ client, chain: amoy, address: contractAddress });

		// Load metadata JSON
		let metadata: any;
		try {
			const res = await fetch(metadataUri);
			if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
			metadata = await res.json();
		} catch (e: any) {
			return NextResponse.json({ success: false, error: e?.message || 'Failed to load metadata' }, { status: 500 });
		}

		const serverWallet = Engine.serverWallet({
			address: BACKEND_WALLET_ADDRESS,
			client,
			vaultAccessToken: ENGINE_ACCESS_TOKEN || THIRDWEB_SECRET_KEY || '',
		});

		// Use mintTo to bypass claim conditions (admin gasless mint)
		const tx = {
			...require('thirdweb/extensions/erc721').mintTo({
				contract,
				to,
				nft: {
					name: metadata?.name || 'Launchpad NFT',
					description: metadata?.description || '',
					image: metadata?.image,
					attributes: metadata?.attributes || [],
				},
			}),
		};

		const { transactionId } = await serverWallet.enqueueTransaction({ transaction: tx });

		return NextResponse.json({ success: true, queueId: transactionId, to, contractAddress, quantity });
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || 'Unhandled error' }, { status: 500 });
	}
}


