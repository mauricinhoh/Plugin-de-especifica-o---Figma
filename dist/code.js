"use strict";
(() => {
  var __defProp = Object.defineProperty;
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

  // src/main/messaging.ts
  function postToUi(message) {
    figma.ui.postMessage(message);
  }

  // src/rules/placeholders.ts
  var PLACEHOLDER_RESOLVERS = {
    "texto do botao": (data) => data.text,
    rotulo: (data) => data.text,
    titulo: (data) => data.text
    // Deliberadamente SEM resolver (ficam como template editável):
    // "verbo do botao", "placeholder", "conteudo preenchido",
    // "texto de suporte", "heading", "mensagem".
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
  function computeVerbalization(rule, extractedData) {
    if (!rule || !rule.hasVerbalization || !rule.template) {
      return "";
    }
    return resolvePlaceholders(rule.template, extractedData);
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
    { key: "notas-designer", label: "Notas do designer" }
  ];

  // src/main/figma-api.ts
  function getCurrentUserName() {
    var _a, _b;
    return (_b = (_a = figma.currentUser) == null ? void 0 : _a.name) != null ? _b : "";
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
      "rotulo": "Cada bot\xE3o dentro do grupo possui seu pr\xF3prio r\xF3tulo (Label), que indica claramente a a\xE7\xE3o que ser\xE1 realizada.",
      "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si n\xE3o possui estados pr\xF3prios.",
      "verbalizacaoEsperada": "Habilitado: \u201C[verbo do bot\xE3o], bot\xE3o.\u201D\nFoco: \u201C[verbo do bot\xE3o], bot\xE3o.\u201D\nDesabilitado: \u201C[verbo do bot\xE3o], bot\xE3o, indispon\xEDvel.\u201D\nLoading: \u201C[verbo do bot\xE3o], carregando, bot\xE3o indispon\xEDvel.\u201D",
      "navegacaoPorTeclado": "Tab: move o foco entre os bot\xF5es. Enter ou Barra de espa\xE7os: ativa o bot\xE3o. Shift + Tab: retorna ao elemento anterior ao grupo.",
      "focoAtributosObservacoes": "O tabindex \xE9 determinado pelos bot\xF5es internos.",
      "tipo": "N\xE3o se aplica",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Action",
      "componente": "Button Icon",
      "rotulo": "Como o bot\xE3o n\xE3o cont\xE9m texto vis\xEDvel, o r\xF3tulo \xE9 sempre um atributo de acessibilidade.",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201CNotifica\xE7\xF5es, bot\xE3o.\u201D\nDisabled: \u201CNotifica\xE7\xF5es, bot\xE3o, indispon\xEDvel.\u201D\nFocus: \u201CNotifica\xE7\xF5es, bot\xE3o.\u201D\nCom badge: \u201CNotifica\xE7\xF5es, novas.\u201D",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Barra de espa\xE7os ou Enter: ativa.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Grupo",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Mini",
      "rotulo": "O r\xF3tulo de um bot\xE3o \xE9 o texto vis\xEDvel que orienta o usu\xE1rio sobre a a\xE7\xE3o que ser\xE1 tomada.",
      "estados": "Habilitado, Disabled, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado: \u201CEditar, bot\xE3o.\u201D\nDisabled: \u201CEditar, bot\xE3o, indispon\xEDvel.\u201D\nFocus: \u201CEditar, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Barra de espa\xE7os ou Enter: ativa.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Primary",
      "rotulo": "O r\xF3tulo \xE9 o texto vis\xEDvel que orienta o usu\xE1rio sobre a a\xE7\xE3o. Deve ser claro, conciso e descritivo.",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Verbo do bot\xE3o], bot\xE3o\u201D.\nLoading macOS: \u201C[Verbo do bot\xE3o], carregando, bot\xE3o, escurecido\u201D.\nLoading Windows: \u201CIndispon\xEDvel, bot\xE3o, [Verbo do bot\xE3o]\u201D.\nDisabled macOS: \u201C[Verbo do bot\xE3o], bot\xE3o, escurecido\u201D.\nDisabled Windows: \u201CIndispon\xEDvel, bot\xE3o, [Verbo do bot\xE3o]\u201D.",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Barra de espa\xE7os ou Enter: ativa.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Button Secondary",
      "rotulo": "O r\xF3tulo deve ser claro, conciso e descritivo.",
      "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C[Verbo do bot\xE3o], bot\xE3o\u201D.\nLoading macOS: \u201C[Verbo do bot\xE3o], carregando, bot\xE3o, escurecido\u201D.\nLoading Windows: \u201CIndispon\xEDvel, bot\xE3o, [Verbo do bot\xE3o]\u201D.\nDisabled macOS: \u201C[Verbo do bot\xE3o], bot\xE3o, escurecido\u201D.\nDisabled Windows: \u201CIndispon\xEDvel, bot\xE3o, [Verbo do bot\xE3o]\u201D.",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Barra de espa\xE7os ou Enter: ativa.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Shortcut",
      "rotulo": "O r\xF3tulo \xE9 o texto vis\xEDvel que descreve o destino ou a funcionalidade do atalho. Deve ser curto e direto.",
      "estados": "Habilitado, Focus, Hover, Disabled.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201C{r\xF3tulo}, link.\u201D\nDisabled: \u201C{r\xF3tulo}, link, indispon\xEDvel.\u201D",
      "navegacaoPorTeclado": "Tab: foco no atalho. Enter: redireciona na mesma aba. Shift + Tab: retorna.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Link",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Menu Button",
      "rotulo": "N\xE3o possui r\xF3tulo vis\xEDvel; \xE9 obrigat\xF3rio aria-label claro e contextual.",
      "estados": "Recolhido, Expandido, Focus e Hover.",
      "verbalizacaoEsperada": "Recolhido: \u201CA\xE7\xF5es do registro, bot\xE3o, menu recolhido.\u201D\nExpandido: \u201CA\xE7\xF5es do registro, bot\xE3o, menu expandido.\u201D\nItem focado: \u201CEditar, item de menu.\u201D",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Enter/Espa\xE7o: abre/fecha. Setas: navegam. Esc: fecha e retorna foco.",
      "focoAtributosObservacoes": "Foco permanece dentro do menu enquanto aberto.",
      "tipo": "Bot\xE3o",
      "foco": "Sim"
    },
    {
      "categoria": "Action",
      "componente": "Link Icon",
      "rotulo": "O r\xF3tulo \xE9 o texto vis\xEDvel que orienta o usu\xE1rio sobre a a\xE7\xE3o que ser\xE1 tomada.",
      "estados": "Habilitado, Focus, Hover.",
      "verbalizacaoEsperada": "Habilitado/Focus: \u201CCentral de ajuda, link.\u201D\nExterno: \u201CPol\xEDtica de privacidade, link externo.\u201D",
      "navegacaoPorTeclado": "Tab: foco no link. Enter: redireciona. Shift + Tab: retorna.",
      "focoAtributosObservacoes": "Respeita o tabindex configurado.",
      "tipo": "Link",
      "foco": "Sim"
    },
    {
      "categoria": "Content",
      "componente": "Icon Shape",
      "rotulo": "N\xE3o possui r\xF3tulo pr\xF3prio, pois \xE9 decorativo e n\xE3o interativo.",
      "estados": "Padr\xE3o; est\xE1tico, sem foco, hover ou desabilitado.",
      "verbalizacaoEsperada": "N\xE3o precisa ser lido por leitores de tela.",
      "navegacaoPorTeclado": "N\xE3o recebe foco nem \xE9 acess\xEDvel diretamente por teclado.",
      "focoAtributosObservacoes": null,
      "tipo": "Decorativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Currency",
      "rotulo": "O conte\xFAdo textual j\xE1 representa o pr\xF3prio valor exibido. No estado mascarado, deve incluir aria-label ou aria-live.",
      "estados": "Padr\xE3o, Mascarado; varia\xE7\xE3o positiva ou negativa apenas visual.",
      "verbalizacaoEsperada": "Valor vis\xEDvel: \u201CR$ 1.200,00.\u201D\nValor mascarado: \u201CValor oculto por privacidade.\u201D",
      "navegacaoPorTeclado": "N\xE3o \xE9 interativo e n\xE3o recebe foco.",
      "focoAtributosObservacoes": 'Atualiza\xE7\xE3o din\xE2mica pode usar aria-live="polite".',
      "tipo": "Texto",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Paragraph",
      "rotulo": "Label.",
      "estados": "Padr\xE3o, sem varia\xE7\xF5es de foco, hover ou desabilitado.",
      "verbalizacaoEsperada": " leitor de tela anuncia o conte\xFAdo textual de forma linear, como parte da leitura natural da p\xE1gina. Exemplo: \u201CO Sicredi oferece solu\xE7\xF5es para o seu neg\xF3cio crescer de forma cooperativa.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": "Texto",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Icon",
      "rotulo": "N\xE3o possui r\xF3tulo quando decorativo; quando sem\xE2ntico, usa aria-label ou texto vis\xEDvel.",
      "estados": "O Icon herda os estados do componente pai, como foco, hover, desabilitado ou carregando. Ele n\xE3o possui estados pr\xF3prios nem deve alterar a leitura sem\xE2ntica do componente onde est\xE1 inserido.\n\n",
      "verbalizacaoEsperada": "Decorativo: O leitor de tela ignora o \xEDcone.\nExemplo: nenhum an\xFAncio.\n\nSem\xE2ntico: O leitor de tela l\xEA o r\xF3tulo associado.\nExemplo: \u201CNotifica\xE7\xF5es.\u201D\n\nDentro de bot\xE3o/link: A leitura \xE9 feita a partir do elemento pai.\nExemplo: \u201CEditar, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco diretamente; foco pertence ao elemento pai.",
      "focoAtributosObservacoes": null,
      "tipo": "Decorativo",
      "foco": "N\xE3o"
    },
    {
      "categoria": "Content",
      "componente": "Topic",
      "rotulo": "O Label descreve o conte\xFAdo.",
      "estados": "Est\xE1tico, sem foco, hover ou desabilitado.",
      "verbalizacaoEsperada": "Leitor l\xEA apenas o Label. Exemplo: \u201CClique em Baixar para realizar o download da ferramenta Diagn\xF3stico Sicredi.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco direto.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Brand",
      "rotulo": "N\xE3o possui r\xF3tulo vis\xEDvel; deve conter descri\xE7\xE3o clara para tecnologias assistivas.",
      "estados": "Est\xE1tico; quando usado como link, possui intera\xE7\xE3o.",
      "verbalizacaoEsperada": "\u201CLogotipo Sicredi\u201D.",
      "navegacaoPorTeclado": "S\xF3 entra na tabula\xE7\xE3o quando usado como link. Enter ou Espa\xE7o aciona o redirecionamento.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Description",
      "rotulo": "Label.",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Leitura normal; quando associado, \xE9 lido com r\xF3tulo principal. Exemplo: \u201CEtapa 1 de 4\u201D.",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Empty State",
      "rotulo": "T\xEDtulo e descri\xE7\xE3o.",
      "estados": "Est\xE1tico; bot\xE3o interno segue Button Primary.",
      "verbalizacaoEsperada": "\u201CSem notifica\xE7\xF5es novas. Voc\xEA ainda n\xE3o recebeu avisos. Adicionar nova notifica\xE7\xE3o, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Apenas elementos interativos internos recebem foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Accordion",
      "rotulo": "Cada item deve ter r\xF3tulo claro no cabe\xE7alho.",
      "estados": "Expandido e Recolhido.",
      "verbalizacaoEsperada": "Ao focar o cabe\xE7alho: \u201C[t\xEDtulo], bot\xE3o recolhido.\u201D\n\nAo expandir: \u201C[t\xEDtulo], bot\xE3o expandido.\u201D Ap\xF3s a expans\xE3o, o conte\xFAdo interno \xE9 anunciado em sequ\xEAncia, permitindo uma leitura cont\xEDnua pelo leitor de tela.\n\nAo recolher: \u201C[t\xEDtulo], bot\xE3o recolhido.\u201D",
      "navegacaoPorTeclado": "Tab: cabe\xE7alhos. Enter/Espa\xE7o: expande/recolhe. Setas, Home e End: navega\xE7\xE3o.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Image",
      "rotulo": "Definido pelo texto alternativo (alt-text).",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "Informativa: l\xEA o alt. Exemplo: \u201CGr\xE1fico de barras mostrando o aumento de clientes no \xFAltimo trimestre.\u201D\nDecorativa: ignorada com alt vazio.",
      "navegacaoPorTeclado": "N\xE3o recebe foco e n\xE3o participa da tabula\xE7\xE3o.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Heading",
      "rotulo": "Label.",
      "estados": "Padr\xE3o, sem varia\xE7\xF5es de foco, hover ou desabilitado.",
      "verbalizacaoEsperada": "O componente deve utilizar as tags sem\xE2nticas adequadas (<h1> a <h6>) conforme a posi\xE7\xE3o do conte\xFAdo na p\xE1gina:\n\n<h1>: t\xEDtulo principal da p\xE1gina ou tela.\n\n<h2>: se\xE7\xF5es principais.\n\n<h3> e seguintes: subse\xE7\xF5es.",
      "navegacaoPorTeclado": "N\xE3o recebe foco; acess\xEDvel pela navega\xE7\xE3o estrutural do leitor de tela.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "List Content",
      "rotulo": "Label 01, Description 01, Label 02, Description 02, Tag e Button Mini, conforme existirem.",
      "estados": "Sem estados pr\xF3prios.",
      "verbalizacaoEsperada": "Ordem: Support element, Description 01, Label 01, Description 02, Label 02, Tag, Button Mini. Ex.: \u201CR$ 500,00. Recebimentos. Banco Ita\xFA. Detalhes.\u201D",
      "navegacaoPorTeclado": "Componente n\xE3o recebe foco direto.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "List Ghost",
      "rotulo": "Description identifica categoria; Label apresenta valor.",
      "estados": "Padr\xE3o, est\xE1tico.",
      "verbalizacaoEsperada": "\u201C\xCDcone Ag\xEAncia. Ag\xEAncia 1234. Conta 56789-0.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco direto.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Credit Card",
      "rotulo": "N\xE3o possui r\xF3tulo verbal pr\xF3prio; depende do texto de apoio.",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "\u201CCart\xE3o Sicredi Visa Gold, final 1234.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Pagination",
      "rotulo": "Cada controle deve possuir r\xF3tulo acess\xEDvel.",
      "estados": "Estados herdados de Dropdown e Button Icon.",
      "verbalizacaoEsperada": "\u201C10 itens por p\xE1gina, 10 selecionado. 1-10 de 30 itens. P\xE1gina 1 de 3. P\xE1gina anterior desativada. Pr\xF3xima p\xE1gina, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Tab: controles. Setas: Dropdown. Enter/Espa\xE7o: ativa bot\xF5es.",
      "focoAtributosObservacoes": "Controles desabilitados n\xE3o entram na tabula\xE7\xE3o.",
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Content",
      "componente": "Table",
      "rotulo": "Cabe\xE7alhos e conte\xFAdos das colunas; controles interativos exigem r\xF3tulos acess\xEDveis.",
      "estados": "Default, Linhas selecionadas, Sem dados.",
      "verbalizacaoEsperada": "Anuncia tipo, total de linhas/colunas e conte\xFAdo linha a linha. Ex.: \u201CTabela de lan\xE7amentos. 4 linhas exibidas de um total de 30...\u201D",
      "navegacaoPorTeclado": "Tab: controles. Setas: c\xE9lulas quando aplic\xE1vel. Espa\xE7o: sele\xE7\xE3o. Enter: bot\xF5es.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Card",
      "rotulo": "N\xE3o possui r\xF3tulo pr\xF3prio.",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "O Card n\xE3o \xE9 anunciado; leitor percorre apenas elementos internos.",
      "navegacaoPorTeclado": "Foco apenas nos elementos internos.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Banner Image Full",
      "rotulo": "Heading, Description quando houver e r\xF3tulo do bot\xE3o.",
      "estados": "Habilitado, Focus, Hover, relacionados \xE0 a\xE7\xE3o.",
      "verbalizacaoEsperada": "\u201CSeu cr\xE9dito foi aprovado! Veja as condi\xE7\xF5es especiais selecionadas para voc\xEA. Saiba mais, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Tab: foco no bot\xE3o. Enter: ativa. Shift + Tab: retorna.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Modal",
      "rotulo": "T\xEDtulo do cabe\xE7alho.",
      "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
      "verbalizacaoEsperada": "\u201CExcluir registro, di\xE1logo. Deseja realmente excluir este item? Cancelar, bot\xE3o. Confirmar, bot\xE3o.\u201D\nAo fechar: \u201CDi\xE1logo fechado.\u201D",
      "navegacaoPorTeclado": "Tab/Shift+Tab: elementos internos. Enter/Espa\xE7o: ativa. Esc: fecha.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Cookies",
      "rotulo": "Heading, Paragraph e Button Primary.",
      "estados": "Vis\xEDvel e Aceito.",
      "verbalizacaoEsperada": "\u201CCookies. Utilizamos cookies neste site para melhorar sua experi\xEAncia de navega\xE7\xE3o, de acordo com nossa Pol\xEDtica de Cookies, link externo. Permitir todos, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Tab: link e bot\xE3o. Enter/Espa\xE7o: ativa consentimento.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Fixed Bar",
      "rotulo": "N\xE3o possui r\xF3tulo vis\xEDvel; conte\xFAdo interno deve possuir.",
      "estados": "Estrutural, sem estados pr\xF3prios.",
      "verbalizacaoEsperada": "\u201CConfirmar, bot\xE3o. Cancelar, bot\xE3o.\u201D\nCom slot: \u201CTotal: R$ 1.000,00. Fazer pagamento, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Tab: a\xE7\xF5es. Enter/Espa\xE7o: executa.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Drawer",
      "rotulo": "Heading da Nav Bar.",
      "estados": "Aberto e Fechado.",
      "verbalizacaoEsperada": "Aberto: \u201C{heading}. Janela lateral aberta.\u201D\nFechado: \u201CJanela lateral fechada.\u201D",
      "navegacaoPorTeclado": "Tab/Shift+Tab: elementos internos. Esc: fecha quando dispens\xE1vel. Enter/Espa\xE7o: ativa.",
      "focoAtributosObservacoes": "Ordem: Heading, Fechar, slot, Fixed Bar.",
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Containers",
      "componente": "Card Review",
      "rotulo": "Heading e Description; tamb\xE9m r\xF3tulos dos controles.",
      "estados": "Default, Ativo e Enviado.",
      "verbalizacaoEsperada": "\u201C4 estrelas, boa, selecionado. Enviar avalia\xE7\xE3o, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Foco percorre controles de avalia\xE7\xE3o, coment\xE1rio e bot\xF5es.",
      "focoAtributosObservacoes": "A documenta\xE7\xE3o informa que as estrelas n\xE3o possuem r\xF3tulos descritivos.",
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Feedback",
      "componente": "Alert",
      "rotulo": "Heading e Description; bot\xE3o fechar exige r\xF3tulo acess\xEDvel.",
      "estados": "Ativo e Encerrado.",
      "verbalizacaoEsperada": "\u201CAtualize a sua senha. Sua senha ir\xE1 expirar em 5 dias. Saiba mais, link externo. Bot\xE3o fechar, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Foco percorre links e bot\xE3o de fechamento.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Feedback",
      "componente": "Flag",
      "rotulo": "Heading e Description.",
      "estados": "Estrutural; links internos herdam estados pr\xF3prios.",
      "verbalizacaoEsperada": "\u201CPendente de autoriza\xE7\xE3o. Para concluir a opera\xE7\xE3o, um gestor precisa autorizar. Saiba mais, link externo.\u201D",
      "navegacaoPorTeclado": "Apenas elementos interativos internos recebem foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Feedback",
      "componente": "Flag Cooperado",
      "rotulo": "Heading e Description.",
      "estados": "Estrutural e n\xE3o interativo; links internos herdam estados.",
      "verbalizacaoEsperada": "\u201CCampos Gerais. Esta transa\xE7\xE3o fortalece a sua comunidade local. Saiba mais, link externo.\u201D",
      "navegacaoPorTeclado": "Apenas elementos interativos internos recebem foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Feedback",
      "componente": "Toast",
      "rotulo": "Label da mensagem.",
      "estados": "Exibido e Oculto.",
      "verbalizacaoEsperada": "\u201CArquivo salvo com sucesso. Fechar mensagem, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Recebe foco. ",
      "focoAtributosObservacoes": "\xCDcones decorativos podem ser ignorados.",
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Feedback",
      "componente": "Tooltip",
      "rotulo": "o conte\xFAdo do Tooltip funciona como descri\xE7\xE3o complementar do elemento de origem.",
      "estados": "Inativo: Tooltip n\xE3o vis\xEDvel.\n\nAtivo: Tooltip vis\xEDvel por hover ou foco.",
      "verbalizacaoEsperada": 'o leitor de tela associa o Tooltip ao elemento de origem. O conte\xFAdo \xE9 verbalizado como descri\xE7\xE3o adicional quando o elemento recebe foco.\n\nExemplo: "\xCDcone de informa\xE7\xE3o, \xEDcone, Valor m\xE1ximo dispon\xEDvel para uso, somando seu saldo e os limites da conta, como cheque especial."\n',
      "navegacaoPorTeclado": "move o foco para o elemento associado ao Tooltip.",
      "focoAtributosObservacoes": "exibe o Tooltip automaticamente.O Tooltip n\xE3o entra na ordem de tabula\xE7\xE3o e n\xE3o deve ser foc\xE1vel.",
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Checkbox",
      "rotulo": "R\xF3tulo vis\xEDvel; em composi\xE7\xF5es, pode herdar o r\xF3tulo do item.",
      "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}, caixa de sele\xE7\xE3o marcada/desmarcada/parcialmente marcada/desabilitada.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Chip Filter",
      "rotulo": "Label descreve o filtro ativo.",
      "estados": "Habilitado, Focus.",
      "verbalizacaoEsperada": 'a verbaliza\xE7\xE3o se concentra na leitura do r\xF3tulo. Exemplo: "\xDAltimos 30 dias".',
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Chip Select",
      "rotulo": "Label descreve a op\xE7\xE3o dispon\xEDvel.",
      "estados": "Habilitado, Focus, Hover.",
      "verbalizacaoEsperada": "Somente label: \u201C\xDAltimos 30 dias\u201D.\nCom \xEDcone: \u201CImagem cart\xE3o. Cart\xE3o de cr\xE9dito.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Date Picker",
      "rotulo": "Herdado do Input Date.",
      "estados": "Calend\xE1rio aberto; estados dos dias.",
      "verbalizacaoEsperada": "\u201CTer\xE7a-feira, 15 de junho de 2026, hoje.\u201D\n\u201C16 de junho de 2026, selecionado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": "Sim"
    },
    {
      "categoria": "Inputs",
      "componente": "Dropdown",
      "rotulo": "Label e descri\xE7\xE3o opcional.",
      "estados": "Habilitado, Focus, Open, Error, Disabled.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}. {texto de suporte}. Lista suspensa.\u201D\nOpen: \u201CLista expandida. Op\xE7\xE3o: Marketing.\u201D\nError: \u201CErro: sele\xE7\xE3o obrigat\xF3ria.\u201D\nDisabled: \u201CIndispon\xEDvel.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code",
      "rotulo": "cada caixa deve conter uma identifica\xE7\xE3o clara que indique sua posi\xE7\xE3o na sequ\xEAncia, garantindo que a leitura descreva corretamente o que est\xE1 sendo preenchido.",
      "estados": "enabled, focus, hover, filled.",
      "verbalizacaoEsperada": "a leitura indica que \xE9 uma digita\xE7\xE3o de c\xF3digo, o conte\xFAdo, quando j\xE1 estiver preenchido e a posi\xE7\xE3o dentro da sequ\xEAncia. Exemplos:\n\nAo focar um input vazio: \u201CDigite o c\xF3digo, campo 1 de 4.\u201D\n\nAo focar um input j\xE1 preenchido: \u201C2. C\xF3digo 1 de 4.\u201D\n",
      "navegacaoPorTeclado": "Tab: move o foco para a pr\xF3xima caixa.\n\nShift + Tab: retorna para a caixa anterior.\n\nDigita\xE7\xE3o de um d\xEDgito: avan\xE7a automaticamente para o pr\xF3ximo campo.\n\nBackspace: apaga o conte\xFAdo da caixa e retorna para a caixa anterior, se houver.",
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Code Number",
      "rotulo": "o componente n\xE3o tem um r\xF3tulo diretamente em sua estrutura, mas deve ter orienta\xE7\xE3o em tela para descrever a a finalidade de preenchimento;",
      "estados": "habilitado, focus, hover e preenchido;",
      "verbalizacaoEsperada": "Habilitado: O leitor de tela anuncia o label do componente seguido do tipo de elemento.\nExemplo: \u201CC\xF3digo de acesso, campo de entrada\u201D.\n\nPreenchido: Cada d\xEDgito mascarado \xE9 lido como \u201Cpreenchido\u201D, sem expor o valor.\nExemplo: \u201CD\xEDgito 1, preenchido\u201D.\n\nFocus: Quando um campo recebe foco, o leitor de tela anuncia sua posi\xE7\xE3o na sequ\xEAncia.\nExemplo: \u201CCampo 2 de 6, digite o pr\xF3ximo d\xEDgito.\u201D",
      "navegacaoPorTeclado": "Tab: move o foco para o componente como um todo (wrapper).\n\nEnter ou Barra de espa\xE7o: ativa bot\xF5es do teclado num\xE9rico virtual ou o bot\xE3o Limpar.\n\nO componente \xE9 projetado para uso prim\xE1rio via teclado virtual, mas respeita padr\xF5es de navega\xE7\xE3o do navegador.",
      "focoAtributosObservacoes": "O foco n\xE3o permanece nas caixas de Input Code, pois elas n\xE3o s\xE3o interativas.\n\nO foco percorre apenas as caixas do teclado num\xE9rico e o bot\xE3o Limpar. Cada um desses bot\xF5es recebe foco individualmente.",
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Date",
      "rotulo": "o label identifica claramente o campo e o tipo de data esperada. O texto de suporte tamb\xE9m serve como r\xF3tulo de orienta\xE7\xE3o.",
      "estados": "Padr\xE3o: campo vazio e pronto para entrada.\n\nAberto: exibe o calend\xE1rio de sele\xE7\xE3o de data.\n\nFoco: realce visual e leitura de r\xF3tulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com intera\xE7\xE3o bloqueada",
      "verbalizacaoEsperada": 'a leitura segue a ordem do conte\xFAdo conforme a renderiza\xE7\xE3o, junto da indica\xE7\xE3o do tipo de componente.\n\nExemplo: \u201CData de vencimento, campo de data. Nenhuma data selecionada. Pressione Enter para abrir o calend\xE1rio."',
      "navegacaoPorTeclado": "Tab: move o foco para o campo.\n\nEnter / Space: abre ou fecha o calend\xE1rio.\n\nSetas: navegam entre os dias do calend\xE1rio.\n\nEnter: seleciona a data focada.\n\nEsc: fecha o calend\xE1rio sem alterar a sele\xE7\xE3o.\n\nNo modo Range, a navega\xE7\xE3o seleciona data inicial e final em sequ\xEAncia.\n\nO componente respeita a ordem do tabindex configurado; caso n\xE3o exista, segue a ordem padr\xE3o do navegador.",
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Password",
      "rotulo": "Label e texto de apoio.",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}, campo de senha.\u201D\nErro: \u201CErro: {mensagem}.\u201D\nControle: \u201CMostrar senha, bot\xE3o.\u201D ou \u201COcultar senha, bot\xE3o.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Select",
      "rotulo": "Identifica o prop\xF3sito do campo.",
      "estados": "Default, Filled, Hover, Active, Error, Disabled.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}. {texto de suporte}. Lista suspensa.\u201D\nOpen: \u201CLista expandida. Op\xE7\xE3o: Marketing.\u201D\nError: \u201CErro: sele\xE7\xE3o obrigat\xF3ria.\u201D\nDisabled: \u201CIndispon\xEDvel.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text",
      "rotulo": "Label, suporte e mensagem de erro.",
      "estados": "Habilitado, Focus, Filled, Error, Disabled.",
      "verbalizacaoEsperada": "\u201CNome completo, campo de texto.\u201D\nFilled: \u201Cpreenchido\u201D.\nError: \u201CErro: formato inv\xE1lido.\u201D\nDisabled: \u201CDesabilitado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Input Text Area",
      "rotulo": "Label obrigat\xF3rio.",
      "estados": "Default, Hover, Focus, Filled, Disabled, Error, Read-only.",
      "verbalizacaoEsperada": "Default: \u201C{r\xF3tulo}, {texto de suporte}, campo de texto.\u201D\nError: \u201CCampo obrigat\xF3rio.\u201D\nDisabled: \u201CDesabilitado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "List Select",
      "rotulo": "Label e Description opcional.",
      "estados": "Herda do seletor interno: Hover, Focus, Checked, Unchecked, Disabled etc.",
      "verbalizacaoEsperada": "\u201CNotifica\xE7\xF5es por e-mail, caixa de sele\xE7\xE3o marcada.\u201D\n\u201CConta pessoal, bot\xE3o de op\xE7\xE3o selecionado.\u201D\n\u201CReceber alertas, alternar ativado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Popover",
      "rotulo": "N\xE3o possui.",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Leitor l\xEA apenas elementos internos; Popover n\xE3o \xE9 anunciado.",
      "navegacaoPorTeclado": "Foco pertence aos elementos internos.",
      "focoAtributosObservacoes": null,
      "tipo": "Grupo",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Popover Menu",
      "rotulo": "N\xE3o possui.",
      "estados": "Padr\xE3o.",
      "verbalizacaoEsperada": "Leitor l\xEA apenas elementos internos; Popover n\xE3o \xE9 anunciado.",
      "navegacaoPorTeclado": "Foco pertence aos elementos internos.",
      "focoAtributosObservacoes": null,
      "tipo": "Grupo",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Radio Button",
      "rotulo": "R\xF3tulo claro e vis\xEDvel da op\xE7\xE3o.",
      "estados": "Selecionado, N\xE3o selecionado, Desabilitado.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}, bot\xE3o de op\xE7\xE3o selecionado/n\xE3o selecionado/desabilitado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Bot\xE3o",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Rate Input",
      "rotulo": "Atributo de acessibilidade.",
      "estados": "Default, Selecionado, Desabilitado.",
      "verbalizacaoEsperada": "\u201CAvalia\xE7\xE3o do atendimento, 1 de 5 estrelas. Nenhuma avalia\xE7\xE3o selecionada.\u201D\n\u201C4 de 5 estrelas. Selecionado.\u201D\n\u201CAvalia\xE7\xE3o do atendimento. Indispon\xEDvel.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Bot\xE3o",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Search",
      "rotulo": "o placeholder e o preenchimento do campo servem como r\xF3tulo para entendimento do componente.",
      "estados": "Habilitado/Focus, Hover, Filled;",
      "verbalizacaoEsperada": 'como o leitor de tela deve anunciar o componente.\n\nFocus e vazio: \u201C{placeholder}, campo de pesquisa.\u201D Exemplo: "Busque aqui, campo de pesquisa."\n\nFilled: \u201C{conte\xFAdo preenchido}, campo de pesquisa.\u201D Exemplo: "Sicredi, campo de pesquisa."',
      "navegacaoPorTeclado": "Tab: move o foco para o campo e para o bot\xE3o de limpar.\n\nShift + Tab: retorna o foco ao elemento anterior.\n\nEnter: confirma a entrada e dispara a pesquisa.\n\nSetas: movem o cursor dentro do texto digitado.\n\nO componente segue a ordem natural de navega\xE7\xE3o da p\xE1gina, garantindo previsibilidade e consist\xEAncia.",
      "focoAtributosObservacoes": null,
      "tipo": "Entrada",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Switch",
      "rotulo": "R\xF3tulo claro; em composi\xE7\xF5es, pode herdar o r\xF3tulo do item.",
      "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
      "verbalizacaoEsperada": "\u201C{r\xF3tulo}, switch ligado/desligado/desabilitado.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": "Bot\xE3o",
      "foco": null
    },
    {
      "categoria": "Inputs",
      "componente": "Uploader",
      "rotulo": "o label e o texto de suporte do campo identificam claramente o prop\xF3sito do componente.",
      "estados": "Default: campo est\xE1 habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e est\xE1 com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou valida\xE7\xE3o.",
      "verbalizacaoEsperada": "o leitor de tela anuncia o r\xF3tulo do campo, as instru\xE7\xF5es e o estado atual do upload, quando houver.\n\n\u201CEnviar arquivo, uploader. Formatos aceitos: PDF, JPG. Tamanho m\xE1ximo: 10 megabytes. Nenhum arquivo selecionado. Pressione Enter para escolher um arquivo ou arraste e solte.\u201D",
      "navegacaoPorTeclado": "Tab: move o foco para a \xE1rea de upload e para a\xE7\xF5es de remover/substituir.\n\nEnter / Space: abre o explorador de arquivos.\n\nEsc: cancela a intera\xE7\xE3o quando aplic\xE1vel.\n\nA lista de arquivos segue ordem l\xF3gica de tabula\xE7\xE3o.\n\nO componente respeita a ordem do tabindex configurado; caso n\xE3o exista, segue a ordem padr\xE3o do navegador.",
      "focoAtributosObservacoes": null,
      "tipo": "Bot\xE3o",
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Avatar Business",
      "rotulo": "Nome da empresa em texto pr\xF3ximo ou aria-label.",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "\u201CSicredi, empresa.\u201D\nCom badge: \u201CSicredi, h\xE1 novas notifica\xE7\xF5es.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco quando informativo.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Avatar Name",
      "rotulo": "Nome da pessoa em texto pr\xF3ximo ou descri\xE7\xE3o acess\xEDvel.",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "\u201CJo\xE3o Pereira, perfil.\u201D\nCom badge: \u201CJo\xE3o Pereira, h\xE1 novas notifica\xE7\xF5es.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco quando informativo.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Breadcrumb",
      "rotulo": "Cada item representa um n\xEDvel; \xFAltimo item \xE9 a p\xE1gina atual.",
      "estados": "Links habilitados; p\xE1gina atual.",
      "verbalizacaoEsperada": "\u201CIn\xEDcio, Produtos. P\xE1gina atual: Detalhes.\u201D",
      "navegacaoPorTeclado": "Tab: links. Enter: redireciona.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Carousel Nav",
      "rotulo": "Bot\xF5es devem possuir r\xF3tulos acess\xEDveis.",
      "estados": "Herda de Page Indicator e Button Icon.",
      "verbalizacaoEsperada": "\u201CCarrossel. 3 itens. Item 1 de 3. Pr\xF3ximo item, bot\xE3o.\u201D",
      "navegacaoPorTeclado": "Foco percorre bot\xF5es de navega\xE7\xE3o.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Header Product",
      "rotulo": "T\xEDtulo principal.",
      "estados": "Estrutural; elementos internos possuem estados pr\xF3prios.",
      "verbalizacaoEsperada": "\u201CConfigura\xE7\xE3o de conta. Guia selecionada: Dados pessoais.\u201D\n\u201CTransfer\xEAncia de Pix. Etapa 1 de 4. Selecionar favorecido.\u201D",
      "navegacaoPorTeclado": "Header n\xE3o recebe foco; controles internos entram na tabula\xE7\xE3o.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "List Navigation",
      "rotulo": "Label principal; Description e Tag Container podem ser r\xF3tulos secund\xE1rios.",
      "estados": "Default e Pressed.",
      "verbalizacaoEsperada": "\u201CAtendimento online, item de navega\xE7\xE3o.\u201D\nCom tag: \u201CAtendimento online, novo. Item de navega\xE7\xE3o.\u201D\nCom descri\xE7\xE3o: \u201CAtendimento online. Fale com a gente pelo chat. Item de navega\xE7\xE3o.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Page Indicator",
      "rotulo": "N\xE3o possui r\xF3tulo interativo pr\xF3prio.",
      "estados": "Informativo e n\xE3o interativo.",
      "verbalizacaoEsperada": "N\xE3o deve ser anunciado isoladamente; contexto informa posi\xE7\xE3o atual.",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Navigation",
      "componente": "Tab",
      "rotulo": "Label de cada aba.",
      "estados": "Selecionada e N\xE3o selecionada.",
      "verbalizacaoEsperada": "\u201CAbas de conte\xFAdo, 3 abas. Vis\xE3o geral, aba selecionada. Movimenta\xE7\xF5es, aba n\xE3o selecionada. Comprovantes, aba n\xE3o selecionada. Conte\xFAdo da aba Vis\xE3o geral exibido.\u201D",
      "navegacaoPorTeclado": null,
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Badge",
      "rotulo": "N\xE3o possui texto pr\xF3prio.",
      "estados": "Sem estados pr\xF3prios.",
      "verbalizacaoEsperada": "\u201CNotifica\xE7\xF5es, h\xE1 novas notifica\xE7\xF5es.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco isoladamente.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Loading",
      "rotulo": "Atributo de acessibilidade.",
      "estados": "\xDAnico.",
      "verbalizacaoEsperada": "\u201CCarregando conte\xFAdo\u201D.",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Progress Line",
      "rotulo": "N\xE3o possui r\xF3tulo pr\xF3prio; identifica\xE7\xE3o vem de t\xEDtulo, subt\xEDtulo ou descri\xE7\xE3o.",
      "estados": "Informativo e n\xE3o interativo.",
      "verbalizacaoEsperada": "\u201CEtapa 2 de 4, Dados do pagamento.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Skeleton",
      "rotulo": "N\xE3o possui.",
      "estados": "\xDAnico.",
      "verbalizacaoEsperada": "\u201CO conte\xFAdo est\xE1 sendo carregado.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Tag Container",
      "rotulo": "Texto do Label.",
      "estados": "Est\xE1tico.",
      "verbalizacaoEsperada": "\u201CStatus: Em an\xE1lise.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
    },
    {
      "categoria": "Status",
      "componente": "Tag Icon",
      "rotulo": "Label descreve categoria, status ou tipo de informa\xE7\xE3o.",
      "estados": "Est\xE1tico e n\xE3o interativo.",
      "verbalizacaoEsperada": "\xCDcone informativo: \u201CAtrasado, \xEDcone de aten\xE7\xE3o.\u201D\n\xCDcone decorativo: \u201CAprovado.\u201D",
      "navegacaoPorTeclado": "N\xE3o recebe foco.",
      "focoAtributosObservacoes": null,
      "tipo": null,
      "foco": null
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
    Link: "link"
    // "Grupo", "Decorativo", "Texto", "Não se aplica" e célula vazia:
    // deliberadamente sem entrada aqui -> caem em "Não especificado".
  };
  function resolveMarkupType(record) {
    var _a;
    if (!record.tipo) return UNSPECIFIED_TYPE_KEY;
    return (_a = TIPO_PLANILHA_PARA_MARKUP_TYPE[record.tipo]) != null ? _a : UNSPECIFIED_TYPE_KEY;
  }
  var STATE_LINE_PATTERN = /^([^:\n]{2,40}):\s*[""“]?(.+?)[”"]?\.?\s*$/;
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
    return parsed;
  }
  function slugify(componentName) {
    return componentName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function buildRule(record) {
    var _a, _b;
    const states = parseVerbalizationStates(record.verbalizacaoEsperada);
    const statesMap = states.length > 0 ? states.reduce((acc, s) => {
      acc[s.label] = s.text;
      return acc;
    }, {}) : void 0;
    const template = (_a = states[0]) == null ? void 0 : _a.text;
    return {
      key: slugify(record.componente),
      label: record.componente,
      markupType: resolveMarkupType(record),
      identifier: { matches: matchesComponentName(record.componente, ...(_b = record.aliasesDeNome) != null ? _b : []) },
      hasVerbalization: Boolean(template),
      extraction: ["first-text"],
      template,
      states: statesMap
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
  var IGNORED_COMPONENT_NAME = "Header Web";
  function discoverTopLevelComponents(root) {
    const found = [];
    function walk(node) {
      if ("visible" in node && !node.visible) {
        return;
      }
      if (node.name === IGNORED_COMPONENT_NAME) {
        return;
      }
      if (node.type === "INSTANCE" || node.type === "COMPONENT") {
        found.push(node);
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    if ("children" in root) {
      for (const child of root.children) {
        walk(child);
      }
    }
    return found;
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

  // src/main/analysis/stateExtraction.ts
  function extractVariantProperties(node) {
    if (node.type !== "INSTANCE") {
      return null;
    }
    const variantProperties = node.variantProperties;
    if (!variantProperties) {
      return null;
    }
    return __spreadValues({}, variantProperties);
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
  async function buildSpecificationItem(node, order, manuallyAdded) {
    var _a, _b, _c, _d;
    const isComponentLike = node.type === "INSTANCE" || node.type === "COMPONENT";
    const coreType = isComponentLike ? (await identifyCoreType(node)).coreType : "DESCONHECIDO";
    const componentName = node.type === "INSTANCE" ? (_b = (_a = await node.getMainComponentAsync()) == null ? void 0 : _a.name) != null ? _b : null : node.type === "COMPONENT" ? node.name : null;
    const rule = findMatchingRule(accessibilityRules, {
      nodeName: node.name,
      componentName
    });
    const extractedData = {};
    if (rule == null ? void 0 : rule.extraction.includes("first-text")) {
      const text = extractFirstText(node);
      if (text !== void 0) {
        extractedData.text = text;
      }
    }
    const verbalization = computeVerbalization(rule, extractedData);
    const variantProperties = extractVariantProperties(node);
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
      verbalizationEdited: false
    };
  }
  async function analyzeScreen(screenNode, forcedContext) {
    const discovered = discoverTopLevelComponents(screenNode);
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
  async function createEntryRow(item, index, isLast) {
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
  function createReadingOrderRow(totalComponentCount, hasMoreRows) {
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
    const totalLabel = String(totalComponentCount).padStart(2, "0");
    const text = createPlainText(`01 a ${totalLabel} - Ordem de leitura`, ENTRY_TITLE_FONT, 15, TEXT_WHITE);
    appendSized(row, text, { horizontal: "FILL" });
    if (hasMoreRows) {
      const divider = createDividerRect();
      appendSized(row, divider, { horizontal: "FILL", vertical: "FIXED" });
    }
    return row;
  }
  async function generatePanel(screenNode, items, totalComponentCount) {
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
    const readingOrderRow = createReadingOrderRow(totalComponentCount, ordered.length > 0);
    appendSized(panel, readingOrderRow, { horizontal: "FILL", vertical: "HUG" });
    for (let i = 0; i < ordered.length; i += 1) {
      const row = await createEntryRow(ordered[i], i, i === ordered.length - 1);
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

  // src/main/code.ts
  var UI_WIDTH = 420;
  var UI_HEIGHT = 700;
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT, themeColors: false });
  var lastAnalyzedScreenId = null;
  var manualSelectionEnabled = false;
  var knownNodeIds = /* @__PURE__ */ new Set();
  var stopManualSelectionListener = null;
  var lastGeneratedOutputNodeId = null;
  function buildComponentTypeOptions() {
    const fromMarkupTypes = MARKUP_TYPES.map((type) => ({
      key: type.key,
      label: type.label,
      hasVerbalization: true
    }));
    return [...fromMarkupTypes, { key: UNSPECIFIED_TYPE_KEY, label: UNSPECIFIED_TYPE_LABEL, hasVerbalization: true }];
  }
  function resetFlowState() {
    lastAnalyzedScreenId = null;
    knownNodeIds = /* @__PURE__ */ new Set();
    lastGeneratedOutputNodeId = null;
    setManualSelectionEnabled(false);
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
      const panel = await generatePanel(screenNode, ordered, ordered.length);
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
      case "cancel":
        figma.closePlugin();
        break;
      default:
        break;
    }
  };
})();
