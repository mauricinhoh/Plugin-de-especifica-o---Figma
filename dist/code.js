"use strict";
(() => {
  // src/main/messaging.ts
  function postToUi(message) {
    figma.ui.postMessage(message);
  }

  // src/rules/placeholders.ts
  var PLACEHOLDER_RESOLVERS = {
    "texto do botao": (data) => data.text,
    rotulo: (data) => data.text,
    titulo: (data) => data.text,
    "verbo do botao": (data) => data.text,
    // Sinônimos confirmados na planilha "Acessibilidade_Colmeia_Web (1)"
    // (aba "{Atualizado} Fonte da verdade", 21/09/2026) — mesmo dado
    // (texto visível do componente), nome diferente.
    label: (data) => data.text,
    "rotulo acessivel": (data) => data.text,
    "label acessivel": (data) => data.text,
    "label do botao": (data) => data.text,
    "texto da label": (data) => data.text,
    "titulo com hierarquia logica": (data) => data.text
    // Deliberadamente SEM resolver (ficam como template editável):
    // "placeholder", "conteudo preenchido", "texto de suporte",
    // "texto de apoio", "heading", "mensagem", "mensagem de erro",
    // "alt-text", "carregando", "description", "descricao",
    // "helper text", "leitura do conteudo", "mascara", "nivel",
    // "posicao", "posicao e total de etapas", "valor", "x de x",
    // "x itens", "contador", "ordem logica" — são textos DIFERENTES do
    // texto/rótulo principal do componente (ou dados que o plugin não
    // consegue extrair, como contadores/posição), então resolver
    // automático arriscaria pegar o texto errado ou inventar um número.
  };
  function normalizePlaceholderName(raw) {
    return raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }
  var PLACEHOLDER_PATTERN = /\(([^()]+)\)|\[([^[\]]+)\]|\{([^{}]+)\}/g;
  function resolvePlaceholders(template, extractedData) {
    return template.replace(PLACEHOLDER_PATTERN, (match, viaParens, viaBrackets, viaBraces) => {
      var _a;
      const rawName = (_a = viaParens != null ? viaParens : viaBrackets) != null ? _a : viaBraces;
      const key = normalizePlaceholderName(rawName);
      const resolver = PLACEHOLDER_RESOLVERS[key];
      if (!resolver) {
        return match;
      }
      const value = resolver(extractedData);
      return value !== void 0 ? value : match;
    });
  }

  // src/rules/engine.ts
  function normalizeWord(word) {
    return word.trim().toLowerCase();
  }
  function fullPhraseTokens(label) {
    return label.split("/").map((part) => normalizeWord(part)).filter((word) => word.length > 0);
  }
  function firstWordTokens(label) {
    return label.split("/").map((part) => part.trim().split(/\s+/)[0]).filter((word) => Boolean(word)).map(normalizeWord);
  }
  function buildStateCandidates(variantProperties, derivedStates) {
    if (!variantProperties) return [];
    const candidates = [];
    for (const [propertyName, value] of Object.entries(variantProperties)) {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === "true") {
        candidates.push(propertyName);
      } else if (normalizedValue !== "false") {
        candidates.push(value);
      }
    }
    if (derivedStates) {
      for (const rule of derivedStates) {
        const allMatch = Object.entries(rule.whenFlagsEqual).every(([flag, expected]) => {
          const actual = variantProperties[flag];
          return actual !== void 0 && actual.trim().toLowerCase() === expected.trim().toLowerCase();
        });
        if (allMatch) {
          candidates.push(rule.thenState);
        }
      }
    }
    return candidates;
  }
  function selectVerbalizationTemplate(rule, variantValues) {
    if (!rule.states || variantValues.length === 0) {
      return void 0;
    }
    const expandedValues = [...variantValues];
    if (rule.stateFlagAliases) {
      const normalizedAliasEntries = Object.entries(rule.stateFlagAliases).map(
        ([figmaName, portugueseLabel]) => [normalizeWord(figmaName), portugueseLabel]
      );
      for (const value of variantValues) {
        const normalizedValue = normalizeWord(value);
        for (const [figmaName, portugueseLabel] of normalizedAliasEntries) {
          if (figmaName === normalizedValue) {
            expandedValues.push(portugueseLabel);
          }
        }
      }
    }
    const normalizedVariantValues = expandedValues.map(normalizeWord);
    for (const tokenize of [fullPhraseTokens, firstWordTokens]) {
      for (const [label, text] of Object.entries(rule.states)) {
        const tokens = tokenize(label);
        if (tokens.some((token) => normalizedVariantValues.includes(token))) {
          return text;
        }
      }
    }
    return void 0;
  }
  function computeVerbalization(rule, extractedData, variantValues = []) {
    var _a;
    if (!rule || !rule.hasVerbalization) {
      return "";
    }
    const template = (_a = selectVerbalizationTemplate(rule, variantValues)) != null ? _a : rule.template;
    if (!template) {
      return "";
    }
    return resolvePlaceholders(template, extractedData);
  }
  function findMatchingRule(rules, input) {
    return rules.find((rule) => rule.identifier.matches(input));
  }
  var UNSPECIFIED_TYPE_KEY = "nao-especificado";
  var UNSPECIFIED_TYPE_LABEL = "N\xE3o especificado";

  // src/rules/markupTypes.ts
  var MARKUP_TYPES = [
    { key: "ponto-referencia", label: "Ponto de refer\xEAncia" },
    { key: "titulos", label: "Titulos" },
    { key: "ordem-foco", label: "Ordem de foco" },
    { key: "ordem-leitura", label: "Ordem de leitura" },
    { key: "botoes", label: "Bot\xF5es" },
    { key: "entrada", label: "Entrada" },
    { key: "link", label: "Link" },
    { key: "imagem", label: "Imagem" },
    { key: "notas-designer", label: "Notas do designer" },
    { key: "decorativo", label: "Decorativo" },
    { key: "estrutura", label: "Estrutura" },
    { key: "nao-interativo", label: "N\xE3o interativo" }
  ];
  var DECORATIVE_MARKUP_TYPE = "decorativo";

  // src/main/figma-api.ts
  function getCurrentUserName() {
    var _a, _b, _c;
    const fullName = (_b = (_a = figma.currentUser) == null ? void 0 : _a.name) != null ? _b : "";
    return (_c = fullName.trim().split(/\s+/)[0]) != null ? _c : "";
  }
  function isValidScreenNode(node) {
    return node.type === "FRAME" || node.type === "GROUP";
  }
  function getCurrentSelection() {
    return figma.currentPage.selection;
  }
  function onSelectionChange(callback) {
    figma.on("selectionchange", callback);
    return () => figma.off("selectionchange", callback);
  }
  var LAYER_COUNT_LIMIT = 5e3;
  function countDescendants(node) {
    let count = 0;
    function walk(current) {
      if ("children" in current) {
        for (const child of current.children) {
          count += 1;
          if (count >= LAYER_COUNT_LIMIT) return false;
          if (!walk(child)) return false;
        }
      }
      return true;
    }
    walk(node);
    return count;
  }
  async function focusNode(nodeId) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !("x" in node)) {
      return false;
    }
    const sceneNode = node;
    figma.currentPage.selection = [sceneNode];
    figma.viewport.scrollAndZoomIntoView([sceneNode]);
    return true;
  }
  var SCREEN_CONTEXT_KEY = "screenContext";
  function getRememberedScreenContext() {
    const value = figma.root.getPluginData(SCREEN_CONTEXT_KEY);
    return value === "WEB" || value === "APLICATIVO" ? value : null;
  }
  function rememberScreenContext(context) {
    figma.root.setPluginData(SCREEN_CONTEXT_KEY, context);
  }

  // src/rules/accessibility-rules-data.ts
  var accessibilityRuleRecords = [
    {
      "categoria": "Action",
      "componente": "Button Group",
      "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si n\xE3o possui estados pr\xF3prios.",
      "verbalizacaoEsperada": "Default: \u201C[Label], Bot\xE3o\u201D.\nBot\xE3o desabilitado: \u201C[Label], indispon\xEDvel, bot\xE3o\u201D.\nHabilitado: \u201C[Label], Bot\xE3o\u201D.\nLoading: \u201CCarregando\u201D ",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Action",
      "componente": "Button Icon",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201C[Label], bot\xE3o.\u201D\nDisabled: \u201C[Label], Indispon\xEDvel, bot\xE3o.\u201D\nFocus: \u201C[Label], bot\xE3o.\u201D\n",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Mini",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201C[Label], bot\xE3o.\u201D\nDisabled: \u201C[Label] Indispon\xEDvel, bot\xE3o.\u201D\nFocus: \u201C[Label], bot\xE3o.\u201D",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Primary",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], bot\xE3o\u201D.\nLoading macOS: \u201Ccarregando\u201D.\nLoading Windows: \u201C[Carregando]\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label]Indispon\xEDvel, bot\xE3o\u201D.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Secondary",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], bot\xE3o\u201D.\nLoading macOS: \u201Ccarregando\u201D.\nLoading Windows: \u201C[Carregando]\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label]Indispon\xEDvel, bot\xE3o\u201D.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Shortcut",
      "estados": "Habilitado, Focus, Hover, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], link.\u201D\nDisabled: \u201C[Label], indispon\xEDvel, Link.\u201D",
      "tipo": "Link",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Menu Button",
      "estados": "Recolhido, Expandido, Focus e Hover.",
      "verbalizacaoEsperada": "Expandido: \u201C[Label], Bot\xE3o, Expandido\u201D\nRecolhido: \u201C[Label], Bot\xE3o, Recolhido\u201D\n",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Link Icon",
      "estados": "Habilitado, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], link.\u201D\nExterno: \u201C[Label], link externo.\u201D",
      "tipo": "Link",
      "foco": "Sim"
    },
    {
      "categoria": "Content",
      "componente": "Icon Shape",
      "estados": "Padr\xE3o; est\xE1tico, sem foco, hover ou desabilitado.",
      "verbalizacaoEsperada": "N\xE3o deve ser verbalizado ou receber foco",
      "tipo": "Decorativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Currency",
      "estados": "Padr\xE3o, Mascarado; varia\xE7\xE3o positiva ou negativa apenas visual.",
      "verbalizacaoEsperada": 'Hiden true: "Valor oculto" Hiden false positive: "[Valor]" Hiden true negative: "Menos [valor]"',
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Paragraph",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Leitura do conte\xFAdo.",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Icon",
      "estados": "Herda estados do componente pai.",
      "verbalizacaoEsperada": "N\xE3o deve ser verbalizado",
      "tipo": "Decorativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Topic",
      "estados": "Est\xE1tico, sem foco, hover ou desabilitado.",
      "verbalizacaoEsperada": "Leitura do conte\xFAdo.",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Brand",
      "estados": "Est\xE1tico; quando usado como link, possui intera\xE7\xE3o.",
      "verbalizacaoEsperada": 'Quando ilustrativo: "Logo Sicredi." Quando link: "Tela inicial do Internet banking do Sicredi, link"',
      "tipo": "Imagem",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Description",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Leitura do conte\xFAdo.",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Empty State",
      "estados": "Est\xE1tico; bot\xE3o interno segue Button Primary.",
      "verbalizacaoEsperada": 'Verbaliza cada componente separadamente. T\xEDtulo: "[T\xEDtulo com hierarquia l\xF3gica]" Descri\xE7\xE3o: "[Leitura do conte\xFAdo]", Button primary: "[Label], bot\xE3o"\n',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Content",
      "componente": "Accordion",
      "estados": "Expandido e Recolhido.",
      "verbalizacaoEsperada": 'Expandido: "[Label], Bot\xE3o, Expandido,\xA0T\xEDtulo, N\xEDvel de cabe\xE7alho 2"\nRecolhido: "[R\xF3tulo], Bot\xE3o, Recolhido,\xA0T\xEDtulo, N\xEDvel de cabe\xE7alho 2" Para ler o conte\xFAdo o usu\xE1rio deve navegar por setas.',
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Content",
      "componente": "Image",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Quando ilustrativa, n\xE3o h\xE1 verbaliza\xE7\xE3o. Se fornece contexto, verbaliza\xE7\xE3o do texto alternativo",
      "tipo": "Imagem",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Heading",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "[Label], T\xEDtulo de n\xEDvel [ordem l\xF3gica]",
      "tipo": "T\xEDtulo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "List Content",
      "estados": "Sem estados pr\xF3prios.",
      "verbalizacaoEsperada": "Conte\xFAdo conforme ordem l\xF3gica",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Content",
      "componente": "List Ghost",
      "estados": "Padr\xE3o, est\xE1tico.",
      "verbalizacaoEsperada": "[Description], [Label]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Content",
      "componente": "Credit Card",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Quando ilustrativo, sem verbaliza\xE7\xE3o. Quando contextual, verbaliza a bandeira",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Pagination",
      "estados": "Estados herdados de Dropdown e Button Icon.",
      "verbalizacaoEsperada": "Segue a ordem l\xF3gica e sem\xE2ntica de cada componente.",
      "tipo": "Bot\xE3o",
      "foco": "Sim",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Content",
      "componente": "Table",
      "estados": "Default, Linhas selecionadas, Sem dados.",
      "verbalizacaoEsperada": "Segue a documenta\xE7\xE3o da tabela: https://confederacaosicredi.sharepoint.com/:w:/r/teams/nucleodeacessibilidade/Shared%20Documents/Especifica%C3%A7%C3%B5es%20Colmeia/Especificac%CC%A7%C3%B5es%20para%20tabela%20(Table).docx?d=w3d5f894400084c4c94753e09a8ad20d7&csf=1&web=1&e=gcqGDV",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Containers",
      "componente": "Card",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Containers",
      "componente": "Banner Image Full",
      "estados": "Habilitado, Focus, Hover, relacionados \xE0 a\xE7\xE3o.",
      "verbalizacaoEsperada": '"[T\xEDtulo], [Descri\xE7\xE3o],[Label],Bot\xE3o"',
      "tipo": "Imagem",
      "foco": "N\xE3o",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Containers",
      "componente": "Modal",
      "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Icon button X: "Fechar, bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Containers",
      "componente": "Cookies",
      "estados": "Vis\xEDvel e Aceito.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes com suas devidas sem\xE2nticas",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Containers",
      "componente": "Fixed Bar",
      "estados": "Estrutural, sem estados pr\xF3prios.",
      "verbalizacaoEsperada": '"[Label], Bot\xE3o"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Containers",
      "componente": "Drawer",
      "estados": "Aberto e Fechado.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Icon button X: "Fechar, bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Containers",
      "componente": "Card Review",
      "estados": "Default, Ativo e Enviado.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Contador de caracteres verbalizado antes do conte\xFAdo do input. Cada estrela verbaliza posi\xE7\xE3o e total de estrelas, exemplo "Uma estrela,bot\xE3o de op\xE7\xE3o, n\xE3o marcado, 1 de 5"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Feedback",
      "componente": "Alert",
      "estados": "Ativo e Encerrado.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Icon button X: "Fechar, bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Feedback",
      "componente": "Flag",
      "estados": "Estrutural; links internos herdam estados pr\xF3prios.",
      "verbalizacaoEsperada": "\u201C[T\xEDtulo] [Description] [Label], link externo.\u201D",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Feedback",
      "componente": "Flag Cooperado",
      "estados": "Estrutural e n\xE3o interativo; links internos herdam estados.",
      "verbalizacaoEsperada": "\u201C[T\xEDtulo] [Description] [Label], link externo.\u201D",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Feedback",
      "componente": "Toast",
      "estados": "Exibido e Oculto.",
      "verbalizacaoEsperada": '"[Description],[label] link externo, fechar,bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Feedback",
      "componente": "Tooltip",
      "estados": "Inativo: Tooltip n\xE3o vis\xEDvel.\n\nAtivo: Tooltip vis\xEDvel por hover ou foco.",
      "verbalizacaoEsperada": '"[Description]"\n',
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Inputs",
      "componente": "Checkbox",
      "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
      "verbalizacaoEsperada": "Marcado: \u201C[Label], caixa de sele\xE7\xE3o, marcado.\u201D\nDesmarcado: \u201C[texto da label], caixa de sele\xE7\xE3o, n\xE3o marcado.\u201D\nParcialmente marcado: \u201C{r\xF3tulo}, caixa de sele\xE7\xE3o parcialmente marcada.\u201D\nDesabilitado: \u201C{r\xF3tulo}, caixa de sele\xE7\xE3o desabilitada.\u201D",
      "tipo": "Entrada",
      "foco": "Sim",
      "stateFlagAliases": {
        "Selected": "Marcado",
        "Indeterminate": "Parcialmente marcado",
        "Disabled": "Desabilitado"
      },
      "derivedStates": [
        {
          "whenFlagsEqual": {
            "Selected": "False",
            "Indeterminate": "False",
            "Disabled": "False"
          },
          "thenState": "Desmarcado"
        }
      ]
    },
    {
      "categoria": "Inputs",
      "componente": "Chip Filter",
      "estados": "Habilitado, Focus.",
      "verbalizacaoEsperada": 'Label], Remover, Bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Chip Select",
      "estados": "Habilitado, Focus, Hover.",
      "verbalizacaoEsperada": 'Desmarcado:"[texto da label], caixa de sele\xE7\xE3o, n\xE3o marcado". Marcado: "[Label], caixa de sele\xE7\xE3o, marcado".',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Date Picker",
      "estados": "Default: exibe o valor padr\xE3o ou o valor selecionado pelo usu\xE1rio\n\nHover: componente recebeu foco com mouse, alterando visualmente seu estilo\n\nSelected: componente est\xE1 com sua lista de op\xE7\xF5es aberta, tendo o mesmo estilo visual do Hover",
      "verbalizacaoEsperada": 'Para o campo de ano: "Anterior, bot\xE3o", "Dois mil e vinte dois","Pr\xF3ximo, bot\xE3o". Para o campo de m\xEAs: "Anterior, bot\xE3o", "Fevereiro","Pr\xF3ximo, bot\xE3o". Os dias s\xE3o anunciados juntamente com o m\xEAs e o ano e dia da semana.\n',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Dropdown",
      "estados": "Habilitado, Focus, Open, Error, Disabled.",
      "verbalizacaoEsperada": 'Expandido: "[Label], Bot\xE3o, Expandido""\nRecolhido: "[Label], Bot\xE3o, Recolhido"',
      "tipo": "Entrada",
      "foco": "Sim",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code",
      "estados": "enabled, focus, hover, filled.",
      "verbalizacaoEsperada": 'Quando vazio: Label acess\xEDvel "informe o c\xF3digo, [posi\xE7\xE3o], campo de edi\xE7\xE3o". Quando preenchido: Label acess\xEDvel "informe o c\xF3digo, marcador, [posi\xE7\xE3o], campo de edi\xE7\xE3o".\n',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code Number",
      "estados": "habilitado, focus, hover e preenchido;",
      "verbalizacaoEsperada": "Ao focar em cada um dos bot\xF5es leitor anuncia: \u201C6 ou 1, bot\xE3o\u201D.\nFeedback din\xE2mico:\nQuando uma tecla \xE9 acionada, o campo de senha atualiza\u2028 \u201Cx d\xEDgitos inseridos\u201D\nBot\xE3o Limpar:\nDeve anunciar \u201CCaracteres apagados\u201D ap\xF3s a\xE7\xE3o.",
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Date",
      "estados": "Padr\xE3o: campo vazio e pronto para entrada.\n\nAberto: exibe o calend\xE1rio de sele\xE7\xE3o de data.\n\nFoco: realce visual e leitura de r\xF3tulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com intera\xE7\xE3o bloqueada",
      "verbalizacaoEsperada": 'Recolhido: "[Label],[Mascara],[Helper text], campo de edi\xE7\xE3o,calend\xE1rio,recolhido, bot\xE3o" Expandido: [Label],[Mascara],[Helper text], campo de edi\xE7\xE3o,expandido,bot\xE3o "',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Password",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": 'Olho aberto/valor oculto: "[Label],[Mascara],[Helper text], campo de edi\xE7\xE3o, mostrar senha, bot\xE3o"                                                                                                                                                             Olho fechado/valor vis\xEDvel: "[Label],[Mascara],[Helper text], campo de edi\xE7\xE3o, ocultar senha, bot\xE3o" ',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Select",
      "estados": "Default, Filled, Hover, Active, Error, Disabled.",
      "verbalizacaoEsperada": 'Recolhido: "[Label],[Mascara],[Helper text], campo de edi\xE7\xE3o,recolhido, bot\xE3o" Expandido: "[Label],[Mascara],[Helper text], campo de edi\xE7\xE3o, expandido, bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": '"[label], [placeholder], [helper text], Campo de edi\xE7\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text Area",
      "estados": "Default, Hover, Focus, Filled, Disabled, Error, Read-only.",
      "verbalizacaoEsperada": '"[label], [placeholder], [contador], [helper text], Caixa de edi\xE7\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "List Select",
      "estados": "Herda do seletor interno: Hover, Focus, Checked, Unchecked, Disabled etc.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes com suas devidas sem\xE2nticas",
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Popover",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes.",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Inputs",
      "componente": "Popover Menu",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes.",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Inputs",
      "componente": "Radio Button",
      "estados": "Selecionado, N\xE3o selecionado, Desabilitado.",
      "verbalizacaoEsperada": 'N\xE3o marcado: "[Label], bot\xE3o de op\xE7\xE3o, n\xE3o marcado, [posi\xE7\xE3o]." Marcado: [Label], bot\xE3o de op\xE7\xE3o, marcado, [posi\xE7\xE3o].',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Rate Input",
      "estados": "Default, Selecionado, Desabilitado.",
      "verbalizacaoEsperada": 'Cada estrela verbaliza posi\xE7\xE3o e total de estrelas, exemplo "Uma estrela,bot\xE3o de op\xE7\xE3o, n\xE3o marcado, 1 de 5"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Search",
      "estados": "Habilitado/Focus, Hover, Filled;",
      "verbalizacaoEsperada": '"[Placeholder],campo de busca,[r\xF3tulo], bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Switch",
      "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
      "verbalizacaoEsperada": 'Pressionado: [Label], bot\xE3o de alternancia, pressionado" N\xE3o pressionado: [Label], bot\xE3o de alternancia, n\xE3o pressionado"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Uploader",
      "estados": "Default: campo est\xE1 habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e est\xE1 com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou valida\xE7\xE3o.",
      "verbalizacaoEsperada": 'Default: "[Label],[Descri\xE7\xE3o], [helper text],[Label do bot\xE3o] bot\xE3o.  Loading: "Label], Carregando"\nError:"[Label],[helper text],excluir arquivo, bot\xE3o. Complete:"[Label],[helper text],[r\xF3tulo acess\xEDvel], bot\xE3o. ',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Navigation",
      "componente": "Avatar Business",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Sem verbaliza\xE7\xE3o",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Navigation",
      "componente": "Avatar Name",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Sem verbaliza\xE7\xE3o",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Navigation",
      "componente": "Breadcrumb",
      "estados": "Links habilitados; p\xE1gina atual.",
      "verbalizacaoEsperada": ' "[Label] link, [Label] link,[Label] p\xE1gina atual"\n',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Navigation",
      "componente": "Carousel Nav",
      "estados": "Herda de Page Indicator e Button Icon.",
      "verbalizacaoEsperada": "O leitor de tela anuncia os bot\xF5es como controles de navega\xE7\xE3o.\n\nExemplo: \u201CCarrossel. 3 itens. Item 1 de 3. Pr\xF3ximo item, bot\xE3o.\u201D",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Navigation",
      "componente": "Header Flow",
      "estados": null,
      "verbalizacaoEsperada": null,
      "tipo": null,
      "foco": null,
      "sempreAprofundar": true
    },
    {
      "categoria": "Navigation",
      "componente": "Header Product",
      "estados": "Estrutural; elementos internos possuem estados pr\xF3prios.",
      "verbalizacaoEsperada": '"[T\xEDtulo], [N\xEDvel], [Descri\xE7\xE3o], [Label acess\xEDvel] bot\xE3o. Flow: "[Alt-text]"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos",
      "sempreAprofundar": true
    },
    {
      "categoria": "Navigation",
      "componente": "List Navigation",
      "estados": "Default: onde o item est\xE1 dispon\xEDvel para navega\xE7\xE3o\n\nHover: estado moment\xE2neo ao acionar a navega\xE7\xE3o\n\nFocus: componente recebe destaque visual para navega\xE7\xE3o por teclado.",
      "verbalizacaoEsperada": "Conte\xFAdo conforme ordem l\xF3gica\n",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos"
    },
    {
      "categoria": "Navigation",
      "componente": "Page Indicator",
      "estados": "Informativo e n\xE3o interativo.",
      "verbalizacaoEsperada": '"[X itens]. Item [X de X].',
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Navigation",
      "componente": "Tab",
      "estados": "Selecionada e N\xE3o selecionada.",
      "verbalizacaoEsperada": 'Selecionada:"[R\xF3tulo], guia selecionado, [Posi\xE7\xE3o]" N\xE3o seleciona:"[R\xF3tulo], guia n\xE3o selecionado, [Posi\xE7\xE3o]"',
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Status",
      "componente": "Badge",
      "estados": "Sem estados pr\xF3prios.",
      "verbalizacaoEsperada": "[Label acess\xEDvel]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Loading",
      "estados": "\xDAnico.",
      "verbalizacaoEsperada": '"Carregando"',
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Progress Line",
      "estados": "Informativo e n\xE3o interativo.",
      "verbalizacaoEsperada": "[Posi\xE7\xE3o e total de etapas]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Skeleton",
      "estados": "\xDAnico.",
      "verbalizacaoEsperada": "Carregando informa\xE7\xF5es",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Tag Container",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Label",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Tag Icon",
      "estados": "Est\xE1tico e n\xE3o interativo.",
      "verbalizacaoEsperada": "Label",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    }
  ];

  // src/rules/accessibility-rules.ts
  function lastSegmentOf(value) {
    var _a;
    return (_a = value.split("/").pop()) != null ? _a : value;
  }
  function normalize(value) {
    return value.trim().toLowerCase();
  }
  function matchesComponentName(...targets) {
    const normalizedTargets = targets.map(normalize);
    return ({ nodeName, componentName }) => {
      const candidates = [nodeName, componentName].filter((v) => v !== null);
      return candidates.some((candidate) => normalizedTargets.includes(normalize(lastSegmentOf(candidate))));
    };
  }
  var TIPO_PLANILHA_PARA_MARKUP_TYPE = {
    Bot\u00E3o: "botoes",
    Entrada: "entrada",
    Link: "link",
    T\u00EDtulo: "titulos",
    Imagem: "imagem",
    Decorativo: "decorativo",
    Estrutura: "estrutura",
    "N\xE3o interativo": "nao-interativo"
  };
  function resolveMarkupType(record) {
    var _a;
    if (!record.tipo) return UNSPECIFIED_TYPE_KEY;
    return (_a = TIPO_PLANILHA_PARA_MARKUP_TYPE[record.tipo]) != null ? _a : UNSPECIFIED_TYPE_KEY;
  }
  function resolveFocusEligible(record) {
    return record.foco === "Sim";
  }
  var STATE_LINE_PATTERN = /^([^:\n]{2,40}):\s*[""“]?(.+?)[”"]?\.?\s*$/;
  var NON_STATE_LABELS = /* @__PURE__ */ new Set(["exemplo"]);
  function parseVerbalizationStates(raw) {
    if (!raw) return [];
    const lines = raw.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) return [];
    const parsed = [];
    for (const line of lines) {
      const match = STATE_LINE_PATTERN.exec(line);
      if (!match) {
        return [];
      }
      parsed.push({ label: match[1].trim(), text: match[2].trim() });
    }
    const realStates = parsed.filter((p) => !NON_STATE_LABELS.has(normalize(p.label)));
    return realStates.length >= 2 ? realStates : [];
  }
  function slugify(componentName) {
    return componentName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function buildRule(record) {
    var _a, _b, _c;
    const states = parseVerbalizationStates(record.verbalizacaoEsperada);
    const statesMap = states.length > 0 ? states.reduce((acc, s) => {
      acc[s.label] = s.text;
      return acc;
    }, {}) : void 0;
    const rawTemplate = (_a = record.verbalizacaoEsperada) == null ? void 0 : _a.trim();
    const hasTemplate = Boolean(rawTemplate && rawTemplate.length > 0);
    return {
      key: slugify(record.componente),
      label: record.componente,
      markupType: resolveMarkupType(record),
      identifier: { matches: matchesComponentName(record.componente, ...(_b = record.aliasesDeNome) != null ? _b : []) },
      hasVerbalization: hasTemplate,
      extraction: [record.extracaoTexto === "todos" ? "all-text" : "first-text"],
      template: hasTemplate ? rawTemplate : void 0,
      states: statesMap,
      focusEligible: resolveFocusEligible(record),
      alwaysDescend: (_c = record.sempreAprofundar) != null ? _c : false,
      stateFlagAliases: record.stateFlagAliases,
      derivedStates: record.derivedStates
    };
  }
  var accessibilityRules = accessibilityRuleRecords.map(buildRule);

  // src/main/idGenerator.ts
  var counter = 0;
  function generateSpecificationId() {
    counter += 1;
    return `spec-${Date.now()}-${counter}`;
  }

  // src/main/analysis/discovery.ts
  var IGNORED_COMPONENT_NAMES = [
    "Header Web",
    "[IB-Leg] Acessibility Settings Bar",
    "[IB-Leg] Header",
    "[IB-Leg] Navigation Bar",
    "[IB-Leg] Footer"
  ];
  async function discoverTopLevelComponents(root, classify) {
    const found = [];
    async function walk(node) {
      if ("visible" in node && !node.visible) {
        return;
      }
      if (IGNORED_COMPONENT_NAMES.includes(node.name)) {
        return;
      }
      if (node.type === "INSTANCE" || node.type === "COMPONENT") {
        const { recognized, alwaysDescend } = await classify(node);
        if (recognized) {
          found.push(node);
          if (!alwaysDescend) {
            return;
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          await walk(child);
        }
      }
    }
    if ("children" in root) {
      for (const child of root.children) {
        await walk(child);
      }
    }
    return found;
  }

  // src/main/analysis/componentIdentity.ts
  async function resolveComponentName(node) {
    var _a;
    if (node.type === "INSTANCE") {
      const mainComponent = await node.getMainComponentAsync();
      return (_a = mainComponent == null ? void 0 : mainComponent.name) != null ? _a : null;
    }
    return node.name;
  }

  // src/main/analysis/readingOrder.ts
  function getBounds(node) {
    const box = node.absoluteBoundingBox;
    if (!box) return null;
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  function rowThresholdFor(a, b) {
    return Math.min(a.height, b.height) * 0.6;
  }
  function sortByReadingOrder(nodes) {
    const withBounds = [];
    const withoutBounds = [];
    for (const node of nodes) {
      const bounds = getBounds(node);
      if (bounds) {
        withBounds.push({ node, bounds, centerY: bounds.y + bounds.height / 2 });
      } else {
        withoutBounds.push(node);
      }
    }
    withBounds.sort((a, b) => a.centerY - b.centerY || a.bounds.x - b.bounds.x);
    const rows = [];
    for (const entry of withBounds) {
      const lastRow = rows[rows.length - 1];
      const lastItem = lastRow == null ? void 0 : lastRow.items[lastRow.items.length - 1];
      const threshold = lastItem ? rowThresholdFor(lastItem.bounds, entry.bounds) : 0;
      if (lastRow && Math.abs(entry.centerY - lastRow.averageCenterY) <= threshold) {
        lastRow.items.push(entry);
        const sum = lastRow.items.reduce((acc, item) => acc + item.centerY, 0);
        lastRow.averageCenterY = sum / lastRow.items.length;
      } else {
        rows.push({ items: [entry], averageCenterY: entry.centerY });
      }
    }
    const ordered = [];
    for (const row of rows) {
      row.items.sort((a, b) => a.bounds.x - b.bounds.x);
      ordered.push(...row.items.map((e) => e.node));
    }
    return [...ordered, ...withoutBounds];
  }

  // src/main/analysis/coreIdentification.ts
  var LIBRARY_NAME_CORE_WEB = "Colmeia DS | Core Web";
  var LIBRARY_NAME_CORE_APP = "Colmeia DS | Core App";
  var DEBUG_CORE_IDENTIFICATION = false;
  function logCoreIdentificationDebugInfo(mainComponent) {
    var _a;
    if (!DEBUG_CORE_IDENTIFICATION) return;
    const parent = mainComponent.parent;
    console.log("[core-identification-debug]", {
      componentName: mainComponent.name,
      componentKey: mainComponent.key,
      remote: mainComponent.remote,
      description: mainComponent.description,
      parentType: (_a = parent == null ? void 0 : parent.type) != null ? _a : null,
      parentName: parent && "name" in parent ? parent.name : null
    });
  }
  function pathContainsLibrary(path, libraryName) {
    return path.split("/").map((segment) => segment.trim()).includes(libraryName);
  }
  function classifyByNamePaths(candidatePaths, selfName) {
    for (const path of candidatePaths) {
      if (pathContainsLibrary(path, LIBRARY_NAME_CORE_WEB)) {
        return { coreType: "CORE_WEB", mainComponentName: selfName };
      }
      if (pathContainsLibrary(path, LIBRARY_NAME_CORE_APP)) {
        return { coreType: "CORE_APP", mainComponentName: selfName };
      }
    }
    return { coreType: "DESCONHECIDO", mainComponentName: selfName };
  }
  async function identifyCoreTypeForInstance(instance) {
    const mainComponent = await instance.getMainComponentAsync();
    if (!mainComponent) {
      return { coreType: "DESCONHECIDO", mainComponentName: null };
    }
    logCoreIdentificationDebugInfo(mainComponent);
    const candidatePaths = [mainComponent.name];
    const parent = mainComponent.parent;
    if (parent && parent.type === "COMPONENT_SET") {
      candidatePaths.push(parent.name);
    }
    return classifyByNamePaths(candidatePaths, mainComponent.name);
  }
  function identifyCoreTypeForComponent(component) {
    logCoreIdentificationDebugInfo(component);
    const candidatePaths = [component.name];
    const parent = component.parent;
    if (parent && parent.type === "COMPONENT_SET") {
      candidatePaths.push(parent.name);
    }
    return classifyByNamePaths(candidatePaths, component.name);
  }
  async function identifyCoreType(node) {
    if (node.type === "INSTANCE") {
      return identifyCoreTypeForInstance(node);
    }
    return identifyCoreTypeForComponent(node);
  }

  // src/main/analysis/contextResolver.ts
  function resolveScreenContext(coreWebCount, coreAppCount) {
    if (coreWebCount > coreAppCount) {
      return { context: "WEB", requiresContextChoice: false };
    }
    if (coreAppCount > coreWebCount) {
      return { context: "APLICATIVO", requiresContextChoice: false };
    }
    return { context: null, requiresContextChoice: true };
  }

  // src/main/analysis/detachDetector.ts
  function detectPossibleDetachedComponents(_topLevelNodes) {
    return [];
  }

  // src/main/analysis/textExtraction.ts
  function findFirstText(node) {
    if ("visible" in node && node.visible === false) {
      return null;
    }
    if (node.type === "TEXT") {
      return node.characters.trim().length > 0 ? node : null;
    }
    if ("children" in node) {
      for (const child of node.children) {
        const found = findFirstText(child);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
  function extractFirstText(node) {
    const textNode = findFirstText(node);
    return textNode ? textNode.characters : void 0;
  }
  function findAllTexts(node) {
    if ("visible" in node && node.visible === false) {
      return [];
    }
    if (node.type === "TEXT") {
      return node.characters.trim().length > 0 ? [node] : [];
    }
    if ("children" in node) {
      const result = [];
      for (const child of node.children) {
        result.push(...findAllTexts(child));
      }
      return result;
    }
    return [];
  }
  function extractAllTextsJoined(node) {
    const texts = findAllTexts(node).map((t) => t.characters);
    return texts.length > 0 ? texts.join(", ") : void 0;
  }

  // src/main/analysis/stateExtraction.ts
  function extractVariantProperties(node) {
    if (node.type !== "INSTANCE") {
      return null;
    }
    const componentProperties = node.componentProperties;
    if (!componentProperties) {
      return null;
    }
    const variantValues = {};
    for (const [propertyName, property] of Object.entries(componentProperties)) {
      if (property.type === "VARIANT" && typeof property.value === "string") {
        variantValues[propertyName] = property.value;
      }
    }
    return Object.keys(variantValues).length > 0 ? variantValues : null;
  }

  // src/main/analysis/validation.ts
  function findCoreIncompatibilities(items, context) {
    const forbidden = context === "WEB" ? "CORE_APP" : "CORE_WEB";
    return items.filter((item) => item.coreType === forbidden).map((item) => ({
      nodeId: item.nodeId,
      nodeName: item.nodeName,
      foundCoreType: forbidden,
      expectedContext: context
    }));
  }

  // src/main/analysis/analyzer.ts
  async function classifyComponent(node) {
    var _a;
    const componentName = await resolveComponentName(node);
    const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName });
    return { recognized: rule !== void 0, alwaysDescend: (_a = rule == null ? void 0 : rule.alwaysDescend) != null ? _a : false };
  }
  var DEBUG_STATE_MATCHING = true;
  function logStateDebugInfo(node, rule, variantProperties, variantValues) {
    if (!DEBUG_STATE_MATCHING || !(rule == null ? void 0 : rule.states)) return;
    console.log("[state-matching-debug]", {
      nodeName: node.name,
      ruleKey: rule.key,
      estadosConhecidosPelaRegra: Object.keys(rule.states),
      variantPropertiesDoFigma: variantProperties,
      valoresComparados: variantValues
    });
  }
  async function buildSpecificationItem(node, order, manuallyAdded) {
    var _a, _b, _c;
    const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
    const coreType = isComponentLike ? (await identifyCoreType(node)).coreType : "DESCONHECIDO";
    const componentName = isComponentLike ? await resolveComponentName(node) : null;
    const rule = findMatchingRule(accessibilityRules, {
      nodeName: node.name,
      componentName
    });
    const extractedData = {};
    if (rule == null ? void 0 : rule.extraction.includes("all-text")) {
      const text = extractAllTextsJoined(node);
      if (text !== void 0) {
        extractedData.text = text;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("first-text")) {
      const text = extractFirstText(node);
      if (text !== void 0) {
        extractedData.text = text;
      }
    }
    const variantProperties = extractVariantProperties(node);
    const variantValues = buildStateCandidates(variantProperties, rule == null ? void 0 : rule.derivedStates);
    logStateDebugInfo(node, rule, variantProperties, variantValues);
    const verbalization = computeVerbalization(rule, extractedData, variantValues);
    return {
      id: generateSpecificationId(),
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      markupType: (_a = rule == null ? void 0 : rule.markupType) != null ? _a : UNSPECIFIED_TYPE_KEY,
      ruleKey: (_b = rule == null ? void 0 : rule.key) != null ? _b : null,
      variantProperties,
      coreType,
      extractedData,
      verbalization,
      order,
      manuallyAdded,
      verbalizationEdited: false,
      focusEligible: (_c = rule == null ? void 0 : rule.focusEligible) != null ? _c : false
    };
  }
  async function analyzeScreen(screenNode, forcedContext) {
    const discovered = await discoverTopLevelComponents(screenNode, classifyComponent);
    const topLevelNodes = sortByReadingOrder(discovered);
    const items = [];
    let coreWebCount = 0;
    let coreAppCount = 0;
    let order = 0;
    for (const node of topLevelNodes) {
      const item = await buildSpecificationItem(node, order, false);
      if (item.coreType === "CORE_WEB") coreWebCount += 1;
      if (item.coreType === "CORE_APP") coreAppCount += 1;
      items.push(item);
      order += 1;
    }
    const resolution = forcedContext ? { context: forcedContext, requiresContextChoice: false } : resolveScreenContext(coreWebCount, coreAppCount);
    const incompatibilities = resolution.context ? findCoreIncompatibilities(items, resolution.context) : [];
    const detachWarnings = detectPossibleDetachedComponents(topLevelNodes);
    return {
      screenNodeId: screenNode.id,
      screenName: screenNode.name,
      context: resolution.context,
      requiresContextChoice: resolution.requiresContextChoice,
      coreWebCount,
      coreAppCount,
      items,
      incompatibilities,
      detachWarnings
    };
  }
  async function buildManualItem(node, order) {
    return buildSpecificationItem(node, order, true);
  }

  // src/main/analysis/usageLog.ts
  var NAMESPACE = "handoffspec";
  var LOG_KEY = "usageLog";
  var MAX_BYTES = 9e4;
  function getUsageLog() {
    const raw = figma.currentPage.getSharedPluginData(NAMESPACE, LOG_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  function appendUsageLogEntry(entry) {
    const current = getUsageLog();
    let updated = [...current, entry];
    while (updated.length > 1 && JSON.stringify(updated).length > MAX_BYTES) {
      updated = updated.slice(1);
    }
    figma.currentPage.setSharedPluginData(NAMESPACE, LOG_KEY, JSON.stringify(updated));
    return updated;
  }

  // src/main/generation/markers.ts
  var MARKER_BLUE = { r: 51 / 255, g: 108 / 255, b: 255 / 255 };
  var MARKER_STROKE_WIDTH = 2;
  var MARKER_PADDING = 6;
  var CIRCLE_DIAMETER = 24;
  var MARKER_FONT = { family: "Inter", style: "Bold" };
  async function createMarkerForItem(node, index) {
    const bounds = node.absoluteBoundingBox;
    if (!bounds) {
      throw new Error(`N\xE3o foi poss\xEDvel ler a posi\xE7\xE3o do componente "${node.name}".`);
    }
    const outline = figma.createRectangle();
    outline.name = `Marca\xE7\xE3o ${formatIndex(index)} - contorno`;
    outline.x = bounds.x - MARKER_PADDING;
    outline.y = bounds.y - MARKER_PADDING;
    outline.resize(bounds.width + MARKER_PADDING * 2, bounds.height + MARKER_PADDING * 2);
    outline.fills = [];
    outline.strokes = [{ type: "SOLID", color: MARKER_BLUE }];
    outline.strokeWeight = MARKER_STROKE_WIDTH;
    outline.dashPattern = [4, 4];
    outline.cornerRadius = 4;
    const circle = figma.createEllipse();
    circle.name = `Marca\xE7\xE3o ${formatIndex(index)} - c\xEDrculo`;
    circle.resize(CIRCLE_DIAMETER, CIRCLE_DIAMETER);
    circle.x = bounds.x - MARKER_PADDING - CIRCLE_DIAMETER / 2;
    circle.y = bounds.y - MARKER_PADDING - CIRCLE_DIAMETER / 2;
    circle.fills = [{ type: "SOLID", color: MARKER_BLUE }];
    circle.strokes = [];
    await figma.loadFontAsync(MARKER_FONT);
    const label = figma.createText();
    label.fontName = MARKER_FONT;
    label.characters = formatIndex(index);
    label.fontSize = 12;
    label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    label.textAlignHorizontal = "CENTER";
    label.textAlignVertical = "CENTER";
    label.textAutoResize = "NONE";
    label.resize(CIRCLE_DIAMETER, CIRCLE_DIAMETER);
    label.x = circle.x;
    label.y = circle.y;
    const group = figma.group([outline, circle, label], figma.currentPage);
    group.name = `Marca\xE7\xE3o ${formatIndex(index)} - ${node.name}`;
    return group;
  }
  function formatIndex(index) {
    return String(index + 1).padStart(2, "0");
  }
  async function generateMarkers(items, onProgress) {
    const createdGroups = [];
    const missingNodeErrors = [];
    const ordered = [...items].sort((a, b) => a.order - b.order);
    const total = ordered.length;
    onProgress == null ? void 0 : onProgress(0, total);
    for (let i = 0; i < ordered.length; i += 1) {
      const item = ordered[i];
      const node = await figma.getNodeByIdAsync(item.nodeId);
      if (!node || !("absoluteBoundingBox" in node)) {
        missingNodeErrors.push(item.nodeName);
        onProgress == null ? void 0 : onProgress(i + 1, total);
        continue;
      }
      const group = await createMarkerForItem(node, i);
      createdGroups.push(group);
      onProgress == null ? void 0 : onProgress(i + 1, total);
    }
    return { createdGroups, missingNodeErrors };
  }

  // src/main/generation/panel.ts
  var PANEL_WIDTH = 440;
  var PANEL_GAP_FROM_SCREEN = 80;
  var PANEL_BG = { r: 24 / 255, g: 27 / 255, b: 24 / 255 };
  var BADGE_BLUE = { r: 51 / 255, g: 108 / 255, b: 255 / 255 };
  var TEXT_WHITE = { r: 1, g: 1, b: 1 };
  var TEXT_MUTED = { r: 169 / 255, g: 175 / 255, b: 170 / 255 };
  var DIVIDER_COLOR = { r: 1, g: 1, b: 1 };
  var DIVIDER_OPACITY = 0.1;
  var BADGE_DIAMETER = 40;
  var TITLE_FONT = { family: "Inter", style: "Bold" };
  var ENTRY_TITLE_FONT = { family: "Inter", style: "Bold" };
  var LABEL_FONT = { family: "Inter", style: "Bold" };
  var BODY_FONT = { family: "Inter", style: "Regular" };
  function typeLabelFor(markupType) {
    var _a;
    const type = MARKUP_TYPES.find((t) => t.key === markupType);
    return (_a = type == null ? void 0 : type.label) != null ? _a : UNSPECIFIED_TYPE_LABEL;
  }
  async function loadFonts() {
    await Promise.all([
      figma.loadFontAsync(TITLE_FONT),
      figma.loadFontAsync(ENTRY_TITLE_FONT),
      figma.loadFontAsync(LABEL_FONT),
      figma.loadFontAsync(BODY_FONT)
    ]);
  }
  function appendSized(parent, child, sizing) {
    parent.appendChild(child);
    if (child.type === "TEXT" && sizing.horizontal) {
      child.textAutoResize = "HEIGHT";
    }
    if (sizing.horizontal && "layoutSizingHorizontal" in child) {
      child.layoutSizingHorizontal = sizing.horizontal;
    }
    if (sizing.vertical && child.type !== "TEXT" && "layoutSizingVertical" in child) {
      child.layoutSizingVertical = sizing.vertical;
    }
  }
  function createPlainText(characters, font, size, color) {
    const text = figma.createText();
    text.fontName = font;
    text.characters = characters;
    text.fontSize = size;
    text.fills = [{ type: "SOLID", color }];
    return text;
  }
  async function createBadge(index) {
    const badge = figma.createFrame();
    badge.name = "Badge";
    badge.layoutMode = "VERTICAL";
    badge.primaryAxisAlignItems = "CENTER";
    badge.counterAxisAlignItems = "CENTER";
    badge.primaryAxisSizingMode = "FIXED";
    badge.counterAxisSizingMode = "FIXED";
    badge.resize(BADGE_DIAMETER, BADGE_DIAMETER);
    badge.cornerRadius = BADGE_DIAMETER / 2;
    badge.fills = [{ type: "SOLID", color: BADGE_BLUE }];
    const label = createPlainText(String(index + 1).padStart(2, "0"), LABEL_FONT, 13, TEXT_WHITE);
    badge.appendChild(label);
    return badge;
  }
  function createDividerRect() {
    const rect = figma.createRectangle();
    rect.resize(1, 1);
    rect.fills = [{ type: "SOLID", color: DIVIDER_COLOR }];
    rect.opacity = DIVIDER_OPACITY;
    return rect;
  }
  async function createEntryRow(item, index, isLast, readingOrderNumber, focusOrderNumber) {
    const row = figma.createFrame();
    row.name = `Especifica\xE7\xE3o ${String(index + 1).padStart(2, "0")}`;
    row.layoutMode = "VERTICAL";
    row.itemSpacing = 20;
    row.paddingTop = 24;
    row.paddingBottom = isLast ? 24 : 0;
    row.paddingLeft = 0;
    row.paddingRight = 0;
    row.fills = [];
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "FIXED";
    const header = figma.createFrame();
    header.name = "Cabe\xE7alho";
    header.layoutMode = "HORIZONTAL";
    header.itemSpacing = 16;
    header.counterAxisAlignItems = "CENTER";
    header.fills = [];
    header.primaryAxisSizingMode = "AUTO";
    header.counterAxisSizingMode = "AUTO";
    const badge = await createBadge(index);
    header.appendChild(badge);
    badge.layoutSizingHorizontal = "FIXED";
    badge.layoutSizingVertical = "FIXED";
    const textColumn = figma.createFrame();
    textColumn.name = "Textos";
    textColumn.layoutMode = "VERTICAL";
    textColumn.itemSpacing = 6;
    textColumn.fills = [];
    textColumn.primaryAxisSizingMode = "AUTO";
    textColumn.counterAxisSizingMode = "FIXED";
    header.appendChild(textColumn);
    textColumn.layoutSizingHorizontal = "FILL";
    textColumn.layoutSizingVertical = "HUG";
    const title = createPlainText(item.nodeName, ENTRY_TITLE_FONT, 15, TEXT_WHITE);
    appendSized(textColumn, title, { horizontal: "FILL" });
    const typeLine = createPlainText(typeLabelFor(item.markupType), BODY_FONT, 12, TEXT_MUTED);
    appendSized(textColumn, typeLine, { horizontal: "FILL" });
    if (readingOrderNumber !== null) {
      const readingOrderLine = createPlainText(`Ordem de leitura: ${readingOrderNumber}`, BODY_FONT, 12, TEXT_MUTED);
      appendSized(textColumn, readingOrderLine, { horizontal: "FILL" });
    }
    if (focusOrderNumber !== null) {
      const focusLine = createPlainText(`Ordem de foco: ${focusOrderNumber}`, BODY_FONT, 12, BADGE_BLUE);
      appendSized(textColumn, focusLine, { horizontal: "FILL" });
    }
    appendSized(row, header, { horizontal: "FILL", vertical: "HUG" });
    const verbalizationLabel = createPlainText("Verbaliza\xE7\xE3o esperada:", LABEL_FONT, 12, TEXT_MUTED);
    appendSized(row, verbalizationLabel, { horizontal: "FILL" });
    const verbalizationText = createPlainText(
      item.verbalization.length > 0 ? item.verbalization : "\u2014",
      BODY_FONT,
      13,
      TEXT_MUTED
    );
    appendSized(row, verbalizationText, { horizontal: "FILL" });
    if (!isLast) {
      const divider = createDividerRect();
      appendSized(row, divider, { horizontal: "FILL", vertical: "FIXED" });
    }
    return row;
  }
  function createReadingOrderRow(readingOrderCount, hasMoreRows) {
    const row = figma.createFrame();
    row.name = "Ordem de leitura";
    row.layoutMode = "VERTICAL";
    row.itemSpacing = 16;
    row.paddingTop = 0;
    row.paddingBottom = 20;
    row.paddingLeft = 0;
    row.paddingRight = 0;
    row.fills = [];
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "FIXED";
    const totalLabel = String(readingOrderCount).padStart(2, "0");
    const text = createPlainText(`01 a ${totalLabel} - Ordem de leitura`, ENTRY_TITLE_FONT, 15, TEXT_WHITE);
    appendSized(row, text, { horizontal: "FILL" });
    if (hasMoreRows) {
      const divider = createDividerRect();
      appendSized(row, divider, { horizontal: "FILL", vertical: "FIXED" });
    }
    return row;
  }
  async function generatePanel(screenNode, items) {
    var _a, _b;
    await loadFonts();
    const ordered = [...items].sort((a, b) => a.order - b.order);
    const panel = figma.createFrame();
    panel.name = "Especifica\xE7\xE3o de Acessibilidade";
    panel.layoutMode = "VERTICAL";
    panel.itemSpacing = 0;
    panel.paddingTop = 32;
    panel.paddingBottom = 8;
    panel.paddingLeft = 32;
    panel.paddingRight = 32;
    panel.primaryAxisSizingMode = "AUTO";
    panel.counterAxisSizingMode = "FIXED";
    panel.resize(PANEL_WIDTH, panel.height);
    panel.fills = [{ type: "SOLID", color: PANEL_BG }];
    panel.cornerRadius = 12;
    const title = createPlainText("ESPECIFICA\xC7\xC3O DE ACESSIBILIDADE", TITLE_FONT, 16, TEXT_WHITE);
    appendSized(panel, title, { horizontal: "FILL" });
    const titleSpacer = figma.createFrame();
    titleSpacer.name = "Espa\xE7o";
    titleSpacer.fills = [];
    titleSpacer.resize(1, 16);
    appendSized(panel, titleSpacer, { horizontal: "FILL", vertical: "FIXED" });
    let nextReadingOrderNumber = 1;
    const readingOrderByItemId = /* @__PURE__ */ new Map();
    for (const item of ordered) {
      if (item.markupType !== DECORATIVE_MARKUP_TYPE) {
        readingOrderByItemId.set(item.id, nextReadingOrderNumber);
        nextReadingOrderNumber += 1;
      }
    }
    const readingOrderCount = readingOrderByItemId.size;
    const readingOrderRow = createReadingOrderRow(readingOrderCount, ordered.length > 0);
    appendSized(panel, readingOrderRow, { horizontal: "FILL", vertical: "HUG" });
    let nextFocusNumber = 1;
    const focusOrderByItemId = /* @__PURE__ */ new Map();
    for (const item of ordered) {
      if (item.focusEligible) {
        focusOrderByItemId.set(item.id, nextFocusNumber);
        nextFocusNumber += 1;
      }
    }
    for (let i = 0; i < ordered.length; i += 1) {
      const row = await createEntryRow(
        ordered[i],
        i,
        i === ordered.length - 1,
        (_a = readingOrderByItemId.get(ordered[i].id)) != null ? _a : null,
        (_b = focusOrderByItemId.get(ordered[i].id)) != null ? _b : null
      );
      appendSized(panel, row, { horizontal: "FILL", vertical: "HUG" });
    }
    const bounds = screenNode.absoluteBoundingBox;
    if (bounds) {
      panel.x = bounds.x + bounds.width + PANEL_GAP_FROM_SCREEN;
      panel.y = bounds.y;
    }
    figma.currentPage.appendChild(panel);
    return panel;
  }

  // src/main/generation/previewMarker.ts
  var previewMarkerGroup = null;
  async function showPreviewMarker(nodeId, index) {
    clearPreviewMarker();
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !("absoluteBoundingBox" in node) || !node.absoluteBoundingBox) {
      return;
    }
    previewMarkerGroup = await createMarkerForItem(node, index);
  }
  function clearPreviewMarker() {
    if (!previewMarkerGroup) return;
    try {
      previewMarkerGroup.remove();
    } catch (e) {
    }
    previewMarkerGroup = null;
  }

  // src/main/code.ts
  var UI_WIDTH = 420;
  var UI_HEIGHT = 700;
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: false });
  figma.on("close", () => {
    clearPreviewMarker();
  });
  var lastAnalyzedScreenId = null;
  var manualSelectionEnabled = false;
  var knownNodeIds = /* @__PURE__ */ new Set();
  var stopManualSelectionListener = null;
  var lastGeneratedOutputNodeId = null;
  function buildComponentTypeOptions() {
    const fromMarkupTypes = MARKUP_TYPES.map((type) => ({
      key: type.key,
      label: type.label
    }));
    return [...fromMarkupTypes, { key: UNSPECIFIED_TYPE_KEY, label: UNSPECIFIED_TYPE_LABEL }];
  }
  function resetFlowState() {
    lastAnalyzedScreenId = null;
    knownNodeIds = /* @__PURE__ */ new Set();
    lastGeneratedOutputNodeId = null;
    setManualSelectionEnabled(false);
    clearPreviewMarker();
  }
  function sendSelectionState() {
    const selection = getCurrentSelection();
    if (selection.length === 1 && isValidScreenNode(selection[0])) {
      const node = selection[0];
      const bounds = "absoluteBoundingBox" in node ? node.absoluteBoundingBox : null;
      postToUi({
        type: "selection-state",
        valid: true,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        width: bounds ? bounds.width : void 0,
        height: bounds ? bounds.height : void 0,
        layerCount: countDescendants(node)
      });
    } else {
      postToUi({ type: "selection-state", valid: false, nodeId: null, nodeName: null });
    }
  }
  async function runAnalysis() {
    const selection = getCurrentSelection();
    if (selection.length !== 1 || !isValidScreenNode(selection[0])) {
      postToUi({ type: "analysis-error", message: "Selecione um \xFAnico frame, grupo ou auto layout." });
      return;
    }
    const screenNode = selection[0];
    lastAnalyzedScreenId = screenNode.id;
    const result = await analyzeScreenRememberingContext(screenNode);
    emitAnalysisResult(result);
  }
  async function analyzeScreenRememberingContext(screenNode) {
    const result = await analyzeScreen(screenNode);
    if (!result.requiresContextChoice) {
      return result;
    }
    const remembered = getRememberedScreenContext();
    if (!remembered) {
      return result;
    }
    return analyzeScreen(screenNode, remembered);
  }
  function emitAnalysisResult(result) {
    knownNodeIds = new Set(result.items.map((item) => item.nodeId));
    postToUi({ type: "analysis-result", result });
  }
  async function resolveContextChoice(context) {
    if (!lastAnalyzedScreenId) {
      postToUi({ type: "analysis-error", message: "Nenhuma tela analisada. Selecione uma tela novamente." });
      return;
    }
    const node = await figma.getNodeByIdAsync(lastAnalyzedScreenId);
    if (!node || !isValidScreenNode(node)) {
      postToUi({ type: "analysis-error", message: "A tela selecionada n\xE3o existe mais no arquivo." });
      return;
    }
    rememberScreenContext(context);
    const result = await analyzeScreen(node, context);
    emitAnalysisResult(result);
  }
  function setManualSelectionEnabled(enabled) {
    manualSelectionEnabled = enabled;
    if (stopManualSelectionListener) {
      stopManualSelectionListener();
      stopManualSelectionListener = null;
    }
    if (!enabled) {
      return;
    }
    stopManualSelectionListener = onSelectionChange(() => {
      void handleManualSelectionChange();
    });
  }
  async function handleManualSelectionChange() {
    if (!manualSelectionEnabled) {
      return;
    }
    const selection = getCurrentSelection();
    for (const node of selection) {
      if (knownNodeIds.has(node.id)) {
        postToUi({ type: "manual-item-duplicate", nodeId: node.id });
        continue;
      }
      const item = await buildManualItem(node, knownNodeIds.size);
      knownNodeIds.add(node.id);
      postToUi({ type: "manual-item-added", item });
    }
  }
  async function generateSpecifications(items) {
    try {
      clearPreviewMarker();
      if (!lastAnalyzedScreenId) {
        postToUi({ type: "generation-error", message: "Nenhuma tela associada a esta especifica\xE7\xE3o." });
        return;
      }
      const screenNode = await figma.getNodeByIdAsync(lastAnalyzedScreenId);
      if (!screenNode) {
        postToUi({ type: "generation-error", message: "A tela selecionada n\xE3o existe mais no arquivo." });
        return;
      }
      postToUi({ type: "generation-progress", stage: "reading-order", done: 0, total: 1 });
      const ordered = [...items].sort((a, b) => a.order - b.order);
      postToUi({ type: "generation-progress", stage: "reading-order", done: 1, total: 1 });
      const { missingNodeErrors } = await generateMarkers(ordered, (done, total) => {
        postToUi({ type: "generation-progress", stage: "markers", done, total });
      });
      postToUi({ type: "generation-progress", stage: "table", done: 0, total: 1 });
      const panel = await generatePanel(screenNode, ordered);
      postToUi({ type: "generation-progress", stage: "table", done: 1, total: 1 });
      lastGeneratedOutputNodeId = panel.id;
      const summary = {
        componentCount: ordered.length,
        verbalizationCount: ordered.filter((item) => item.verbalization.trim().length > 0).length,
        warningCount: missingNodeErrors.length,
        screenName: screenNode.name,
        outputNodeId: panel.id
      };
      postToUi({ type: "generation-complete", summary });
      const logEntry = {
        dateIso: (/* @__PURE__ */ new Date()).toISOString(),
        designerName: getCurrentUserName(),
        screenName: screenNode.name,
        items: ordered.map((item) => {
          var _a, _b;
          return {
            nodeName: item.nodeName,
            markupTypeLabel: (_b = (_a = MARKUP_TYPES.find((t) => t.key === item.markupType)) == null ? void 0 : _a.label) != null ? _b : UNSPECIFIED_TYPE_LABEL,
            verbalization: item.verbalization
          };
        })
      };
      const updatedLog = appendUsageLogEntry(logEntry);
      postToUi({ type: "usage-log", entries: updatedLog });
    } catch (error) {
      console.error("Falha ao gerar especifica\xE7\xF5es:", error);
      postToUi({
        type: "generation-error",
        message: "N\xE3o foi poss\xEDvel concluir a gera\xE7\xE3o. Os itens da lista foram preservados."
      });
    }
  }
  var selectionListenerRegistered = false;
  function safely(label, fn) {
    try {
      fn();
    } catch (error) {
      console.error(`Falha ao inicializar "${label}":`, error);
    }
  }
  figma.ui.onmessage = (message) => {
    switch (message.type) {
      case "ui-ready":
        if (!selectionListenerRegistered) {
          safely("listener de sele\xE7\xE3o", () => {
            onSelectionChange(sendSelectionState);
            selectionListenerRegistered = true;
          });
        }
        safely("estado inicial de sele\xE7\xE3o", sendSelectionState);
        safely(
          "nome do designer",
          () => postToUi({ type: "designer-name", name: getCurrentUserName() })
        );
        safely(
          "tipos de componente",
          () => postToUi({ type: "component-type-options", domain: "accessibility", options: buildComponentTypeOptions() })
        );
        safely("hist\xF3rico de uso da p\xE1gina", () => postToUi({ type: "usage-log", entries: getUsageLog() }));
        break;
      case "request-selection-state":
        sendSelectionState();
        break;
      case "start-analysis":
        void runAnalysis();
        break;
      case "resolve-context-choice":
        void resolveContextChoice(message.context);
        break;
      case "toggle-manual-selection":
        setManualSelectionEnabled(message.enabled);
        break;
      case "sync-known-node-ids":
        knownNodeIds = new Set(message.nodeIds);
        break;
      case "generate-specifications":
        void generateSpecifications(message.items);
        break;
      case "preview-marker":
        void showPreviewMarker(message.nodeId, message.index);
        break;
      case "clear-preview-marker":
        clearPreviewMarker();
        break;
      case "focus-node":
        void focusNode(message.nodeId).then((found) => {
          if (!found) {
            figma.notify("Componente n\xE3o encontrado");
          }
        });
        break;
      case "focus-generation-output":
        if (lastGeneratedOutputNodeId) {
          void focusNode(lastGeneratedOutputNodeId).then((found) => {
            if (!found) {
              figma.notify("Painel de especifica\xE7\xF5es n\xE3o encontrado");
            }
          });
        }
        break;
      case "reset-flow":
        resetFlowState();
        break;
      case "close-plugin":
        figma.closePlugin();
        break;
      default:
        break;
    }
  };
})();
