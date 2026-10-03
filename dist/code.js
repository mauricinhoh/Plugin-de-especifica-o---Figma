"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
    "titulo com hierarquia logica": (data) => data.text,
    // Sinônimos específicos por posição, confirmados no Banner Image
    // Full (título, descrição e rótulo do botão, cada um na sua posição,
    // todos no mesmo card — ver extração "tres-posicoes"). Diferente do
    // "label" genérico acima (que sempre é a PRIMEIRA posição), esses
    // são explícitos sobre qual posição querem.
    "label do titulo": (data) => data.text,
    "label da descricao": (data) => data.text2,
    "rotulo do botao": (data) => data.text3,
    // Segunda posição de texto (ex.: a descrição do Empty State, que é
    // sempre o SEGUNDO texto do componente, não relacionado a tamanho
    // de fonte — ver rules/accessibility-rules-data.ts, extração
    // "duas-posicoes"). Só populado para componentes que usam essa
    // extração; nos demais este placeholder simplesmente não resolve.
    "leitura do conteudo": (data) => data.text2,
    descricao: (data) => data.text2,
    // Nível de título (h1–h6), calculado a partir do tamanho da fonte
    // do TEXT — não é o mesmo dado que os outros (não é o texto visível,
    // é um número deduzido). Ver main/analysis/headingDetection.ts.
    // Só existe em `extractedData.nivel` quando o node é um TEXT solto
    // reconhecido como título; para os demais casos o placeholder
    // simplesmente não resolve (fica como está, sem inventar nível).
    "ordem logica": (data) => data.nivel,
    // Lista já formatada item a item (ex.: níveis do Breadcrumb) — ver
    // computeVerbalization em engine.ts.
    niveis: (data) => data.niveis,
    // Abas já formatadas (ex.: Tab) e, dentro de cada linha, a posição e
    // o total — ver computeVerbalization em engine.ts. Só existem durante
    // a montagem das abas; fora disso não resolvem.
    abas: (data) => data.abas,
    posicao: (data) => data.posicao,
    total: (data) => data.total
    // Deliberadamente SEM resolver (ficam como template editável):
    // "placeholder", "conteudo preenchido", "texto de suporte",
    // "texto de apoio", "heading", "mensagem", "mensagem de erro",
    // "alt-text", "carregando", "description",
    // "helper text", "mascara", "nivel", "posicao", "posicao e total de
    // etapas", "valor", "x de x", "x itens", "contador" — são textos
    // DIFERENTES do texto/rótulo principal do componente (ou dados que
    // o plugin não consegue extrair, como contadores/posição), então
    // resolver automático arriscaria pegar o texto errado ou inventar
    // um número.
  };
  function normalizePlaceholderName(raw) {
    return raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }
  var PLACEHOLDER_PATTERN = /\(([^()]+)\)|\[([^[\]]+)\]|\{([^{}]+)\}/g;
  function resolvePlaceholders(template, extractedData) {
    return template.replace(PLACEHOLDER_PATTERN, (match, viaParens, viaBrackets, viaBraces) => {
      var _a2;
      const rawName = (_a2 = viaParens != null ? viaParens : viaBrackets) != null ? _a2 : viaBraces;
      const key = normalizePlaceholderName(rawName);
      const byLayer = extractedData[`camada:${key}`];
      if (byLayer !== void 0) {
        return byLayer;
      }
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
    var _a2, _b, _c;
    if (!rule || !rule.hasVerbalization) {
      return "";
    }
    const template = rule.templateWithoutTitle && extractedData.text === void 0 && extractedData.text2 !== void 0 ? rule.templateWithoutTitle : rule.templateWithoutDescription && extractedData.text !== void 0 && extractedData.text2 === void 0 ? rule.templateWithoutDescription : (_a2 = selectVerbalizationTemplate(rule, variantValues)) != null ? _a2 : rule.template;
    if (!template) {
      return "";
    }
    if (rule.tabFormat && extractedData.abas) {
      let tabs = [];
      try {
        tabs = JSON.parse(extractedData.abas);
      } catch (e) {
        tabs = [];
      }
      const format = rule.tabFormat;
      const formatted = tabs.map(
        (tab, index) => resolvePlaceholders(tab.selected ? format.selecionada : format.naoSelecionada, {
          text: tab.label,
          posicao: String(index + 1),
          total: String(tabs.length)
        })
      ).join((_b = format.separador) != null ? _b : "\n");
      return resolvePlaceholders(template, __spreadProps(__spreadValues({}, extractedData), { abas: formatted }));
    }
    if (rule.listFormat && extractedData.lista) {
      let items = [];
      try {
        items = JSON.parse(extractedData.lista);
      } catch (e) {
        items = [];
      }
      const format = rule.listFormat;
      const formatted = items.map(
        (text, index) => resolvePlaceholders(index === items.length - 1 ? format.ultimo : format.item, { text })
      ).join((_c = format.separador) != null ? _c : ", ");
      return resolvePlaceholders(template, __spreadProps(__spreadValues({}, extractedData), { niveis: formatted }));
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

  // src/rules/accessibility-rules-data.ts
  var accessibilityRuleRecords = [
    {
      "categoria": "Action",
      "componente": "Button Group",
      "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si n\xE3o possui estados pr\xF3prios.",
      "verbalizacaoEsperada": "Default: \u201C[Label], Bot\xE3o\u201D.\nBot\xE3o desabilitado: \u201C[Label], Indispon\xEDvel, Bot\xE3o\u201D.\nHabilitado: \u201C[Label], Bot\xE3o\u201D.\nLoading: \u201CCarregando\u201D ",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "somenteFilhos": true
    },
    {
      "categoria": "Action",
      "componente": "Button Icon",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201C[Label], Bot\xE3o.\u201D\nDisabled: \u201C[Label], Indispon\xEDvel, Bot\xE3o.\u201D\nFocus: \u201C[Label], Bot\xE3o.\u201D\n",
      "tipo": "Bot\xE3o",
      "foco": "Sim",
      "verbalizacaoDentroDe": {
        "Drawer": "Habilitado: \u201CFechar, Bot\xE3o.\u201D\nDisabled: \u201CFechar, Indispon\xEDvel, Bot\xE3o.\u201D\nFocus: \u201CFechar, Bot\xE3o.\u201D",
        "Modal": "Fechar, Bot\xE3o"
      }
    },
    {
      "categoria": "Action",
      "componente": "Button Mini",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201C[Label], Bot\xE3o.\u201D\nDisabled: \u201C[Label] Indispon\xEDvel, Bot\xE3o.\u201D\nFocus: \u201C[Label], Bot\xE3o.\u201D",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Primary",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Bot\xE3o\u201D.\nLoading macOS: \u201CCarregando\u201D.\nLoading Windows: \u201C[Carregando]\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label] Indispon\xEDvel, Bot\xE3o\u201D.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Secondary",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Bot\xE3o\u201D.\nLoading macOS: \u201CCarregando\u201D.\nLoading Windows: \u201C[Carregando]\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label] Indispon\xEDvel, Bot\xE3o\u201D.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Shortcut",
      "estados": "Habilitado, Focus, Hover, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Link.\u201D\nDisabled: \u201C[Label], Indispon\xEDvel, Link.\u201D",
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
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Link.\u201D\nExterno: \u201C[Label], Link externo.\u201D",
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
      "verbalizacaoEsperada": 'Hiden true: "Valor oculto" Hiden false positive: "[Label]" Hiden true negative: "Menos [Label]"',
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
      "verbalizacaoEsperada": "[Label]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Brand",
      "estados": "Est\xE1tico; quando usado como link, possui intera\xE7\xE3o.",
      "verbalizacaoEsperada": 'Quando ilustrativo: "Logo Sicredi." Quando link: "Tela inicial do Internet banking do Sicredi, Link"',
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
      "verbalizacaoEsperada": 'Verbaliza cada componente separadamente. T\xEDtulo: "[T\xEDtulo com hierarquia l\xF3gica]" Descri\xE7\xE3o: "[Leitura do conte\xFAdo]", Button primary: "[r\xF3tulo do bot\xE3o], Bot\xE3o"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "tres-posicoes"
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
      "somenteFilhos": true
    },
    {
      "categoria": "Content",
      "componente": "List Ghost",
      "estados": "Padr\xE3o, est\xE1tico.",
      "verbalizacaoEsperada": "[Label]",
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
      "verbalizacaoEsperada": "Segue a documenta\xE7\xE3o da tabela:\nhttps://sicredi.atlassian.net/wiki/spaces/TCD/pages/556172391/Exemplos+de+especifica+es",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "links": [
        {
          "text": "https://sicredi.atlassian.net/wiki/spaces/TCD/pages/556172391/Exemplos+de+especifica+es",
          "url": "https://sicredi.atlassian.net/wiki/spaces/TCD/pages/556172391/Exemplos+de+especifica+es"
        }
      ]
    },
    {
      "categoria": "Containers",
      "componente": "Card",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "sempreAprofundar": true
    },
    {
      "categoria": "Containers",
      "componente": "Banner Image Full",
      "estados": "Habilitado, Focus, Hover, relacionados \xE0 a\xE7\xE3o.",
      "verbalizacaoEsperada": "[label do T\xEDtulo], [label da descri\xE7\xE3o], [r\xF3tulo do bot\xE3o], Bot\xE3o",
      "tipo": "Imagem",
      "foco": "N\xE3o",
      "extracaoTexto": "tres-posicoes",
      "aliasesDeNome": [
        "Banner Full Image"
      ]
    },
    {
      "categoria": "Containers",
      "componente": "Modal",
      "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Icon button X: "Fechar, Bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "ultimosDentro": [
        "Button Icon"
      ],
      "somenteFilhos": true
    },
    {
      "categoria": "Containers",
      "componente": "Cookies",
      "estados": "Vis\xEDvel e Aceito.",
      "verbalizacaoEsperada": "[label do T\xEDtulo], [label da descri\xE7\xE3o], [r\xF3tulo do bot\xE3o], Bot\xE3o",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "tres-posicoes"
    },
    {
      "categoria": "Containers",
      "componente": "Fixed Bar",
      "estados": "Estrutural, sem estados pr\xF3prios.",
      "verbalizacaoEsperada": '"[Label], Bot\xE3o"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "todos",
      "somenteFilhos": true,
      "ignorarTextoSolto": true
    },
    {
      "categoria": "Containers",
      "componente": "Drawer",
      "estados": "Aberto e Fechado.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Icon button X: "Fechar, Bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "ultimosDentro": [
        "Button Icon"
      ],
      "somenteFilhos": true
    },
    {
      "categoria": "Containers",
      "componente": "Card Review",
      "estados": "Default, Ativo e Enviado.",
      "verbalizacaoEsperada": 'Ordem l\xF3gica dos componentes. Contador de caracteres verbalizado antes do conte\xFAdo do input. Cada estrela verbaliza posi\xE7\xE3o e total de estrelas, exemplo "Uma estrela, Bot\xE3o de op\xE7\xE3o, N\xE3o marcado, 1 de 5"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Feedback",
      "componente": "Alert",
      "estados": "Ativo e Encerrado.",
      "verbalizacaoEsperada": "[T\xEDtulo], [Descri\xE7\xE3o], Fechar, Bot\xE3o",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "titulo-descricao",
      "verbalizacaoSemTitulo": "[Descri\xE7\xE3o], Fechar, Bot\xE3o",
      "somenteTextosProprios": true
    },
    {
      "categoria": "Feedback",
      "componente": "Flag",
      "estados": "Estrutural; links internos herdam estados pr\xF3prios.",
      "verbalizacaoEsperada": "[T\xEDtulo], [Descri\xE7\xE3o], Link",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "titulo-descricao",
      "verbalizacaoSemTitulo": "[Descri\xE7\xE3o], Link"
    },
    {
      "categoria": "Feedback",
      "componente": "Flag Cooperado",
      "estados": "Estrutural e n\xE3o interativo; links internos herdam estados.",
      "verbalizacaoEsperada": "[T\xEDtulo], [Descri\xE7\xE3o], Link",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "titulo-descricao",
      "verbalizacaoSemTitulo": "[Descri\xE7\xE3o], Link"
    },
    {
      "categoria": "Feedback",
      "componente": "Toast",
      "estados": "Exibido e Oculto.",
      "verbalizacaoEsperada": '"[label]. Link, Fechar, Bot\xE3o".',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos"
    },
    {
      "categoria": "Feedback",
      "componente": "Tooltip",
      "estados": "Inativo: Tooltip n\xE3o vis\xEDvel.\n\nAtivo: Tooltip vis\xEDvel por hover ou foco.",
      "verbalizacaoEsperada": "[Label]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Inputs",
      "componente": "Checkbox",
      "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
      "verbalizacaoEsperada": "Marcado: \u201C[Label], Caixa de sele\xE7\xE3o, Marcado.\u201D\nDesmarcado: \u201C[texto da label], Caixa de sele\xE7\xE3o, N\xE3o marcado.\u201D\nParcialmente marcado: \u201C{r\xF3tulo}, Caixa de sele\xE7\xE3o parcialmente marcada.\u201D\nDesabilitado: \u201C{r\xF3tulo}, Caixa de sele\xE7\xE3o desabilitada.\u201D",
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
      "verbalizacaoEsperada": "[Label], Remover, Bot\xE3o",
      "tipo": "Entrada",
      "foco": "Sim",
      "cardPorItem": true
    },
    {
      "categoria": "Inputs",
      "componente": "Chip Select",
      "estados": "Habilitado, Focus, Hover.",
      "verbalizacaoEsperada": 'Desmarcado:"[texto da label], Caixa de sele\xE7\xE3o, N\xE3o marcado". Marcado: "[Label], Caixa de sele\xE7\xE3o, Marcado".',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Date Picker",
      "estados": "Default: exibe o valor padr\xE3o ou o valor selecionado pelo usu\xE1rio\n\nHover: componente recebeu foco com mouse, alterando visualmente seu estilo\n\nSelected: componente est\xE1 com sua lista de op\xE7\xF5es aberta, tendo o mesmo estilo visual do Hover",
      "verbalizacaoEsperada": 'Para o campo de ano: "Anterior, Bot\xE3o", "Dois mil e vinte dois", "Pr\xF3ximo, Bot\xE3o". Para o campo de m\xEAs: "Anterior, Bot\xE3o", "Fevereiro", "Pr\xF3ximo, Bot\xE3o". Os dias s\xE3o anunciados juntamente com o m\xEAs e o ano e dia da semana.\n',
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
      "verbalizacaoEsperada": 'Quando vazio: Label acess\xEDvel "Informe o c\xF3digo, [posi\xE7\xE3o], Campo de edi\xE7\xE3o". Quando preenchido: Label acess\xEDvel "Informe o c\xF3digo, Marcador, [posi\xE7\xE3o], Campo de edi\xE7\xE3o".\n',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code Number",
      "estados": "habilitado, focus, hover e preenchido;",
      "verbalizacaoEsperada": "Ao focar em cada um dos bot\xF5es leitor anuncia: \u201C6 ou 1, Bot\xE3o\u201D.\nFeedback din\xE2mico:\nQuando uma tecla \xE9 acionada, o campo de senha atualiza\u2028 \u201Cx d\xEDgitos inseridos\u201D\nBot\xE3o Limpar:\nDeve anunciar \u201CCaracteres apagados\u201D ap\xF3s a\xE7\xE3o.",
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Input Date",
      "estados": "Padr\xE3o: campo vazio e pronto para entrada.\n\nAberto: exibe o calend\xE1rio de sele\xE7\xE3o de data.\n\nFoco: realce visual e leitura de r\xF3tulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com intera\xE7\xE3o bloqueada",
      "verbalizacaoEsperada": 'Recolhido: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Calend\xE1rio, Recolhido, Bot\xE3o" Expandido: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Expandido, Bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "label": [
          "label",
          "rotulo"
        ],
        "placeholder": [
          "placeholder"
        ],
        "helper text": [
          "help",
          "texto de apoio",
          "texto de ajuda",
          "texto de suporte",
          "suporte",
          "support"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Input Password",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": 'Olho aberto/valor oculto: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Mostrar senha, Bot\xE3o" Olho fechado/valor vis\xEDvel: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Ocultar senha, Bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "label": [
          "label",
          "rotulo"
        ],
        "placeholder": [
          "placeholder"
        ],
        "helper text": [
          "help",
          "texto de apoio",
          "texto de ajuda",
          "texto de suporte",
          "suporte",
          "support"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Input Select",
      "estados": "Default, Filled, Hover, Active, Error, Disabled.",
      "verbalizacaoEsperada": 'Recolhido: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Recolhido, Bot\xE3o" Expandido: "[Label], [Placeholder], [Helper text], Campo de edi\xE7\xE3o, Expandido, Bot\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "label": [
          "label",
          "rotulo"
        ],
        "placeholder": [
          "placeholder"
        ],
        "helper text": [
          "help",
          "texto de apoio",
          "texto de ajuda",
          "texto de suporte",
          "suporte",
          "support"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": '"[label], [placeholder], [helper text], Campo de edi\xE7\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "label": [
          "label",
          "rotulo"
        ],
        "placeholder": [
          "placeholder"
        ],
        "helper text": [
          "help",
          "texto de apoio",
          "texto de ajuda",
          "texto de suporte",
          "suporte",
          "support"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text Area",
      "estados": "Default, Hover, Focus, Filled, Disabled, Error, Read-only.",
      "verbalizacaoEsperada": '"[label], [placeholder], [contador], [helper text], Caixa de edi\xE7\xE3o"',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "label": [
          "label",
          "rotulo"
        ],
        "placeholder": [
          "placeholder"
        ],
        "contador": [
          "contador",
          "counter",
          "caracteres",
          "character"
        ],
        "helper text": [
          "help",
          "texto de apoio",
          "texto de ajuda",
          "texto de suporte",
          "suporte",
          "support"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "List Select",
      "estados": "Herda do seletor interno: Hover, Focus, Checked, Unchecked, Disabled etc.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes com suas devidas sem\xE2nticas",
      "tipo": "Entrada",
      "foco": "Sim",
      "somenteFilhos": true
    },
    {
      "categoria": "Inputs",
      "componente": "Popover",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes.",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "somenteFilhos": true
    },
    {
      "categoria": "Inputs",
      "componente": "Popover Menu",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Ordem l\xF3gica dos componentes.",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "somenteFilhos": true
    },
    {
      "categoria": "Inputs",
      "componente": "Radio Button",
      "estados": "Selecionado, N\xE3o selecionado, Desabilitado.",
      "verbalizacaoEsperada": 'N\xE3o marcado: "[Label], Bot\xE3o de op\xE7\xE3o, N\xE3o marcado, [posi\xE7\xE3o]." Marcado: "[Label], Bot\xE3o de op\xE7\xE3o, Marcado, [posi\xE7\xE3o]."',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Rate Input",
      "estados": "Default, Selecionado, Desabilitado.",
      "verbalizacaoEsperada": 'Cada estrela verbaliza posi\xE7\xE3o e total de estrelas, exemplo "Uma estrela, Bot\xE3o de op\xE7\xE3o, N\xE3o marcado, 1 de 5"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Search",
      "estados": "Habilitado/Focus, Hover, Filled;",
      "verbalizacaoEsperada": "[Placeholder], Campo de Busca, Bot\xE3o",
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorCamada": {
        "placeholder": [
          "placeholder",
          "value",
          "valor",
          "conteudo",
          "texto",
          "text"
        ]
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Switch",
      "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
      "verbalizacaoEsperada": 'Pressionado: "[Label], Bot\xE3o de alternancia, Pressionado" N\xE3o pressionado: "[Label], Bot\xE3o de alternancia, N\xE3o pressionado"',
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Uploader",
      "estados": "Default: campo est\xE1 habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e est\xE1 com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou valida\xE7\xE3o.",
      "verbalizacaoEsperada": 'Default: "[Label], [Descri\xE7\xE3o], [helper text], [Label do bot\xE3o] bot\xE3o."\nLoading: "[Label], Carregando"\nError: "[Label], [helper text], Excluir arquivo, Bot\xE3o."\nComplete: "[Label], [helper text], Remover arquivo, Bot\xE3o."',
      "tipo": "Entrada",
      "foco": "Sim",
      "textosProprios": {
        "label": [
          "label",
          "rotulo",
          "titulo",
          "title"
        ],
        "descricao": [
          "descri"
        ],
        "helper text": [
          "help",
          "suporte",
          "support",
          "apoio"
        ]
      },
      "textoDoBotao": "label do botao",
      "stateFlagAliases": {
        "Completed": "Complete",
        "Active": "Default"
      }
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
      "verbalizacaoEsperada": "[n\xEDveis]",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "lista",
      "formatoLista": {
        "item": "[Label] Link",
        "ultimo": "[Label] P\xE1gina atual",
        "separador": ", "
      }
    },
    {
      "categoria": "Navigation",
      "componente": "Carousel Nav",
      "estados": "Herda de Page Indicator e Button Icon.",
      "verbalizacaoEsperada": "O leitor de tela anuncia os bot\xF5es como controles de navega\xE7\xE3o.\n\nExemplo: \u201CCarrossel. 3 itens. Item 1 de 3. Pr\xF3ximo, Bot\xE3o.\u201D",
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
      "verbalizacaoEsperada": '"[T\xEDtulo], T\xEDtulo de n\xEDvel [ordem l\xF3gica], [Descri\xE7\xE3o]". Flow: "[Alt-text]"',
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "cabecalho",
      "sempreAprofundar": true,
      "verbalizacaoSemDescricao": '"[T\xEDtulo], T\xEDtulo de n\xEDvel [ordem l\xF3gica]". Flow: "[Alt-text]"'
    },
    {
      "categoria": "Navigation",
      "componente": "List Navigation",
      "estados": "Default: onde o item est\xE1 dispon\xEDvel para navega\xE7\xE3o\n\nHover: estado moment\xE2neo ao acionar a navega\xE7\xE3o\n\nFocus: componente recebe destaque visual para navega\xE7\xE3o por teclado.",
      "verbalizacaoEsperada": "Conte\xFAdo conforme ordem l\xF3gica\n",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "somenteFilhos": true
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
      "verbalizacaoEsperada": "[abas]",
      "tipo": "Bot\xE3o",
      "foco": "Sim",
      "extracaoTexto": "abas",
      "formatoAbas": {
        "selecionada": "[Label], Guia selecionado, Posi\xE7\xE3o [Posi\xE7\xE3o] de [Total]",
        "naoSelecionada": "N\xE3o selecionado: [Label], Guia n\xE3o selecionado, Posi\xE7\xE3o [Posi\xE7\xE3o] de [Total]",
        "separador": "\n"
      }
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
      "verbalizacaoEsperada": "[Label]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Status",
      "componente": "Tag Icon",
      "estados": "Est\xE1tico e n\xE3o interativo.",
      "verbalizacaoEsperada": "[Label]",
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o"
    }
  ];

  // src/rules/accessibility-rules.ts
  function lastSegmentOf(value) {
    var _a2;
    return (_a2 = value.split("/").pop()) != null ? _a2 : value;
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
    var _a2;
    if (!record.tipo) return UNSPECIFIED_TYPE_KEY;
    return (_a2 = TIPO_PLANILHA_PARA_MARKUP_TYPE[record.tipo]) != null ? _a2 : UNSPECIFIED_TYPE_KEY;
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
  function buildVariantsInsideContainer(record) {
    if (!record.verbalizacaoDentroDe) return void 0;
    const map = {};
    for (const container of Object.keys(record.verbalizacaoDentroDe)) {
      map[slugify(container)] = `${slugify(record.componente)}--dentro-de-${slugify(container)}`;
    }
    return map;
  }
  function buildRule(record) {
    var _a2, _b, _c, _d, _e, _f, _g;
    const states = parseVerbalizationStates(record.verbalizacaoEsperada);
    const statesMap = states.length > 0 ? states.reduce((acc, s) => {
      acc[s.label] = s.text;
      return acc;
    }, {}) : void 0;
    const rawTemplate = (_a2 = record.verbalizacaoEsperada) == null ? void 0 : _a2.trim();
    const hasTemplate = Boolean(rawTemplate && rawTemplate.length > 0);
    return {
      key: slugify(record.componente),
      label: record.componente,
      markupType: resolveMarkupType(record),
      identifier: { matches: matchesComponentName(record.componente, ...(_b = record.aliasesDeNome) != null ? _b : []) },
      hasVerbalization: hasTemplate,
      extraction: [
        record.extracaoTexto === "todos" ? "all-text" : record.extracaoTexto === "duas-posicoes" ? "first-two-texts" : record.extracaoTexto === "tres-posicoes" ? "first-three-texts" : record.extracaoTexto === "lista" ? "item-list" : record.extracaoTexto === "titulo-descricao" ? "title-description" : record.extracaoTexto === "cabecalho" ? "header" : record.extracaoTexto === "abas" ? "tabs" : "first-text"
      ],
      template: hasTemplate ? rawTemplate : void 0,
      states: statesMap,
      focusEligible: resolveFocusEligible(record),
      alwaysDescend: (_c = record.sempreAprofundar) != null ? _c : false,
      childrenOnly: (_d = record.somenteFilhos) != null ? _d : false,
      cardPerItem: (_e = record.cardPorItem) != null ? _e : false,
      ignoreLooseText: (_f = record.ignorarTextoSolto) != null ? _f : false,
      listFormat: record.formatoLista,
      tabFormat: record.formatoAbas,
      templateWithoutTitle: record.verbalizacaoSemTitulo,
      ownTextsOnly: (_g = record.somenteTextosProprios) != null ? _g : false,
      templateWithoutDescription: record.verbalizacaoSemDescricao,
      textsByLayerName: record.textosPorCamada,
      ownTextSlots: record.textosProprios,
      innerButtonTextPlaceholder: record.textoDoBotao,
      variantsInsideContainer: buildVariantsInsideContainer(record),
      lastInside: record.ultimosDentro,
      stateFlagAliases: record.stateFlagAliases,
      derivedStates: record.derivedStates,
      links: record.links
    };
  }
  var accessibilityRules = accessibilityRuleRecords.map(buildRule);
  var containerVariantRules = [];
  var _a;
  for (const record of accessibilityRuleRecords) {
    const variants = (_a = record.verbalizacaoDentroDe) != null ? _a : {};
    for (const container of Object.keys(variants)) {
      containerVariantRules.push(__spreadProps(__spreadValues({}, buildRule(__spreadProps(__spreadValues({}, record), { verbalizacaoDentroDe: void 0, verbalizacaoEsperada: variants[container] }))), {
        key: `${slugify(record.componente)}--dentro-de-${slugify(container)}`
      }));
    }
  }
  function findRuleByKey(key) {
    var _a2;
    if (!key) return void 0;
    return (_a2 = accessibilityRules.find((r) => r.key === key)) != null ? _a2 : containerVariantRules.find((r) => r.key === key);
  }

  // src/main/figma-api.ts
  function getCurrentUserName() {
    var _a2, _b, _c;
    const fullName = (_b = (_a2 = figma.currentUser) == null ? void 0 : _a2.name) != null ? _b : "";
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
  function collectItems(node) {
    const items = [];
    if (!("children" in node)) return items;
    for (const child of node.children) {
      if ("visible" in child && !child.visible) continue;
      if (child.type === "INSTANCE" || child.type === "COMPONENT") {
        items.push(child);
      } else if ("children" in child) {
        items.push(...collectItems(child));
      }
    }
    return items;
  }
  async function discoverTopLevelComponents(root, classify, inheritedParents) {
    const found = [];
    async function walk(node, insideRecognizedContainer) {
      if ("visible" in node && !node.visible) {
        return;
      }
      if (IGNORED_COMPONENT_NAMES.includes(node.name)) {
        return;
      }
      const shouldClassify = node.type === "INSTANCE" || node.type === "COMPONENT" || node.type === "TEXT" && !insideRecognizedContainer;
      let nextInsideRecognizedContainer = insideRecognizedContainer;
      if (shouldClassify) {
        const { recognized, alwaysDescend, childrenOnly, cardPerItem, ignoreLooseText } = await classify(
          node
        );
        if (recognized && cardPerItem && (node.type === "INSTANCE" || node.type === "COMPONENT")) {
          const items = collectItems(node);
          if (items.length === 0) {
            found.push(node);
          } else {
            for (const item of items) {
              found.push(item);
              inheritedParents == null ? void 0 : inheritedParents.set(item.id, node);
            }
          }
          return;
        }
        if (recognized && childrenOnly) {
          if (ignoreLooseText) {
            nextInsideRecognizedContainer = true;
          }
        } else if (recognized) {
          found.push(node);
          if (!alwaysDescend) {
            return;
          }
          nextInsideRecognizedContainer = true;
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          await walk(child, nextInsideRecognizedContainer);
        }
      }
    }
    if ("children" in root) {
      for (const child of root.children) {
        await walk(child, false);
      }
    }
    return found;
  }

  // src/main/analysis/componentIdentity.ts
  async function resolveComponentName(node) {
    var _a2;
    if (node.type === "INSTANCE") {
      const mainComponent = await node.getMainComponentAsync();
      return (_a2 = mainComponent == null ? void 0 : mainComponent.name) != null ? _a2 : null;
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
    var _a2;
    if (!DEBUG_CORE_IDENTIFICATION) return;
    const parent = mainComponent.parent;
    console.log("[core-identification-debug]", {
      componentName: mainComponent.name,
      componentKey: mainComponent.key,
      remote: mainComponent.remote,
      description: mainComponent.description,
      parentType: (_a2 = parent == null ? void 0 : parent.type) != null ? _a2 : null,
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
  function normalizeLayerName(value) {
    return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }
  function extractTextsByLayerName(node, spec) {
    const result = {};
    for (const textNode of findAllTexts(node)) {
      const layerName = normalizeLayerName(textNode.name);
      for (const [placeholder, patterns] of Object.entries(spec)) {
        if (result[placeholder] !== void 0) continue;
        if (patterns.some((pattern) => layerName.includes(normalizeLayerName(pattern)))) {
          result[placeholder] = textNode.characters;
          break;
        }
      }
    }
    return result;
  }
  function listTextLayers(node) {
    return findAllTexts(node).map((t) => ({ camada: t.name, texto: t.characters }));
  }
  function extractTextList(node) {
    return findAllTexts(node).map((t) => t.characters.trim()).filter((text) => !/^[>/›»|\-–—•·]+$/.test(text));
  }
  var DESCRIPTION_FONT_SIZE = 14;
  function extractTitleAndDescription(node, ownTextsOnly = false) {
    var _a2, _b;
    const texts = ownTextsOnly ? findOwnTexts(node) : findAllTexts(node);
    const descriptionIndex = texts.findIndex((t) => t.fontSize === DESCRIPTION_FONT_SIZE);
    if (descriptionIndex === -1) {
      return { title: (_a2 = texts[0]) == null ? void 0 : _a2.characters, description: (_b = texts[1]) == null ? void 0 : _b.characters };
    }
    return {
      title: descriptionIndex > 0 ? texts[0].characters : void 0,
      description: texts[descriptionIndex].characters
    };
  }
  function findOwnTexts(node) {
    const result = [];
    if (!("children" in node)) return result;
    for (const child of node.children) {
      if ("visible" in child && child.visible === false) continue;
      if (child.type === "TEXT") {
        if (child.characters.trim().length > 0) result.push(child);
      } else if (child.type !== "INSTANCE" && "children" in child) {
        result.push(...findOwnTexts(child));
      }
    }
    return result;
  }
  var SELECTED_TAB_VALUES = ["select", "selected", "selecionado", "selecionada", "ativo", "ativa", "active"];
  function collectTabItems(node) {
    const items = [];
    if (!("children" in node)) return items;
    for (const child of node.children) {
      if ("visible" in child && child.visible === false) continue;
      if (child.type === "INSTANCE" || child.type === "COMPONENT") {
        items.push(child);
      } else if ("children" in child) {
        items.push(...collectTabItems(child));
      }
    }
    return items;
  }
  function isSelectedTab(item) {
    if (item.type !== "INSTANCE" || !item.componentProperties) return false;
    for (const [name, property] of Object.entries(item.componentProperties)) {
      const value = normalizeLayerName(String(property.value));
      if (SELECTED_TAB_VALUES.includes(value)) return true;
      const propertyName = normalizeLayerName(name.split("#")[0]);
      if (value === "true" && SELECTED_TAB_VALUES.includes(propertyName)) return true;
    }
    return false;
  }
  function extractTabs(node) {
    const items = collectTabItems(node).map((item) => {
      var _a2, _b;
      return { item, label: (_b = (_a2 = findFirstText(item)) == null ? void 0 : _a2.characters.trim()) != null ? _b : "" };
    }).filter((entry) => entry.label.length > 0);
    if (items.length === 0) {
      return findAllTexts(node).map((t) => ({ label: t.characters.trim(), selected: false }));
    }
    const position = (n) => {
      var _a2;
      return (_a2 = n.absoluteBoundingBox) != null ? _a2 : { x: 0, y: 0 };
    };
    items.sort((a, b) => position(a.item).x - position(b.item).x || position(a.item).y - position(b.item).y);
    return items.map(({ item, label }) => ({
      label,
      selected: isSelectedTab(item),
      propriedades: item.type === "INSTANCE" ? item.componentProperties : void 0
    }));
  }
  function extractOwnTextSlots(node, spec) {
    const own = findOwnTexts(node);
    const result = {};
    const used = /* @__PURE__ */ new Set();
    own.forEach((textNode, index) => {
      const layerName = normalizeLayerName(textNode.name);
      for (const [slot, patterns] of Object.entries(spec)) {
        if (result[slot] !== void 0) continue;
        if (patterns.some((pattern) => layerName.includes(normalizeLayerName(pattern)))) {
          result[slot] = textNode.characters;
          used.add(index);
          break;
        }
      }
    });
    const remaining = own.filter((_, index) => !used.has(index));
    for (const slot of Object.keys(spec)) {
      if (result[slot] === void 0 && remaining.length > 0) {
        result[slot] = remaining.shift().characters;
      }
    }
    return result;
  }
  function findInnerInstanceText(node) {
    if (!("children" in node)) return void 0;
    for (const child of node.children) {
      if ("visible" in child && child.visible === false) continue;
      if (child.type === "INSTANCE") {
        const text = findFirstText(child);
        if (text) return text.characters;
      } else if ("children" in child) {
        const found = findInnerInstanceText(child);
        if (found !== void 0) return found;
      }
    }
    return void 0;
  }
  function findFirstTextNode(node) {
    return findFirstText(node);
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
  function extractFirstTwoTexts(node) {
    var _a2, _b;
    const texts = findAllTexts(node);
    return {
      first: (_a2 = texts[0]) == null ? void 0 : _a2.characters,
      second: (_b = texts[1]) == null ? void 0 : _b.characters
    };
  }
  function extractFirstThreeTexts(node) {
    var _a2, _b, _c;
    const texts = findAllTexts(node);
    return {
      first: (_a2 = texts[0]) == null ? void 0 : _a2.characters,
      second: (_b = texts[1]) == null ? void 0 : _b.characters,
      third: (_c = texts[2]) == null ? void 0 : _c.characters
    };
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

  // src/main/analysis/headingDetection.ts
  var FONT_SIZE_TO_HEADING_LEVEL = {
    40: "2",
    32: "2",
    24: "3",
    20: "4",
    16: "5",
    14: "6"
  };
  function detectHeadingLevelFromFontSize(node) {
    var _a2;
    if (node.fontSize === figma.mixed) {
      return null;
    }
    const size = node.fontSize;
    return (_a2 = FONT_SIZE_TO_HEADING_LEVEL[size]) != null ? _a2 : null;
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
    var _a2, _b, _c, _d;
    if (node.type === "TEXT") {
      const headingLevel = detectHeadingLevelFromFontSize(node);
      if (headingLevel === null && DEBUG_TEXT_LAYERS && node.characters.trim().length > 0) {
        console.log("[texto-solto-ignorado-debug]", {
          texto: node.characters,
          camada: node.name,
          tamanhoDaFonte: node.fontSize === figma.mixed ? "misto" : node.fontSize
        });
      }
      return { recognized: headingLevel !== null, alwaysDescend: false };
    }
    const componentName = await resolveComponentName(node);
    const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName });
    return {
      recognized: rule !== void 0,
      alwaysDescend: (_a2 = rule == null ? void 0 : rule.alwaysDescend) != null ? _a2 : false,
      childrenOnly: (_b = rule == null ? void 0 : rule.childrenOnly) != null ? _b : false,
      cardPerItem: (_c = rule == null ? void 0 : rule.cardPerItem) != null ? _c : false,
      ignoreLooseText: (_d = rule == null ? void 0 : rule.ignoreLooseText) != null ? _d : false
    };
  }
  var DEBUG_STATE_MATCHING = true;
  var DEBUG_TEXT_LAYERS = true;
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
  async function findAncestorRules(node) {
    const result = [];
    let current = node.parent;
    while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
      if (current.type === "INSTANCE" || current.type === "COMPONENT") {
        const name = await resolveComponentName(current);
        const rule = findMatchingRule(accessibilityRules, { nodeName: current.name, componentName: name });
        if (rule) result.push({ node: current, ruleKey: rule.key });
      }
      current = current.parent;
    }
    return result;
  }
  async function buildSpecificationItem(node, order, manuallyAdded, inheritRuleFrom) {
    var _a2, _b, _c, _d, _e;
    const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
    const isTextNode = node.type === "TEXT";
    const coreType = isComponentLike ? (await identifyCoreType(node)).coreType : "DESCONHECIDO";
    const componentName = isComponentLike ? await resolveComponentName(node) : null;
    let rule = isComponentLike ? findMatchingRule(accessibilityRules, { nodeName: node.name, componentName }) : void 0;
    if (inheritRuleFrom) {
      const parentComponentName = await resolveComponentName(inheritRuleFrom);
      rule = (_a2 = findMatchingRule(accessibilityRules, { nodeName: inheritRuleFrom.name, componentName: parentComponentName })) != null ? _a2 : rule;
    }
    if (rule == null ? void 0 : rule.variantsInsideContainer) {
      for (const ancestor of await findAncestorRules(node)) {
        const variantKey = rule.variantsInsideContainer[ancestor.ruleKey];
        if (variantKey) {
          rule = (_b = findRuleByKey(variantKey)) != null ? _b : rule;
          break;
        }
      }
    }
    const extractedData = {};
    if (isTextNode) {
      const headingLevel = detectHeadingLevelFromFontSize(node);
      if (headingLevel) {
        rule = accessibilityRules.find((r) => r.key === "heading");
        extractedData.text = node.characters;
        extractedData.nivel = headingLevel;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("all-text")) {
      const text = extractAllTextsJoined(node);
      if (text !== void 0) {
        extractedData.text = text;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("tabs")) {
      const tabs = extractTabs(node);
      if (tabs.length > 0) {
        extractedData.abas = JSON.stringify(tabs.map(({ label, selected }) => ({ label, selected })));
        extractedData.text = tabs.map((t) => t.label).join(", ");
      }
      if (DEBUG_TEXT_LAYERS) {
        console.log("[tab-debug]", { nodeName: node.name, abas: tabs });
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("header")) {
      const ownTexts = findOwnTexts(node);
      if (ownTexts[0]) {
        extractedData.text = ownTexts[0].characters;
        const level = detectHeadingLevelFromFontSize(ownTexts[0]);
        if (level) extractedData.nivel = level;
      }
      if (ownTexts[1]) {
        extractedData.text2 = ownTexts[1].characters;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("title-description")) {
      const { title, description } = extractTitleAndDescription(node, rule.ownTextsOnly);
      if (title !== void 0) {
        extractedData.text = title;
      }
      if (description !== void 0) {
        extractedData.text2 = description;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("item-list")) {
      const list = extractTextList(node);
      if (list.length > 0) {
        extractedData.lista = JSON.stringify(list);
        extractedData.text = list.join(", ");
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("first-two-texts")) {
      const { first, second } = extractFirstTwoTexts(node);
      if (first !== void 0) {
        extractedData.text = first;
      }
      if (second !== void 0) {
        extractedData.text2 = second;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("first-three-texts")) {
      const { first, second, third } = extractFirstThreeTexts(node);
      if (first !== void 0) {
        extractedData.text = first;
      }
      if (second !== void 0) {
        extractedData.text2 = second;
      }
      if (third !== void 0) {
        extractedData.text3 = third;
      }
    } else if (rule == null ? void 0 : rule.extraction.includes("first-text")) {
      const text = extractFirstText(node);
      if (text !== void 0) {
        extractedData.text = text;
      }
    }
    if (!isTextNode && (rule == null ? void 0 : rule.ownTextSlots)) {
      const slots = extractOwnTextSlots(node, rule.ownTextSlots);
      for (const [placeholder, value] of Object.entries(slots)) {
        extractedData[`camada:${placeholder}`] = value;
      }
      if (DEBUG_TEXT_LAYERS) {
        console.log("[own-texts-debug]", { nodeName: node.name, ruleKey: rule.key, camadasDeTexto: listTextLayers(node), preenchidos: slots });
      }
    }
    if (!isTextNode && (rule == null ? void 0 : rule.innerButtonTextPlaceholder)) {
      const buttonText = findInnerInstanceText(node);
      if (buttonText !== void 0) {
        extractedData[`camada:${rule.innerButtonTextPlaceholder}`] = buttonText;
      }
    }
    if (!isTextNode && (rule == null ? void 0 : rule.textsByLayerName)) {
      const byLayer = extractTextsByLayerName(node, rule.textsByLayerName);
      for (const [placeholder, value] of Object.entries(byLayer)) {
        extractedData[`camada:${placeholder}`] = value;
      }
      if (DEBUG_TEXT_LAYERS) {
        console.log("[text-layers-debug]", { nodeName: node.name, ruleKey: rule.key, camadasDeTexto: listTextLayers(node), preenchidos: byLayer });
      }
    }
    if (!isTextNode && (rule == null ? void 0 : rule.key) === "heading" && extractedData.nivel === void 0) {
      const headingText = findFirstTextNode(node);
      const level = headingText ? detectHeadingLevelFromFontSize(headingText) : null;
      if (level) {
        extractedData.nivel = level;
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
      markupType: (_c = rule == null ? void 0 : rule.markupType) != null ? _c : UNSPECIFIED_TYPE_KEY,
      ruleKey: (_d = rule == null ? void 0 : rule.key) != null ? _d : null,
      variantProperties,
      coreType,
      extractedData,
      verbalization,
      order,
      manuallyAdded,
      verbalizationEdited: false,
      focusEligible: (_e = rule == null ? void 0 : rule.focusEligible) != null ? _e : false
    };
  }
  function placeContainersBeforeContents(ordered) {
    const result = [...ordered];
    const ids = new Set(result.map((n) => n.id));
    for (const container of ordered) {
      let firstInside = -1;
      result.forEach((node, index) => {
        if (firstInside !== -1 || node.id === container.id) return;
        let parent = node.parent;
        while (parent && parent.type !== "PAGE" && parent.type !== "DOCUMENT") {
          if (parent.id === container.id) {
            firstInside = index;
            return;
          }
          parent = parent.parent;
        }
      });
      const containerIndex = result.indexOf(container);
      if (firstInside !== -1 && containerIndex > firstInside && ids.has(container.id)) {
        result.splice(containerIndex, 1);
        result.splice(firstInside, 0, container);
      }
    }
    return result;
  }
  async function moveLastInsideContainers(ordered) {
    var _a2;
    const result = [...ordered];
    const containers = /* @__PURE__ */ new Map();
    for (const node of result) {
      for (const ancestor of await findAncestorRules(node)) {
        const containerRule = findRuleByKey(ancestor.ruleKey);
        if (!((_a2 = containerRule == null ? void 0 : containerRule.lastInside) == null ? void 0 : _a2.length)) continue;
        let entry = containers.get(ancestor.node.id);
        if (!entry) {
          entry = { lastInside: containerRule.lastInside, insideIds: /* @__PURE__ */ new Set(), toMove: [] };
          containers.set(ancestor.node.id, entry);
        }
        entry.insideIds.add(node.id);
        if (node.type === "INSTANCE" || node.type === "COMPONENT") {
          const name = await resolveComponentName(node);
          const rule = findMatchingRule(accessibilityRules, { nodeName: node.name, componentName: name });
          if (rule && entry.lastInside.includes(rule.label)) entry.toMove.push(node);
        }
      }
    }
    for (const entry of containers.values()) {
      if (entry.toMove.length === 0) continue;
      const originalFirst = Math.min(...entry.toMove.map((n) => result.indexOf(n)));
      for (const node of entry.toMove) result.splice(result.indexOf(node), 1);
      let insertAt = -1;
      result.forEach((node, index) => {
        if (entry.insideIds.has(node.id)) insertAt = index;
      });
      const position = insertAt === -1 ? originalFirst : insertAt + 1;
      result.splice(position, 0, ...entry.toMove);
    }
    return result;
  }
  async function analyzeScreen(screenNode, forcedContext) {
    const inheritedParents = /* @__PURE__ */ new Map();
    const discovered = await discoverTopLevelComponents(screenNode, classifyComponent, inheritedParents);
    const topLevelNodes = await moveLastInsideContainers(placeContainersBeforeContents(sortByReadingOrder(discovered)));
    const items = [];
    let coreWebCount = 0;
    let coreAppCount = 0;
    let order = 0;
    for (const node of topLevelNodes) {
      const item = await buildSpecificationItem(node, order, false, inheritedParents.get(node.id));
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
  var PANEL_NAME = "Especifica\xE7\xE3o de Acessibilidade";
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
    var _a2;
    const type = MARKUP_TYPES.find((t) => t.key === markupType);
    return (_a2 = type == null ? void 0 : type.label) != null ? _a2 : UNSPECIFIED_TYPE_LABEL;
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
    const verbalizationLabel = createPlainText("Verbaliza\xE7\xE3o:", LABEL_FONT, 12, TEXT_MUTED);
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
    var _a2, _b;
    await loadFonts();
    const ordered = [...items].sort((a, b) => a.order - b.order);
    const panel = figma.createFrame();
    panel.name = PANEL_NAME;
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
        (_a2 = readingOrderByItemId.get(ordered[i].id)) != null ? _a2 : null,
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

  // src/main/generation/existingMarkup.ts
  var SCREEN_ID_KEY = "handoffScreenId";
  var MARKER_NAME_PATTERN = /^Marcação \d+/;
  var PANEL_POSITION_TOLERANCE = 1;
  function tagAsScreenOutput(node, screenId) {
    node.setPluginData(SCREEN_ID_KEY, screenId);
  }
  function intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function findExistingMarkup(screen) {
    const markers = [];
    let panel = null;
    const bounds = screen.absoluteBoundingBox;
    if (!bounds) return { markers, panel };
    for (const child of figma.currentPage.children) {
      if (child.id === screen.id) continue;
      const owner = child.getPluginData(SCREEN_ID_KEY);
      const isMarker = child.type === "GROUP" && MARKER_NAME_PATTERN.test(child.name);
      const isPanel = child.type === "FRAME" && child.name === PANEL_NAME;
      if (!isMarker && !isPanel) continue;
      if (owner) {
        if (owner !== screen.id) continue;
        if (isMarker) markers.push(child);
        else if (!panel) panel = child;
        continue;
      }
      const childBounds = child.absoluteBoundingBox;
      if (!childBounds) continue;
      if (isMarker && intersects(childBounds, bounds)) {
        markers.push(child);
      } else if (isPanel && !panel && Math.abs(childBounds.y - bounds.y) <= PANEL_POSITION_TOLERANCE && Math.abs(childBounds.x - (bounds.x + bounds.width + PANEL_GAP_FROM_SCREEN)) <= PANEL_POSITION_TOLERANCE) {
        panel = child;
      }
    }
    return { markers, panel };
  }
  function countExistingMarkers(screen) {
    return findExistingMarkup(screen).markers.length;
  }
  function deleteExistingMarkup(screen) {
    const { markers, panel } = findExistingMarkup(screen);
    for (const marker of markers) {
      if (!marker.removed) marker.remove();
    }
    if (panel && !panel.removed) {
      panel.remove();
    }
    return markers.length;
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

  // src/tagueamento/shared/messages.ts
  var TAG_MESSAGE_PREFIX = "tag:";
  function isTagMessageType(type) {
    return typeof type === "string" && type.startsWith(TAG_MESSAGE_PREFIX);
  }

  // src/tagueamento/main/messaging.ts
  function postToTagUi(message) {
    figma.ui.postMessage(message);
  }

  // src/tagueamento/shared/gaCard.ts
  var GA_CARD_SET_NAME = "[Helper] Google Analytics Spec";
  var GA_CARD_SET_KEY = "051df160d03349be02f026974d98735ec96a5128";
  var GA_CARD_SHOW_TOGGLE = "Mostrar atributos";
  var GA_CARD_EVENT_PROPERTY = "Evento";
  var GA_EVENTS = [
    {
      key: "screen_view",
      params: [
        "firebase_screen",
        "region",
        "subregion*",
        "firebase_previous_screen",
        "target_screen*",
        "code*",
        "status*",
        "title*",
        "message*",
        "details*",
        "utm_source*",
        "utm_medium*",
        "utm_campaing*",
        "utm_content*",
        "utm_term*",
        "hiring_id*"
      ]
    },
    {
      // Lista completa confirmada pela foto do card web (03/10/2026): mesmos
      // opcionais do screen_view, com os nomes web nas linhas de tela.
      key: "page_view",
      params: [
        "page_name",
        "region",
        "subregion*",
        "previous_page",
        "target_page*",
        "code*",
        "status*",
        "title*",
        "message*",
        "details*",
        "utm_source*",
        "utm_medium*",
        "utm_campaing*",
        "utm_content*",
        "utm_term*",
        "hiring_id*"
      ]
    },
    {
      key: "select_content",
      params: ["content_type", "region", "subregion*", "action", "local_name", "local_type", "previous_page"]
    },
    { key: "modal_view", params: ["modal_name", "page_name", "firebase_screen", "region", "subregion*"] },
    {
      key: "feedback",
      params: [
        "region",
        "subregion*",
        "firebase_screen",
        "page_name",
        "feedback_name",
        "firebase_previous_screen",
        "previous_page"
      ]
    },
    {
      key: "search",
      params: [
        "search_term",
        "result",
        "firebase_screen",
        "page_name",
        "region",
        "subregion*",
        "firebase_previous_screen",
        "previous_page"
      ]
    },
    { key: "login", params: ["region", "authentication", "result", "method*", "details*"] },
    {
      key: "transaction",
      params: [
        "firebase_screen",
        "page_name",
        "authentication",
        "region",
        "subregion*",
        "transaction_id*",
        "transaction_type",
        "transaction_code",
        "transaction_name",
        "transaction_items",
        "value*",
        "result",
        "details*"
      ]
    },
    {
      key: "refresh",
      params: ["firebase_screen", "page_name", "region", "firebase_previous_screen", "previous_page", "subregion*", "details*"]
    },
    { key: "conversion", params: ["firebase_screen", "page_name", "region", "result", "subregion*", "details*"] }
  ];
  function normalizeParamLabel(label) {
    return label.replace(/\*/g, "").trim().toLowerCase();
  }
  function eventKeyFromVariantName(variantName) {
    return variantName.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, "").toLowerCase();
  }

  // src/tagueamento/main/cardDiagnostic.ts
  var MAX_LAYERS = 600;
  var MAX_CHARACTERS = 120;
  var TEST_CARD_GAP = 40;
  var TEST_CARD_PLUGIN_DATA_KEY = "tagueamento.testCard";
  function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function stripPropertyId(name) {
    const hashIndex = name.lastIndexOf("#");
    return hashIndex > 0 ? name.slice(0, hashIndex) : name;
  }
  function describeComponent(node) {
    return { id: node.id, name: node.name, key: node.key, remote: node.remote };
  }
  function fontLabel(font) {
    return `${font.family} ${font.style}`;
  }
  function collectLayers(root) {
    const layers = [];
    const fonts = /* @__PURE__ */ new Set();
    let truncated = false;
    function visit(node, depth) {
      if (layers.length >= MAX_LAYERS) {
        truncated = true;
        return;
      }
      const layer = { depth, type: node.type, name: node.name, visible: node.visible };
      if (node.type === "TEXT") {
        const text = node.characters;
        layer.characters = text.length > MAX_CHARACTERS ? `${text.slice(0, MAX_CHARACTERS)}\u2026` : text;
        if (node.fontName !== figma.mixed) {
          layer.font = fontLabel(node.fontName);
          fonts.add(layer.font);
        } else {
          layer.font = "(v\xE1rias fontes)";
          try {
            for (const font of node.getRangeAllFontNames(0, text.length)) {
              fonts.add(fontLabel(font));
            }
          } catch (e) {
          }
        }
      }
      const refs = "componentPropertyReferences" in node ? node.componentPropertyReferences : null;
      if (refs) {
        const entries = Object.entries(refs).filter(([, value]) => typeof value === "string");
        if (entries.length > 0) {
          const propertyRefs = {};
          for (const [field, property] of entries) propertyRefs[field] = property;
          layer.propertyRefs = propertyRefs;
        }
      }
      layers.push(layer);
      if ("children" in node) {
        for (const child of node.children) {
          visit(child, depth + 1);
        }
      }
    }
    visit(root, 0);
    return { layers, truncated, fonts: [...fonts].sort() };
  }
  function readPropertyDefinitions(mainComponent, componentSet, warnings) {
    try {
      if (componentSet) return componentSet.componentPropertyDefinitions;
      return mainComponent.componentPropertyDefinitions;
    } catch (error) {
      warnings.push(
        `N\xE3o foi poss\xEDvel ler as defini\xE7\xF5es das propriedades (op\xE7\xF5es de variante e valores padr\xE3o): ${errorMessage(error)}`
      );
      return null;
    }
  }
  async function diagnoseSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1) {
      throw new Error(
        selection.length === 0 ? "Selecione no canvas uma inst\xE2ncia do card antes de ler." : "Selecione s\xF3 um card por vez."
      );
    }
    const node = selection[0];
    const warnings = [];
    const diagnosis = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      width: Math.round(node.width),
      height: Math.round(node.height),
      mainComponent: null,
      componentSet: null,
      properties: [],
      layers: [],
      layersTruncated: false,
      fonts: [],
      warnings
    };
    if (node.type !== "INSTANCE") {
      warnings.push(
        `A camada selecionada \xE9 do tipo ${node.type}, n\xE3o uma inst\xE2ncia. Selecione a inst\xE2ncia do card (\xEDcone de losango no painel de camadas), n\xE3o uma camada de dentro dele.`
      );
    } else {
      const mainComponent = await node.getMainComponentAsync();
      if (!mainComponent) {
        warnings.push("A inst\xE2ncia n\xE3o tem componente principal (ele pode ter sido apagado da biblioteca).");
      } else {
        diagnosis.mainComponent = describeComponent(mainComponent);
        let componentSet = null;
        try {
          const parent = mainComponent.parent;
          if (parent && parent.type === "COMPONENT_SET") {
            componentSet = parent;
            diagnosis.componentSet = describeComponent(parent);
          }
        } catch (error) {
          warnings.push(`N\xE3o foi poss\xEDvel ler o conjunto de variantes: ${errorMessage(error)}`);
        }
        const setName = componentSet ? componentSet.name : mainComponent.name;
        if (setName !== GA_CARD_SET_NAME) {
          warnings.push(
            `O componente se chama "${setName}", e o esperado era "${GA_CARD_SET_NAME}". Confira se \xE9 o card certo.`
          );
        }
        const definitions = readPropertyDefinitions(mainComponent, componentSet, warnings);
        for (const [name, property] of Object.entries(node.componentProperties)) {
          const definition = definitions ? definitions[name] : void 0;
          const diagnosed = {
            name,
            displayName: stripPropertyId(name),
            type: property.type,
            value: property.value
          };
          if (definition) {
            diagnosed.defaultValue = definition.defaultValue;
            if (definition.type === "VARIANT" && definition.variantOptions) {
              diagnosed.options = [...definition.variantOptions];
            }
          }
          diagnosis.properties.push(diagnosed);
        }
      }
    }
    const { layers, truncated, fonts } = collectLayers(node);
    diagnosis.layers = layers;
    diagnosis.layersTruncated = truncated;
    diagnosis.fonts = fonts;
    if (truncated) {
      warnings.push(`A lista de camadas foi cortada em ${MAX_LAYERS} itens.`);
    }
    return diagnosis;
  }
  async function createTestCard(sourceNodeId, variantValues) {
    const source = await figma.getNodeByIdAsync(sourceNodeId);
    if (!source || source.type !== "INSTANCE") {
      return { ok: false, message: "O card lido n\xE3o existe mais no arquivo. Selecione-o e clique em Ler card de novo." };
    }
    const mainComponent = await source.getMainComponentAsync();
    if (!mainComponent) {
      return { ok: false, message: "O card lido n\xE3o tem componente principal." };
    }
    let instance;
    let method;
    let importError;
    try {
      const imported = await figma.importComponentByKeyAsync(mainComponent.key);
      instance = imported.createInstance();
      method = "Importado pela chave (importComponentByKeyAsync)";
    } catch (error) {
      importError = errorMessage(error);
      try {
        instance = mainComponent.createInstance();
        method = "Criado direto do componente principal (a importa\xE7\xE3o pela chave falhou)";
      } catch (fallbackError) {
        return {
          ok: false,
          message: `N\xE3o foi poss\xEDvel criar o card de teste: ${errorMessage(fallbackError)}`,
          importError
        };
      }
    }
    const box = source.absoluteBoundingBox;
    if (box) {
      instance.x = box.x + box.width + TEST_CARD_GAP;
      instance.y = box.y;
    }
    instance.setPluginData(TEST_CARD_PLUGIN_DATA_KEY, "1");
    const current = instance.componentProperties;
    const toApply = {};
    for (const [name, value] of Object.entries(variantValues)) {
      const property = current[name];
      if (property && property.type === "VARIANT" && property.value !== value) {
        toApply[name] = value;
      }
    }
    try {
      if (Object.keys(toApply).length > 0) {
        instance.setProperties(toApply);
      }
    } catch (error) {
      figma.currentPage.selection = [instance];
      figma.viewport.scrollAndZoomIntoView([source, instance]);
      return {
        ok: false,
        message: `O card de teste foi criado, mas n\xE3o deu para aplicar as variantes: ${errorMessage(error)}`,
        method,
        importError
      };
    }
    figma.currentPage.selection = [instance];
    figma.viewport.scrollAndZoomIntoView([source, instance]);
    const applied = {};
    for (const [name, property] of Object.entries(instance.componentProperties)) {
      if (property.type === "VARIANT") applied[name] = String(property.value);
    }
    return {
      ok: true,
      message: "Card de teste criado ao lado do card lido.",
      method,
      importError,
      appliedProperties: applied
    };
  }

  // src/tagueamento/main/cardStructure.ts
  function stripPropertyId2(name) {
    const hashIndex = name.lastIndexOf("#");
    return hashIndex > 0 ? name.slice(0, hashIndex) : name;
  }
  function firstTextInside(node) {
    if (node.type === "TEXT") return node;
    if ("children" in node) {
      for (const child of node.children) {
        const found = firstTextInside(child);
        if (found) return found;
      }
    }
    return null;
  }
  function asRow(node) {
    if (node.type !== "FRAME" && node.type !== "GROUP") return null;
    let labelNode = null;
    let valueNode = null;
    for (const child of node.children) {
      if (!labelNode && child.type === "TEXT") labelNode = child;
      if (!valueNode && child.type === "INSTANCE") valueNode = firstTextInside(child);
    }
    if (!labelNode || !valueNode) return null;
    const refs = node.type === "FRAME" ? node.componentPropertyReferences : null;
    const info = {
      label: labelNode.characters.trim(),
      value: valueNode.characters,
      visible: node.visible
    };
    if (refs && typeof refs.visible === "string") {
      info.toggle = stripPropertyId2(refs.visible);
    }
    return { info, row: node, labelNode, valueNode };
  }
  function readCardStructure(card) {
    const structure = { rows: [], typeNode: null, numberNode: null };
    function visit(node) {
      if (node !== card) {
        const row = asRow(node);
        if (row) {
          structure.rows.push(row);
          return;
        }
        if (!structure.typeNode && node.type === "FRAME" && node.name === "Type") {
          structure.typeNode = firstTextInside(node);
        }
        if (!structure.numberNode && node.type === "FRAME" && node.name === "Number") {
          structure.numberNode = firstTextInside(node);
        }
      }
      if ("children" in node) {
        for (const child of node.children) visit(child);
      }
    }
    visit(card);
    return structure;
  }

  // src/tagueamento/main/variantCheck.ts
  var TEMP_OFFSET = -1e5;
  function errorMessage2(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function stripPropertyId3(name) {
    const hashIndex = name.lastIndexOf("#");
    return hashIndex > 0 ? name.slice(0, hashIndex) : name;
  }
  async function setFromSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== "INSTANCE") return null;
    const main = await selection[0].getMainComponentAsync();
    const parent = main ? main.parent : null;
    return parent && parent.type === "COMPONENT_SET" ? parent : null;
  }
  function variantNameOf(component) {
    const props = component.variantProperties;
    return props && typeof props[GA_CARD_EVENT_PROPERTY] === "string" ? props[GA_CARD_EVENT_PROPERTY] : null;
  }
  async function checkAllVariants() {
    const result = {
      keyUsed: GA_CARD_SET_KEY,
      importOk: false,
      source: "none",
      setNameOk: false,
      variantOptions: [],
      unmatchedVariants: [],
      toggles: [],
      showToggleFound: false,
      checks: [],
      warnings: []
    };
    let componentSet = null;
    try {
      componentSet = await figma.importComponentSetByKeyAsync(GA_CARD_SET_KEY);
      result.importOk = true;
      result.source = "import";
    } catch (error) {
      result.importError = errorMessage2(error);
      componentSet = await setFromSelection();
      if (componentSet) {
        result.source = "selection";
        result.warnings.push(
          "A importa\xE7\xE3o pela chave falhou; as variantes foram lidas do card selecionado. A gera\xE7\xE3o precisa da importa\xE7\xE3o funcionando."
        );
      } else {
        result.warnings.push(
          "A importa\xE7\xE3o pela chave falhou e n\xE3o h\xE1 um card selecionado. Selecione uma inst\xE2ncia do card e verifique de novo para ver a chave real."
        );
        return result;
      }
    }
    result.setName = componentSet.name;
    result.setNameOk = componentSet.name === GA_CARD_SET_NAME;
    result.actualSetKey = componentSet.key;
    if (!result.setNameOk) {
      result.warnings.push(`O conjunto se chama "${componentSet.name}"; o esperado era "${GA_CARD_SET_NAME}".`);
    }
    try {
      const definitions = componentSet.componentPropertyDefinitions;
      for (const [name, definition] of Object.entries(definitions)) {
        if (definition.type === "BOOLEAN") result.toggles.push(stripPropertyId3(name));
        if (definition.type === "VARIANT" && name === GA_CARD_EVENT_PROPERTY && definition.variantOptions) {
          result.variantOptions = [...definition.variantOptions];
        }
      }
    } catch (error) {
      result.warnings.push(`N\xE3o foi poss\xEDvel ler as propriedades do conjunto: ${errorMessage2(error)}`);
    }
    result.showToggleFound = result.toggles.includes(GA_CARD_SHOW_TOGGLE);
    if (!result.showToggleFound) {
      result.warnings.push(`A toggle "${GA_CARD_SHOW_TOGGLE}" n\xE3o foi encontrada no conjunto.`);
    }
    const variantsByEvent = /* @__PURE__ */ new Map();
    for (const child of componentSet.children) {
      if (child.type !== "COMPONENT") continue;
      const variantName = variantNameOf(child);
      if (!variantName) continue;
      const eventKey = eventKeyFromVariantName(variantName);
      if (GA_EVENTS.some((event) => event.key === eventKey)) {
        variantsByEvent.set(eventKey, child);
      } else {
        result.unmatchedVariants.push(variantName);
      }
    }
    for (const event of GA_EVENTS) {
      const expected = event.params.map(normalizeParamLabel);
      const check = {
        eventKey: event.key,
        variantName: null,
        ok: false,
        expectedCount: expected.length,
        foundCount: 0,
        missing: [],
        extra: [],
        rows: [],
        hasNumber: false
      };
      const variant = variantsByEvent.get(event.key);
      if (!variant) {
        check.missing = [...event.params];
        check.error = "Nenhuma variante de Evento corresponde a este evento.";
        result.checks.push(check);
        continue;
      }
      check.variantName = variantNameOf(variant);
      let temp = null;
      try {
        temp = variant.createInstance();
        temp.x = TEMP_OFFSET;
        temp.y = TEMP_OFFSET;
        const structure = readCardStructure(temp);
        check.rows = structure.rows.map((row) => row.info);
        check.typeText = structure.typeNode ? structure.typeNode.characters : void 0;
        check.hasNumber = structure.numberNode !== null;
        const foundLabels = new Set(check.rows.map((row) => normalizeParamLabel(row.label)));
        check.missing = event.params.filter((param) => !foundLabels.has(normalizeParamLabel(param)));
        check.extra = check.rows.map((row) => row.label).filter((label) => !expected.includes(normalizeParamLabel(label)));
        check.foundCount = expected.length - check.missing.length;
        check.ok = check.missing.length === 0;
      } catch (error) {
        check.error = `N\xE3o foi poss\xEDvel ler esta variante: ${errorMessage2(error)}`;
        check.missing = [...event.params];
      } finally {
        if (temp && !temp.removed) temp.remove();
      }
      result.checks.push(check);
    }
    return result;
  }

  // src/tagueamento/main/setupStorage.ts
  var LAST_SETUP_KEY = "tagueamento.lastSetup";
  async function loadLastSetup() {
    try {
      const stored = await figma.clientStorage.getAsync(LAST_SETUP_KEY);
      return stored && typeof stored === "object" ? stored : null;
    } catch (error) {
      console.error("Tagueamento: n\xE3o foi poss\xEDvel ler a \xFAltima escolha do setup.", error);
      return null;
    }
  }
  async function saveLastSetup(setup) {
    try {
      await figma.clientStorage.setAsync(LAST_SETUP_KEY, setup);
    } catch (error) {
      console.error("Tagueamento: n\xE3o foi poss\xEDvel guardar a escolha do setup.", error);
    }
  }

  // src/tagueamento/main/mapping/prototype.ts
  function pushUnique(map, key, value) {
    var _a2;
    const list = (_a2 = map.get(key)) != null ? _a2 : [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  }
  function navigationTargets(node) {
    var _a2;
    if (!("reactions" in node)) return [];
    const targets = [];
    for (const reaction of node.reactions) {
      const legacy = reaction.action;
      const actions = (_a2 = reaction.actions) != null ? _a2 : legacy ? [legacy] : [];
      for (const action of actions) {
        if (action.type === "NODE" && action.navigation === "NAVIGATE" && action.destinationId) {
          targets.push(action.destinationId);
        }
      }
    }
    return targets;
  }
  async function topLevelFrameId(nodeId, frameIds) {
    if (frameIds.has(nodeId)) return nodeId;
    let node = await figma.getNodeByIdAsync(nodeId);
    while (node) {
      if (frameIds.has(node.id)) return node.id;
      node = node.parent;
    }
    return null;
  }
  async function buildPrototypeGraph(frames) {
    const graph = { outgoing: /* @__PURE__ */ new Map(), incoming: /* @__PURE__ */ new Map() };
    const frameIds = new Set(frames.map((frame) => frame.id));
    for (const frame of frames) {
      const withReactions = [frame];
      if ("findAll" in frame) {
        withReactions.push(...frame.findAll((node) => "reactions" in node && node.reactions.length > 0));
      }
      for (const node of withReactions) {
        for (const destinationId of navigationTargets(node)) {
          const destinationFrame = await topLevelFrameId(destinationId, frameIds);
          if (!destinationFrame || destinationFrame === frame.id) continue;
          pushUnique(graph.outgoing, frame.id, destinationFrame);
          pushUnique(graph.incoming, destinationFrame, frame.id);
        }
      }
    }
    return graph;
  }

  // src/tagueamento/shared/classification.ts
  var LABEL = { kind: "label" };
  var PD = { kind: "pd" };
  var CLASSIFICATION = [
    { names: ["Search"], classe: "search", acao: "Buscar" },
    { names: ["Alert", "Toast", "Flag", "Flag Cooperado"], classe: "feedback" },
    { names: ["Modal", "Drawer"], classe: "modal_view" },
    {
      names: [
        "Button Primary",
        "Button Secondary",
        "Button Mini",
        "Link Icon",
        "Shortcut",
        "Tab",
        "List Navigation",
        "Menu Button",
        "Popover Menu"
      ],
      classe: "select_content",
      acao: LABEL
    },
    { names: ["Accordion"], classe: "select_content", acao: "Expandir" },
    {
      names: ["Checkbox", "Radio Button", "List Select", "Chip Select", "Dropdown", "Input Select"],
      classe: "select_content",
      acao: "Selecionar"
    },
    { names: ["Chip Filter"], classe: "select_content", acao: "Filtrar" },
    { names: ["Switch"], classe: "select_content", acao: "Ativar / Desativar" },
    { names: ["Date Picker"], classe: "select_content", acao: "Selecionar_data" },
    { names: ["Pagination", "Carousel Nav"], classe: "select_content", acao: "Navegar" },
    { names: ["Uploader"], classe: "select_content", acao: "Anexar" },
    { names: ["Rate Input", "Cookies", "Banner Image Full"], classe: "select_content", acao: LABEL },
    {
      names: [
        "Input Text",
        "Input Text Area",
        "Input Password",
        "Input Code",
        "Input Code Number",
        "Input Date",
        "Currency"
      ],
      classe: "select_content",
      acao: LABEL
    },
    { names: ["Button Icon"], classe: "select_content", acao: PD },
    // Table: o componente inteiro vira um item e o plugin não entra nele (ajuste do Mau, 03/10/2026).
    // A ação fica para o PD na revisão até a regra da tabela ser definida.
    { names: ["Table"], classe: "select_content", acao: PD },
    { names: ["Card", "Card Review", "Fixed Bar", "Header Product", "Button Group"], classe: "container" },
    {
      names: [
        "Avatar Business",
        "Avatar Name",
        "Badge",
        "Brand",
        "Description",
        "Heading",
        "Icon",
        "Icon Shape",
        "Image",
        "Loading",
        "Page Indicator",
        "Paragraph",
        "Progress Line",
        "Skeleton",
        "Tag Container",
        "Tag Icon",
        "Topic",
        "List Content",
        "List Ghost",
        "Tooltip",
        "Empty State",
        "Credit Card"
      ],
      classe: "nao_marcar"
    }
  ];
  var IGNORED_LAYER_NAMES = [
    "Header Web",
    "[IB-Leg] Acessibility Settings Bar",
    "[IB-Leg] Header",
    "[IB-Leg] Navigation Bar",
    "[IB-Leg] Footer",
    // Não mapear (ajuste do Mau, 03/10/2026): nem o componente nem o que tem dentro.
    "Breadcrumb"
  ];
  var EVENT_BY_CLASS = {
    select_content: "select_content",
    search: "search",
    feedback: "feedback",
    modal_view: "modal_view"
  };
  function normalizeName(name) {
    return name.replace(/\s+/g, " ").trim().toLowerCase();
  }
  var RULE_BY_NAME = /* @__PURE__ */ new Map();
  for (const rule of CLASSIFICATION) {
    for (const name of rule.names) RULE_BY_NAME.set(normalizeName(name), { rule, name });
  }
  function findClassification(candidates) {
    var _a2, _b;
    for (const candidate of candidates) {
      if (!candidate) continue;
      const full = normalizeName(candidate);
      const last = normalizeName((_a2 = candidate.split("/").pop()) != null ? _a2 : candidate);
      const match = (_b = RULE_BY_NAME.get(full)) != null ? _b : RULE_BY_NAME.get(last);
      if (match) return match;
    }
    return null;
  }
  var IGNORED_NORMALIZED = IGNORED_LAYER_NAMES.map(normalizeName);
  function isIgnoredLayer(names) {
    return names.some((name) => {
      var _a2;
      if (!name) return false;
      const full = normalizeName(name);
      const last = normalizeName((_a2 = name.split("/").pop()) != null ? _a2 : name);
      return IGNORED_NORMALIZED.includes(full) || IGNORED_NORMALIZED.includes(last);
    });
  }

  // src/tagueamento/shared/dicionario.ts
  var TRADUCOES = [
    ["Search", "Buscar"],
    // spec 4.2
    ["Back", "Voltar"],
    ["Next", "Proximo"],
    ["Cancel", "Cancelar"],
    ["Close", "Fechar"],
    ["Confirm", "Confirmar"],
    ["Continue", "Continuar"],
    ["Send", "Enviar"],
    ["Submit", "Enviar"],
    ["Save", "Salvar"],
    ["Edit", "Editar"],
    ["Delete", "Excluir"],
    ["Remove", "Remover"],
    ["Add", "Adicionar"],
    ["Share", "Compartilhar"],
    ["Download", "Baixar"],
    ["Upload", "Anexar"],
    ["Settings", "Configuracoes"],
    ["Profile", "Perfil"],
    ["Password", "Senha"],
    ["Help", "Ajuda"],
    ["Home", "Inicio"],
    ["Filter", "Filtrar"],
    ["Select", "Selecionar"],
    ["Expand", "Expandir"],
    ["Open", "Abrir"],
    ["Sign in", "Entrar"],
    ["Sign up", "Cadastrar"],
    ["Logout", "Sair"],
    ["Try again", "Tentar novamente"],
    ["Retry", "Tentar novamente"],
    ["Error", "Erro"],
    ["Success", "Sucesso"]
  ];
  var MANTER = ["Click", "Screen", "Modal", "Login", "Pix", "Token", "App", "Web", "N/A"];
  var SINALIZAR = [];

  // src/tagueamento/shared/naming.ts
  var MAX_VALUE_LENGTH = 100;
  var UNITS = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  var TEENS = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var HUNDREDS = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos"
  ];
  function belowThousand(n) {
    if (n === 0) return "";
    if (n === 100) return "cem";
    const parts = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds > 0) parts.push(HUNDREDS[hundreds]);
    if (rest > 0) {
      if (rest < 10) parts.push(UNITS[rest]);
      else if (rest < 20) parts.push(TEENS[rest - 10]);
      else {
        const tens = Math.floor(rest / 10);
        const units = rest % 10;
        parts.push(units > 0 ? `${TENS[tens]} e ${UNITS[units]}` : TENS[tens]);
      }
    }
    return parts.join(" e ");
  }
  function numberToWords(n) {
    if (!Number.isInteger(n) || n < 0 || n > 999999999) return String(n);
    if (n === 0) return UNITS[0];
    const millions = Math.floor(n / 1e6);
    const thousands = Math.floor(n % 1e6 / 1e3);
    const rest = n % 1e3;
    const groups = [];
    if (millions > 0) groups.push(millions === 1 ? "um milhao" : `${belowThousand(millions)} milhoes`);
    if (thousands > 0) groups.push(thousands === 1 ? "mil" : `${belowThousand(thousands)} mil`);
    if (rest > 0) groups.push(belowThousand(rest));
    if (groups.length > 1 && rest > 0 && (rest < 100 || rest % 100 === 0)) {
      const last = groups.pop();
      return `${groups.join(" ")} e ${last}`;
    }
    return groups.join(" ");
  }
  function removeAccents(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function wordPattern(term) {
    const body = removeAccents(term).trim().split(/\s+/).map(escapeRegExp).join("[\\s_-]+");
    return new RegExp("(^|[^A-Za-z0-9])(" + body + ")(?=$|[^A-Za-z0-9])", "gi");
  }
  var MANTER_KEYS = new Set(MANTER.map((term) => removeAccents(term).toLowerCase()));
  var TRANSLATIONS = TRADUCOES.filter(([en]) => !MANTER_KEYS.has(removeAccents(en).toLowerCase())).sort((a, b) => b[0].length - a[0].length).map(([en, pt]) => ({ en, pt, pattern: wordPattern(en) }));
  var FLAGS = SINALIZAR.filter((term) => !MANTER_KEYS.has(removeAccents(term).toLowerCase())).map((term) => ({
    term,
    pattern: wordPattern(term)
  }));
  function applyDictionary(text) {
    let result = removeAccents(text);
    const trocas = [];
    for (const { pt, pattern } of TRANSLATIONS) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, (_match, before, found) => {
        trocas.push({ de: found, para: pt });
        return before + pt;
      });
    }
    const sinalizados = [];
    for (const { term, pattern } of FLAGS) {
      pattern.lastIndex = 0;
      if (pattern.test(result)) sinalizados.push(term);
    }
    return { text: result, trocas, sinalizados };
  }
  function truncate(value, max) {
    if (value.length <= max) return value;
    const cut = value.slice(0, max);
    const lastUnderscore = cut.lastIndexOf("_");
    return (lastUnderscore > 0 ? cut.slice(0, lastUnderscore) : cut).replace(/_+$/, "");
  }
  function baseNormalize(text) {
    let value = text.trim();
    value = value.replace(/\d+/g, (digits) => ` ${numberToWords(Number(digits))} `);
    value = removeAccents(value);
    value = value.replace(/[\s-]+/g, "_");
    value = value.replace(/[^A-Za-z0-9_]/g, "");
    value = value.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    return value;
  }
  function normalizeWithReport(text, kind) {
    if (kind === "subregion" && text.trim().toUpperCase() === "N/A") {
      return { value: "N/A", trocas: [], sinalizados: [], cortado: false };
    }
    const dictionary = applyDictionary(text);
    const base = baseNormalize(dictionary.text);
    let cased;
    if (kind === "region") {
      cased = base.toUpperCase();
    } else {
      const lower = base.toLowerCase();
      cased = lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    const value = truncate(cased, MAX_VALUE_LENGTH);
    return { value, trocas: dictionary.trocas, sinalizados: dictionary.sinalizados, cortado: value.length < cased.length };
  }
  function describeReport(report) {
    const notas = report.trocas.map((troca) => `Termo em ingl\xEAs trocado: "${troca.de}" \u2192 ${troca.para.replace(/ /g, "_")}`);
    const pendencias = report.sinalizados.map((term) => `Termo em ingl\xEAs sem tradu\xE7\xE3o: "${term}" \u2014 revise`);
    if (report.cortado) pendencias.push(`Valor cortado em ${MAX_VALUE_LENGTH} caracteres \u2014 revise`);
    return { notas, pendencias };
  }

  // src/tagueamento/main/traversal/componentIdentity.ts
  async function resolveComponentNames(node) {
    const names = { instanceName: node.name, setName: null, mainName: null };
    let main = null;
    try {
      main = node.type === "INSTANCE" ? await node.getMainComponentAsync() : node;
    } catch (e) {
      main = null;
    }
    if (main) {
      names.mainName = main.name;
      try {
        const parent = main.parent;
        if (parent && parent.type === "COMPONENT_SET") names.setName = parent.name;
      } catch (e) {
      }
    }
    return names;
  }
  function candidateNames(names) {
    return [names.setName, names.mainName, names.instanceName].filter((name) => !!name);
  }
  function displayName(names) {
    var _a2, _b;
    return (_b = (_a2 = names.setName) != null ? _a2 : names.mainName) != null ? _b : names.instanceName;
  }

  // src/tagueamento/main/traversal/discovery.ts
  function firstVisibleText(node) {
    if ("visible" in node && !node.visible) return null;
    if (node.type === "TEXT") {
      const text = node.characters.replace(/\s+/g, " ").trim();
      return text.length > 0 ? text : null;
    }
    if ("children" in node) {
      for (const child of node.children) {
        const found = firstVisibleText(child);
        if (found) return found;
      }
    }
    return null;
  }
  async function discoverItems(root) {
    const found = [];
    async function walkChildren(node, insideModal) {
      if (!("children" in node)) return;
      for (const child of node.children) {
        await walk(child, insideModal);
      }
    }
    async function walk(node, insideModal) {
      if ("visible" in node && !node.visible) return;
      if (isIgnoredLayer([node.name])) return;
      if (node.type !== "INSTANCE" && node.type !== "COMPONENT") {
        await walkChildren(node, insideModal);
        return;
      }
      const names = await resolveComponentNames(node);
      if (isIgnoredLayer(candidateNames(names))) return;
      const match = findClassification(candidateNames(names));
      if (!match) {
        const before = found.length;
        await walkChildren(node, insideModal);
        if (found.length === before && firstVisibleText(node)) {
          found.push({
            node,
            names,
            componentName: displayName(names),
            classe: "nao_reconhecido",
            ruleName: null,
            insideModal
          });
        }
        return;
      }
      const { rule, name } = match;
      const item = { node, names, componentName: name, classe: rule.classe, ruleName: name, insideModal };
      switch (rule.classe) {
        case "select_content":
        case "search":
          found.push(item);
          return;
        case "modal_view":
          found.push(item);
          await walkChildren(node, true);
          return;
        case "feedback":
          found.push(item);
          await walkChildren(node, insideModal);
          return;
        case "container":
        case "nao_marcar":
          await walkChildren(node, insideModal);
          return;
      }
    }
    await walkChildren(root, false);
    return found;
  }

  // src/tagueamento/main/traversal/readingOrder.ts
  function getBounds2(node) {
    const box = node.absoluteBoundingBox;
    if (!box) return null;
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  function rowThresholdFor2(a, b) {
    return Math.min(a.height, b.height) * 0.6;
  }
  function sortByReadingOrder2(nodes) {
    const withBounds = [];
    const withoutBounds = [];
    for (const node of nodes) {
      const bounds = getBounds2(node);
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
      const threshold = lastItem ? rowThresholdFor2(lastItem.bounds, entry.bounds) : 0;
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

  // src/tagueamento/main/mapping/mapScreen.ts
  var WEB_WIDTH_THRESHOLD = 1e3;
  var PLACEHOLDER_PREVIOUS = "<Tela_anterior_apresentada>";
  function keysFor(plataforma) {
    return plataforma === "APP" ? { screen: "firebase_screen", previous: "firebase_previous_screen", target: "target_screen" } : { screen: "page_name", previous: "previous_page", target: "target_page" };
  }
  function firstTwoWords(text) {
    return text.split(/\s+/).filter((word) => /[A-Za-z0-9\u00C0-\u024F]/.test(word)).slice(0, 2).join(" ");
  }
  function screenNameOf(frameName) {
    return normalizeWithReport(firstTwoWords(frameName), "param").value;
  }
  function contentTypeOf(base, nomeTela) {
    const baseReport = normalizeWithReport(base, "param");
    const combined = normalizeWithReport(nomeTela ? `${baseReport.value}_${nomeTela}` : baseReport.value, "param");
    const { notas, pendencias } = describeReport(__spreadProps(__spreadValues({}, baseReport), { cortado: combined.cortado }));
    return { value: combined.value, notas, pendencias };
  }
  function contentBase(acao, label, componente) {
    if (acao && typeof acao === "object" && acao.kind === "pd") {
      return { base: null, pendencia: `A\xE7\xE3o preenchida pelo PD (${componente})` };
    }
    if (label) return { base: firstTwoWords(label) };
    if (typeof acao === "string") return { base: acao };
    return { base: null, pendencia: "Componente sem texto: preencha a a\xE7\xE3o" };
  }
  function mapScreen(frame, discovered, setup, graph, nomeTelaById) {
    var _a2, _b, _c, _d;
    const keys = keysFor(setup.plataforma);
    const nomeTelaReport = normalizeWithReport(firstTwoWords(frame.name), "param");
    const nomeTela = nomeTelaReport.value;
    const nomeTelaInfo = describeReport(nomeTelaReport);
    const largura = Math.round(frame.width);
    const plataformaPelaLargura = frame.width > WEB_WIDTH_THRESHOLD ? "WEB" : "APP";
    const avisos = [];
    if (!nomeTela) avisos.push("O nome do frame n\xE3o tem palavras para formar o nome da tela.");
    const divergeDoCanal = plataformaPelaLargura !== setup.plataforma;
    if (divergeDoCanal) {
      avisos.push(
        `A largura do frame (${largura} px) parece ${plataformaPelaLargura === "WEB" ? "web" : "app"}, mas o canal "${setup.canal}" \xE9 ${setup.plataforma === "WEB" ? "web" : "app"}. Voc\xEA pode seguir assim.`
      );
    }
    const origens = ((_a2 = graph.incoming.get(frame.id)) != null ? _a2 : []).map((id) => {
      var _a3;
      return (_a3 = nomeTelaById.get(id)) != null ? _a3 : id;
    });
    const destinos = ((_b = graph.outgoing.get(frame.id)) != null ? _b : []).map((id) => {
      var _a3;
      return (_a3 = nomeTelaById.get(id)) != null ? _a3 : id;
    });
    const telaAnterior = (_c = origens[0]) != null ? _c : null;
    if (origens.length > 1) {
      avisos.push(`Mais de uma tela leva at\xE9 esta (${origens.join(", ")}). Usei "${origens[0]}" como tela anterior \u2014 confira.`);
    }
    if (destinos.length > 1) {
      avisos.push(`Esta tela leva a mais de uma tela (${destinos.join(", ")}). A tela alvo ficou para voc\xEA escolher.`);
    }
    const previousValue = telaAnterior != null ? telaAnterior : PLACEHOLDER_PREVIOUS;
    const base = { region: setup.region, subregion: setup.subregion };
    const items = [];
    const screenParams = __spreadProps(__spreadValues({
      [keys.screen]: nomeTela
    }, base), {
      [keys.previous]: previousValue
    });
    if (destinos.length === 1) screenParams[keys.target] = destinos[0];
    items.push({
      numero: 1,
      nodeId: frame.id,
      componente: frame.name,
      evento: setup.plataforma === "APP" ? "screen_view" : "page_view",
      origem: "tela",
      label: null,
      params: screenParams,
      pendencias: [...nomeTelaInfo.pendencias],
      notas: nomeTelaInfo.notas.map((nota) => `Nome da tela \u2014 ${nota}`),
      paraPd: []
    });
    const ordered = sortByReadingOrder2(discovered.map((item) => item.node));
    const byId = new Map(discovered.map((item) => [item.node.id, item]));
    for (const node of ordered) {
      const found = byId.get(node.id);
      if (!found) continue;
      const label = firstVisibleText(found.node);
      const evento = found.classe === "nao_reconhecido" ? "select_content" : EVENT_BY_CLASS[found.classe];
      if (!evento) continue;
      const item = {
        numero: items.length + 1,
        nodeId: found.node.id,
        componente: found.componentName,
        evento,
        origem: "componente",
        label,
        params: {},
        pendencias: [],
        notas: [],
        paraPd: []
      };
      if (found.classe === "nao_reconhecido") {
        item.pendencias.push("Componente n\xE3o reconhecido: confirme se \xE9 mesmo um select_content");
      }
      switch (evento) {
        case "select_content": {
          const rule = found.ruleName ? (_d = findClassification([found.ruleName])) == null ? void 0 : _d.rule : void 0;
          const { base: contentText, pendencia } = contentBase(rule == null ? void 0 : rule.acao, label, found.componentName);
          if (pendencia) item.pendencias.push(pendencia);
          const contentType = contentText ? contentTypeOf(contentText, nomeTela) : null;
          if (contentType) {
            item.notas.push(...contentType.notas);
            item.pendencias.push(...contentType.pendencias);
          }
          item.params = __spreadProps(__spreadValues({
            content_type: contentType ? contentType.value : ""
          }, base), {
            action: "Click",
            local_name: nomeTela,
            local_type: found.insideModal ? "Modal" : "Screen",
            previous_page: previousValue
          });
          if (!contentText) delete item.params.content_type;
          break;
        }
        case "modal_view": {
          const modalReport = label ? normalizeWithReport(label, "param") : null;
          const modalName = modalReport ? modalReport.value : "";
          if (modalReport) {
            const info = describeReport(modalReport);
            item.notas.push(...info.notas);
            item.pendencias.push(...info.pendencias);
          }
          if (!modalName) item.pendencias.push("Modal sem t\xEDtulo: preencha o modal_name");
          item.params = __spreadValues({}, base);
          if (modalName) item.params.modal_name = modalName;
          if (setup.plataforma === "APP") item.params.firebase_screen = nomeTela;
          else if (modalName) item.params.page_name = modalName;
          break;
        }
        case "feedback":
          item.params = __spreadProps(__spreadValues({}, base), { [keys.screen]: nomeTela, [keys.previous]: previousValue });
          item.paraPd.push("feedback_name");
          break;
        case "search":
          item.params = __spreadProps(__spreadValues({}, base), { [keys.screen]: nomeTela, [keys.previous]: previousValue });
          item.paraPd.push("search_term", "result");
          break;
      }
      items.push(item);
    }
    return {
      frameId: frame.id,
      frameName: frame.name,
      nomeTela,
      largura,
      altura: Math.round(frame.height),
      plataformaPelaLargura,
      divergeDoCanal,
      origens,
      destinos,
      items,
      avisos
    };
  }

  // src/tagueamento/main/mapping/runMapping.ts
  function isScreenNode(node) {
    return node.type === "FRAME" || node.type === "GROUP";
  }
  function topLevelFrames() {
    const frames = [];
    function collect(children) {
      for (const child of children) {
        if (!child.visible) continue;
        if (child.type === "SECTION") collect(child.children);
        else if (child.type === "FRAME") frames.push(child);
      }
    }
    collect(figma.currentPage.children);
    return frames;
  }
  var yieldToFigma = () => new Promise((resolve) => setTimeout(resolve, 0));
  async function runMapping(setup, onProgress) {
    const pageFrames = topLevelFrames();
    const result = { modo: setup.modo, screens: [], avisos: [] };
    let targets;
    if (setup.modo === "tela") {
      const selection = figma.currentPage.selection;
      if (selection.length !== 1 || !isScreenNode(selection[0])) {
        throw new Error("Selecione um \xFAnico frame para mapear.");
      }
      targets = [selection[0]];
    } else {
      targets = pageFrames;
      if (targets.length === 0) {
        result.avisos.push("Esta p\xE1gina n\xE3o tem frames de primeiro n\xEDvel.");
        return result;
      }
    }
    const graphFrames = [...pageFrames];
    for (const target of targets) if (!graphFrames.includes(target)) graphFrames.push(target);
    const graph = await buildPrototypeGraph(graphFrames);
    const nomeTelaById = new Map(graphFrames.map((frame) => [frame.id, screenNameOf(frame.name)]));
    onProgress(0, targets.length);
    for (let index = 0; index < targets.length; index++) {
      const frame = targets[index];
      const discovered = await discoverItems(frame);
      result.screens.push(mapScreen(frame, discovered, setup, graph, nomeTelaById));
      onProgress(index + 1, targets.length);
      await yieldToFigma();
    }
    return result;
  }

  // src/tagueamento/main/selection.ts
  var listening = false;
  function currentState() {
    const selection = figma.currentPage.selection;
    if (selection.length === 1 && isScreenNode(selection[0])) {
      const node = selection[0];
      return {
        valid: true,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        width: Math.round(node.width),
        height: Math.round(node.height)
      };
    }
    return { valid: false, nodeId: null, nodeName: null };
  }
  function sendState() {
    postToTagUi({ type: "tag:selection-state", state: currentState() });
  }
  function watchSelection(enabled) {
    if (enabled && !listening) {
      figma.on("selectionchange", sendState);
      listening = true;
    } else if (!enabled && listening) {
      figma.off("selectionchange", sendState);
      listening = false;
    }
    if (enabled) sendState();
  }

  // src/tagueamento/main/router.ts
  function isTagueamentoMessage(message) {
    return typeof message === "object" && message !== null && isTagMessageType(message.type);
  }
  async function runDiagnosis() {
    try {
      const diagnosis = await diagnoseSelection();
      postToTagUi({ type: "tag:diagnosis-result", diagnosis });
    } catch (error) {
      postToTagUi({
        type: "tag:diagnosis-error",
        message: error instanceof Error ? error.message : "N\xE3o foi poss\xEDvel ler o card selecionado."
      });
    }
  }
  async function runCreateTestCard(sourceNodeId, variantValues) {
    try {
      const result = await createTestCard(sourceNodeId, variantValues);
      postToTagUi({ type: "tag:test-card-result", result });
    } catch (error) {
      postToTagUi({
        type: "tag:test-card-result",
        result: {
          ok: false,
          message: `Falha inesperada ao criar o card de teste: ${error instanceof Error ? error.message : String(error)}`
        }
      });
    }
  }
  async function runCheckAllVariants() {
    try {
      const result = await checkAllVariants();
      postToTagUi({ type: "tag:all-variants-result", result });
    } catch (error) {
      postToTagUi({
        type: "tag:all-variants-result",
        result: {
          keyUsed: GA_CARD_SET_KEY,
          importOk: false,
          source: "none",
          setNameOk: false,
          variantOptions: [],
          unmatchedVariants: [],
          toggles: [],
          showToggleFound: false,
          checks: [],
          warnings: [`Falha inesperada na verifica\xE7\xE3o: ${error instanceof Error ? error.message : String(error)}`]
        }
      });
    }
  }
  var mappingInProgress = false;
  async function runMappingAndReport(setup) {
    if (mappingInProgress) return;
    mappingInProgress = true;
    try {
      const result = await runMapping(setup, (done, total) => postToTagUi({ type: "tag:mapping-progress", done, total }));
      postToTagUi({ type: "tag:mapping-result", result });
    } catch (error) {
      postToTagUi({
        type: "tag:mapping-error",
        message: error instanceof Error ? error.message : "N\xE3o foi poss\xEDvel mapear a tela."
      });
    } finally {
      mappingInProgress = false;
    }
  }
  async function focusNode2(nodeId) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (node && "visible" in node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    } else {
      figma.notify("Camada n\xE3o encontrada");
    }
  }
  function handleTagueamentoMessage(message) {
    switch (message.type) {
      case "tag:ui-ready":
        postToTagUi({ type: "tag:ready", fileName: figma.root.name });
        break;
      case "tag:close-plugin":
        watchSelection(false);
        figma.closePlugin();
        break;
      case "tag:diagnose-selection":
        void runDiagnosis();
        break;
      case "tag:create-test-card":
        void runCreateTestCard(message.sourceNodeId, message.variantValues);
        break;
      case "tag:check-all-variants":
        void runCheckAllVariants();
        break;
      case "tag:get-last-setup":
        void loadLastSetup().then((setup) => postToTagUi({ type: "tag:last-setup", setup }));
        break;
      case "tag:save-setup":
        void saveLastSetup(message.setup);
        break;
      case "tag:open-external":
        figma.openExternal(message.url);
        break;
      case "tag:watch-selection":
        watchSelection(message.enabled);
        break;
      case "tag:run-mapping":
        void runMappingAndReport(message.setup);
        break;
      case "tag:focus-node":
        void focusNode2(message.nodeId);
        break;
      default:
        break;
    }
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
  var outputIsDeletedScreen = false;
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
    outputIsDeletedScreen = false;
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
        layerCount: countDescendants(node),
        existingMarkerCount: countExistingMarkers(node)
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
      const { createdGroups, missingNodeErrors } = await generateMarkers(ordered, (done, total) => {
        postToUi({ type: "generation-progress", stage: "markers", done, total });
      });
      postToUi({ type: "generation-progress", stage: "table", done: 0, total: 1 });
      const panel = await generatePanel(screenNode, ordered);
      postToUi({ type: "generation-progress", stage: "table", done: 1, total: 1 });
      lastGeneratedOutputNodeId = panel.id;
      outputIsDeletedScreen = false;
      for (const group of createdGroups) {
        tagAsScreenOutput(group, screenNode.id);
      }
      tagAsScreenOutput(panel, screenNode.id);
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
          var _a2, _b, _c;
          return {
            nodeName: item.nodeName,
            markupTypeLabel: (_b = (_a2 = MARKUP_TYPES.find((t) => t.key === item.markupType)) == null ? void 0 : _a2.label) != null ? _b : UNSPECIFIED_TYPE_LABEL,
            verbalization: item.verbalization,
            links: (_c = findRuleByKey(item.ruleKey)) == null ? void 0 : _c.links
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
  async function deleteExistingMarkupOfSelection(thenAnalyze) {
    const selection = getCurrentSelection();
    if (selection.length !== 1 || !isValidScreenNode(selection[0])) {
      postToUi({ type: "analysis-error", message: "Selecione um \xFAnico frame, grupo ou auto layout." });
      return;
    }
    const screenNode = selection[0];
    const deletedCount = deleteExistingMarkup(screenNode);
    if (thenAnalyze) {
      await runAnalysis();
      return;
    }
    lastGeneratedOutputNodeId = screenNode.id;
    outputIsDeletedScreen = true;
    postToUi({ type: "markup-deleted", deletedCount, screenName: screenNode.name, screenId: screenNode.id });
    figma.currentPage.selection = [];
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
    if (isTagueamentoMessage(message)) {
      handleTagueamentoMessage(message);
      return;
    }
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
        if (lastGeneratedOutputNodeId && outputIsDeletedScreen) {
          void figma.getNodeByIdAsync(lastGeneratedOutputNodeId).then((node) => {
            if (node && "x" in node) {
              figma.viewport.scrollAndZoomIntoView([node]);
            } else {
              figma.notify("Tela n\xE3o encontrada");
            }
          });
        } else if (lastGeneratedOutputNodeId) {
          void focusNode(lastGeneratedOutputNodeId).then((found) => {
            if (!found) {
              figma.notify("Painel de especifica\xE7\xF5es n\xE3o encontrado");
            }
          });
        }
        break;
      case "delete-existing-markup":
        void deleteExistingMarkupOfSelection(message.thenAnalyze);
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
