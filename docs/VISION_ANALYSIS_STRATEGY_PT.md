# 🔍 Estratégia de Análise Vision - Português

## ✅ Objetivo

Você quer:

- Analisar a imagem com Vision e extrair:
  - Cores exatas
  - Estilo
  - Elementos gráficos e padrões
  - Layout e posição de nome e número
  - Tipo de gola, mangas, etc.

- Montar um prompt de saída com esses detalhes, onde você só troca nome e número para gerar novas versões com DALL·E 3.

## ✅ Prompt de Análise para o modelo Vision

Use este prompt junto com a imagem no recurso Vision (OpenRouter + modelo compatível como GPT-4-V ou Claude):

### 📤 Prompt de Análise:

```
Você é um especialista em design esportivo. Analise esta camisa de futebol com alto nível de detalhe para gerar um prompt técnico que será usado por uma IA de geração de imagens. Responda nos seguintes tópicos:

1. **Cores principais e secundárias** da camisa (incluindo gradientes, tons e contrastes);
2. **Estilo visual** da camisa (moderna, retrô, minimalista, etc.);
3. **Textura e padrões presentes** (ex: padrões gráficos dentro dos números);
4. **Formato e cor da gola e das mangas**;
5. **Estilo e posição do nome e número** (ex: centralizado, fonte, cor, preenchimento interno);
6. **Outros detalhes visuais relevantes** para reprodução precisa da camisa.

Sua resposta será usada para criar uma nova camisa com nome e número personalizados. Seja preciso e técnico, como se fosse para um designer 3D.
```

## ✅ Exemplo de saída esperada da análise

A resposta do modelo Vision idealmente deve se parecer com isso (esse texto você irá combinar com seu nome/número para mandar ao DALL·E 3):

### 📄 Prompt de saída resultante para enviar ao DALL·E 3:

```
Design de camisa de futebol moderna com estilo minimalista. A camisa tem cores principais em branco e preto com transição de gradiente suave do branco no topo para preto na parte inferior, incluindo mangas com preto sólido. A gola é redonda e branca, sem detalhes extras. As mangas são pretas, combinando com a base inferior do gradiente.

O número nas costas é grande, centralizado, preto com um preenchimento decorativo em padrões circulares concêntricos em cinza escuro. O nome do jogador aparece centralizado acima do número, em letras maiúsculas, pretas e com uma tipografia sans-serif, limpa e moderna.

**Substitua pelo nome: [NOME]**
**Substitua pelo número: [NUMERO]**

A imagem deve ter fundo branco neutro e foco somente na camisa, vista de costas, sem manequins nem marcas visíveis.
```

## ✅ Como montar dinamicamente no seu app

No seu app, você deve montar algo como:

```typescript
const nome = "BRENO BIDON";
const numero = "27";

const promptBase = `
Design de camisa de futebol moderna com estilo minimalista...
...Substitua pelo nome: ${nome}
Substitua pelo número: ${numero}
`;

const image = await generateImageFromDalle3(promptBase); // seu endpoint
```

## ⚠️ Observações finais

- O problema que você tinha antes era falta de direcionamento detalhado para a análise;
- A resposta do modelo melhora muito quando você guia com tópicos bem claros;
- Com isso, você pode manter a consistência de design mesmo trocando nome e número;

## 🔄 Fluxo no Vision-Test

1. **Envie imagem + prompt de análise para o Vision**
   - Receba o texto estruturado.

2. **Insira variáveis dinâmicas:**
   ```typescript
   const promptFinal = visionResult
     .replace("{{NAME}}", userName)
     .replace("{{NUMBER}}", userNumber);
   ```

3. **Envie isso como prompt para o DALL·E 3 na sua geração final.**

## ✅ Resultado Esperado

Se você fizer isso corretamente, o DALL·E 3:
- Vai manter o mesmo estilo e padrão da camisa
- E só trocar o nome e número com alta fidelidade 