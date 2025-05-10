const log = require('../utils/loggers');
const { obterCardapio } = require('../services/cardapioService');
const cron = require('node-cron');
const { obterTodosComPreferenciaDeCardapio } = require('../repositories/usuarioRepository');
const { carregarArquivo } = require('../utils/arquivos');

// Horários de envio configuráveis
const HORARIOS = {
  almoco: '37 04 * * *', // 10:00
  jantar: '39 04 * * *' // 16:30
};

/**
 * Agenda envios de cardápio conforme preferências de cada usuário.
 * Deve ser chamado em bot/index.js após conexão e carregamento de cadastro.
 * @param {import('@whiskeysockets/baileys').Socket} sock
 */
function agendarEnvios(sock) {
  try {
    cron.schedule(HORARIOS.almoco, () => enviar(sock, 'Almoço').catch(e => log.erro('Erro no envio automático de Almoço: ' + e.message)));
    cron.schedule(HORARIOS.jantar, () => enviar(sock, 'Jantar').catch(e => log.erro('Erro no envio automático de Jantar: ' + e.message)));
    log.info('Agendamento de envios de cardápio configurado.');
  } catch (e) {
    log.erro('Erro ao agendar envios de cardápio: ' + e.message);
  }
}

/**
 * Envia cardápio para todos os usuários que têm preferência pelo tipo informado.
 * @param {import('@whiskeysockets/baileys').Socket} sock
 * @param {string} tipo - "Almoço" ou "Jantar"
 */
async function enviar(sock, tipo) {
  // Sempre recarrega o cadastro do disco para garantir dados atualizados
  const cadastro = carregarArquivo('./data/cadastro.json');
  const date = new Date().toISOString().slice(0, 10);
  log.info(`[CARDAPIO] Iniciando envio de cardápio para tipo: ${tipo}, data: ${date}`);
  const prefs = await obterTodosComPreferenciaDeCardapio(tipo);
  if (!Array.isArray(prefs) || prefs.length === 0) {
    log.info(`[CARDAPIO] Nenhum usuário com preferência para ${tipo}.`);
    return;
  }
  log.info(`[CARDAPIO] Usuários encontrados para envio: ${JSON.stringify(prefs)}`);
  const ruMap = {
    'RU Setorial I': '6',
    'RU Setorial II': '1',
    'RU Saúde e Direito': '2',
    'RU ICA': '5',
  };

  function podeEnviarJantar(ru, tipo) {
    return !(tipo === 'Jantar' && (ru === 'RU Setorial II' || ru === '1'));
  }

  // Monta todas as consultas válidas
  const consultas = prefs
    .filter(({ ru }) => podeEnviarJantar(ru, tipo))
    .map(({ jid, ru }) => ({ jid, ru, ruId: ruMap[ru] || ru }));
  // Executa todas as consultas em paralelo
  const resultados = await Promise.all(consultas.map(async ({ jid, ru, ruId }) => {
    try {
      log.info(`[CARDAPIO] Buscando cardápio para RU: ${ru} (id: ${ruId}), usuário: ${jid}`);
      const texto = await obterCardapio(ruId, date, tipo);
      return { jid, texto };
    } catch (e) {
      log.erro(`[CARDAPIO] Erro ao obter/enviar cardápio (${tipo}) para ${jid}: ${e.message}`);
      return { jid, texto: `❌ Não foi possível obter o cardápio de hoje para ${ru} (${tipo}).` };
    }
  }));
  // Envia todas as mensagens em paralelo
  await Promise.all(resultados.map(async ({ jid, texto }) => {
    try {
      await sock.sendMessage(jid, { text: texto });
      log.info(`[CARDAPIO] Mensagem enviada para ${jid}`);
    } catch (e) {
      log.erro(`[CARDAPIO] Falha ao enviar mensagem para ${jid}: ${e.message}`);
    }
  }));
}

module.exports = { agendarEnvios, enviar };
