# Collection/NFT Detail Page – Implementation Plan

## Layout Overview

- **Top Card:**
  - Large collection/NFT image (left)
  - Right side: Action button (Connect Wallet/Buy), stats cards (Total Supply, NFTs, Activity)
- **Below Image:**
  - Price history chart
- **Right Side (below action):**
  - Traits card (attributes)
- **Style:**
  - shadcn components, minimalistic, black/white, accent #A20131 only on selected buttons, no shadows

---

## To-Do List

1. **Plan page structure**  
   Define main containers/components (image, stats, action button, chart, traits) using shadcn and approved layout.  
   _Status: In progress_

2. **Define and document backend endpoints**  
   List/document all endpoints needed to fetch real data (image, stats, traits, price history, activity) from MongoDB/blockchain.

3. **Create page skeleton with shadcn**  
   Build visual structure and placeholders for components as per approved layout.

4. **Integrate real data**  
   Connect frontend to backend endpoints to display real data (image, stats, traits, price history, activity).

5. **Implement action button logic**  
   Show "Connect Wallet" if not connected, or "Buy" if connected.

6. **Adjust responsiveness and minimalistic visual**  
   Ensure responsive layout and black/white minimal look, accent #A20131 only on selected buttons, no shadows.

7. **Test detail page**  
   Test with real data, covering cases with no data, incomplete data, and all data available.

---

_This plan follows the approved layout and project standards. All data must come from MongoDB/blockchain, never mocks._ 