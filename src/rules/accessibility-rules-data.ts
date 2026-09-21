/**
 * ATENÇÃO — ESTE ARQUIVO É UM ESPELHO DIRETO DA PLANILHA.
 *
 * Fonte: "Acessibilidade_Colmeia_Web.xlsx" (aba "Acessibilidade Core
 * Web"), fornecida pelo time de acessibilidade em 10/09/2026 —
 * substitui a planilha anterior ("Extracao_Acessibilidade_Core_Web_
 * 70_Componentes.xlsx") como base de verdade.
 *
 * ATUALIZAÇÃO 21/09/2026: os textos de "verbalizacaoEsperada" foram
 * substituídos pelos da planilha "Acessibilidade_Colmeia_Web (1).xlsx",
 * aba "{Atualizado} Fonte da verdade" — só o TEXTO mudou (a pedido
 * explícito do usuário: "não mude nenhuma regra, troque apenas o
 * texto"). Categoria/Tipo/Foco e todos os campos de extensão
 * (aliasesDeNome, sempreAprofundar, extracaoTexto, stateFlagAliases,
 * derivedStates) continuam vindo da planilha anterior, exceto onde
 * confirmado em conversa (ex.: Checkbox manteve os estados
 * "Parcialmente marcado"/"Desabilitado" da planilha anterior, porque
 * a nova só definia "Marcado"/"Desmarcado").
 *
 * COMO ATUALIZAR QUANDO A PLANILHA MUDAR
 * ---------------------------------------
 * 1. Abra a planilha nova e confira se as colunas continuam sendo,
 *    nesta ordem: Categoria | Componente | Estados | Verbalização
 *    esperada | Tipo | Foco.
 * 2. Para cada linha (uma por componente), adicione/edite um objeto
 *    neste array seguindo a interface `AccessibilityRuleRecord`
 *    abaixo. Copie o texto das células literalmente — inclusive
 *    quebras de linha (uma string JS com `\n` para cada linha da
 *    célula) e as aspas curvas (“ ”) que a planilha usa.
 * 3. A coluna "Tipo" precisa ser um destes 8 valores exatos: "Botão",
 *    "Entrada", "Link", "Título", "Imagem", "Decorativo", "Estrutura",
 *    "Não interativo" — são os únicos que accessibility-rules.ts sabe
 *    mapear para as categorias do plugin (ver
 *    TIPO_PLANILHA_PARA_MARKUP_TYPE nesse arquivo). Um valor fora
 *    dessa lista faz o componente cair em "Não especificado".
 * 4. A coluna "Foco" precisa ser "Sim", "Não" ou "Apenas elementos
 *    interativos" (ver Regra 3 e 4 do documento de regras — Estrutura
 *    sempre usa "Apenas elementos interativos": a estrutura em si não
 *    recebe número de Ordem de foco, só os componentes internos dela).
 * 5. NÃO edite `accessibility-rules.ts` para registrar um componente
 *    novo — aquele arquivo só TRANSFORMA os registros daqui em regras
 *    do motor (`ComponentTypeRule`). Basta adicionar o registro aqui
 *    que a regra correspondente é gerada automaticamente.
 * 6. Campos vazios na planilha viram `null` aqui — não invente
 *    conteúdo para preenchê-los.
 * 7. Se o nome do componente principal no Figma divergir do nome
 *    aqui (já aconteceu: "Botao defaut" em vez de "Botão Default"),
 *    NÃO crie um registro novo — adicione o nome real em
 *    `aliasesDeNome` no registro existente.
 * 8. Depois de editar, rode `npm run typecheck` e `npm run build`
 *    para confirmar que nada quebrou.
 */

export interface AccessibilityRuleRecord {
  /** Categoria do Design System (ex.: "Action", "Inputs", "Content"). Informativo; não usado pelo motor ainda. */
  categoria: string;
  /** Nome do componente exatamente como está na planilha e (esperado) no componente principal do Figma. */
  componente: string;
  /** Lista de estados possíveis do componente, em texto livre (como veio da planilha). Informativo por ora — ver ComponentTypeRule.states. */
  estados: string | null;
  /**
   * Texto de verbalização esperada, literalmente como veio da célula
   * (pode ter múltiplas linhas/estados, ou ser um texto corrido
   * explicativo com exemplo embutido — os dois casos são usados
   * INTEIROS como verbalização inicial, editável pelo designer;
   * nenhum dos dois fica vazio só porque não é uma lista limpa de
   * "Estado: texto"). Placeholders usam "(Nome)", "[Nome]" ou
   * "{Nome}" dependendo da linha — ver src/rules/placeholders.ts.
   */
  verbalizacaoEsperada: string | null;
  /**
   * Valor literal da coluna "Tipo" da planilha — um dos 8 tipos
   * válidos do documento de regras (Botão, Entrada, Link, Título,
   * Imagem, Decorativo, Estrutura, Não interativo). Mapeado 1:1 para
   * as categorias do plugin em accessibility-rules.ts.
   */
  tipo: string | null;
  /**
   * Coluna "Foco" da planilha: "Sim" | "Não" | "Apenas elementos
   * interativos" | null. Determina a Ordem de foco (Regra 3/4) — só
   * "Sim" torna o componente elegível a receber um número de foco.
   */
  foco: string | null;
  /**
   * NÃO vem da planilha — campo de extensão para quem for dar
   * manutenção depois. Se o nome do componente principal no arquivo
   * Figma real divergir do valor de `componente`, liste aqui os
   * nomes alternativos aceitos. Deixe `undefined` quando não houver
   * divergência conhecida.
   */
  aliasesDeNome?: string[];
  /**
   * NÃO vem da planilha — campo de extensão. Por padrão, um
   * componente reconhecido (com regra aqui) faz a busca parar nele:
   * gera um card, mas não desce para dentro dele. Alguns componentes
   * — como "Header Product" — são reconhecidos E SEMPRE têm outros
   * componentes reais dentro (ex.: Breadcrumb, Título) que também
   * precisam virar card. Marque `true` para esses casos. Default:
   * false (comportamento padrão de "para aqui").
   */
  sempreAprofundar?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Por padrão, a extração
   * pega só o primeiro texto visível dentro do componente ("primeiro").
   * Componentes com múltiplos textos que juntos formam a verbalização
   * (ex.: Breadcrumb: "Início, Produtos, Detalhes") usam "todos" —
   * junta todos os textos visíveis, na ordem, separados por vírgula.
   * Default: "primeiro".
   */
  extracaoTexto?: "primeiro" | "todos";
  /**
   * NÃO vem da planilha — campo de extensão. Traduz o NOME de uma
   * propriedade booleana do Figma (quando "true") para o rótulo de
   * estado correspondente aqui na planilha, quando usam palavras
   * diferentes — ex.: a propriedade do Figma se chama "Selected"
   * (inglês), mas o estado no campo `estados`/no texto de verbalização
   * se chama "Marcado" (português). Descoberto testando componente
   * real via log de diagnóstico — adicione um par aqui sempre que
   * confirmar, com dados reais, que uma propriedade do Figma
   * corresponde a um estado com nome diferente.
   */
  stateFlagAliases?: Record<string, string>;
  /**
   * NÃO vem da planilha — campo de extensão. Regras de inferência por
   * AUSÊNCIA de sinal, para estados sem nenhuma propriedade "true"
   * correspondente no Figma (ex.: "Desmarcado" de um Checkbox — não
   * existe "Unselected: true", só a ausência de "Selected"/
   * "Indeterminate"). Cadastre só quando confirmar com dados reais —
   * é específico de cada componente, nunca um algoritmo genérico.
   */
  derivedStates?: Array<{ whenFlagsEqual: Record<string, string>; thenState: string }>;
}

export const accessibilityRuleRecords: AccessibilityRuleRecord[] = [
  {
    "categoria": "Action",
    "componente": "Button Group",
    "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si não possui estados próprios.",
    "verbalizacaoEsperada": "Default: “[Label], Botão”.\nBotão desabilitado: “[Label], indisponível, botão”.\nHabilitado: “[Label], Botão”.\nLoading: “Carregando” ",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Action",
    "componente": "Button Icon",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “[Label], botão.”\nDisabled: “[Label], Indisponível, botão.”\nFocus: “[Label], botão.”\n",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Mini",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “[Label], botão.”\nDisabled: “[Label] Indisponível, botão.”\nFocus: “[Label], botão.”",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Primary",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], botão”.\nLoading macOS: “carregando”.\nLoading Windows: “[Carregando]”.\nDisabled macOS: “[Label], Escurecido, Botão”.\nDisabled Windows: “[Label]Indisponível, botão”.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Secondary",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], botão”.\nLoading macOS: “carregando”.\nLoading Windows: “[Carregando]”.\nDisabled macOS: “[Label], Escurecido, Botão”.\nDisabled Windows: “[Label]Indisponível, botão”.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Shortcut",
    "estados": "Habilitado, Focus, Hover, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], link.”\nDisabled: “[Label], indisponível, Link.”",
    "tipo": "Link",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Menu Button",
    "estados": "Recolhido, Expandido, Focus e Hover.",
    "verbalizacaoEsperada": "Expandido: “[Label], Botão, Expandido”\nRecolhido: “[Label], Botão, Recolhido”\n",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Link Icon",
    "estados": "Habilitado, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], link.”\nExterno: “[Label], link externo.”",
    "tipo": "Link",
    "foco": "Sim"
  },
  {
    "categoria": "Content",
    "componente": "Icon Shape",
    "estados": "Padrão; estático, sem foco, hover ou desabilitado.",
    "verbalizacaoEsperada": "Não deve ser verbalizado ou receber foco",
    "tipo": "Decorativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Currency",
    "estados": "Padrão, Mascarado; variação positiva ou negativa apenas visual.",
    "verbalizacaoEsperada": "Hiden true: \"Valor oculto\" Hiden false positive: \"[Valor]\" Hiden true negative: \"Menos [valor]\"",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Paragraph",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Leitura do conteúdo.",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Icon",
    "estados": "Herda estados do componente pai.",
    "verbalizacaoEsperada": "Não deve ser verbalizado",
    "tipo": "Decorativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Topic",
    "estados": "Estático, sem foco, hover ou desabilitado.",
    "verbalizacaoEsperada": "Leitura do conteúdo.",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Brand",
    "estados": "Estático; quando usado como link, possui interação.",
    "verbalizacaoEsperada": "Quando ilustrativo: \"Logo Sicredi.\" Quando link: \"Tela inicial do Internet banking do Sicredi, link\"",
    "tipo": "Imagem",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Description",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Leitura do conteúdo.",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Empty State",
    "estados": "Estático; botão interno segue Button Primary.",
    "verbalizacaoEsperada": "Verbaliza cada componente separadamente. Título: \"[Título com hierarquia lógica]\" Descrição: \"[Leitura do conteúdo]\", Button primary: \"[Label], botão\"\n",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Content",
    "componente": "Accordion",
    "estados": "Expandido e Recolhido.",
    "verbalizacaoEsperada": "Expandido: \"[Label], Botão, Expandido, Título, Nível de cabeçalho 2\"\nRecolhido: \"[Rótulo], Botão, Recolhido, Título, Nível de cabeçalho 2\" Para ler o conteúdo o usuário deve navegar por setas.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Content",
    "componente": "Image",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Quando ilustrativa, não há verbalização. Se fornece contexto, verbalização do texto alternativo",
    "tipo": "Imagem",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Heading",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "[Label], Título de nível [ordem lógica]",
    "tipo": "Título",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "List Content",
    "estados": "Sem estados próprios.",
    "verbalizacaoEsperada": "Conteúdo conforme ordem lógica",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Content",
    "componente": "List Ghost",
    "estados": "Padrão, estático.",
    "verbalizacaoEsperada": "[Description], [Label]",
    "tipo": "Não interativo",
    "foco": "Não",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Content",
    "componente": "Credit Card",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Quando ilustrativo, sem verbalização. Quando contextual, verbaliza a bandeira",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Pagination",
    "estados": "Estados herdados de Dropdown e Button Icon.",
    "verbalizacaoEsperada": "Segue a ordem lógica e semântica de cada componente.",
    "tipo": "Botão",
    "foco": "Sim",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Content",
    "componente": "Table",
    "estados": "Default, Linhas selecionadas, Sem dados.",
    "verbalizacaoEsperada": "Segue a documentação da tabela: https://confederacaosicredi.sharepoint.com/:w:/r/teams/nucleodeacessibilidade/Shared%20Documents/Especifica%C3%A7%C3%B5es%20Colmeia/Especificac%CC%A7%C3%B5es%20para%20tabela%20(Table).docx?d=w3d5f894400084c4c94753e09a8ad20d7&csf=1&web=1&e=gcqGDV",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Containers",
    "componente": "Card",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Containers",
    "componente": "Banner Image Full",
    "estados": "Habilitado, Focus, Hover, relacionados à ação.",
    "verbalizacaoEsperada": "\"[Título], [Descrição],[Label],Botão\"",
    "tipo": "Imagem",
    "foco": "Não",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Containers",
    "componente": "Modal",
    "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Icon button X: \"Fechar, botão\".",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Containers",
    "componente": "Cookies",
    "estados": "Visível e Aceito.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes com suas devidas semânticas",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Containers",
    "componente": "Fixed Bar",
    "estados": "Estrutural, sem estados próprios.",
    "verbalizacaoEsperada": "\"[Label], Botão\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Containers",
    "componente": "Drawer",
    "estados": "Aberto e Fechado.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Icon button X: \"Fechar, botão\".",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Containers",
    "componente": "Card Review",
    "estados": "Default, Ativo e Enviado.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Contador de caracteres verbalizado antes do conteúdo do input. Cada estrela verbaliza posição e total de estrelas, exemplo \"Uma estrela,botão de opção, não marcado, 1 de 5\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Feedback",
    "componente": "Alert",
    "estados": "Ativo e Encerrado.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Icon button X: \"Fechar, botão\".",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Feedback",
    "componente": "Flag",
    "estados": "Estrutural; links internos herdam estados próprios.",
    "verbalizacaoEsperada": "“[Título] [Description] [Label], link externo.”",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Feedback",
    "componente": "Flag Cooperado",
    "estados": "Estrutural e não interativo; links internos herdam estados.",
    "verbalizacaoEsperada": "“[Título] [Description] [Label], link externo.”",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Feedback",
    "componente": "Toast",
    "estados": "Exibido e Oculto.",
    "verbalizacaoEsperada": "\"[Description],[label] link externo, fechar,botão\".",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Feedback",
    "componente": "Tooltip",
    "estados": "Inativo: Tooltip não visível.\n\nAtivo: Tooltip visível por hover ou foco.",
    "verbalizacaoEsperada": "\"[Description]\"\n",
    "tipo": "Não interativo",
    "foco": "Não",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Inputs",
    "componente": "Checkbox",
    "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
    "verbalizacaoEsperada": "Marcado: “[Label], caixa de seleção, marcado.”\nDesmarcado: “[texto da label], caixa de seleção, não marcado.”\nParcialmente marcado: “{rótulo}, caixa de seleção parcialmente marcada.”\nDesabilitado: “{rótulo}, caixa de seleção desabilitada.”",
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
    "verbalizacaoEsperada": "Label], Remover, Botão\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Chip Select",
    "estados": "Habilitado, Focus, Hover.",
    "verbalizacaoEsperada": "Desmarcado:\"[texto da label], caixa de seleção, não marcado\". Marcado: \"[Label], caixa de seleção, marcado\".",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Date Picker",
    "estados": "Default: exibe o valor padrão ou o valor selecionado pelo usuário\n\nHover: componente recebeu foco com mouse, alterando visualmente seu estilo\n\nSelected: componente está com sua lista de opções aberta, tendo o mesmo estilo visual do Hover",
    "verbalizacaoEsperada": "Para o campo de ano: \"Anterior, botão\", \"Dois mil e vinte dois\",\"Próximo, botão\". Para o campo de mês: \"Anterior, botão\", \"Fevereiro\",\"Próximo, botão\". Os dias são anunciados juntamente com o mês e o ano e dia da semana.\n",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Dropdown",
    "estados": "Habilitado, Focus, Open, Error, Disabled.",
    "verbalizacaoEsperada": "Expandido: \"[Label], Botão, Expandido\"\"\nRecolhido: \"[Label], Botão, Recolhido\"",
    "tipo": "Entrada",
    "foco": "Sim",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Code",
    "estados": "enabled, focus, hover, filled.",
    "verbalizacaoEsperada": "Quando vazio: Label acessível \"informe o código, [posição], campo de edição\". Quando preenchido: Label acessível \"informe o código, marcador, [posição], campo de edição\".\n",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Code Number",
    "estados": "habilitado, focus, hover e preenchido;",
    "verbalizacaoEsperada": "Ao focar em cada um dos botões leitor anuncia: “6 ou 1, botão”.\nFeedback dinâmico:\nQuando uma tecla é acionada, o campo de senha atualiza  “x dígitos inseridos”\nBotão Limpar:\nDeve anunciar “Caracteres apagados” após ação.",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Date",
    "estados": "Padrão: campo vazio e pronto para entrada.\n\nAberto: exibe o calendário de seleção de data.\n\nFoco: realce visual e leitura de rótulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com interação bloqueada",
    "verbalizacaoEsperada": "Recolhido: \"[Label],[Mascara],[Helper text], campo de edição,calendário,recolhido, botão\" Expandido: [Label],[Mascara],[Helper text], campo de edição,expandido,botão \"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Password",
    "estados": "Habilitado, Focus, Filled, Error, Disabled.",
    "verbalizacaoEsperada": "Olho aberto/valor oculto: \"[Label],[Mascara],[Helper text], campo de edição, mostrar senha, botão\"                                                                                                                                                             Olho fechado/valor visível: \"[Label],[Mascara],[Helper text], campo de edição, ocultar senha, botão\" ",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Select",
    "estados": "Default, Filled, Hover, Active, Error, Disabled.",
    "verbalizacaoEsperada": "Recolhido: \"[Label],[Mascara],[Helper text], campo de edição,recolhido, botão\" Expandido: \"[Label],[Mascara],[Helper text], campo de edição, expandido, botão\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Text",
    "estados": "Habilitado, Focus, Filled, Error, Disabled.",
    "verbalizacaoEsperada": "\"[label], [placeholder], [helper text], Campo de edição\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Input Text Area",
    "estados": "Default, Hover, Focus, Filled, Disabled, Error, Read-only.",
    "verbalizacaoEsperada": "\"[label], [placeholder], [contador], [helper text], Caixa de edição\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "List Select",
    "estados": "Herda do seletor interno: Hover, Focus, Checked, Unchecked, Disabled etc.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes com suas devidas semânticas",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Popover",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes.",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Inputs",
    "componente": "Popover Menu",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes.",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Inputs",
    "componente": "Radio Button",
    "estados": "Selecionado, Não selecionado, Desabilitado.",
    "verbalizacaoEsperada": "Não marcado: \"[Label], botão de opção, não marcado, [posição].\" Marcado: [Label], botão de opção, marcado, [posição].",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Rate Input",
    "estados": "Default, Selecionado, Desabilitado.",
    "verbalizacaoEsperada": "Cada estrela verbaliza posição e total de estrelas, exemplo \"Uma estrela,botão de opção, não marcado, 1 de 5\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Search",
    "estados": "Habilitado/Focus, Hover, Filled;",
    "verbalizacaoEsperada": "\"[Placeholder],campo de busca,[rótulo], botão\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Switch",
    "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
    "verbalizacaoEsperada": "Pressionado: [Label], botão de alternancia, pressionado\" Não pressionado: [Label], botão de alternancia, não pressionado\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Uploader",
    "estados": "Default: campo está habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e está com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou validação.",
    "verbalizacaoEsperada": "Default: \"[Label],[Descrição], [helper text],[Label do botão] botão.  Loading: \"Label], Carregando\"\nError:\"[Label],[helper text],excluir arquivo, botão. Complete:\"[Label],[helper text],[rótulo acessível], botão. ",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Navigation",
    "componente": "Avatar Business",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Sem verbalização",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Navigation",
    "componente": "Avatar Name",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Sem verbalização",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Navigation",
    "componente": "Breadcrumb",
    "estados": "Links habilitados; página atual.",
    "verbalizacaoEsperada": " \"[Label] link, [Label] link,[Label] página atual\"\n",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Navigation",
    "componente": "Carousel Nav",
    "estados": "Herda de Page Indicator e Button Icon.",
    "verbalizacaoEsperada": "O leitor de tela anuncia os botões como controles de navegação.\n\nExemplo: “Carrossel. 3 itens. Item 1 de 3. Próximo item, botão.”",
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
    "estados": "Estrutural; elementos internos possuem estados próprios.",
    "verbalizacaoEsperada": "\"[Título], [Nível], [Descrição], [Label acessível] botão. Flow: \"[Alt-text]\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos",
    "sempreAprofundar": true
  },
  {
    "categoria": "Navigation",
    "componente": "List Navigation",
    "estados": "Default: onde o item está disponível para navegação\n\nHover: estado momentâneo ao acionar a navegação\n\nFocus: componente recebe destaque visual para navegação por teclado.",
    "verbalizacaoEsperada": "Conteúdo conforme ordem lógica\n",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "todos"
  },
  {
    "categoria": "Navigation",
    "componente": "Page Indicator",
    "estados": "Informativo e não interativo.",
    "verbalizacaoEsperada": "\"[X itens]. Item [X de X].",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Navigation",
    "componente": "Tab",
    "estados": "Selecionada e Não selecionada.",
    "verbalizacaoEsperada": "Selecionada:\"[Rótulo], guia selecionado, [Posição]\" Não seleciona:\"[Rótulo], guia não selecionado, [Posição]\"",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Status",
    "componente": "Badge",
    "estados": "Sem estados próprios.",
    "verbalizacaoEsperada": "[Label acessível]",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Loading",
    "estados": "Único.",
    "verbalizacaoEsperada": "\"Carregando\"",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Progress Line",
    "estados": "Informativo e não interativo.",
    "verbalizacaoEsperada": "[Posição e total de etapas]",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Skeleton",
    "estados": "Único.",
    "verbalizacaoEsperada": "Carregando informações",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Tag Container",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Label",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Tag Icon",
    "estados": "Estático e não interativo.",
    "verbalizacaoEsperada": "Label",
    "tipo": "Não interativo",
    "foco": "Não"
  }
];
