# Endpoint: /api/marketplace/nft-collection/price-history

## Objetivo
Retornar o histórico de vendas (preço ao longo do tempo) de uma coleção específica, para alimentar o gráfico de price history no frontend.

## Dados retornados
- **history:** Array de objetos `{ date, price }`
  - `date`: data da venda (ex: `2024-06-01`)
  - `price`: valor da venda (em CHZ, ETH, etc.)

## Parâmetros
- `collection` (string): nome da coleção (ex: jerseys, stadiums, badges)
- (Opcional) `tokenId` para histórico de uma NFT específica

## Origem dos dados
- Coleção `sales` no MongoDB, filtrando por `collection` (e opcionalmente por `tokenId`)
- Ordenar por data crescente

## Exemplo de resposta
```json
{
  "history": [
    { "date": "2024-06-01", "price": 0.5 },
    { "date": "2024-06-02", "price": 0.7 }
  ]
}
```

## Passos para implementação
1. Criar arquivo do endpoint `/api/marketplace/nft-collection/price-history/route.ts`
2. Buscar vendas reais no MongoDB, filtrando por coleção (e tokenId se informado)
3. Retornar array de histórico ordenado por data

---

_Todos os dados devem ser reais, nunca mocks. Se não houver dados, retornar array vazio._ 