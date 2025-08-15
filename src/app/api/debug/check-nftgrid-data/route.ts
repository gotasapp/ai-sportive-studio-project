import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simular chamada do marketplace para ver que dados chegam no NFTGrid
    const res = await fetch('http://localhost:3000/api/marketplace/nfts');
    const data = await res.json();
    
    // Encontrar coleção Kane 2018
    const kaneCollection = data.data?.find((item: any) => 
      item.name?.includes('Kane') || 
      item.collection?.includes('Kane') ||
      item._id === '689e70b34341ccf79a223460'
    );

    if (!kaneCollection) {
      return NextResponse.json({
        error: 'Kane collection not found in marketplace data',
        totalItems: data.data?.length || 0
      });
    }

    // Simular a lógica do NFTGrid
    const isLaunchpadCollection =
      (kaneCollection.type === 'launchpad' && kaneCollection.status === 'active') ||
      kaneCollection.type === 'launchpad_collection' ||
      kaneCollection.collectionType === 'launchpad' ||
      kaneCollection.marketplace?.isLaunchpadCollection;

    const computedCollectionId =
      kaneCollection.collectionId || kaneCollection.customCollectionId || kaneCollection.collectionData?._id || kaneCollection._id;
    
    const hrefOverride = isLaunchpadCollection && kaneCollection.status === 'active' && computedCollectionId
      ? `/marketplace/collection/launchpad/${computedCollectionId}`
      : undefined;

    return NextResponse.json({
      success: true,
      kaneCollection: {
        _id: kaneCollection._id,
        name: kaneCollection.name,
        type: kaneCollection.type,
        status: kaneCollection.status,
        collectionType: kaneCollection.collectionType,
        marketplace: kaneCollection.marketplace,
        isCollection: kaneCollection.isCollection
      },
      detection: {
        isLaunchpadCollection,
        computedCollectionId,
        hrefOverride,
        conditions: {
          typeIsLaunchpad: kaneCollection.type === 'launchpad',
          typeIsLaunchpadCollection: kaneCollection.type === 'launchpad_collection',
          statusIsActive: kaneCollection.status === 'active',
          hasMarketplaceFlag: !!kaneCollection.marketplace?.isLaunchpadCollection
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking NFTGrid data:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check NFTGrid data'
    }, { status: 500 });
  }
}
