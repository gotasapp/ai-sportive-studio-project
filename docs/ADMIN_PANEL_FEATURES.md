### 1. **Página de Administração - Estrutura Geral**

A página de administração será composta por diversas seções, cada uma dedicada ao gerenciamento de diferentes tipos de filtros e pré-definições que o administrador pode aplicar para cada categoria de NFT (camisas, logos, emblemas, estádios, etc.). Algumas das seções principais podem ser:

#### **Seção de Filtros Gerais**

* **Descrição:** Nesta seção, o administrador poderá definir filtros globais que influenciam a geração de qualquer tipo de NFT, como filtros para **estilos** (realista, clássico, retro, etc.), **cenas** (campo de futebol, estádio, etc.), **cores** (por exemplo, a paleta de cores de um time).
* **Exemplos de Filtros Gerais:**

  * Estilo: Realista, Retro, Clássico
  * Tema: Futebol, Basquete, Outros esportes
  * Tipo de Geração: Ícones, Logos, Jerseys, Estádios
  * Restrições de Cores: Paleta específica de cores para manter consistência com times ou estilos
  * **Filtros Negativos:** Impedir certos elementos ou estilos (por exemplo, não permitir "camisas de basquete" quando o usuário escolher "camisa de futebol").

#### **Seção de Filtros por Categoria (Ex: Jerseys, Logos, Badges, etc.)**

* **Descrição:** O administrador pode configurar filtros específicos para cada tipo de NFT que os usuários escolherão para criar.

  * **Jersey**: Para camisas de futebol, o administrador pode permitir filtros como:

    * **Times Específicos**: Flamengo, Vasco, Palmeiras, etc.
    * **Estilos**: Camisa oficial, Camisa retro, Camisa alternativa.
    * **Filtros de Cores e Linhas**: Permitir que o administrador defina quais cores devem ser priorizadas ou evitadas, como linhas vermelhas e pretas para o Flamengo.
    * **Estilo de Geração**: Realista, estilo de camisa oficial, estilo criativo, etc.
    * **Prompt Negativo**: Impedir que o usuário crie algo que não seja uma camisa de futebol (ex: camisa de basquete ou camisa sem tema esportivo).
  * **Logo/Badge**: O administrador pode adicionar filtros de estilo para os logos, como:

    * Tipos de emblemas ou logotipos esportivos.
    * Manter elementos representativos de um time específico.
    * Restrições em cores ou estilo gráfico (ex: evitar logos muito modernos para times tradicionais).
  * **Estádio**: Para estádios, pode-se configurar filtros como:

    * **Estilo de Estádio**: Tradicional, moderno, de alta tecnologia.
    * **Limitações de Design**: A estrutura deve seguir um estilo específico (ex: estádio de futebol com uma cobertura metálica futurista, ou estádio mais tradicional).

#### **Seção de Filtros Dinâmicos e Adição de Campos Personalizados**

* **Descrição:** Nessa área, o administrador pode criar filtros personalizados para atender a necessidades específicas de cada time ou tipo de NFT. Além disso, o administrador pode configurar campos de prompts extras para ajustar a geração e reduzir os erros.

  * **Campos de Prompt Personalizados**: O administrador pode adicionar campos de texto que o usuário deve preencher, como detalhes de estilo, cores, ou elementos específicos (por exemplo: "Escolha o padrão de listras para a camisa" ou "Escolha um emblema do time").
  * **Ajuste do Prompt para Geração IA**: Baseado nos filtros e campos definidos, o administrador ajustará como o prompt será estruturado, incluindo uma parte do prompt pré-definida para garantir que a IA receba contextos corretos e aplicáveis.

### 2. **Fluxo de Geração e Configuração de Filtros**

O fluxo de interação será o seguinte:

* O **usuário** escolhe o tipo de NFT (ex: jersey, logo, estádio).
* A interface de front-end consulta o **backend** para verificar quais filtros o administrador configurou para aquele tipo específico de NFT.
* O **backend** combina os filtros e gera um prompt otimizado para a IA, incluindo os contextos definidos pelo administrador.
* A IA gera a imagem com base nesse prompt otimizado, mantendo os elementos dentro dos parâmetros pré-estabelecidos.

### 3. **Ajustes de Interface**

* O administrador terá uma interface com campos **select** ou **checkbox** para habilitar/desabilitar filtros para cada categoria de NFT.
* Cada filtro poderá ser configurado para ser **obrigatório** ou **opcional** para os usuários, dependendo da importância do filtro para a qualidade da geração.
* O administrador também poderá visualizar uma **prévia** de como os filtros estão impactando a geração dos NFTs, para ajustar conforme necessário.

### 4. **Exemplos de Filtros Específicos**

* **Jerseys de Futebol**:

  * **Filtro de Estilo**: Realista, Retrô, Criativo.
  * **Filtro de Cor**: Manter as cores oficiais do Flamengo (vermelho e preto).
  * **Filtro Negativo**: Impedir camisas de basquete ou outros esportes.
* **Badges**:

  * **Filtro de Estilo**: Moderno, Vintage.
  * **Filtro de Cor**: Preferir fundo com azul e amarelo para representar o Brasil.
  * **Filtro Negativo**: Não gerar logotipos de empresas que não sejam relacionadas ao esporte.

### 5. **Segurança e Controle**

* **Controle de Permissões**: A página de administração deve permitir que apenas usuários autorizados (admins) alterem os filtros e as configurações.
* **Auditoria e Logs**: O sistema deve registrar todas as alterações feitas pelo administrador, garantindo transparência e rastreabilidade.

### Conclusão

Essa estrutura permitirá que o administrador tenha total controle sobre os filtros e o contexto aplicado na geração de NFTs, mantendo a consistência e qualidade desejadas. A flexibilidade de poder definir diferentes filtros para cada tipo de NFT vai proporcionar uma experiência única para os usuários, ao mesmo tempo que facilita o gerenciamento de conteúdos e a manutenção da integridade do sistema de geração. 