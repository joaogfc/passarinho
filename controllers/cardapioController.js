const { obterCardapio } = require('../services/cardapioService');
const cron = require('node-cron');
const { obterTodosComPreferenciaDeCardapio } = require('../repositories/usuarioRepository');
const { carregarArquivo } = require('../utils/arquivos');

/**
 * Agenda envios de cardápio conforme preferências de cada usuário.
 * Deve ser chamado em bot/index.js após conexão e carregamento de cadastro.
 * @param {import('@whiskeysockets/baileys').Socket} sock
 */
function agendarEnvios(sock) {
  // Almoço: todo dia às 10:00
  cron.schedule('00 10 * * *', () => enviar(sock, 'Almoço'));
  // Jantar: todo dia às 16:30
  cron.schedule('30 16 * * *', () => enviar(sock, 'Jantar'));
}

/**
 * Envia cardápio para todos os usuários que têm preferência pelo tipo informado.
 * @param {import('@whiskeysockets/baileys').Socket} sock
 * @param {string} tipo - "Almoço" ou "Jantar"
 */
async function enviar(sock, tipo) {
  // Sempre recarrega o cadastro do disco para garantir dados atualizados
  const cadastro = carregarArquivo('./cadastro.json');
  const date = new Date().toISOString().slice(0, 10);
  console.log(`[DEBUG] Iniciando envio de cardápio para tipo: ${tipo}, data: ${date}`);
  const prefs = await obterTodosComPreferenciaDeCardapio(tipo);
  console.log(`[DEBUG] Usuários encontrados para envio:`, prefs);
  const ruMap = {
    'RU Setorial I': '6',
    'RU Setorial II': '1',
    'RU Saúde e Direito': '2',
    'RU ICA': '5',
  };
  // Monta todas as consultas válidas
  const consultas = prefs
    .filter(({ ru }) => !(tipo === 'Jantar' && (ru === 'RU Setorial II' || ru === '1')))
    .map(({ jid, ru }) => ({ jid, ru, ruId: ruMap[ru] || ru }));
  // Executa todas as consultas em paralelo
  const resultados = await Promise.all(consultas.map(async ({ jid, ru, ruId }) => {
    try {
      console.log(`[DEBUG] Buscando cardápio para RU: ${ru} (id: ${ruId}), usuário: ${jid}`);
      const texto = await obterCardapio(ruId, date, tipo);
      return { jid, texto };
    } catch (e) {
      console.log(`Erro ao obter/enviar cardápio (${tipo}) para ${jid}:`, e.message);
      return { jid, texto: `❌ Não foi possível obter o cardápio de hoje para ${ru} (${tipo}).` };
    }
  }));
  // Envia cada resultado em uma mensagem separada
  for (const { jid, texto } of resultados) {
    await sock.sendMessage(jid, { text: texto });
    console.log(`[DEBUG] Mensagem enviada para ${jid}`);
  }
}

module.exports = { agendarEnvios, enviar };
