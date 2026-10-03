#!/usr/bin/env node
/**
 * Gera a lista de regions/subregions do TAGUEAMENTO a partir do Excel.
 *
 * Roda sozinho no `npm run build` (e no `npm run typecheck`). Não precisa
 * ser chamado à mão — mas pode: `npm run build:regions`.
 *
 * Qual arquivo é lido:
 *   1. src/tagueamento/data/regions.xlsx           ← planilha REAL (fica só na máquina; está no .gitignore)
 *   2. src/tagueamento/data/regions.template.xlsx  ← template de exemplo (vai para o GitHub)
 *
 * O que é lido: aba "Regions e Subregions", colunas Canal, Produto,
 * Tarefa do usuário, Region e Subregion (achadas pelo nome do cabeçalho;
 * outras colunas são ignoradas).
 *
 * O que é gerado: src/tagueamento/data/regions.generated.json — lista
 * compacta embutida no plugin. O Excel NÃO vai para dentro do plugin.
 *
 * Validação (qualidade dos dados):
 *   ERRO  (o build para): aba ou coluna faltando; célula obrigatória vazia;
 *         Subregion vazia (use N/A); Canal sem plataforma em canais.json;
 *         mesmo Produto com duas Regions diferentes no mesmo Canal; mesma
 *         Tarefa com duas Subregions diferentes no mesmo Produto.
 *   AVISO (o build segue, o valor é usado como está na planilha): Region ou
 *         Subregion fora do padrão de nomenclatura; espaços extras; linhas
 *         repetidas (usadas uma vez só); valor com mais de 100 caracteres.
 */

import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "src", "tagueamento", "data");
const REAL_FILE = join(DATA_DIR, "regions.xlsx");
const TEMPLATE_FILE = join(DATA_DIR, "regions.template.xlsx");
const CANAIS_FILE = join(DATA_DIR, "canais.json");
const OUTPUT_FILE = join(DATA_DIR, "regions.generated.json");

const SHEET_NAME = "Regions e Subregions";
const COLUMNS = {
  canal: "Canal",
  produto: "Produto",
  tarefa: "Tarefa do usuário",
  region: "Region",
  subregion: "Subregion"
};
const MAX_LENGTH = 100;
const REGION_PATTERN = /^[A-Z]+(_[A-Z]+)*$/;
const SUBREGION_PATTERN = /^[A-Z][a-z]*(_[a-z]+)*$/;

const errors = [];
const warnings = [];

function headerKey(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Tira espaços nas pontas e espaços duplos/não separáveis; avisa quando mexeu. */
function clean(value, rowNumber, columnLabel) {
  const raw = value === undefined || value === null ? "" : String(value);
  const cleaned = raw.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  if (cleaned !== raw && raw.trim() !== "") {
    warnings.push(`Linha ${rowNumber}, ${columnLabel}: espaços extras removidos ("${raw}").`);
  }
  return cleaned;
}

function fail() {
  console.error("\n✖ Lista de regions NÃO foi gerada. Corrija a planilha e rode o build de novo:\n");
  for (const error of errors) console.error(`  ERRO  ${error}`);
  if (warnings.length > 0) {
    console.error("");
    for (const warning of warnings) console.error(`  aviso ${warning}`);
  }
  console.error("");
  process.exit(1);
}

// ---------- Arquivos ----------

const usingRealFile = existsSync(REAL_FILE);
const sourceFile = usingRealFile ? REAL_FILE : TEMPLATE_FILE;
if (!existsSync(sourceFile)) {
  errors.push(`Nenhum Excel encontrado. Esperado: ${relative(ROOT, REAL_FILE)} (ou o template ${relative(ROOT, TEMPLATE_FILE)}).`);
  fail();
}

let platformByCanal;
try {
  platformByCanal = JSON.parse(readFileSync(CANAIS_FILE, "utf8")).canais ?? {};
} catch (error) {
  errors.push(`Não foi possível ler ${relative(ROOT, CANAIS_FILE)}: ${error.message}`);
  fail();
}

const workbook = XLSX.readFile(sourceFile);
const sheet = workbook.Sheets[SHEET_NAME];
if (!sheet) {
  errors.push(`A aba "${SHEET_NAME}" não existe no Excel. Abas encontradas: ${workbook.SheetNames.join(", ")}.`);
  fail();
}

const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: true });

// ---------- Cabeçalho ----------

let headerRowIndex = -1;
const columnIndex = {};
for (let r = 0; r < Math.min(grid.length, 20) && headerRowIndex < 0; r++) {
  const keys = grid[r].map(headerKey);
  const found = {};
  for (const [field, label] of Object.entries(COLUMNS)) {
    const index = keys.indexOf(headerKey(label));
    if (index >= 0) found[field] = index;
  }
  if (Object.keys(found).length === Object.keys(COLUMNS).length) {
    headerRowIndex = r;
    Object.assign(columnIndex, found);
  }
}
if (headerRowIndex < 0) {
  errors.push(
    `Não achei o cabeçalho com as colunas ${Object.values(COLUMNS).map((c) => `"${c}"`).join(", ")} nas primeiras 20 linhas da aba "${SHEET_NAME}".`
  );
  fail();
}

// ---------- Linhas ----------

const rows = [];
const seenRows = new Set();
for (let r = headerRowIndex + 1; r < grid.length; r++) {
  const rowNumber = r + 1; // número da linha como aparece no Excel
  const cells = grid[r];
  const values = {};
  for (const [field, label] of Object.entries(COLUMNS)) {
    values[field] = clean(cells[columnIndex[field]], rowNumber, label);
  }
  if (Object.values(values).every((value) => value === "")) continue; // linha em branco

  for (const field of ["canal", "produto", "tarefa", "region"]) {
    if (!values[field]) errors.push(`Linha ${rowNumber}: a coluna "${COLUMNS[field]}" está vazia.`);
  }
  if (!values.subregion) {
    errors.push(`Linha ${rowNumber}: a coluna "Subregion" está vazia (quando não houver, use N/A).`);
  } else if (values.subregion.toUpperCase() === "N/A") {
    values.subregion = "N/A";
  }

  if (values.region && !REGION_PATTERN.test(values.region)) {
    warnings.push(`Linha ${rowNumber}: Region "${values.region}" fora do padrão (MAIUSCULO_COM_UNDERSCORE, sem números). Usada como está.`);
  }
  if (values.subregion && values.subregion !== "N/A" && !SUBREGION_PATTERN.test(values.subregion)) {
    warnings.push(`Linha ${rowNumber}: Subregion "${values.subregion}" fora do padrão (Primeira_letra_maiuscula, sem números). Usada como está.`);
  }
  for (const [field, value] of Object.entries(values)) {
    if (value.length > MAX_LENGTH) warnings.push(`Linha ${rowNumber}: "${COLUMNS[field]}" tem mais de ${MAX_LENGTH} caracteres.`);
  }

  const signature = [values.canal, values.produto, values.tarefa, values.region, values.subregion].join("\u0001");
  if (seenRows.has(signature)) {
    warnings.push(`Linha ${rowNumber}: repete uma linha anterior — usada uma vez só.`);
    continue;
  }
  seenRows.add(signature);
  rows.push({ ...values, rowNumber });
}

if (rows.length === 0 && errors.length === 0) {
  errors.push(`A aba "${SHEET_NAME}" não tem nenhuma linha de dados abaixo do cabeçalho.`);
}

// ---------- Canais e consistência ----------

const canalsMissingPlatform = new Set();
for (const row of rows) {
  const platform = platformByCanal[row.canal];
  if (!row.canal) continue;
  if (platform === undefined) canalsMissingPlatform.add(row.canal);
  else if (platform !== "APP" && platform !== "WEB") {
    errors.push(`canais.json: o canal "${row.canal}" tem plataforma "${platform}" (use APP ou WEB).`);
  }
}
for (const canal of canalsMissingPlatform) {
  errors.push(`O canal "${canal}" não tem plataforma em src/tagueamento/data/canais.json (adicione "${canal}": "APP" ou "WEB").`);
}

const regionByProduto = new Map();
const subregionByTarefa = new Map();
for (const row of rows) {
  const produtoKey = `${row.canal}\u0001${row.produto}`;
  const previousRegion = regionByProduto.get(produtoKey);
  if (previousRegion && previousRegion.region !== row.region) {
    errors.push(
      `Linha ${row.rowNumber}: o produto "${row.produto}" (canal "${row.canal}") tem Region "${row.region}", mas na linha ${previousRegion.rowNumber} tem "${previousRegion.region}".`
    );
  } else if (!previousRegion) {
    regionByProduto.set(produtoKey, row);
  }

  const tarefaKey = `${produtoKey}\u0001${row.tarefa}`;
  const previousTarefa = subregionByTarefa.get(tarefaKey);
  if (previousTarefa && previousTarefa.subregion !== row.subregion) {
    errors.push(
      `Linha ${row.rowNumber}: a tarefa "${row.tarefa}" (produto "${row.produto}") tem Subregion "${row.subregion}", mas na linha ${previousTarefa.rowNumber} tem "${previousTarefa.subregion}".`
    );
  } else if (!previousTarefa) {
    subregionByTarefa.set(tarefaKey, row);
  }
}

if (errors.length > 0) fail();

// ---------- Saída compacta ----------

const byName = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
const canais = new Map();
for (const row of rows) {
  if (!canais.has(row.canal)) {
    canais.set(row.canal, { nome: row.canal, plataforma: platformByCanal[row.canal], produtos: new Map() });
  }
  const canal = canais.get(row.canal);
  if (!canal.produtos.has(row.produto)) {
    canal.produtos.set(row.produto, { nome: row.produto, region: row.region, fluxos: new Map() });
  }
  const produto = canal.produtos.get(row.produto);
  if (!produto.fluxos.has(row.tarefa)) {
    produto.fluxos.set(row.tarefa, { nome: row.tarefa, subregion: row.subregion });
  }
}

const output = {
  fonte: usingRealFile ? "planilha" : "template",
  arquivo: relative(DATA_DIR, sourceFile),
  geradoEm: new Date().toISOString(),
  totalLinhas: rows.length,
  canais: [...canais.values()]
    .map((canal) => ({
      nome: canal.nome,
      plataforma: canal.plataforma,
      produtos: [...canal.produtos.values()]
        .map((produto) => ({
          nome: produto.nome,
          region: produto.region,
          fluxos: [...produto.fluxos.values()].sort(byName)
        }))
        .sort(byName)
    }))
    .sort(byName)
};

writeFileSync(OUTPUT_FILE, JSON.stringify(output) + "\n", "utf8");

const produtoCount = output.canais.reduce((sum, canal) => sum + canal.produtos.length, 0);
console.log(
  `✔ Regions geradas a partir de ${relative(ROOT, sourceFile)}${usingRealFile ? "" : " (TEMPLATE de exemplo)"}: ` +
    `${rows.length} linhas, ${output.canais.length} canais, ${produtoCount} produtos.`
);
if (warnings.length > 0) {
  console.log(`\n  ${warnings.length} aviso(s) — o build seguiu, mas vale revisar a planilha:`);
  for (const warning of warnings) console.log(`  aviso ${warning}`);
  console.log("");
}
