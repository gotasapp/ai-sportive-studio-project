import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tag, AlertTriangle } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuctionData } from '@/hooks/useAuctionData';
import BuyNowButton from './BuyNowButton';
import MakeOfferButton from './MakeOfferButton';
import { CreateListingModal } from './CreateListingModal';
import { UpdateListingModal } from './UpdateListingModal';
import { CancelListingButton } from './CancelListingButton';
import AuctionBidButton from './AuctionBidButton';
import { CreateAuctionModal } from './CreateAuctionModal';
import { CancelAuctionButton } from './CancelAuctionButton';
import { CollectAuctionPayoutButton } from './CollectAuctionPayoutButton';
import { CollectAuctionTokensButton } from './CollectAuctionTokensButton';
import { isValidPrice } from '@/lib/marketplace-config';

export interface MarketplaceActionButtonsProps {
  name: string;
  price: string;
  tokenId?: string;
  assetContract?: string;
  listingId?: string;
  isListed?: boolean;
  owner?: string;
  isAuction?: boolean;
  auctionId?: string;
  currentBid?: string;
  endTime?: Date;
  activeOffers?: number;
  imageUrl?: string;
  category?: string;
}

export default function MarketplaceActionButtons(props: MarketplaceActionButtonsProps) {
  const {
    name, price, tokenId = '1', assetContract = '', listingId, isListed = false, owner,
    isAuction = false, auctionId, currentBid, endTime, activeOffers = 0, imageUrl, category
  } = props;
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showUpdateListing, setShowUpdateListing] = useState(false);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const account = useActiveAccount();
  const isOwner = account?.address?.toLowerCase() === owner?.toLowerCase();
  const auctionData = useAuctionData({
    auctionId,
    isAuction,
    initialBid: currentBid || '1 MATIC',
    refreshInterval: 30
  });
  const displayCurrentBid = isAuction 
    ? (auctionData.hasValidBid ? auctionData.currentBid : currentBid)
    : currentBid;
  const isPriceValid = price !== 'Not for sale' && price !== 'N/A' ? isValidPrice(price) : true;
  const safePrice = price !== 'Not for sale' && price !== 'N/A' && !isPriceValid ? 'Invalid price' : price;
  const handleListButtonClick = () => {
    if (!assetContract) return;
    setShowCreateListing(true);
  };
  // Renderização dos botões (idêntica ao desktop, mas classes mobile-friendly)
  if (isListed && listingId) {
    if (isOwner) {
      return <>
        <Button onClick={() => setShowUpdateListing(true)} className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white h-10 text-sm">
          <Tag className="mr-2 h-4 w-4" />Update Price
        </Button>
        <CancelListingButton listingId={listingId} price={price} nftName={name} tokenId={tokenId} className="w-full h-10 text-sm" variant="outline" />
        {showUpdateListing && listingId && (
          <UpdateListingModal isOpen={showUpdateListing} onOpenChange={setShowUpdateListing} listingId={listingId} currentPrice={price} nftName={name} tokenId={tokenId} />
        )}
      </>;
    } else {
      return <>
        {isPriceValid ? (
          <BuyNowButton listingId={listingId} price={price} className="w-full h-10 text-sm" />
        ) : (
          <Button disabled className="w-full bg-red-500/20 text-red-400 cursor-not-allowed h-10 text-sm" title="Cannot purchase due to invalid price">
            <AlertTriangle className="mr-2 h-4 w-4" />Invalid Price
          </Button>
        )}
        {assetContract && <MakeOfferButton assetContract={assetContract} tokenId={tokenId} nftName={name} className="w-full h-10 text-sm" />}
      </>;
    }
  } else if (isAuction && auctionId) {
    const isAuctionEnded = endTime ? new Date() > endTime : false;
    if (isOwner) {
      return <>
        {!isAuctionEnded ? (
          <CancelAuctionButton auctionId={auctionId} nftName={name} className="w-full h-10 text-sm" variant="outline" />
        ) : (
          <CollectAuctionPayoutButton auctionId={auctionId} nftName={name} className="w-full h-10 text-sm" variant="default" />
        )}
      </>;
    } else {
      return <>
        {!isAuctionEnded ? (
          <AuctionBidButton auctionId={auctionId} currentBid={displayCurrentBid || '0 MATIC'} minimumBid={currentBid || '0'} endTime={endTime || new Date()} currency="MATIC" className="w-full h-10 text-sm" onBidSuccess={() => auctionData.refetch()} />
        ) : (
          <CollectAuctionTokensButton auctionId={auctionId} nftName={name} className="w-full h-10 text-sm" variant="default" />
        )}
        {assetContract && <MakeOfferButton assetContract={assetContract} tokenId={tokenId} nftName={name} className="w-full h-10 text-sm" />}
      </>;
    }
  } else {
    return <>
      {isOwner ? <>
        <Button onClick={handleListButtonClick} className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white h-10 text-sm">
          <Tag className="mr-2 h-4 w-4" />List for Sale
        </Button>
        <Button onClick={() => setShowCreateAuction(true)} variant="outline" className="w-full border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white h-10 text-sm">
          🏆 Create Auction
        </Button>
        {showCreateListing && assetContract && (
          <CreateListingModal isOpen={showCreateListing} onOpenChange={setShowCreateListing} nft={{ assetContractAddress: assetContract, tokenId, name, imageUrl }} />
        )}
        {showCreateAuction && assetContract && (
          <CreateAuctionModal isOpen={showCreateAuction} onOpenChange={setShowCreateAuction} nft={{ assetContractAddress: assetContract, tokenId, name, imageUrl: imageUrl || "" }} />
        )}
      </> : <MakeOfferButton assetContract={assetContract} tokenId={tokenId} nftName={name} className="w-full h-10 text-sm" />}
    </>;
  }
} 