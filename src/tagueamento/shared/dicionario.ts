/**
 * Dicionário de termos em inglês do TAGUEAMENTO (spec 6.2, passo 9).
 * Aprovado pelo Mau em 03/10/2026. Dados puros: para atualizar, edite só
 * este arquivo.
 *
 * Onde vale: SÓ nos textos que o plugin pega da tela (label do componente,
 * título do modal, nome do frame) e nos textos que o PD digita ("Outro" do
 * setup e, na Fase 6, os campos da revisão). Tudo o que vem do Excel de
 * regions já foi validado e NÃO passa pelo dicionário (decisão do Mau).
 *
 *  - TRADUCOES: o termo é trocado pelo português (aceita expressões).
 *  - MANTER: nunca é trocado nem sinalizado (inglês usado de propósito).
 *  - SINALIZAR: não é trocado; vira pendência na revisão para o PD decidir.
 *
 * A comparação ignora maiúsculas/minúsculas e acentos, e só casa palavras
 * inteiras ("Add" não casa dentro de "Address").
 */

export const TRADUCOES: [string, string][] = [
  ["Search", "Buscar"], // spec 4.2
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

export const MANTER: string[] = ["Click", "Screen", "Modal", "Login", "Pix", "Token", "App", "Web", "N/A"];

/** Começa vazia; termos são acrescentados conforme aparecerem nos testes. */
export const SINALIZAR: string[] = [];
