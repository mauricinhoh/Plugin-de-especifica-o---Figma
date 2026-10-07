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
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

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
    // Mesmo texto do [Label], sem o sinal de menos do começo (ex.:
    // Currency negativo: "-R$ 500,00" → "R$ 500,00"). Confirmado com o
    // usuário em 05/10/2026.
    "label sem sinal": (data) => {
      var _a2;
      return (_a2 = data.text) == null ? void 0 : _a2.replace(/^\s*[-\u2212\u2013]\s*/, "");
    },
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
  function buildStateCandidates(variantProperties, derivedStates, booleanProperties) {
    if (!variantProperties && !booleanProperties) return [];
    const candidates = [];
    for (const [propertyName, value] of Object.entries(variantProperties != null ? variantProperties : {})) {
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
          var _a2;
          const actual = (_a2 = variantProperties == null ? void 0 : variantProperties[flag]) != null ? _a2 : booleanProperties == null ? void 0 : booleanProperties[flag];
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
    var _a2, _b, _c, _d;
    if (!rule || !rule.hasVerbalization) {
      return "";
    }
    const derivedTemplate = rule.templatesByDerivedState ? (_a2 = Object.entries(rule.templatesByDerivedState).find(([state]) => variantValues.includes(state))) == null ? void 0 : _a2[1] : void 0;
    let template = derivedTemplate != null ? derivedTemplate : rule.templateWithoutTitle && extractedData.text === void 0 && extractedData.text2 !== void 0 ? rule.templateWithoutTitle : rule.templateWithoutDescription && extractedData.text !== void 0 && extractedData.text2 === void 0 ? rule.templateWithoutDescription : (_b = selectVerbalizationTemplate(rule, variantValues)) != null ? _b : rule.template;
    if (!template) {
      return "";
    }
    if (rule.onlyWithUnderline && extractedData.sublinhado === "nao") {
      template = template.split(rule.onlyWithUnderline).join("");
    }
    if (rule.lastTextLayer && extractedData.ultimaCamadaOculta === "sim") {
      template = template.split(rule.lastTextLayer.trechoSeOculta).join("");
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
      ).join((_c = format.separador) != null ? _c : "\n");
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
      ).join((_d = format.separador) != null ? _d : ", ");
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
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Bot\xE3o\u201D.\nLoading macOS: \u201CCarregando\u201D.\nLoading Windows: \u201CCarregando\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label] Indispon\xEDvel, Bot\xE3o\u201D.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Secondary",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Label], Bot\xE3o\u201D.\nLoading macOS: \u201CCarregando\u201D.\nLoading Windows: \u201CCarregando\u201D.\nDisabled macOS: \u201C[Label], Escurecido, Bot\xE3o\u201D.\nDisabled Windows: \u201C[Label] Indispon\xEDvel, Bot\xE3o\u201D.",
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
      "verbalizacaoEsperada": 'Hiden true: "Valor oculto" Hiden false positive: "[Label]" Hiden true negative: "-[Label]"',
      "tipo": "N\xE3o interativo",
      "foco": "N\xE3o",
      "derivedStates": [
        { "whenFlagsEqual": { "Hiden": "True" }, "thenState": "Currency oculto" },
        { "whenFlagsEqual": { "Type": "Negative" }, "thenState": "Currency negativo" }
      ],
      "verbalizacaoPorEstadoDerivado": {
        "Currency oculto": 'Hiden true: "Valor oculto"',
        "Currency negativo": 'Hiden true: "Valor oculto" Hiden false positive: "[Label sem sinal]" Hiden true negative: "[Label]"'
      }
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
      // NÃO vem da planilha — componente usado dentro do frame "PDF".
      // Verbalização passada pelo usuário em 07/10/2026.
      "categoria": "Content",
      "componente": "Sicredi Logo",
      "estados": null,
      "verbalizacaoEsperada": "Alt Text: Sicredi, Logo Sicredi",
      "tipo": "Imagem",
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
      "somenteFilhos": true,
      "titulosEmOrdemLogica": true
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
      "verbalizacaoSemTitulo": "[Descri\xE7\xE3o], Link",
      "trechoSoComSublinhado": ", Link"
    },
    {
      "categoria": "Feedback",
      "componente": "Flag Cooperado",
      "estados": "Estrutural e n\xE3o interativo; links internos herdam estados.",
      "verbalizacaoEsperada": "[T\xEDtulo], [Descri\xE7\xE3o], Link",
      "tipo": "Estrutura",
      "foco": "Apenas elementos interativos",
      "extracaoTexto": "titulo-descricao",
      "verbalizacaoSemTitulo": "[Descri\xE7\xE3o], Link",
      "trechoSoComSublinhado": ", Link"
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
      "verbalizacaoEsperada": 'Quando vazio: Label acess\xEDvel "Informe o c\xF3digo, [posi\xE7\xE3o], Campo de edi\xE7\xE3o, [Help Text]". Quando preenchido: Label acess\xEDvel "Informe o c\xF3digo, Marcador, [posi\xE7\xE3o], Campo de edi\xE7\xE3o, [Help Text]".\n',
      "tipo": "Entrada",
      "foco": "Sim",
      "ultimaCamadaDeTexto": {
        "placeholder": "help text",
        "trechoSeOculta": ", [Help Text]"
      }
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code Number",
      "estados": "habilitado, focus, hover e preenchido;",
      "verbalizacaoEsperada": "Ao focar em cada um dos bot\xF5es leitor anuncia: \u201C6 ou 1, Bot\xE3o, [Help Text]\u201D.\nFeedback din\xE2mico:\nQuando uma tecla \xE9 acionada, o campo de senha atualiza\u2028 \u201Cx d\xEDgitos inseridos\u201D\nBot\xE3o Limpar:\nDeve anunciar \u201CCaracteres apagados\u201D ap\xF3s a\xE7\xE3o.",
      "tipo": "Entrada",
      "foco": "Sim",
      "ultimaCamadaDeTexto": {
        "placeholder": "help text",
        "trechoSeOculta": ", [Help Text]"
      }
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
      },
      "ultimaCamadaDeTexto": {
        "placeholder": "contador",
        "trechoSeOculta": "[contador], "
      }
    },
    {
      "categoria": "Inputs",
      "componente": "List Select",
      "estados": "Herda do seletor interno: Hover, Focus, Checked, Unchecked, Disabled etc.",
      "verbalizacaoEsperada": "Marcado: \u201C[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o, Marcado\u201D\nN\xE3o marcado: \u201C[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o, N\xE3o marcado\u201D\nParcialmente marcado: \u201C[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o parcialmente marcada\u201D\nDesabilitado: \u201C[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o desabilitada\u201D",
      "tipo": "Entrada",
      "foco": "Sim",
      "textosPorPosicao": [
        "Descri\xE7\xE3o",
        "Label"
      ],
      "estadoDoComponenteInterno": "Checkbox",
      "derivedStates": [
        { "whenFlagsEqual": { "Selected": "True" }, "thenState": "List Select marcado" },
        { "whenFlagsEqual": { "Selected": "False", "Indeterminate": "False", "Disabled": "False" }, "thenState": "List Select n\xE3o marcado" },
        { "whenFlagsEqual": { "Indeterminate": "True" }, "thenState": "List Select parcialmente marcado" },
        { "whenFlagsEqual": { "Disabled": "True" }, "thenState": "List Select desabilitado" }
      ],
      "verbalizacaoPorEstadoDerivado": {
        "List Select marcado": "[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o, Marcado",
        "List Select n\xE3o marcado": "[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o, N\xE3o marcado",
        "List Select parcialmente marcado": "[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o parcialmente marcada",
        "List Select desabilitado": "[Descri\xE7\xE3o], [Label], Caixa de sele\xE7\xE3o desabilitada"
      }
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
      "somenteFilhos": true,
      "itensPadrao": {
        "nomeDoItem": "^item\\s*\\d+$",
        "verbalizacaoDoItem": "[Label]"
      }
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
      "aliasesDeNome": [
        "Input Search"
      ],
      "estados": "Habilitado/Focus, Hover, Filled;",
      "verbalizacaoEsperada": "[Placeholder], Campo de busca, Buscar, Bot\xE3o",
      "tipo": "Entrada",
      "foco": "Sim",
      "primeiroTextoEm": "placeholder"
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
        "item": "[Label] link",
        "ultimo": "[Label] link, P\xE1gina atual",
        "separador": ", "
      }
    },
    {
      "categoria": "Navigation",
      "componente": "Carousel Nav",
      "estados": "Herda de Page Indicator e Button Icon.",
      "verbalizacaoEsperada": "O leitor de tela anuncia os bot\xF5es como controles de navega\xE7\xE3o.\n\n\u201CCarrossel. 3 itens. Item 1 de 3. Pr\xF3ximo, Bot\xE3o\u201D",
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
      "sempreAprofundar": true,
      "textoPequenoSemTitulo": true
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
        "naoSelecionada": "N\xE3o selecionado: [Label], Guia, Posi\xE7\xE3o [Posi\xE7\xE3o] de [Total]",
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
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j;
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
      templatesByDerivedState: record.verbalizacaoPorEstadoDerivado,
      onlyWithUnderline: record.trechoSoComSublinhado,
      lastTextLayer: record.ultimaCamadaDeTexto,
      headingsInLogicalOrder: (_h = record.titulosEmOrdemLogica) != null ? _h : false,
      smallTextAsPlainText: (_i = record.textoPequenoSemTitulo) != null ? _i : false,
      firstTextPlaceholder: record.primeiroTextoEm,
      textsByPosition: record.textosPorPosicao,
      stateFromInnerComponent: record.estadoDoComponenteInterno,
      standardItemNamePattern: (_j = record.itensPadrao) == null ? void 0 : _j.nomeDoItem,
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
  var standardItemRules = accessibilityRuleRecords.filter((record) => record.itensPadrao).map((record) => __spreadProps(__spreadValues({}, buildRule(__spreadProps(__spreadValues({}, record), {
    itensPadrao: void 0,
    somenteFilhos: false,
    verbalizacaoEsperada: record.itensPadrao.verbalizacaoDoItem
  }))), {
    key: `${slugify(record.componente)}--item`
  }));
  var PDF_HEADING_RULE_KEY = "pdf-titulo";
  var PLAIN_TEXT_RULE_KEY = "texto";
  var looseTextRules = [
    __spreadProps(__spreadValues({}, buildRule({
      categoria: "Content",
      componente: "PDF T\xEDtulo",
      estados: null,
      // O número do nível é preenchido manualmente pelo PD.
      verbalizacaoEsperada: "[Label], T\xEDtulo de n\xEDvel",
      tipo: "T\xEDtulo",
      foco: "N\xE3o"
    })), {
      key: PDF_HEADING_RULE_KEY
    }),
    __spreadProps(__spreadValues({}, buildRule({
      categoria: "Content",
      componente: "Texto",
      estados: null,
      // O próprio texto.
      verbalizacaoEsperada: "[Label]",
      tipo: "N\xE3o interativo",
      foco: "N\xE3o"
    })), {
      key: PLAIN_TEXT_RULE_KEY
    })
  ];
  function findRuleByKey(key) {
    var _a2, _b, _c;
    if (!key) return void 0;
    return (_c = (_b = (_a2 = accessibilityRules.find((r) => r.key === key)) != null ? _a2 : containerVariantRules.find((r) => r.key === key)) != null ? _b : standardItemRules.find((r) => r.key === key)) != null ? _c : looseTextRules.find((r) => r.key === key);
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

  // src/main/analysis/pdfFrame.ts
  var PDF_FRAME_NAME = "pdf";
  function isPdfFrame(node) {
    return (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION") && node.name.trim().toLowerCase() === PDF_FRAME_NAME;
  }
  function isInsidePdfFrame(node) {
    let current = node.parent;
    while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
      if (isPdfFrame(current)) return true;
      current = current.parent;
    }
    return false;
  }
  function isBoldStyle(style) {
    const compact = style.toLowerCase().replace(/[\s_-]+/g, "");
    return compact.startsWith("bold") || compact.startsWith("extrabold");
  }
  function isPdfHeadingText(node) {
    if (node.fontName !== figma.mixed) {
      return isBoldStyle(node.fontName.style);
    }
    const segments = node.getStyledTextSegments(["fontName"]);
    return segments.length > 0 && segments.every((segment) => isBoldStyle(segment.fontName.style));
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
    async function walk(node, insideRecognizedContainer, insidePdf) {
      if ("visible" in node && !node.visible) {
        return;
      }
      if (IGNORED_COMPONENT_NAMES.includes(node.name)) {
        return;
      }
      const nextInsidePdf = insidePdf || isPdfFrame(node);
      if (nextInsidePdf && node.type === "TEXT" && !insideRecognizedContainer) {
        if (node.characters.trim().length > 0) {
          found.push(node);
        }
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
          await walk(child, nextInsideRecognizedContainer, nextInsidePdf);
        }
      }
    }
    if ("children" in root) {
      const rootIsPdf = isPdfFrame(root);
      for (const child of root.children) {
        await walk(child, false, rootIsPdf);
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
  function extractTextsByLayerName(node, spec, excludeNodeId) {
    const result = {};
    for (const textNode of findAllTexts(node)) {
      if (textNode.id === excludeNodeId) continue;
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
  function findLastTextLayer(node) {
    let last = null;
    const walk = (current, parentVisible) => {
      const visible = parentVisible && !("visible" in current && current.visible === false);
      if (current.type === "TEXT") {
        last = { node: current, visible };
        return;
      }
      if ("children" in current) {
        for (const child of current.children) walk(child, visible);
      }
    };
    if ("children" in node) {
      for (const child of node.children) walk(child, true);
    }
    return last;
  }
  function hasUnderlinedText(node) {
    return findAllTexts(node).some((text) => {
      if (text.textDecoration === "UNDERLINE") return true;
      if (text.textDecoration === figma.mixed) {
        return text.getStyledTextSegments(["textDecoration"]).some((segment) => segment.textDecoration === "UNDERLINE");
      }
      return false;
    });
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
  function extractBooleanProperties(node) {
    if (node.type !== "INSTANCE") {
      return null;
    }
    const componentProperties = node.componentProperties;
    if (!componentProperties) {
      return null;
    }
    const booleanValues = {};
    for (const [propertyName, property] of Object.entries(componentProperties)) {
      if (property.type === "BOOLEAN" && typeof property.value === "boolean") {
        booleanValues[propertyName.split("#")[0].trim()] = property.value ? "true" : "false";
      }
    }
    return Object.keys(booleanValues).length > 0 ? booleanValues : null;
  }
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
  var SMALL_TEXT_HEADING_LEVELS = /* @__PURE__ */ new Set(["5", "6"]);
  var MAX_HEADING_LEVEL = 6;

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
    if ((rule == null ? void 0 : rule.standardItemNamePattern) && await hasStandardItems(node, rule.standardItemNamePattern)) {
      return { recognized: true, alwaysDescend: false, childrenOnly: false, cardPerItem: true, ignoreLooseText: false };
    }
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
  async function hasStandardItems(node, pattern) {
    const items = collectItems(node);
    if (items.length === 0) return false;
    const nameRegex = new RegExp(pattern, "i");
    if (!items.every((item) => nameRegex.test(item.name.trim()))) return false;
    const componentNames = /* @__PURE__ */ new Set();
    for (const item of items) componentNames.add(await resolveComponentName(item));
    return componentNames.size === 1 && !componentNames.has(null);
  }
  function normalizePlaceholderKey(name) {
    return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }
  async function findInnerComponentByRule(node, ruleLabel) {
    if (!("children" in node)) return null;
    for (const child of node.children) {
      if (child.type === "INSTANCE") {
        const name = await resolveComponentName(child);
        const childRule = findMatchingRule(accessibilityRules, { nodeName: child.name, componentName: name });
        if ((childRule == null ? void 0 : childRule.label) === ruleLabel) return child;
      }
      const found = await findInnerComponentByRule(child, ruleLabel);
      if (found) return found;
    }
    return null;
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
  async function isInsideSmallTextAsPlainTextContainer(node) {
    let current = node.parent;
    while (current && current.type !== "PAGE" && current.type !== "DOCUMENT") {
      const componentName = current.type === "INSTANCE" || current.type === "COMPONENT" ? await resolveComponentName(current) : null;
      const rule = findMatchingRule(accessibilityRules, { nodeName: current.name, componentName });
      if (rule == null ? void 0 : rule.smallTextAsPlainText) return true;
      current = current.parent;
    }
    return false;
  }
  async function buildSpecificationItem(node, order, manuallyAdded, inheritRuleFrom) {
    var _a2, _b, _c, _d, _e, _f;
    const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
    const isTextNode = node.type === "TEXT";
    const coreType = isComponentLike ? (await identifyCoreType(node)).coreType : "DESCONHECIDO";
    const componentName = isComponentLike ? await resolveComponentName(node) : null;
    let rule = isComponentLike ? findMatchingRule(accessibilityRules, { nodeName: node.name, componentName }) : void 0;
    if (inheritRuleFrom) {
      const parentComponentName = await resolveComponentName(inheritRuleFrom);
      rule = (_a2 = findMatchingRule(accessibilityRules, { nodeName: inheritRuleFrom.name, componentName: parentComponentName })) != null ? _a2 : rule;
      if (rule == null ? void 0 : rule.standardItemNamePattern) {
        rule = (_b = findRuleByKey(`${rule.key}--item`)) != null ? _b : rule;
      }
    }
    if (rule == null ? void 0 : rule.variantsInsideContainer) {
      for (const ancestor of await findAncestorRules(node)) {
        const variantKey = rule.variantsInsideContainer[ancestor.ruleKey];
        if (variantKey) {
          rule = (_c = findRuleByKey(variantKey)) != null ? _c : rule;
          break;
        }
      }
    }
    const extractedData = {};
    if (isTextNode && isInsidePdfFrame(node)) {
      rule = findRuleByKey(isPdfHeadingText(node) ? PDF_HEADING_RULE_KEY : PLAIN_TEXT_RULE_KEY);
      extractedData.text = node.characters;
    } else if (isTextNode) {
      const headingLevel = detectHeadingLevelFromFontSize(node);
      if (headingLevel && SMALL_TEXT_HEADING_LEVELS.has(headingLevel) && await isInsideSmallTextAsPlainTextContainer(node)) {
        rule = findRuleByKey(PLAIN_TEXT_RULE_KEY);
        extractedData.text = node.characters;
      } else if (headingLevel) {
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
    if (!isTextNode && (rule == null ? void 0 : rule.textsByPosition)) {
      const texts = listTextLayers(node);
      rule.textsByPosition.forEach((placeholder, index) => {
        var _a3;
        const value = (_a3 = texts[index]) == null ? void 0 : _a3.texto;
        if (value !== void 0) {
          extractedData[`camada:${normalizePlaceholderKey(placeholder)}`] = value;
        }
      });
    }
    if (!isTextNode && (rule == null ? void 0 : rule.firstTextPlaceholder)) {
      const firstText = extractFirstText(node);
      if (firstText !== void 0) {
        extractedData[`camada:${rule.firstTextPlaceholder}`] = firstText;
      }
    }
    const lastTextLayer = !isTextNode && (rule == null ? void 0 : rule.lastTextLayer) ? findLastTextLayer(node) : null;
    if (!isTextNode && (rule == null ? void 0 : rule.textsByLayerName)) {
      const byLayer = extractTextsByLayerName(node, rule.textsByLayerName, lastTextLayer == null ? void 0 : lastTextLayer.node.id);
      for (const [placeholder, value] of Object.entries(byLayer)) {
        extractedData[`camada:${placeholder}`] = value;
      }
      if (DEBUG_TEXT_LAYERS) {
        console.log("[text-layers-debug]", { nodeName: node.name, ruleKey: rule.key, camadasDeTexto: listTextLayers(node), preenchidos: byLayer });
      }
    }
    if ((rule == null ? void 0 : rule.lastTextLayer) && lastTextLayer) {
      if (lastTextLayer.visible && lastTextLayer.node.characters.trim().length > 0) {
        extractedData[`camada:${rule.lastTextLayer.placeholder}`] = lastTextLayer.node.characters;
      } else {
        delete extractedData[`camada:${rule.lastTextLayer.placeholder}`];
        extractedData.ultimaCamadaOculta = "sim";
      }
    }
    if (!isTextNode && (rule == null ? void 0 : rule.key) === "heading" && extractedData.nivel === void 0) {
      const headingText = findFirstTextNode(node);
      const level = headingText ? detectHeadingLevelFromFontSize(headingText) : null;
      if (level) {
        extractedData.nivel = level;
      }
    }
    if (rule == null ? void 0 : rule.onlyWithUnderline) {
      extractedData.sublinhado = hasUnderlinedText(node) ? "sim" : "nao";
    }
    let variantProperties = extractVariantProperties(node);
    let booleanProperties = extractBooleanProperties(node);
    if (!isTextNode && (rule == null ? void 0 : rule.stateFromInnerComponent)) {
      const inner = await findInnerComponentByRule(node, rule.stateFromInnerComponent);
      if (inner) {
        const innerVariants = extractVariantProperties(inner);
        const innerBooleans = extractBooleanProperties(inner);
        if (innerVariants) variantProperties = __spreadValues(__spreadValues({}, variantProperties != null ? variantProperties : {}), innerVariants);
        if (innerBooleans) booleanProperties = __spreadValues(__spreadValues({}, booleanProperties != null ? booleanProperties : {}), innerBooleans);
      }
    }
    const variantValues = buildStateCandidates(variantProperties, rule == null ? void 0 : rule.derivedStates, booleanProperties);
    logStateDebugInfo(node, rule, variantProperties, variantValues);
    const verbalization = computeVerbalization(rule, extractedData, variantValues);
    return {
      id: generateSpecificationId(),
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      markupType: (_d = rule == null ? void 0 : rule.markupType) != null ? _d : UNSPECIFIED_TYPE_KEY,
      ruleKey: (_e = rule == null ? void 0 : rule.key) != null ? _e : null,
      variantProperties,
      booleanProperties,
      coreType,
      extractedData,
      verbalization,
      order,
      manuallyAdded,
      verbalizationEdited: false,
      focusEligible: (_f = rule == null ? void 0 : rule.focusEligible) != null ? _f : false
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
    await renumberHeadingsInLogicalOrder(topLevelNodes, items);
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
  var SCREEN_FIRST_HEADING_LEVEL = 2;
  async function renumberHeadingsInLogicalOrder(nodes, items) {
    var _a2;
    const containerCounters = /* @__PURE__ */ new Map();
    let screenLevel = SCREEN_FIRST_HEADING_LEVEL - 1;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const node = nodes[index];
      if (!node) continue;
      if (isInsidePdfFrame(node)) continue;
      const isHeading = item.ruleKey === "heading";
      const isHeaderProductWithTitle = item.ruleKey === "header-product" && item.extractedData.text !== void 0;
      if (!isHeading && !isHeaderProductWithTitle) continue;
      const currentLevel = item.extractedData.nivel;
      const container = (await findAncestorRules(node)).find(
        (ancestor) => {
          var _a3;
          return (_a3 = findRuleByKey(ancestor.ruleKey)) == null ? void 0 : _a3.headingsInLogicalOrder;
        }
      );
      if (container) {
        if (!isHeading || currentLevel === void 0 || SMALL_TEXT_HEADING_LEVELS.has(currentLevel)) continue;
        const next = Math.min(((_a2 = containerCounters.get(container.node.id)) != null ? _a2 : 0) + 1, MAX_HEADING_LEVEL);
        containerCounters.set(container.node.id, next);
        applyHeadingLevel(item, String(next));
        continue;
      }
      screenLevel += 1;
      if (screenLevel <= MAX_HEADING_LEVEL) {
        applyHeadingLevel(item, String(screenLevel));
        continue;
      }
      const isSmallLooseText = node.type === "TEXT" && currentLevel !== void 0 && SMALL_TEXT_HEADING_LEVELS.has(currentLevel);
      if (isSmallLooseText) {
        turnIntoPlainText(item);
      } else {
        applyHeadingLevel(item, String(MAX_HEADING_LEVEL));
      }
    }
  }
  function recomputeVerbalization(item) {
    const rule = findRuleByKey(item.ruleKey);
    if (!rule || item.verbalizationEdited) return;
    item.verbalization = computeVerbalization(
      rule,
      item.extractedData,
      buildStateCandidates(item.variantProperties, rule.derivedStates, item.booleanProperties)
    );
  }
  function applyHeadingLevel(item, level) {
    item.extractedData = __spreadProps(__spreadValues({}, item.extractedData), { nivel: level });
    recomputeVerbalization(item);
  }
  function turnIntoPlainText(item) {
    const textRule = findRuleByKey(PLAIN_TEXT_RULE_KEY);
    if (!textRule) return;
    const _a2 = item.extractedData, { nivel: _nivel } = _a2, rest = __objRest(_a2, ["nivel"]);
    item.extractedData = rest;
    item.ruleKey = textRule.key;
    item.markupType = textRule.markupType;
    item.focusEligible = textRule.focusEligible;
    recomputeVerbalization(item);
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
