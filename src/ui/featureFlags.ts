/**
 * Chaves para ligar/desligar partes da interface sem apagar código.
 *
 * SHOW_DOCX_DOWNLOAD — botões "Baixar histórico (.docx)" (tela inicial
 * e tela de sucesso). Desligado durante o piloto controlado, a pedido
 * do usuário. Toda a geração do .docx e o histórico de uso continuam
 * funcionando no código; para mostrar os botões de novo, troque para
 * `true` e rode o build.
 */
export const SHOW_DOCX_DOWNLOAD = false;
