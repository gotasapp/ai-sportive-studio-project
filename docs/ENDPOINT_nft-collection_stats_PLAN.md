# Endpoint: /api/marketplace/nft-collection/stats

## Objetivo
Retornar estatísticas agregadas de uma coleção de NFTs para alimentar a página de detalhe da coleção/NFT.

## Dados retornados
- **totalSupply:** Total de NFTs possíveis na coleção (contrato ou MongoDB)
- **mintedNFTs:** Total de NFTs já mintadas (com tokenId, MongoDB)
- **activity:**
  - **salesVolume:** Volume total de vendas (em CHZ, ETH, etc.)
  - **transactions:** Número de transações/vendas

## Parâmetros
- `collection` (string): nome da coleção (ex: jerseys, stadiums, badges)
- (Opcional) `collectionId` se for necessário identificar por ID

## Origem dos dados
- **totalSupply:** Contrato Thirdweb (preferencial) ou campo correspondente no MongoDB
- **mintedNFTs:** Contagem de NFTs mintadas no MongoDB (status: 'Approved', isMinted: true, etc.)
- **activity:** Buscar vendas/transações na coleção correspondente do MongoDB (ex: coleção sales ou similar)

## Exemplo de resposta
```json
{
  "totalSupply": 100,
  "mintedNFTs": 27,
  "activity": {
    "salesVolume": 12.5,
    "transactions": 8
  }
}
```

## Passos para implementação
1. Receber parâmetro de identificação da coleção
2. Buscar totalSupply (contrato ou MongoDB)
3. Contar NFTs mintadas (MongoDB)
4. Calcular activity (volume de vendas e número de transações, MongoDB)
5. Retornar JSON com os dados

---

_Todos os dados devem ser reais, nunca mocks. Se não houver dados, retornar 0 ou array vazio._ 