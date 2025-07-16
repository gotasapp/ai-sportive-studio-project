# BACKUP - Correções Marketplace NFTs Mintadas + IPFS

## Problema Resolvido
- Marketplace estava mostrando NFTs não mintadas
- Erro IPFS: "hostname not configured under images in next.config.js"
- Erro MongoDB: "connectToDatabase is not exported"

## Resultado Atual
✅ Marketplace mostra APENAS NFTs mintadas
✅ Imagens IPFS funcionam corretamente
✅ Sem erros de importação MongoDB

---

## MUDANÇAS NECESSÁRIAS PARA REAPLICAR:

### 1. **next.config.js** - Adicionar gateways IPFS
```js
// Na seção images.remotePatterns, adicionar:
      // IPFS gateways
      {
        protocol: 'https',
        hostname: '**.ipfs.w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'gateway.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      }
```

### 2. **src/lib/utils.ts** - Adicionar função IPFS
```ts
/**
 * Converts IPFS URLs to HTTP gateway URLs
 * @param src - The IPFS URL or hash
 * @returns HTTP gateway URL
 */
export function convertIpfsToHttp(src: string): string {
  // Se já é uma URL HTTP, retornar como está
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Se é uma URL IPFS, converter para gateway HTTP
  if (src.startsWith('ipfs://')) {
    const ipfsHash = src.replace('ipfs://', '');
    return `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
  }
  
  // Se começa com Qm (hash IPFS), adicionar gateway
  if (src.startsWith('Qm') || src.startsWith('bafy')) {
    return `https://gateway.ipfs.io/ipfs/${src}`;
  }
  
  // Fallback para URLs normais
  return src;
}
```

### 3. **src/components/marketplace/MarketplaceCard.tsx** - Corrigir imagem
```ts
// Adicionar import:
import { convertIpfsToHttp } from '@/lib/utils';

// Corrigir a tag Image (linha ~185):
<Image 
  src={convertIpfsToHttp(imageUrl)} 
  alt={name}
  fill
  style={{ objectFit: 'cover' }}
  className="group-hover:scale-105 transition-transform duration-300"
/>
```

### 4. **src/app/api/marketplace/sync-listings/route.ts** - Corrigir MongoDB
```ts
// Corrigir import:
import clientPromise from '@/lib/mongodb';

// Adicionar constante:
const DB_NAME = 'chz-app-db';

// Corrigir conexão (linha ~43):
const client = await clientPromise;
const db = client.db(DB_NAME);
```

### 5. **src/app/api/marketplace/update-listing/route.ts** - Corrigir MongoDB
```ts
// Corrigir import:
import clientPromise from '@/lib/mongodb';

// Adicionar constante:
const DB_NAME = 'chz-app-db';

// Corrigir conexão (linha ~15):
const client = await clientPromise;
const db = client.db(DB_NAME);
```

### 6. **src/hooks/useMarketplaceData.ts** - MUDANÇA CRUCIAL! Mostrar apenas NFTs mintadas
```ts
// ALTERAR linha ~64-74:
// 2. Buscar APENAS NFTs MINTADOS das APIs (para metadados) com cache bust
const timestamp = Date.now();
const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
  fetch(`/api/jerseys/minted?_t=${timestamp}`),
  fetch(`/api/stadiums/minted?_t=${timestamp}`), 
  fetch(`/api/badges/minted?_t=${timestamp}`)
]);

const jerseysData = await jerseysResponse.json();
const stadiumsData = await stadiumsResponse.json();
const badgesData = await badgesResponse.json();

// Extrair apenas os dados dos NFTs mintados
const jerseys = jerseysData.data || [];
const stadiums = stadiumsData.data || [];
const badges = badgesData.data || [];
```

---

## ARQUIVOS MODIFICADOS:
1. `next.config.js` - Gateways IPFS
2. `src/lib/utils.ts` - Função convertIpfsToHttp
3. `src/components/marketplace/MarketplaceCard.tsx` - IPFS + layout fix
4. `src/app/api/marketplace/sync-listings/route.ts` - MongoDB fix
5. `src/app/api/marketplace/update-listing/route.ts` - MongoDB fix
6. **`src/hooks/useMarketplaceData.ts` - MUDANÇA CRUCIAL! Filtrar apenas NFTs mintadas**

## ARQUIVOS DESNECESSÁRIOS REMOVIDOS:
- `src/lib/ipfs-loader.js` (não estava sendo usado)

---

## COMO REAPLICAR APÓS RESET:
1. Fazer as 5 mudanças acima na ordem
2. Testar se marketplace mostra apenas NFTs mintadas
3. Verificar se imagens IPFS carregam sem erro
4. Confirmar que APIs MongoDB não têm erro de import

**RESULTADO ESPERADO:** Marketplace limpo com apenas NFTs realmente mintadas + imagens IPFS funcionando. 