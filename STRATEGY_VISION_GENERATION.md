# Estratégia de Geração de Imagens com Vision & Referências do Banco de Dados

Este documento descreve o plano de ação para evoluir o sistema de geração de imagens, unificando a lógica, eliminando código hard-coded e aumentando a qualidade das imagens geradas.

## Visão Geral da Arquitetura Final

O objetivo é transformar a geração "Standard" (sem upload) em um "Vision Flow Interno", onde o sistema utiliza referências (prompts e imagens) armazenadas no MongoDB para criar um prompt de alta fidelidade antes de chamar o DALL-E 3.

## Plano de Implementação em Fases

### Fase 1: Conectar o Backend ao DB e Remover o Hard-Code (Correção Imediata)

**Objetivo:** Fazer a rota `/generate-jersey-from-reference` funcionar de forma estável, buscando os prompts base diretamente da coleção `team_references` no MongoDB. Isso elimina a dependência de prompts fixos no código Python e resolve o fluxo quebrado atual.

**Passos:**
1.  **Dependências:** Verificar se o `pymongo` está instalado no ambiente Python e, se não, instalá-lo.
2.  **Conexão com o DB:** Adicionar a lógica de conexão com o MongoDB no arquivo `api/main_unified.py`, utilizando a variável de ambiente `MONGODB_URI_PROD`.
3.  **Modificar a Rota:** Alterar a implementação da rota `/generate-jersey-from-reference` para que, ao receber um `teamName`:
    *   Conecte-se à coleção `team_references`.
    *   Encontre o documento correspondente ao `teamName`.
    *   Extraia o valor do campo `teamBasePrompt`.
    *   Utilize este prompt para formatar o prompt final enviado ao DALL-E 3.

**Resultado Esperado:** A geração padrão de imagens volta a funcionar, agora de forma dinâmica e escalável, refletindo qualquer alteração feita no painel de administração em tempo real.

---

### Fase 2: Introduzir a Análise Vision (Evolução da Qualidade)

**Objetivo:** Aprimorar a qualidade da geração, adicionando uma etapa de análise visual das imagens de referência armazenadas no banco de dados.

**Passos:**
1.  **Análise de Imagem:** Na rota `/generate-jersey-from-reference`, após buscar o documento do time no DB (da Fase 1):
    *   Pegar a URL da primeira imagem de referência do campo `referenceImages`.
    *   Fazer uma chamada para a API Vision da OpenAI, enviando a URL da imagem para análise.
2.  **Combinação de Prompts:** Implementar uma lógica para combinar os três "ingredientes" de forma inteligente:
    *   O **resultado da análise Vision** (ex: "listras verticais azuis e pretas...").
    *   O **`teamBasePrompt`** do banco de dados (ex: "garantir que o azul seja o tom Pantone 286 C...").
    *   As **informações do usuário** da UI (nome, número, etc.).
3.  **Geração Final:** Enviar este novo "super prompt" combinado para o DALL-E 3.
4.  **(Opcional, mas recomendado):** Implementar um sistema de cache para armazenar os resultados da análise Vision, evitando chamadas repetidas e reduzindo custos e latência.

**Resultado Esperado:** A qualidade e a fidelidade das imagens geradas aumentam drasticamente, capturando nuances visuais que só uma análise de imagem real pode fornecer. 