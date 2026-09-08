# Especificação de Handoff — Plugin Figma

Plugin Figma para gerar, a partir de uma tela selecionada, uma especificação de
acessibilidade: cards revisáveis na UI, marcações reais no canvas e um painel
único de especificação — 100% local, sem servidor, API externa ou rede.

## Como abrir no Figma (modo desenvolvedor)

1. Instale as dependências e gere o build (veja abaixo).
2. No app desktop do Figma: **Plugins → Development → Import plugin from manifest…**
3. Selecione o arquivo `manifest.json` na raiz deste projeto.
4. Rode o plugin em qualquer arquivo Figma: **Plugins → Development → Especificação de Handoff**.

## Build

Requer Node.js 18+.

```bash
npm install
npm run build
```

Isso gera:
- `dist/ui.html` — UI do plugin (React, empacotada em um único arquivo HTML, via Vite + vite-plugin-singlefile).
- `dist/code.js` — código do main thread (acesso à Figma API), empacotado via esbuild.

Ambos os caminhos já estão referenciados em `manifest.json` (`ui` e `main`).

Durante o desenvolvimento do main thread:

```bash
npm run watch:code
```

(A UI precisa ser reconstruída manualmente com `npm run build:ui` a cada alteração,
já que o Figma não faz hot-reload do iframe da UI.)

## Verificação de tipos

```bash
npm run typecheck
```

Roda o `tsc --noEmit` separadamente para a UI (`tsconfig.json`) e para o main
thread (`tsconfig.main.json`), já que os dois rodam em ambientes diferentes
(DOM vs. sandbox da Figma Plugin API) e não podem compartilhar globals.

## Estrutura do projeto

```
manifest.json
src/
  main/                  # roda na sandbox da Figma Plugin API
    code.ts              # ponto de entrada: roteia mensagens da UI
    figma-api.ts          # wrapper fino sobre a Figma Plugin API
    messaging.ts          # postToUi (usa o global `figma`)
    analysis/             # descoberta, Core Web/App, contexto, detach, extração de texto
    generation/            # marcações no canvas + painel de especificações
  ui/                    # roda no iframe (React)
    App.tsx               # máquina de estados: Etapa 0 → 1 → 2
    mainBridge.ts          # postToMain (usa `parent.postMessage`)
    components/            # Step0, Step1, Step2, Card, ContextChoice, IncompatibilityBlock
    state/specificationStore.ts  # reducer dos SpecificationItem (ordem, edições, remoção)
    styles/                # tokens de cor/tipografia (seção 33 do briefing)
  shared/                # tipos e protocolo de mensagens UI↔main (sem `figma` nem DOM)
  rules/                 # motor de regras genérico + regras de acessibilidade
    engine.ts              # motor agnóstico de domínio (reutilizável por "analytics" no futuro)
    markupTypes.ts          # as 9 categorias fixas de "Tipo de marcação"
    placeholders.ts         # resolve "(Nome)", "[Nome]" e "{Nome}" nos templates
    accessibility-rules-data.ts # ESPELHO da planilha real — edite aqui para atualizar regras
    accessibility-rules.ts  # TRANSFORMA os dados acima em regras do motor — não edite componentes aqui
```

## Base de regras de acessibilidade

As regras reais vêm da planilha `Extracao_Acessibilidade_Core_Web_70_Componentes.xlsx`
(70 componentes do Core Web), fornecida pelo time de acessibilidade em 08/09/2026.

**Para atualizar uma regra, corrigir um texto ou adicionar um componente novo:**
edite `src/rules/accessibility-rules-data.ts` — é um array de objetos simples
(um por componente), sem nenhuma lógica. As instruções completas de como
editar esse arquivo (inclusive como adicionar um alias de nome quando o
componente real no Figma tem um nome diferente do da planilha) estão no
comentário no topo do próprio arquivo.

**Nunca edite `accessibility-rules.ts` para registrar um componente** — esse
arquivo só contém a lógica que transforma os dados em regras do motor
(identificação por nome, mapeamento de "Tipo" da planilha para "Tipo de
marcação" do plugin, e o parser conservador de "Estado: texto"). Rode
`npm run typecheck && npm run build` depois de qualquer edição nos dados.

### Decisões conservadoras tomadas na conversão da planilha

- **"Tipo" da planilha → "Tipo de marcação" do plugin**: só os 3 valores
  inequívocos (Botão→Botões, Entrada→Entrada, Link→Link) foram mapeados
  automaticamente. Os demais valores da planilha (Grupo, Decorativo, Texto,
  "Não se aplica", vazio) ficam como "Não especificado" — mapear esses exigiria
  uma escolha arbitrária que o briefing pediu para evitar. Ajuste o mapa
  `TIPO_PLANILHA_PARA_MARKUP_TYPE` em `accessibility-rules.ts` quando o time
  confirmar o mapeamento correto.
- **Verbalização automática**: só é preenchida quando TODAS as linhas da
  célula "Verbalização esperada" seguem o padrão `Estado: "texto".` de forma
  reconhecível (21 dos 70 componentes hoje). Quando a célula é texto corrido
  (parágrafo explicativo em vez de estados separados), o campo fica vazio e
  editável — em vez de arriscar extrair um trecho errado de um parágrafo.
- **Placeholders**: a planilha usa três estilos — `(Nome)`, `[Nome]` e
  `{Nome}` — todos resolvidos pelo mesmo mecanismo em `placeholders.ts`. Só
  placeholders que representam exatamente o mesmo dado já extraído pelo
  plugin (rótulo/título/texto do botão) são substituídos automaticamente;
  os demais (`[verbo do botão]`, `{placeholder}`, `{mensagem}` etc.) ficam
  literalmente no texto para o designer preencher.
- **Estados (variantes do Figma)**: `SpecificationItem.variantProperties`
  já captura `InstanceNode.variantProperties` de cada instância (a forma
  confiável, via API real, de saber o estado atual de um componente com
  variantes). O motor ainda não usa esse dado para ESCOLHER automaticamente
  qual estado da planilha aplicar — isso é o próximo passo natural, e a
  estrutura (`ComponentTypeRule.states`) já guarda todos os estados
  parseados de cada componente, prontos para essa seleção ser implementada.

## O que ficou pendente de propósito (não foi inventado)

### 1. Identificação de biblioteca (Core Web / Core App)

A Figma Plugin API **não expõe** um método que devolva diretamente "o nome do
arquivo de biblioteca publicada" de onde um componente remoto veio. O que a
API garante e o plugin usa:

- `InstanceNode.getMainComponentAsync()` → `ComponentNode | null`
- `ComponentNode.remote` → indica se veio de uma biblioteca
- `ComponentNode.name` e, quando o componente faz parte de variantes,
  `ComponentNode.parent` (o `ComponentSetNode`, com seu próprio `.name`)

A estratégia implementada em `src/main/analysis/coreIdentification.ts` verifica
se o nome do componente principal (ou do seu component set) contém, como
segmento de caminho (separado por `/`, convenção real de pastas do Assets
panel do Figma), exatamente um dos textos `"Colmeia DS | Core Web"` ou
`"Colmeia DS | Core App"`. **Se a convenção de nomenclatura real do Design
System for diferente**, ajuste as duas constantes no topo desse arquivo — não
foi adicionada nenhuma outra lógica além dessa checagem de nome.

### 2. Detecção de componentes detachados

A Figma Plugin API não fornece histórico de operações — não há como saber com
certeza se um `FRAME`/`GROUP` já foi uma instância no passado. Para não gerar
falsos positivos (exigência explícita do briefing), `detectPossibleDetachedComponents`
retorna sempre uma lista vazia por enquanto. O ponto de extensão já existe em
`src/main/analysis/detachDetector.ts`, documentado com a limitação técnica.

### 3. Fonte Nunito nos objetos gerados no canvas

O requisito de fonte "Nunito" (seção 33) se refere à interface do plugin.
Como o plugin não tem acesso à rede, a UI usa `"Nunito"` no CSS com fallback
para uma pilha de sans-serif (funciona se a fonte estiver instalada no SO do
designer; ver `src/ui/styles/tokens.css`). Para os textos **gerados no canvas**
do Figma (números das marcações e painel de especificações), o plugin usa a
fonte `Inter`, que é sempre garantida pelo Figma via `figma.loadFontAsync`,
para não depender de uma fonte que pode não estar carregada no arquivo.

## O que foi explicitamente NÃO implementado (fora de escopo desta fase)

Conforme a seção 39 do briefing: Tagueamento/Google Analytics, exportação
DOCX, login, servidor, colaboração, ranking, histórico, recuperação de
sessão, sincronização entre usuários e painel que acompanha a tela.

A arquitetura (camadas `analysis/` → `rules/engine.ts` → `generation/`) foi
desenhada para permitir adicionar futuramente `analytics-rules.ts` sem
reescrever seleção, cards, ordenação, geração de marcações/painel ou a
comunicação UI↔main — apenas um novo conjunto de regras e, na Etapa 0, um
novo botão habilitado.
