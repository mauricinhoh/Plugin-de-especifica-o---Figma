/**
 * Resolução de placeholders dentro dos templates de "Verbalização
 * esperada". A planilha real (Extração de Acessibilidade — Core Web,
 * 70 componentes) usa TRÊS estilos de delimitador, sem um padrão
 * único entre os componentes:
 *
 *   - Parênteses: "(Rótulo)"            — vinha do briefing original
 *   - Colchetes:  "[Verbo do botão]", "[título]"
 *   - Chaves:     "{rótulo}", "{placeholder}", "{conteúdo preenchido}"
 *
 * Em vez de manter mecanismos separados por delimitador (o que
 * confundiria quem for dar manutenção depois), este arquivo resolve
 * os três com a MESMA lógica: extrai o texto entre qualquer um dos
 * três pares de delimitador, normaliza o nome e procura um resolver
 * cadastrado.
 *
 * Cada placeholder conhecido é resolvido a partir dos dados já
 * extraídos do Figma pela regra (`extractedData`). Placeholders que
 * dependem do designer, ou cujo dado a extração atual do plugin não
 * consegue obter com segurança (ex.: "[verbo do botão]", "{placeholder}",
 * "{mensagem}"), NÃO têm resolver cadastrado — permanecem literalmente
 * no texto, como template para edição manual.
 *
 * IMPORTANTE: nenhum conteúdo de verbalização é inventado aqui. Esta
 * é só a MECÂNICA de substituição; o texto ao redor do placeholder (o
 * "template" em si) vem sempre da planilha/regra, nunca deste
 * arquivo.
 */

type PlaceholderResolver = (data: Record<string, string>) => string | undefined;

/**
 * Registro de placeholders conhecidos. A chave é o texto exato entre
 * delimitadores, normalizado (minúsculas, sem acento, espaços
 * únicos). Adicione novas entradas aqui quando a planilha trouxer
 * outros nomes de placeholder — sem precisar tocar no mecanismo de
 * substituição em si.
 *
 * Só existem resolvers para os placeholders que representam
 * EXATAMENTE o mesmo dado já obtido pela extração de texto existente
 * do plugin (primeiro TEXT visível e não-vazio; ver
 * src/main/analysis/textExtraction.ts, que não foi alterada por esta
 * planilha). Qualquer placeholder que represente um dado DIFERENTE
 * (ex.: texto de placeholder de um input, mensagem de erro, texto de
 * suporte) fica de propósito sem resolver — resolver "no chute" seria
 * inventar conteúdo.
 */
const PLACEHOLDER_RESOLVERS: Record<string, PlaceholderResolver> = {
  "texto do botao": (data) => data.text,
  rotulo: (data) => data.text,
  titulo: (data) => data.text
  // Deliberadamente SEM resolver (ficam como template editável):
  // "verbo do botao", "placeholder", "conteudo preenchido",
  // "texto de suporte", "heading", "mensagem".
};

function normalizePlaceholderName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Casa "(nome)", "[nome]" ou "{nome}" — qualquer um dos três pares de delimitador. */
const PLACEHOLDER_PATTERN = /\(([^()]+)\)|\[([^[\]]+)\]|\{([^{}]+)\}/g;

/**
 * Substitui, dentro de `template`, cada placeholder conhecido
 * (independente do estilo de delimitador usado) pelo valor resolvido
 * em `extractedData`. Placeholders sem resolver cadastrado, ou cujo
 * dado ainda não foi extraído, são deixados literalmente como estão
 * no texto — para o designer editar manualmente, nunca para inventar
 * conteúdo.
 */
export function resolvePlaceholders(template: string, extractedData: Record<string, string>): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, viaParens, viaBrackets, viaBraces) => {
    const rawName: string = viaParens ?? viaBrackets ?? viaBraces;
    const key = normalizePlaceholderName(rawName);
    const resolver = PLACEHOLDER_RESOLVERS[key];
    if (!resolver) {
      return match;
    }
    const value = resolver(extractedData);
    return value !== undefined ? value : match;
  });
}
