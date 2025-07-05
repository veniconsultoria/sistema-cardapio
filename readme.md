# Sistema de Cadastro - Produtos e Receitas

Sistema modular para gerenciamento de produtos, receitas, clientes e planejamento de cardápios.

## Estrutura dos Arquivos

O sistema foi refatorado para uma estrutura modular com os seguintes arquivos:

### Arquivo Principal
- **index.html** - Arquivo principal do sistema

### Estilos
- **css/main.css** - Estilos principais do sistema

### Scripts JavaScript
- **js/main.js** - Script principal e funções compartilhadas
- **js/produtos.js** - Módulo de produtos
- **js/receitas.js** - Módulo de receitas  
- **js/tipos-refeicoes.js** - Módulo de tipos de refeições
- **js/clientes.js** - Módulo de clientes
- **js/cardapio.js** - Módulo de cardápio

## Como Usar

### 1. Preparação
1. Crie uma pasta para o sistema
2. Dentro desta pasta, crie as subpastas:
   - `css/`
   - `js/`
3. Salve cada arquivo na pasta correspondente

### 2. Estrutura de Pastas
```
sistema/
├── index.html
├── css/
│   └── main.css
└── js/
    ├── main.js
    ├── produtos.js
    ├── receitas.js
    ├── tipos-refeicoes.js
    ├── clientes.js
    └── cardapio.js
```

### 3. Abrir o Sistema
- Abra o arquivo `index.html` em seu navegador
- O sistema funcionará completamente offline

## Principais Melhorias na Tela de Cardápio

### 1. Campos Compactos
- **Comensais**: Campo reduzido para 120px de largura
- **Botão Atualizar**: Tamanho compacto (8px padding)
- **Layout responsivo**: Formulário organizado em grid otimizado

### 2. Calendário com Toggle
- **Mostrar/Ocultar**: Botão para exibir ou esconder o calendário
- **Posição fixa**: Calendário posicionado no canto superior direito
- **Responsivo**: Em telas pequenas, posiciona-se normalmente no fluxo

### 3. Sistema de Impressão Avançado

#### Botão "Imprimir Preparos"
- **Funcionalidade**: Imprime receitas com quantidades calculadas
- **Período personalizável**: Selecione data inicial e final
- **Detalhamento**: Mostra ingredientes com quantidades exatas
- **Formatação**: Layout profissional para impressão

#### Botão "Imprimir Lista de Produtos"  
- **Funcionalidade**: Consolida todos os produtos necessários
- **Cálculo automático**: Soma quantidades de todos os dias do período
- **Organização**: Lista tabulada com códigos, nomes e quantidades
- **Otimização**: Evita duplicatas e agrupa por produto

### 4. Interface Melhorada
- **Seções expansíveis**: Tipos de refeições podem ser expandidos/contraídos
- **Botões compactos**: Ações organizadas de forma mais limpa
- **Feedback visual**: Alertas informativos para todas as ações

## Fluxo de Uso Recomendado

### 1. Configuração Inicial
1. **Produtos**: Cadastre todos os ingredientes e produtos
2. **Tipos de Refeições**: Defina os tipos (café, almoço, jantar, etc.)
3. **Receitas**: Crie receitas associando ingredientes
4. **Clientes**: Cadastre clientes e vincule tipos de refeições

### 2. Planejamento de Cardápio
1. **Selecione o cliente**
2. **Escolha a data**
3. **Configure o número de comensais**
4. **Adicione receitas** para cada tipo de refeição
5. **Calcule as quantidades**
6. **Grave o cardápio**

### 3. Impressão e Relatórios
1. **Defina o período** (data inicial e final)
2. **Escolha o tipo de impressão**:
   - **Preparos**: Para cozinha (receitas detalhadas)
   - **Lista de Produtos**: Para compras (produtos consolidados)

## Funcionalidades Principais

### Gestão de Produtos
- Cadastro completo com códigos automáticos
- Controle de preços e unidades de medida
- Gestão de perdas e pesos

### Gestão de Receitas
- Associação de ingredientes
- Cálculo automático de custos
- Controle de rendimento

### Planejamento de Cardápio
- Calendário visual interativo
- Múltiplos tipos de refeições por cliente
- Cálculos automáticos de quantidades
- Controle de comensais individualizado

### Sistema de Impressão
- Relatórios profissionais
- Cálculos precisos de ingredientes
- Consolidação inteligente de produtos
- Layout otimizado para impressão

## Tecnologias Utilizadas
- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo e moderno
- **JavaScript ES6+**: Funcionalidades interativas
- **Armazenamento local**: Dados mantidos no navegador

## Compatibilidade
- Funciona em todos os navegadores modernos
- Responsivo para dispositivos móveis
- Não requer internet após carregamento inicial
- Armazenamento local automático

## Suporte
O sistema foi desenvolvido de forma modular para facilitar manutenção e expansões futuras. Cada módulo pode ser editado independentemente sem afetar o restante do sistema.