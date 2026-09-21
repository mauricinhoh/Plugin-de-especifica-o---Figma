/// <reference types="@figma/plugin-typings" />

import { UsageLogEntry } from "../../shared/types";

/**
 * Rastro de uso do plugin, gravado na PÁGINA do Figma onde ele rodou
 * (não no arquivo inteiro — confirmado com o usuário). Dois usos:
 *
 * 1. Auditoria: como o plugin é usado por qualquer designer do time,
 *    não faz sentido expor "consultar se foi usado" dentro do próprio
 *    plugin (ficaria visível pra todo mundo). Por isso este log usa
 *    `setSharedPluginData`/`getSharedPluginData` (dado "compartilhado"
 *    entre plugins, mas continua INVISÍVEL na interface nativa do
 *    Figma — nenhum painel built-in mostra isso). Uma ferramenta
 *    separada e privada (uma segunda instalação de plugin, só do
 *    responsável pela auditoria) pode ler esse mesmo namespace/chave
 *    sem precisar ser literalmente o mesmo plugin publicado — algo
 *    que NÃO seria possível com `setPluginData` (dado privado, só o
 *    próprio plugin consegue ler de volta).
 * 2. Matéria-prima do export em .docx: como o designer pode gerar o
 *    documento depois de várias execuções, o export lê TODO o
 *    histórico acumulado aqui, não só a última geração.
 *
 * LIMITE TÉCNICO CONFIRMADO: cada entrada de shared plugin data tem
 * um teto de 100 KB (namespace + chave + valor somados). Uma entrada
 * de log típica (tela + alguns componentes) fica na casa de
 * 150-400 bytes — isso cabe tranquilamente mais de 100 execuções.
 * Por segurança, `appendUsageLogEntry` descarta os registros mais
 * antigos automaticamente se algum dia chegar perto do limite, em vez
 * de lançar erro.
 */

const NAMESPACE = "handoffspec"; // precisa ter 3+ caracteres alfanuméricos
const LOG_KEY = "usageLog";
const MAX_BYTES = 90_000; // margem de segurança abaixo do teto de 100 KB

export function getUsageLog(): UsageLogEntry[] {
  const raw = figma.currentPage.getSharedPluginData(NAMESPACE, LOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Dado corrompido/formato antigo: melhor começar um log novo do
    // que quebrar a geração por causa de um histórico ilegível.
    return [];
  }
}

export function appendUsageLogEntry(entry: UsageLogEntry): UsageLogEntry[] {
  const current = getUsageLog();
  let updated = [...current, entry];

  // Se estourar o limite de 100 KB, descarta as entradas mais antigas
  // até caber — silenciosamente, já que isso é só o "rastro", não
  // deveria travar o fluxo do designer.
  while (updated.length > 1 && JSON.stringify(updated).length > MAX_BYTES) {
    updated = updated.slice(1);
  }

  figma.currentPage.setSharedPluginData(NAMESPACE, LOG_KEY, JSON.stringify(updated));
  return updated;
}
