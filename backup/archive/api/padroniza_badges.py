from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb+srv://myjeff22vieira:eXTRG3Ox2D6Txh7J@cluster0chz.bjbv0ia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0CHZ")
db = client["chz-app-db"]
badges = db["badges"]

def build_nft_document(existing, nft_type="Badge"):
    now = existing.get("createdAt") or datetime.utcnow()
    name = existing.get("name", "Unknown Badge")
    style = existing.get("style", "standard")
    image_url = existing.get("imageUrl", "")
    cloudinary_url = existing.get("cloudinaryUrl", "")
    token_id = existing.get("tokenId")
    owner = existing.get("ownerAddress", "")
    creator_wallet = existing.get("creatorWallet", owner)
    badge_id = existing.get("badgeId", name)
    prompt_used = existing.get("promptUsed", "")
    generation_type = existing.get("generationType", "vision_reference")
    description = existing.get("description", f"AI-generated {name} badge. Style: {style}.")
    attributes = existing.get("attributes") or [
        {"trait_type": "Team", "value": name},
        {"trait_type": "Style", "value": style},
        {"trait_type": "Type", "value": nft_type},
        {"trait_type": "Generator", "value": "AI Sports NFT"}
    ]
    metadata = {
        "name": name,
        "description": description,
        "image": image_url,
        "attributes": attributes,
        "properties": {
            "created_by": "AI Sports NFT Generator",
            "created_at": now.isoformat(),
            "team": name,
            "style": style
        }
    }
    blockchain = existing.get("blockchain") or {
        "chainId": 80002,
        "network": "Polygon Amoy",
        "contractAddress": "0xfF973a4aFc5A96DEc81366461A461824c4f80254",
        "tokenId": token_id,
        "owner": owner,
        "mintedAt": now,
        "syncedAt": now
    }
    marketplace = existing.get("marketplace") or {
        "isListable": True,
        "canTrade": True,
        "verified": True,
        "isListed": False
    }
    doc = {
        "name": name,
        "description": description,
        "imageUrl": image_url,
        "cloudinaryUrl": cloudinary_url,
        "tokenId": token_id,
        "blockchainTokenId": token_id,
        "status": existing.get("status", "Approved"),
        "isMinted": existing.get("isMinted", False),
        "blockchain": blockchain,
        "metadata": metadata,
        "attributes": attributes,
        "creator": {"wallet": creator_wallet},
        "creatorWallet": creator_wallet,
        "ownerAddress": owner,
        "marketplace": marketplace,
        "promptUsed": prompt_used,
        "style": style,
        "generationType": generation_type,
        "createdAt": now,
        "updatedAt": datetime.utcnow(),
        "syncedFromBlockchain": existing.get("syncedFromBlockchain", False),
        "syncedAt": now,
        "badgeId": badge_id
    }
    return doc

for badge in badges.find({}):
    doc = build_nft_document(badge)
    badges.update_one({"_id": badge["_id"]}, {"$set": doc})

print("Todos os badges foram padronizados com sucesso!")