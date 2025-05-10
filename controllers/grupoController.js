const log = require('../utils/loggers');
const grupoService = require('../services/grupoService');
const { processarFigurinha } = require('../utils/figurinha');

/**
 * Lida com mensagens recebidas em grupos e redireciona para os usuários conforme regras do serviço.
 * @param {object} sock - Instância do socket Baileys
 * @param {string} jid - ID do grupo
 * @param {object} msg - Mensagem original
 * @param {string} texto - Texto extraído da mensagem
 * @param {object} cadastro - Cadastro de usuários
 * @param {object} fontesCursos - Fontes de cursos
 * @param {object} fontesInteresses - Fontes de interesses
 */
async function tratarMensagemGrupo(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses) {
  try {
    // Suporte ao comando /figurinha em grupos, inclusive quoted
    let quotedMsg = undefined;
    if (msg && msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.quotedMessage) {
      quotedMsg = {
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        stanzaId: msg.message.extendedTextMessage.contextInfo.stanzaId,
        participant: msg.message.extendedTextMessage.contextInfo.participant
      };
    }
    const mensagemTexto = texto ? texto.toLowerCase().trim() : '';
    if (mensagemTexto === '/figurinha') {
      // Se houver quotedMsg, priorize ela
      await processarFigurinha(sock, jid, quotedMsg && quotedMsg.message ? quotedMsg : msg);
      return;
    }
    await grupoService.redirecionarMensagemParaUsuarios(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses);
  } catch (e) {
    log.erro(`Erro ao tratar mensagem de grupo (${jid}): ${e.message}`);
  }
}

module.exports = { tratarMensagemGrupo };
