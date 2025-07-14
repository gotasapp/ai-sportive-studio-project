import { createThirdwebClient, getContract } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { getNFTs, ownerOf } from "thirdweb/extensions/erc721";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = "0xfF973a4aFc5A96DEc81366461A461824c4f80254";

export async function getMintedNFTAndOwner(tokenId: string) {
  const contract = getContract({
    client,
    chain: polygonAmoy,
    address: NFT_CONTRACT_ADDRESS,
  });

  // Buscar todos os NFTs mintados (pode ser otimizado para buscar só um)
  const nfts = await getNFTs({ contract, start: 0, count: 100 });
  const nft = nfts.find(n => n.id.toString() === tokenId);

  let owner = "Unknown";
  if (nft) {
    try {
      owner = await ownerOf({ contract, tokenId: BigInt(tokenId) });
    } catch {}
  }

  return { nft, owner };
} 