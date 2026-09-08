/**
 * ATENÇÃO — ESTE ARQUIVO É UM ESPELHO DIRETO DA PLANILHA.
 *
 * Fonte: "Extracao_Acessibilidade_Core_Web_70_Componentes.xlsx"
 * (aba "Acessibilidade Core Web"), fornecida pelo time de
 * acessibilidade em 08/09/2026 como base de verdade das regras de
 * acessibilidade do Core Web.
 *
 * COMO ATUALIZAR QUANDO A PLANILHA MUDAR
 * ---------------------------------------
 * 1. Abra a planilha nova e confira se as colunas continuam sendo,
 *    nesta ordem: Categoria | Componente | Rótulo | Estados |
 *    Verbalização esperada | Navegação por teclado | Foco, atributos
 *    e observações | Tipo | Foco.
 * 2. Para cada linha (uma por componente), adicione/edite um objeto
 *    neste array seguindo a interface `AccessibilityRuleRecord`
 *    abaixo. Copie o texto das células literalmente — inclusive
 *    quebras de linha (uma string JS com `\n` para cada linha da
 *    célula) e as aspas curvas (“ ”) que a planilha usa.
 * 3. NÃO edite `accessibility-rules.ts` para registrar um componente
 *    novo — aquele arquivo só TRANSFORMA os registros daqui em regras
 *    do motor (`ComponentTypeRule`). Basta adicionar o registro aqui
 *    que a regra correspondente é gerada automaticamente.
 * 4. Campos vazios na planilha viram `null` aqui — não invente
 *    conteúdo para preenchê-los.
 * 5. Depois de editar, rode `npm run typecheck` e `npm run build`
 *    para confirmar que nada quebrou.
 * 6. Se o plugin não reconhecer um componente automaticamente porque
 *    o nome real no arquivo Figma é diferente do valor de
 *    `componente` aqui (já aconteceu — "Botao defaut" vs "Botão
 *    Default"), NÃO crie um registro novo: adicione o nome real em
 *    `aliasesDeNome` no registro existente.
 *
 * Se um componente precisar de uma forma de identificação diferente
 * de "nome do componente principal == valor de `componente`" (ex.:
 * mais de um nome/apelido no arquivo Figma), isso é tratado em
 * `accessibility-rules.ts`, não aqui — este arquivo continua sendo
 * texto puro, sem lógica.
 */

export interface AccessibilityRuleRecord {
  /** Categoria do Design System (ex.: "Action", "Inputs", "Content"). Informativo; não usado pelo motor ainda. */
  categoria: string;
  /** Nome do componente exatamente como está na planilha e (esperado) no componente principal do Figma. */
  componente: string;
  /** Explicação de qual texto/rótulo o leitor de tela deve anunciar para este componente. */
  rotulo: string | null;
  /** Lista de estados possíveis do componente, em texto livre (como veio da planilha). */
  estados: string | null;
  /**
   * Texto(s) de verbalização esperada, literalmente como veio da
   * célula (pode conter múltiplas linhas, uma por estado, ou texto
   * corrido quando a planilha não separou por estado). Placeholders
   * usam "(Nome)", "[Nome]" ou "{Nome}" dependendo da linha — ver
   * src/rules/placeholders.ts.
   */
  verbalizacaoEsperada: string | null;
  /** Como o componente se comporta na navegação por teclado. Informativo; não usado pelo motor ainda. */
  navegacaoPorTeclado: string | null;
  /** Observações de foco/atributos ARIA. Informativo; não usado pelo motor ainda. */
  focoAtributosObservacoes: string | null;
  /**
   * Valor literal da coluna "Tipo" da planilha (categorização própria
   * da planilha — ex.: "Botão", "Entrada", "Link", "Grupo",
   * "Decorativo", "Texto", "Não se aplica"). NÃO é o mesmo vocabulário
   * do "Tipo de marcação" do plugin (as 9 categorias fixas de
   * markupTypes.ts) — o mapeamento entre os dois, quando seguro, é
   * feito em accessibility-rules.ts.
   */
  tipo: string | null;
  /** Coluna "Foco" da planilha: "Sim" | "Não" | null. Reservado para a lógica futura de Ordem de foco (não implementada agora). */
  foco: string | null;
  /**
   * NÃO vem da planilha — campo de extensão para quem for dar
   * manutenção depois. Se o nome do componente principal no arquivo
   * Figma real divergir do valor de `componente` (como já aconteceu:
   * o Design System tinha "Botao defaut" em vez de "Botão Default"),
   * liste aqui os nomes alternativos aceitos. Deixe `undefined`
   * quando não houver divergência conhecida — não precisa adicionar
   * este campo em todo registro.
   */
  aliasesDeNome?: string[];
}

export const accessibilityRuleRecords: AccessibilityRuleRecord[] = [
  {
    "categoria": "Action",
    "componente": "Button Group",
    "rotulo": "Cada botão dentro do grupo possui seu próprio rótulo (Label), que indica claramente a ação que será realizada.",
    "estados": "Habilitado, Foco, Desabilitado e Loading. O grupo em si não possui estados próprios.",
    "verbalizacaoEsperada": "Habilitado: “[verbo do botão], botão.”\nFoco: “[verbo do botão], botão.”\nDesabilitado: “[verbo do botão], botão, indisponível.”\nLoading: “[verbo do botão], carregando, botão indisponível.”",
    "navegacaoPorTeclado": "Tab: move o foco entre os botões. Enter ou Barra de espaços: ativa o botão. Shift + Tab: retorna ao elemento anterior ao grupo.",
    "focoAtributosObservacoes": "O tabindex é determinado pelos botões internos.",
    "tipo": "Não se aplica",
    "foco": "Não"
  },
  {
    "categoria": "Action",
    "componente": "Button Icon",
    "rotulo": "Como o botão não contém texto visível, o rótulo é sempre um atributo de acessibilidade.",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “Notificações, botão.”\nDisabled: “Notificações, botão, indisponível.”\nFocus: “Notificações, botão.”\nCom badge: “Notificações, novas.”",
    "navegacaoPorTeclado": "Tab: foco no botão. Barra de espaços ou Enter: ativa.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Grupo",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Mini",
    "rotulo": "O rótulo de um botão é o texto visível que orienta o usuário sobre a ação que será tomada.",
    "estados": "Habilitado, Disabled, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado: “Editar, botão.”\nDisabled: “Editar, botão, indisponível.”\nFocus: “Editar, botão.”",
    "navegacaoPorTeclado": "Tab: foco no botão. Barra de espaços ou Enter: ativa.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Primary",
    "rotulo": "O rótulo é o texto visível que orienta o usuário sobre a ação. Deve ser claro, conciso e descritivo.",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Verbo do botão], botão”.\nLoading macOS: “[Verbo do botão], carregando, botão, escurecido”.\nLoading Windows: “Indisponível, botão, [Verbo do botão]”.\nDisabled macOS: “[Verbo do botão], botão, escurecido”.\nDisabled Windows: “Indisponível, botão, [Verbo do botão]”.",
    "navegacaoPorTeclado": "Tab: foco no botão. Barra de espaços ou Enter: ativa.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Button Secondary",
    "rotulo": "O rótulo deve ser claro, conciso e descritivo.",
    "estados": "Habilitado, Hover, Focus, Loading, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “[Verbo do botão], botão”.\nLoading macOS: “[Verbo do botão], carregando, botão, escurecido”.\nLoading Windows: “Indisponível, botão, [Verbo do botão]”.\nDisabled macOS: “[Verbo do botão], botão, escurecido”.\nDisabled Windows: “Indisponível, botão, [Verbo do botão]”.",
    "navegacaoPorTeclado": "Tab: foco no botão. Barra de espaços ou Enter: ativa.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Shortcut",
    "rotulo": "O rótulo é o texto visível que descreve o destino ou a funcionalidade do atalho. Deve ser curto e direto.",
    "estados": "Habilitado, Focus, Hover, Disabled.",
    "verbalizacaoEsperada": "Habilitado/Focus: “{rótulo}, link.”\nDisabled: “{rótulo}, link, indisponível.”",
    "navegacaoPorTeclado": "Tab: foco no atalho. Enter: redireciona na mesma aba. Shift + Tab: retorna.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Link",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Menu Button",
    "rotulo": "Não possui rótulo visível; é obrigatório aria-label claro e contextual.",
    "estados": "Recolhido, Expandido, Focus e Hover.",
    "verbalizacaoEsperada": "Recolhido: “Ações do registro, botão, menu recolhido.”\nExpandido: “Ações do registro, botão, menu expandido.”\nItem focado: “Editar, item de menu.”",
    "navegacaoPorTeclado": "Tab: foco no botão. Enter/Espaço: abre/fecha. Setas: navegam. Esc: fecha e retorna foco.",
    "focoAtributosObservacoes": "Foco permanece dentro do menu enquanto aberto.",
    "tipo": "Botão",
    "foco": "Sim"
  },
  {
    "categoria": "Action",
    "componente": "Link Icon",
    "rotulo": "O rótulo é o texto visível que orienta o usuário sobre a ação que será tomada.",
    "estados": "Habilitado, Focus, Hover.",
    "verbalizacaoEsperada": "Habilitado/Focus: “Central de ajuda, link.”\nExterno: “Política de privacidade, link externo.”",
    "navegacaoPorTeclado": "Tab: foco no link. Enter: redireciona. Shift + Tab: retorna.",
    "focoAtributosObservacoes": "Respeita o tabindex configurado.",
    "tipo": "Link",
    "foco": "Sim"
  },
  {
    "categoria": "Content",
    "componente": "Icon Shape",
    "rotulo": "Não possui rótulo próprio, pois é decorativo e não interativo.",
    "estados": "Padrão; estático, sem foco, hover ou desabilitado.",
    "verbalizacaoEsperada": "Não precisa ser lido por leitores de tela.",
    "navegacaoPorTeclado": "Não recebe foco nem é acessível diretamente por teclado.",
    "focoAtributosObservacoes": null,
    "tipo": "Decorativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Currency",
    "rotulo": "O conteúdo textual já representa o próprio valor exibido. No estado mascarado, deve incluir aria-label ou aria-live.",
    "estados": "Padrão, Mascarado; variação positiva ou negativa apenas visual.",
    "verbalizacaoEsperada": "Valor visível: “R$ 1.200,00.”\nValor mascarado: “Valor oculto por privacidade.”",
    "navegacaoPorTeclado": "Não é interativo e não recebe foco.",
    "focoAtributosObservacoes": "Atualização dinâmica pode usar aria-live=\"polite\".",
    "tipo": "Texto",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Paragraph",
    "rotulo": "Label.",
    "estados": "Padrão, sem variações de foco, hover ou desabilitado.",
    "verbalizacaoEsperada": " leitor de tela anuncia o conteúdo textual de forma linear, como parte da leitura natural da página. Exemplo: “O Sicredi oferece soluções para o seu negócio crescer de forma cooperativa.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": "Texto",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Icon",
    "rotulo": "Não possui rótulo quando decorativo; quando semântico, usa aria-label ou texto visível.",
    "estados": "O Icon herda os estados do componente pai, como foco, hover, desabilitado ou carregando. Ele não possui estados próprios nem deve alterar a leitura semântica do componente onde está inserido.\n\n",
    "verbalizacaoEsperada": "Decorativo: O leitor de tela ignora o ícone.\nExemplo: nenhum anúncio.\n\nSemântico: O leitor de tela lê o rótulo associado.\nExemplo: “Notificações.”\n\nDentro de botão/link: A leitura é feita a partir do elemento pai.\nExemplo: “Editar, botão.”",
    "navegacaoPorTeclado": "Não recebe foco diretamente; foco pertence ao elemento pai.",
    "focoAtributosObservacoes": null,
    "tipo": "Decorativo",
    "foco": "Não"
  },
  {
    "categoria": "Content",
    "componente": "Topic",
    "rotulo": "O Label descreve o conteúdo.",
    "estados": "Estático, sem foco, hover ou desabilitado.",
    "verbalizacaoEsperada": "Leitor lê apenas o Label. Exemplo: “Clique em Baixar para realizar o download da ferramenta Diagnóstico Sicredi.”",
    "navegacaoPorTeclado": "Não recebe foco direto.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Brand",
    "rotulo": "Não possui rótulo visível; deve conter descrição clara para tecnologias assistivas.",
    "estados": "Estático; quando usado como link, possui interação.",
    "verbalizacaoEsperada": "“Logotipo Sicredi”.",
    "navegacaoPorTeclado": "Só entra na tabulação quando usado como link. Enter ou Espaço aciona o redirecionamento.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Description",
    "rotulo": "Label.",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Leitura normal; quando associado, é lido com rótulo principal. Exemplo: “Etapa 1 de 4”.",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Empty State",
    "rotulo": "Título e descrição.",
    "estados": "Estático; botão interno segue Button Primary.",
    "verbalizacaoEsperada": "“Sem notificações novas. Você ainda não recebeu avisos. Adicionar nova notificação, botão.”",
    "navegacaoPorTeclado": "Apenas elementos interativos internos recebem foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Accordion",
    "rotulo": "Cada item deve ter rótulo claro no cabeçalho.",
    "estados": "Expandido e Recolhido.",
    "verbalizacaoEsperada": "Ao focar o cabeçalho: “[título], botão recolhido.”\n\nAo expandir: “[título], botão expandido.” Após a expansão, o conteúdo interno é anunciado em sequência, permitindo uma leitura contínua pelo leitor de tela.\n\nAo recolher: “[título], botão recolhido.”",
    "navegacaoPorTeclado": "Tab: cabeçalhos. Enter/Espaço: expande/recolhe. Setas, Home e End: navegação.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Image",
    "rotulo": "Definido pelo texto alternativo (alt-text).",
    "estados": "Estático.",
    "verbalizacaoEsperada": "Informativa: lê o alt. Exemplo: “Gráfico de barras mostrando o aumento de clientes no último trimestre.”\nDecorativa: ignorada com alt vazio.",
    "navegacaoPorTeclado": "Não recebe foco e não participa da tabulação.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Heading",
    "rotulo": "Label.",
    "estados": "Padrão, sem variações de foco, hover ou desabilitado.",
    "verbalizacaoEsperada": "O componente deve utilizar as tags semânticas adequadas (<h1> a <h6>) conforme a posição do conteúdo na página:\n\n<h1>: título principal da página ou tela.\n\n<h2>: seções principais.\n\n<h3> e seguintes: subseções.",
    "navegacaoPorTeclado": "Não recebe foco; acessível pela navegação estrutural do leitor de tela.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "List Content",
    "rotulo": "Label 01, Description 01, Label 02, Description 02, Tag e Button Mini, conforme existirem.",
    "estados": "Sem estados próprios.",
    "verbalizacaoEsperada": "Ordem: Support element, Description 01, Label 01, Description 02, Label 02, Tag, Button Mini. Ex.: “R$ 500,00. Recebimentos. Banco Itaú. Detalhes.”",
    "navegacaoPorTeclado": "Componente não recebe foco direto.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "List Ghost",
    "rotulo": "Description identifica categoria; Label apresenta valor.",
    "estados": "Padrão, estático.",
    "verbalizacaoEsperada": "“Ícone Agência. Agência 1234. Conta 56789-0.”",
    "navegacaoPorTeclado": "Não recebe foco direto.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Credit Card",
    "rotulo": "Não possui rótulo verbal próprio; depende do texto de apoio.",
    "estados": "Estático.",
    "verbalizacaoEsperada": "“Cartão Sicredi Visa Gold, final 1234.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Pagination",
    "rotulo": "Cada controle deve possuir rótulo acessível.",
    "estados": "Estados herdados de Dropdown e Button Icon.",
    "verbalizacaoEsperada": "“10 itens por página, 10 selecionado. 1-10 de 30 itens. Página 1 de 3. Página anterior desativada. Próxima página, botão.”",
    "navegacaoPorTeclado": "Tab: controles. Setas: Dropdown. Enter/Espaço: ativa botões.",
    "focoAtributosObservacoes": "Controles desabilitados não entram na tabulação.",
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Content",
    "componente": "Table",
    "rotulo": "Cabeçalhos e conteúdos das colunas; controles interativos exigem rótulos acessíveis.",
    "estados": "Default, Linhas selecionadas, Sem dados.",
    "verbalizacaoEsperada": "Anuncia tipo, total de linhas/colunas e conteúdo linha a linha. Ex.: “Tabela de lançamentos. 4 linhas exibidas de um total de 30...”",
    "navegacaoPorTeclado": "Tab: controles. Setas: células quando aplicável. Espaço: seleção. Enter: botões.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Card",
    "rotulo": "Não possui rótulo próprio.",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "O Card não é anunciado; leitor percorre apenas elementos internos.",
    "navegacaoPorTeclado": "Foco apenas nos elementos internos.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Banner Image Full",
    "rotulo": "Heading, Description quando houver e rótulo do botão.",
    "estados": "Habilitado, Focus, Hover, relacionados à ação.",
    "verbalizacaoEsperada": "“Seu crédito foi aprovado! Veja as condições especiais selecionadas para você. Saiba mais, botão.”",
    "navegacaoPorTeclado": "Tab: foco no botão. Enter: ativa. Shift + Tab: retorna.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Modal",
    "rotulo": "Título do cabeçalho.",
    "estados": "Aberto e Fechado; tipos Default, Danger e Positive.",
    "verbalizacaoEsperada": "“Excluir registro, diálogo. Deseja realmente excluir este item? Cancelar, botão. Confirmar, botão.”\nAo fechar: “Diálogo fechado.”",
    "navegacaoPorTeclado": "Tab/Shift+Tab: elementos internos. Enter/Espaço: ativa. Esc: fecha.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Cookies",
    "rotulo": "Heading, Paragraph e Button Primary.",
    "estados": "Visível e Aceito.",
    "verbalizacaoEsperada": "“Cookies. Utilizamos cookies neste site para melhorar sua experiência de navegação, de acordo com nossa Política de Cookies, link externo. Permitir todos, botão.”",
    "navegacaoPorTeclado": "Tab: link e botão. Enter/Espaço: ativa consentimento.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Fixed Bar",
    "rotulo": "Não possui rótulo visível; conteúdo interno deve possuir.",
    "estados": "Estrutural, sem estados próprios.",
    "verbalizacaoEsperada": "“Confirmar, botão. Cancelar, botão.”\nCom slot: “Total: R$ 1.000,00. Fazer pagamento, botão.”",
    "navegacaoPorTeclado": "Tab: ações. Enter/Espaço: executa.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Drawer",
    "rotulo": "Heading da Nav Bar.",
    "estados": "Aberto e Fechado.",
    "verbalizacaoEsperada": "Aberto: “{heading}. Janela lateral aberta.”\nFechado: “Janela lateral fechada.”",
    "navegacaoPorTeclado": "Tab/Shift+Tab: elementos internos. Esc: fecha quando dispensável. Enter/Espaço: ativa.",
    "focoAtributosObservacoes": "Ordem: Heading, Fechar, slot, Fixed Bar.",
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Containers",
    "componente": "Card Review",
    "rotulo": "Heading e Description; também rótulos dos controles.",
    "estados": "Default, Ativo e Enviado.",
    "verbalizacaoEsperada": "“4 estrelas, boa, selecionado. Enviar avaliação, botão.”",
    "navegacaoPorTeclado": "Foco percorre controles de avaliação, comentário e botões.",
    "focoAtributosObservacoes": "A documentação informa que as estrelas não possuem rótulos descritivos.",
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Feedback",
    "componente": "Alert",
    "rotulo": "Heading e Description; botão fechar exige rótulo acessível.",
    "estados": "Ativo e Encerrado.",
    "verbalizacaoEsperada": "“Atualize a sua senha. Sua senha irá expirar em 5 dias. Saiba mais, link externo. Botão fechar, botão.”",
    "navegacaoPorTeclado": "Foco percorre links e botão de fechamento.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Feedback",
    "componente": "Flag",
    "rotulo": "Heading e Description.",
    "estados": "Estrutural; links internos herdam estados próprios.",
    "verbalizacaoEsperada": "“Pendente de autorização. Para concluir a operação, um gestor precisa autorizar. Saiba mais, link externo.”",
    "navegacaoPorTeclado": "Apenas elementos interativos internos recebem foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Feedback",
    "componente": "Flag Cooperado",
    "rotulo": "Heading e Description.",
    "estados": "Estrutural e não interativo; links internos herdam estados.",
    "verbalizacaoEsperada": "“Campos Gerais. Esta transação fortalece a sua comunidade local. Saiba mais, link externo.”",
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
    "verbalizacaoEsperada": "“Arquivo salvo com sucesso. Fechar mensagem, botão.”",
    "navegacaoPorTeclado": "Recebe foco. ",
    "focoAtributosObservacoes": "Ícones decorativos podem ser ignorados.",
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Feedback",
    "componente": "Tooltip",
    "rotulo": "o conteúdo do Tooltip funciona como descrição complementar do elemento de origem.",
    "estados": "Inativo: Tooltip não visível.\n\nAtivo: Tooltip visível por hover ou foco.",
    "verbalizacaoEsperada": "o leitor de tela associa o Tooltip ao elemento de origem. O conteúdo é verbalizado como descrição adicional quando o elemento recebe foco.\n\nExemplo: \"Ícone de informação, ícone, Valor máximo disponível para uso, somando seu saldo e os limites da conta, como cheque especial.\"\n",
    "navegacaoPorTeclado": "move o foco para o elemento associado ao Tooltip.",
    "focoAtributosObservacoes": "exibe o Tooltip automaticamente.O Tooltip não entra na ordem de tabulação e não deve ser focável.",
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Checkbox",
    "rotulo": "Rótulo visível; em composições, pode herdar o rótulo do item.",
    "estados": "Marcado, Desmarcado, Parcialmente marcado, Desabilitado.",
    "verbalizacaoEsperada": "“{rótulo}, caixa de seleção marcada/desmarcada/parcialmente marcada/desabilitada.”",
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
    "verbalizacaoEsperada": "a verbalização se concentra na leitura do rótulo. Exemplo: \"Últimos 30 dias\".",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Chip Select",
    "rotulo": "Label descreve a opção disponível.",
    "estados": "Habilitado, Focus, Hover.",
    "verbalizacaoEsperada": "Somente label: “Últimos 30 dias”.\nCom ícone: “Imagem cartão. Cartão de crédito.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Date Picker",
    "rotulo": "Herdado do Input Date.",
    "estados": "Calendário aberto; estados dos dias.",
    "verbalizacaoEsperada": "“Terça-feira, 15 de junho de 2026, hoje.”\n“16 de junho de 2026, selecionado.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": "Sim"
  },
  {
    "categoria": "Inputs",
    "componente": "Dropdown",
    "rotulo": "Label e descrição opcional.",
    "estados": "Habilitado, Focus, Open, Error, Disabled.",
    "verbalizacaoEsperada": "“{rótulo}. {texto de suporte}. Lista suspensa.”\nOpen: “Lista expandida. Opção: Marketing.”\nError: “Erro: seleção obrigatória.”\nDisabled: “Indisponível.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Code",
    "rotulo": "cada caixa deve conter uma identificação clara que indique sua posição na sequência, garantindo que a leitura descreva corretamente o que está sendo preenchido.",
    "estados": "enabled, focus, hover, filled.",
    "verbalizacaoEsperada": "a leitura indica que é uma digitação de código, o conteúdo, quando já estiver preenchido e a posição dentro da sequência. Exemplos:\n\nAo focar um input vazio: “Digite o código, campo 1 de 4.”\n\nAo focar um input já preenchido: “2. Código 1 de 4.”\n",
    "navegacaoPorTeclado": "Tab: move o foco para a próxima caixa.\n\nShift + Tab: retorna para a caixa anterior.\n\nDigitação de um dígito: avança automaticamente para o próximo campo.\n\nBackspace: apaga o conteúdo da caixa e retorna para a caixa anterior, se houver.",
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Code Number",
    "rotulo": "o componente não tem um rótulo diretamente em sua estrutura, mas deve ter orientação em tela para descrever a a finalidade de preenchimento;",
    "estados": "habilitado, focus, hover e preenchido;",
    "verbalizacaoEsperada": "Habilitado: O leitor de tela anuncia o label do componente seguido do tipo de elemento.\nExemplo: “Código de acesso, campo de entrada”.\n\nPreenchido: Cada dígito mascarado é lido como “preenchido”, sem expor o valor.\nExemplo: “Dígito 1, preenchido”.\n\nFocus: Quando um campo recebe foco, o leitor de tela anuncia sua posição na sequência.\nExemplo: “Campo 2 de 6, digite o próximo dígito.”",
    "navegacaoPorTeclado": "Tab: move o foco para o componente como um todo (wrapper).\n\nEnter ou Barra de espaço: ativa botões do teclado numérico virtual ou o botão Limpar.\n\nO componente é projetado para uso primário via teclado virtual, mas respeita padrões de navegação do navegador.",
    "focoAtributosObservacoes": "O foco não permanece nas caixas de Input Code, pois elas não são interativas.\n\nO foco percorre apenas as caixas do teclado numérico e o botão Limpar. Cada um desses botões recebe foco individualmente.",
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Date",
    "rotulo": "o label identifica claramente o campo e o tipo de data esperada. O texto de suporte também serve como rótulo de orientação.",
    "estados": "Padrão: campo vazio e pronto para entrada.\n\nAberto: exibe o calendário de seleção de data.\n\nFoco: realce visual e leitura de rótulo pelo leitor de tela.\n\nPreenchido: exibe a data inserida ou selecionada.\n\nErro: campo marcado com mensagem de erro associada exibida no texto de suporte.\n\nDesativado: campo inativ e com interação bloqueada",
    "verbalizacaoEsperada": "a leitura segue a ordem do conteúdo conforme a renderização, junto da indicação do tipo de componente.\n\nExemplo: “Data de vencimento, campo de data. Nenhuma data selecionada. Pressione Enter para abrir o calendário.\"",
    "navegacaoPorTeclado": "Tab: move o foco para o campo.\n\nEnter / Space: abre ou fecha o calendário.\n\nSetas: navegam entre os dias do calendário.\n\nEnter: seleciona a data focada.\n\nEsc: fecha o calendário sem alterar a seleção.\n\nNo modo Range, a navegação seleciona data inicial e final em sequência.\n\nO componente respeita a ordem do tabindex configurado; caso não exista, segue a ordem padrão do navegador.",
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Password",
    "rotulo": "Label e texto de apoio.",
    "estados": "Habilitado, Focus, Filled, Error, Disabled.",
    "verbalizacaoEsperada": "“{rótulo}, campo de senha.”\nErro: “Erro: {mensagem}.”\nControle: “Mostrar senha, botão.” ou “Ocultar senha, botão.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Select",
    "rotulo": "Identifica o propósito do campo.",
    "estados": "Default, Filled, Hover, Active, Error, Disabled.",
    "verbalizacaoEsperada": "“{rótulo}. {texto de suporte}. Lista suspensa.”\nOpen: “Lista expandida. Opção: Marketing.”\nError: “Erro: seleção obrigatória.”\nDisabled: “Indisponível.”",
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
    "verbalizacaoEsperada": "“Nome completo, campo de texto.”\nFilled: “preenchido”.\nError: “Erro: formato inválido.”\nDisabled: “Desabilitado.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Input Text Area",
    "rotulo": "Label obrigatório.",
    "estados": "Default, Hover, Focus, Filled, Disabled, Error, Read-only.",
    "verbalizacaoEsperada": "Default: “{rótulo}, {texto de suporte}, campo de texto.”\nError: “Campo obrigatório.”\nDisabled: “Desabilitado.”",
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
    "verbalizacaoEsperada": "“Notificações por e-mail, caixa de seleção marcada.”\n“Conta pessoal, botão de opção selecionado.”\n“Receber alertas, alternar ativado.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Popover",
    "rotulo": "Não possui.",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Leitor lê apenas elementos internos; Popover não é anunciado.",
    "navegacaoPorTeclado": "Foco pertence aos elementos internos.",
    "focoAtributosObservacoes": null,
    "tipo": "Grupo",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Popover Menu",
    "rotulo": "Não possui.",
    "estados": "Padrão.",
    "verbalizacaoEsperada": "Leitor lê apenas elementos internos; Popover não é anunciado.",
    "navegacaoPorTeclado": "Foco pertence aos elementos internos.",
    "focoAtributosObservacoes": null,
    "tipo": "Grupo",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Radio Button",
    "rotulo": "Rótulo claro e visível da opção.",
    "estados": "Selecionado, Não selecionado, Desabilitado.",
    "verbalizacaoEsperada": "“{rótulo}, botão de opção selecionado/não selecionado/desabilitado.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Botão",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Rate Input",
    "rotulo": "Atributo de acessibilidade.",
    "estados": "Default, Selecionado, Desabilitado.",
    "verbalizacaoEsperada": "“Avaliação do atendimento, 1 de 5 estrelas. Nenhuma avaliação selecionada.”\n“4 de 5 estrelas. Selecionado.”\n“Avaliação do atendimento. Indisponível.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Botão",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Search",
    "rotulo": "o placeholder e o preenchimento do campo servem como rótulo para entendimento do componente.",
    "estados": "Habilitado/Focus, Hover, Filled;",
    "verbalizacaoEsperada": "como o leitor de tela deve anunciar o componente.\n\nFocus e vazio: “{placeholder}, campo de pesquisa.” Exemplo: \"Busque aqui, campo de pesquisa.\"\n\nFilled: “{conteúdo preenchido}, campo de pesquisa.” Exemplo: \"Sicredi, campo de pesquisa.\"",
    "navegacaoPorTeclado": "Tab: move o foco para o campo e para o botão de limpar.\n\nShift + Tab: retorna o foco ao elemento anterior.\n\nEnter: confirma a entrada e dispara a pesquisa.\n\nSetas: movem o cursor dentro do texto digitado.\n\nO componente segue a ordem natural de navegação da página, garantindo previsibilidade e consistência.",
    "focoAtributosObservacoes": null,
    "tipo": "Entrada",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Switch",
    "rotulo": "Rótulo claro; em composições, pode herdar o rótulo do item.",
    "estados": "Ligado, Desligado, Desabilitado; Default, Selected, Hover, Focus.",
    "verbalizacaoEsperada": "“{rótulo}, switch ligado/desligado/desabilitado.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": "Botão",
    "foco": null
  },
  {
    "categoria": "Inputs",
    "componente": "Uploader",
    "rotulo": "o label e o texto de suporte do campo identificam claramente o propósito do componente.",
    "estados": "Default: campo está habilitado e aguardando o envio do arquivo.\n\nActive: campo recebeu o foco e está com destaque visual.\n\nLoading: upload em andamento.\n\nCompleted: upload finalizado.\n\nError: falha no envio ou validação.",
    "verbalizacaoEsperada": "o leitor de tela anuncia o rótulo do campo, as instruções e o estado atual do upload, quando houver.\n\n“Enviar arquivo, uploader. Formatos aceitos: PDF, JPG. Tamanho máximo: 10 megabytes. Nenhum arquivo selecionado. Pressione Enter para escolher um arquivo ou arraste e solte.”",
    "navegacaoPorTeclado": "Tab: move o foco para a área de upload e para ações de remover/substituir.\n\nEnter / Space: abre o explorador de arquivos.\n\nEsc: cancela a interação quando aplicável.\n\nA lista de arquivos segue ordem lógica de tabulação.\n\nO componente respeita a ordem do tabindex configurado; caso não exista, segue a ordem padrão do navegador.",
    "focoAtributosObservacoes": null,
    "tipo": "Botão",
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Avatar Business",
    "rotulo": "Nome da empresa em texto próximo ou aria-label.",
    "estados": "Estático.",
    "verbalizacaoEsperada": "“Sicredi, empresa.”\nCom badge: “Sicredi, há novas notificações.”",
    "navegacaoPorTeclado": "Não recebe foco quando informativo.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Avatar Name",
    "rotulo": "Nome da pessoa em texto próximo ou descrição acessível.",
    "estados": "Estático.",
    "verbalizacaoEsperada": "“João Pereira, perfil.”\nCom badge: “João Pereira, há novas notificações.”",
    "navegacaoPorTeclado": "Não recebe foco quando informativo.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Breadcrumb",
    "rotulo": "Cada item representa um nível; último item é a página atual.",
    "estados": "Links habilitados; página atual.",
    "verbalizacaoEsperada": "“Início, Produtos. Página atual: Detalhes.”",
    "navegacaoPorTeclado": "Tab: links. Enter: redireciona.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Carousel Nav",
    "rotulo": "Botões devem possuir rótulos acessíveis.",
    "estados": "Herda de Page Indicator e Button Icon.",
    "verbalizacaoEsperada": "“Carrossel. 3 itens. Item 1 de 3. Próximo item, botão.”",
    "navegacaoPorTeclado": "Foco percorre botões de navegação.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Header Product",
    "rotulo": "Título principal.",
    "estados": "Estrutural; elementos internos possuem estados próprios.",
    "verbalizacaoEsperada": "“Configuração de conta. Guia selecionada: Dados pessoais.”\n“Transferência de Pix. Etapa 1 de 4. Selecionar favorecido.”",
    "navegacaoPorTeclado": "Header não recebe foco; controles internos entram na tabulação.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "List Navigation",
    "rotulo": "Label principal; Description e Tag Container podem ser rótulos secundários.",
    "estados": "Default e Pressed.",
    "verbalizacaoEsperada": "“Atendimento online, item de navegação.”\nCom tag: “Atendimento online, novo. Item de navegação.”\nCom descrição: “Atendimento online. Fale com a gente pelo chat. Item de navegação.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Page Indicator",
    "rotulo": "Não possui rótulo interativo próprio.",
    "estados": "Informativo e não interativo.",
    "verbalizacaoEsperada": "Não deve ser anunciado isoladamente; contexto informa posição atual.",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Navigation",
    "componente": "Tab",
    "rotulo": "Label de cada aba.",
    "estados": "Selecionada e Não selecionada.",
    "verbalizacaoEsperada": "“Abas de conteúdo, 3 abas. Visão geral, aba selecionada. Movimentações, aba não selecionada. Comprovantes, aba não selecionada. Conteúdo da aba Visão geral exibido.”",
    "navegacaoPorTeclado": null,
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Badge",
    "rotulo": "Não possui texto próprio.",
    "estados": "Sem estados próprios.",
    "verbalizacaoEsperada": "“Notificações, há novas notificações.”",
    "navegacaoPorTeclado": "Não recebe foco isoladamente.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Loading",
    "rotulo": "Atributo de acessibilidade.",
    "estados": "Único.",
    "verbalizacaoEsperada": "“Carregando conteúdo”.",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Progress Line",
    "rotulo": "Não possui rótulo próprio; identificação vem de título, subtítulo ou descrição.",
    "estados": "Informativo e não interativo.",
    "verbalizacaoEsperada": "“Etapa 2 de 4, Dados do pagamento.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Skeleton",
    "rotulo": "Não possui.",
    "estados": "Único.",
    "verbalizacaoEsperada": "“O conteúdo está sendo carregado.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Tag Container",
    "rotulo": "Texto do Label.",
    "estados": "Estático.",
    "verbalizacaoEsperada": "“Status: Em análise.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  },
  {
    "categoria": "Status",
    "componente": "Tag Icon",
    "rotulo": "Label descreve categoria, status ou tipo de informação.",
    "estados": "Estático e não interativo.",
    "verbalizacaoEsperada": "Ícone informativo: “Atrasado, ícone de atenção.”\nÍcone decorativo: “Aprovado.”",
    "navegacaoPorTeclado": "Não recebe foco.",
    "focoAtributosObservacoes": null,
    "tipo": null,
    "foco": null
  }
];
