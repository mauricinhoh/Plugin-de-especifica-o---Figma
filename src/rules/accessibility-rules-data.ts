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
   * NÃO vem da planilha — campo de extensão. Quando true, o componente
   * é reconhecido mas NÃO gera card próprio: a descoberta só desce
   * dentro dele e cada componente reconhecido lá dentro vira seu card
   * (ex.: Button Group → um card por botão, com a regra de Button
   * Primary/Secondary). Pedido do usuário.
   */
  somenteFilhos?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Quando true, o componente
   * é um CONTÊINER DE ITENS IGUAIS (ex.: Chip Filter com 1 a 8 chips):
   * não gera card próprio, e cada item de dentro vira um card usando a
   * regra DESTE componente (verbalização, tipo, foco), pegando o texto
   * do próprio item. Não depende do nome das camadas de dentro.
   */
  cardPorItem?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Usado com extracaoTexto
   * "abas" (ex.: Tab com 2 a 7 abas): uma linha por aba, na ordem da
   * esquerda para a direita. [Label] = texto da aba, [Posição] = posição
   * dela, [Total] = total de abas. A aba no estado "Select" usa
   * `selecionada`; as demais usam `naoSelecionada`. O resultado entra
   * no placeholder [abas].
   */
  formatoAbas?: { selecionada: string; naoSelecionada: string; separador?: string };
  /**
   * NÃO vem da planilha — campo de extensão. Com somenteFilhos: não lê
   * textos soltos dentro deste contêiner — só os componentes
   * reconhecidos viram cards (ex.: Fixed Bar → só os botões).
   */
  ignorarTextoSolto?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Verbalização usada quando
   * o componente NÃO tem título (extração "titulo-descricao" não achou
   * título). Ex.: Flag sem título → "[Descrição], Link".
   */
  verbalizacaoSemTitulo?: string;
  /**
   * NÃO vem da planilha — campo de extensão. Trecho da verbalização que
   * só aparece quando o plugin acha um texto SUBLINHADO (link) dentro
   * do componente; sem sublinhado, esse trecho é tirado do texto. Ex.:
   * Flag → ", Link". Confirmado com o usuário em 05/10/2026.
   */
  trechoSoComSublinhado?: string;
  /**
   * NÃO vem da planilha — campo de extensão. A ÚLTIMA camada de texto
   * do componente (mesmo oculta) é reservada para `placeholder`: se
   * estiver visível, o texto dela preenche o placeholder; se estiver
   * oculta, `trechoSeOculta` é tirado da verbalização. Essa camada não
   * entra no `textosPorCamada` dos outros placeholders. Ex.: Input Text
   * Area → contador ("000/000") na camada "Support". Confirmado com o
   * usuário em 05/10/2026.
   */
  ultimaCamadaDeTexto?: { placeholder: string; trechoSeOculta: string };
  /**
   * NÃO vem da planilha — campo de extensão. Títulos dentro deste
   * contêiner recebem o nível pela ORDEM LÓGICA (1º título = nível 1,
   * 2º = nível 2...), não pelo tamanho da fonte. Textos pequenos (que
   * hoje viram nível 5/6 pelo tamanho) continuam como estão. Começou
   * pelo Modal — confirmado com o usuário em 05/10/2026.
   */
  titulosEmOrdemLogica?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Nome do placeholder que é
   * preenchido com o PRIMEIRO texto visível do componente (ex.: Input
   * Search → [Placeholder] = primeira label de dentro). Confirmado com
   * o usuário em 05/10/2026.
   */
  primeiroTextoEm?: string;
  /**
   * NÃO vem da planilha — campo de extensão. Placeholders preenchidos
   * pela POSIÇÃO do texto visível: o 1º nome recebe o 1º texto, o 2º
   * nome o 2º texto, etc. Ex.: List Select → ["Descrição", "Label"].
   * Confirmado com o usuário em 05/10/2026.
   */
  textosPorPosicao?: string[];
  /**
   * NÃO vem da planilha — campo de extensão. O estado vem de um
   * COMPONENTE INTERNO (o primeiro reconhecido com esse nome de regra),
   * não do próprio componente: as propriedades dele (variantes e
   * toggles) entram na conferência de `derivedStates`. Ex.: List Select
   * → estado do Checkbox de dentro (toggles Selected, Indeterminate,
   * Disabled). Confirmado com o usuário em 05/10/2026.
   */
  estadoDoComponenteInterno?: string;
  /**
   * NÃO vem da planilha — campo de extensão. Na extração
   * "titulo-descricao", lê só os textos do PRÓPRIO componente, sem
   * entrar em componentes internos (ex.: o "x" do Button Icon do Alert
   * não pode virar título nem descrição).
   */
  somenteTextosProprios?: boolean;
  /**
   * NÃO vem da planilha — campo de extensão. Verbalização usada quando
   * o componente NÃO tem descrição (ex.: Header Product só com título).
   */
  verbalizacaoSemDescricao?: string;
  /**
   * NÃO vem da planilha — campo de extensão. Usado com extracaoTexto
   * "lista": cada texto do componente é um item (ex.: cada nível do
   * Breadcrumb, de 2 a 6). `item` formata os itens do meio, `ultimo`
   * formata o último; [Label] é o texto do item. O resultado entra no
   * placeholder [níveis] da verbalização.
   */
  formatoLista?: { item: string; ultimo: string; separador?: string };
  /**
   * NÃO vem da planilha — campo de extensão. Preenche cada placeholder
   * com o texto da CAMADA de mesmo papel dentro do componente, achada
   * pelo NOME da camada (não pela posição). Chave = nome do placeholder
   * (como no texto, ex.: "helper text"); valor = trechos que o nome da
   * camada pode conter (sem acento/maiúscula). Ex.: Input Text →
   * { "label": ["label"], "placeholder": ["placeholder"], ... }.
   * Se a camada não existir/estiver oculta, o placeholder fica visível
   * no card para o designer preencher (o [label] ainda cai no primeiro
   * texto, como antes).
   */
  textosPorCamada?: Record<string, string[]>;
  /**
   * NÃO vem da planilha — campo de extensão. Preenche placeholders com
   * os textos do PRÓPRIO componente (sem entrar em componentes
   * internos, ex.: o botão do Uploader). Primeiro pelo nome da camada
   * (trechos listados); o que não bater é preenchido pela ORDEM dos
   * textos, na ordem das chaves. Ex.: Uploader → label, descrição,
   * helper text.
   */
  textosProprios?: Record<string, string[]>;
  /**
   * NÃO vem da planilha — campo de extensão. Placeholder preenchido com
   * o texto do primeiro componente interno (ex.: o botão do Uploader →
   * "label do botão").
   */
  textoDoBotao?: string;
  /**
   * NÃO vem da planilha — campo de extensão. Verbalização diferente
   * quando ESTE componente está dentro de um contêiner específico
   * (chave = nome do contêiner, igual ao campo `componente` dele).
   * Ex.: Button Icon dentro do Drawer diz "Fechar" em vez do [Label].
   * Fora desses contêineres, vale a verbalização normal.
   */
  verbalizacaoDentroDe?: Record<string, string>;
  /**
   * NÃO vem da planilha — campo de extensão. Componentes (nomes iguais
   * ao campo `componente`) que, quando estão dentro DESTE contêiner,
   * devem ser sempre os últimos da ordem entre os itens do contêiner.
   * Ex.: Drawer → ["Button Icon"] (o X de fechar é lido por último).
   */
  ultimosDentro?: string[];
  /**
   * NÃO vem da planilha — campo de extensão. Por padrão, a extração
   * pega só o primeiro texto visível dentro do componente ("primeiro").
   * Componentes com múltiplos textos que juntos formam a verbalização
   * (ex.: Breadcrumb: "Início, Produtos, Detalhes") usam "todos" —
   * junta todos os textos visíveis, na ordem, separados por vírgula.
   * "duas-posicoes"/"tres-posicoes" pegam o primeiro, segundo (e
   * terceiro) texto separadamente (ex.: Empty State: primeiro =
   * título, segundo = descrição; Banner Image Full: primeiro =
   * título, segundo = descrição, terceiro = rótulo do botão — tudo no
   * mesmo card) — posição fixa, não relacionada a tamanho de fonte.
   * Default: "primeiro".
   */
  extracaoTexto?: "primeiro" | "todos" | "duas-posicoes" | "tres-posicoes" | "lista" | "titulo-descricao" | "cabecalho" | "abas";
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
  /**
   * NÃO vem da planilha — campo de extensão. Links reais que devem
   * virar HYPERLINK de verdade no .docx exportado (não só texto azul
   * sublinhado — um link clicável, apontando pra URL real). O `text`
   * precisa aparecer EXATAMENTE (mesma grafia) dentro de
   * `verbalizacaoEsperada` — é esse trecho que vira o link.
   */
  links?: Array<{ text: string; url: string }>;
  /**
   * NÃO vem da planilha — campo de extensão. Verbalização inteira a
   * usar quando um estado de `derivedStates` bate (chave = `thenState`).
   * Vale a PRIMEIRA chave, na ordem escrita aqui, que bater; se
   * nenhuma bater, usa `verbalizacaoEsperada`. Ex.: Currency — oculto
   * (Hiden = true) → só "Valor oculto"; Type = Negative → texto sem o
   * "Menos". Confirmado com o usuário em 05/10/2026.
   */
  verbalizacaoPorEstadoDerivado?: Record<string, string>;
}

export const accessibilityRuleRecords: AccessibilityRuleRecord[] = [
  {
    "categoria": "Action",
    "componente": "Button Group",
    "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si não possui estados próprios.",
    "verbalizacaoEsperada": "Default: “[Label], Botão”.\nBotão desabilitado: “[Label], Indisponível, Botão”.\nHabilitado: “[Label], Botão”.\nLoading: “Carregando” ",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "somenteFilhos": true
  },
  {
    "categoria": "Action",
    "componente": "Button Icon",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “[Label], Botão.”\nDisabled: “[Label], Indisponível, Botão.”\nFocus: “[Label], Botão.”\n",
    "tipo": "Botão",
    "foco": "Sim",
    "verbalizacaoDentroDe": {
      "Drawer": "Habilitado: “Fechar, Botão.”\nDisabled: “Fechar, Indisponível, Botão.”\nFocus: “Fechar, Botão.”",
      "Modal": "Fechar, Botão"
    }
  },
  {
    "categoria": "Action",
    "componente": "Button Mini",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “[Label], Botão.”\nDisabled: “[Label] Indisponível, Botão.”\nFocus: “[Label], Botão.”",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Primary",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], Botão”.\nLoading macOS: “Carregando”.\nLoading Windows: “Carregando”.\nDisabled macOS: “[Label], Escurecido, Botão”.\nDisabled Windows: “[Label] Indisponível, Botão”.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Secondary",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], Botão”.\nLoading macOS: “Carregando”.\nLoading Windows: “Carregando”.\nDisabled macOS: “[Label], Escurecido, Botão”.\nDisabled Windows: “[Label] Indisponível, Botão”.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Shortcut",
    "estados": "Habilitado, Focus, Hover, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], Link.”\nDisabled: “[Label], Indisponível, Link.”",
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
    "verbalizacaoEsperada": "Habilitado/Focus: “[Label], Link.”\nExterno: “[Label], Link externo.”",
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
    "verbalizacaoEsperada": "Hiden true: \"Valor oculto\" Hiden false positive: \"[Label]\" Hiden true negative: \"-[Label]\"",
    "tipo": "Não interativo",
    "foco": "Não",
    "derivedStates": [
      { "whenFlagsEqual": { "Hiden": "True" }, "thenState": "Currency oculto" },
      { "whenFlagsEqual": { "Type": "Negative" }, "thenState": "Currency negativo" }
    ],
    "verbalizacaoPorEstadoDerivado": {
      "Currency oculto": "Hiden true: \"Valor oculto\"",
      "Currency negativo": "Hiden true: \"Valor oculto\" Hiden false positive: \"[Label sem sinal]\" Hiden true negative: \"[Label]\""
    }
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
    "verbalizacaoEsperada": "[Label]",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Brand",
    "estados": "Estático; quando usado como link, possui interação.",
    "verbalizacaoEsperada": "Quando ilustrativo: \"Logo Sicredi.\" Quando link: \"Tela inicial do Internet banking do Sicredi, Link\"",
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
    "verbalizacaoEsperada": "Verbaliza cada componente separadamente. Título: \"[Título com hierarquia lógica]\" Descrição: \"[Leitura do conteúdo]\", Button primary: \"[rótulo do botão], Botão\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "tres-posicoes"
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
    "somenteFilhos": true
  },
  {
    "categoria": "Content",
    "componente": "List Ghost",
    "estados": "Padrão, estático.",
    "verbalizacaoEsperada": "[Label]",
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
    "verbalizacaoEsperada": "Segue a documentação da tabela:\nhttps://sicredi.atlassian.net/wiki/spaces/TCD/pages/556172391/Exemplos+de+especifica+es",
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
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "sempreAprofundar": true
  },
  {
    "categoria": "Containers",
    "componente": "Banner Image Full",
    "estados": "Habilitado, Focus, Hover, relacionados à ação.",
    "verbalizacaoEsperada": "[label do Título], [label da descrição], [rótulo do botão], Botão",
    "tipo": "Imagem",
    "foco": "Não",
    "extracaoTexto": "tres-posicoes",
    "aliasesDeNome": [
      "Banner Full Image"
    ]
  },
  {
    "categoria": "Containers",
    "componente": "Modal",
    "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Icon button X: \"Fechar, Botão\".",
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
    "estados": "Visível e Aceito.",
    "verbalizacaoEsperada": "[label do Título], [label da descrição], [rótulo do botão], Botão",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "tres-posicoes"
  },
  {
    "categoria": "Containers",
    "componente": "Fixed Bar",
    "estados": "Estrutural, sem estados próprios.",
    "verbalizacaoEsperada": "\"[Label], Botão\"",
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
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Icon button X: \"Fechar, Botão\".",
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
    "verbalizacaoEsperada": "Ordem lógica dos componentes. Contador de caracteres verbalizado antes do conteúdo do input. Cada estrela verbaliza posição e total de estrelas, exemplo \"Uma estrela, Botão de opção, Não marcado, 1 de 5\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Feedback",
    "componente": "Alert",
    "estados": "Ativo e Encerrado.",
    "verbalizacaoEsperada": "[Título], [Descrição], Fechar, Botão",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "titulo-descricao",
    "verbalizacaoSemTitulo": "[Descrição], Fechar, Botão",
    "somenteTextosProprios": true
  },
  {
    "categoria": "Feedback",
    "componente": "Flag",
    "estados": "Estrutural; links internos herdam estados próprios.",
    "verbalizacaoEsperada": "[Título], [Descrição], Link",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "titulo-descricao",
    "verbalizacaoSemTitulo": "[Descrição], Link",
    "trechoSoComSublinhado": ", Link"
  },
  {
    "categoria": "Feedback",
    "componente": "Flag Cooperado",
    "estados": "Estrutural e não interativo; links internos herdam estados.",
    "verbalizacaoEsperada": "[Título], [Descrição], Link",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "titulo-descricao",
    "verbalizacaoSemTitulo": "[Descrição], Link",
    "trechoSoComSublinhado": ", Link"
  },
  {
    "categoria": "Feedback",
    "componente": "Toast",
    "estados": "Exibido e Oculto.",
    "verbalizacaoEsperada": "\"[label]. Link, Fechar, Botão\".",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos"
  },
  {
    "categoria": "Feedback",
    "componente": "Tooltip",
    "estados": "Inativo: Tooltip não visível.\n\nAtivo: Tooltip visível por hover ou foco.",
    "verbalizacaoEsperada": "[Label]",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Inputs",
    "componente": "Checkbox",
    "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
    "verbalizacaoEsperada": "Marcado: “[Label], Caixa de seleção, Marcado.”\nDesmarcado: “[texto da label], Caixa de seleção, Não marcado.”\nParcialmente marcado: “{rótulo}, Caixa de seleção parcialmente marcada.”\nDesabilitado: “{rótulo}, Caixa de seleção desabilitada.”",
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
    "verbalizacaoEsperada": "[Label], Remover, Botão",
    "tipo": "Entrada",
    "foco": "Sim",
    "cardPorItem": true
  },
  {
    "categoria": "Inputs",
    "componente": "Chip Select",
    "estados": "Habilitado, Focus, Hover.",
    "verbalizacaoEsperada": "Desmarcado:\"[texto da label], Caixa de seleção, Não marcado\". Marcado: \"[Label], Caixa de seleção, Marcado\".",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Date Picker",
    "estados": "Default: exibe o valor padrão ou o valor selecionado pelo usuário\n\nHover: componente recebeu foco com mouse, alterando visualmente seu estilo\n\nSelected: componente está com sua lista de opções aberta, tendo o mesmo estilo visual do Hover",
    "verbalizacaoEsperada": "Para o campo de ano: \"Anterior, Botão\", \"Dois mil e vinte dois\", \"Próximo, Botão\". Para o campo de mês: \"Anterior, Botão\", \"Fevereiro\", \"Próximo, Botão\". Os dias são anunciados juntamente com o mês e o ano e dia da semana.\n",
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
    "verbalizacaoEsperada": "Quando vazio: Label acessível \"Informe o código, [posição], Campo de edição, [Help Text]\". Quando preenchido: Label acessível \"Informe o código, Marcador, [posição], Campo de edição, [Help Text]\".\n",
    "tipo": "Entrada",
    "foco": "Sim",
    "textosPorCamada": {
      "help text": [
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
    "componente": "Input Code Number",
    "estados": "habilitado, focus, hover e preenchido;",
    "verbalizacaoEsperada": "Ao focar em cada um dos botões leitor anuncia: “6 ou 1, Botão, [Help Text]”.\nFeedback dinâmico:\nQuando uma tecla é acionada, o campo de senha atualiza  “x dígitos inseridos”\nBotão Limpar:\nDeve anunciar “Caracteres apagados” após ação.",
    "tipo": "Entrada",
    "foco": "Sim",
    "textosPorCamada": {
      "help text": [
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
    "componente": "Input Date",
    "estados": "Padrão: campo vazio e pronto para entrada.\n\nAberto: exibe o calendário de seleção de data.\n\nFoco: realce visual e leitura de rótulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com interação bloqueada",
    "verbalizacaoEsperada": "Recolhido: \"[Label], [Placeholder], [Helper text], Campo de edição, Calendário, Recolhido, Botão\" Expandido: \"[Label], [Placeholder], [Helper text], Campo de edição, Expandido, Botão\"",
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
    "verbalizacaoEsperada": "Olho aberto/valor oculto: \"[Label], [Placeholder], [Helper text], Campo de edição, Mostrar senha, Botão\" Olho fechado/valor visível: \"[Label], [Placeholder], [Helper text], Campo de edição, Ocultar senha, Botão\"",
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
    "verbalizacaoEsperada": "Recolhido: \"[Label], [Placeholder], [Helper text], Campo de edição, Recolhido, Botão\" Expandido: \"[Label], [Placeholder], [Helper text], Campo de edição, Expandido, Botão\"",
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
    "verbalizacaoEsperada": "\"[label], [placeholder], [helper text], Campo de edição\"",
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
    "verbalizacaoEsperada": "\"[label], [placeholder], [contador], [helper text], Caixa de edição\"",
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
    "verbalizacaoEsperada": "Marcado: “[Descrição], [Label], Caixa de seleção, Marcado”\nNão marcado: “[Descrição], [Label], Caixa de seleção, Não marcado”\nParcialmente marcado: “[Descrição], [Label], Caixa de seleção parcialmente marcada”\nDesabilitado: “[Descrição], [Label], Caixa de seleção desabilitada”",
    "tipo": "Entrada",
    "foco": "Sim",
    "textosPorPosicao": [
      "Descrição",
      "Label"
    ],
    "estadoDoComponenteInterno": "Checkbox",
    "derivedStates": [
      { "whenFlagsEqual": { "Selected": "True" }, "thenState": "List Select marcado" },
      { "whenFlagsEqual": { "Selected": "False", "Indeterminate": "False", "Disabled": "False" }, "thenState": "List Select não marcado" },
      { "whenFlagsEqual": { "Indeterminate": "True" }, "thenState": "List Select parcialmente marcado" },
      { "whenFlagsEqual": { "Disabled": "True" }, "thenState": "List Select desabilitado" }
    ],
    "verbalizacaoPorEstadoDerivado": {
      "List Select marcado": "[Descrição], [Label], Caixa de seleção, Marcado",
      "List Select não marcado": "[Descrição], [Label], Caixa de seleção, Não marcado",
      "List Select parcialmente marcado": "[Descrição], [Label], Caixa de seleção parcialmente marcada",
      "List Select desabilitado": "[Descrição], [Label], Caixa de seleção desabilitada"
    }
  },
  {
    "categoria": "Inputs",
    "componente": "Popover",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes.",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "somenteFilhos": true
  },
  {
    "categoria": "Inputs",
    "componente": "Popover Menu",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Ordem lógica dos componentes.",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "somenteFilhos": true
  },
  {
    "categoria": "Inputs",
    "componente": "Radio Button",
    "estados": "Selecionado, Não selecionado, Desabilitado.",
    "verbalizacaoEsperada": "Não marcado: \"[Label], Botão de opção, Não marcado, [posição].\" Marcado: \"[Label], Botão de opção, Marcado, [posição].\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Rate Input",
    "estados": "Default, Selecionado, Desabilitado.",
    "verbalizacaoEsperada": "Cada estrela verbaliza posição e total de estrelas, exemplo \"Uma estrela, Botão de opção, Não marcado, 1 de 5\"",
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
    "verbalizacaoEsperada": "[Placeholder], Campo de busca, Buscar, Botão",
    "tipo": "Entrada",
    "foco": "Sim",
    "primeiroTextoEm": "placeholder"
  },
  {
    "categoria": "Inputs",
    "componente": "Switch",
    "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
    "verbalizacaoEsperada": "Pressionado: \"[Label], Botão de alternancia, Pressionado\" Não pressionado: \"[Label], Botão de alternancia, Não pressionado\"",
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Uploader",
    "estados": "Default: campo está habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e está com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou validação.",
    "verbalizacaoEsperada": "Default: \"[Label], [Descrição], [helper text], [Label do botão] botão.\"\nLoading: \"[Label], Carregando\"\nError: \"[Label], [helper text], Excluir arquivo, Botão.\"\nComplete: \"[Label], [helper text], Remover arquivo, Botão.\"",
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
    "verbalizacaoEsperada": "[níveis]",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "lista",
    "formatoLista": {
      "item": "[Label] link",
      "ultimo": "[Label] link, Página atual",
      "separador": ", "
    }
  },
  {
    "categoria": "Navigation",
    "componente": "Carousel Nav",
    "estados": "Herda de Page Indicator e Button Icon.",
    "verbalizacaoEsperada": "O leitor de tela anuncia os botões como controles de navegação.\n\n“Carrossel. 3 itens. Item 1 de 3. Próximo, Botão”",
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
    "verbalizacaoEsperada": "\"[Título], Título de nível [ordem lógica], [Descrição]\". Flow: \"[Alt-text]\"",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "extracaoTexto": "cabecalho",
    "sempreAprofundar": true,
    "verbalizacaoSemDescricao": "\"[Título], Título de nível [ordem lógica]\". Flow: \"[Alt-text]\""
  },
  {
    "categoria": "Navigation",
    "componente": "List Navigation",
    "estados": "Default: onde o item está disponível para navegação\n\nHover: estado momentâneo ao acionar a navegação\n\nFocus: componente recebe destaque visual para navegação por teclado.",
    "verbalizacaoEsperada": "Conteúdo conforme ordem lógica\n",
    "tipo": "Estrutura",
    "foco": "Apenas elementos interativos",
    "somenteFilhos": true
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
    "verbalizacaoEsperada": "[abas]",
    "tipo": "Botão",
    "foco": "Sim",
    "extracaoTexto": "abas",
    "formatoAbas": {
      "selecionada": "[Label], Guia selecionado, Posição [Posição] de [Total]",
      "naoSelecionada": "Não selecionado: [Label], Guia, Posição [Posição] de [Total]",
      "separador": "\n"
    }
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
    "verbalizacaoEsperada": "[Label]",
    "tipo": "Não interativo",
    "foco": "Não"
  },
  {
    "categoria": "Status",
    "componente": "Tag Icon",
    "estados": "Estático e não interativo.",
    "verbalizacaoEsperada": "[Label]",
    "tipo": "Não interativo",
    "foco": "Não"
  }
];
