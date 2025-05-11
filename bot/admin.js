// Funções e utilidades exclusivas do ADMIN

const ADMIN_ID = '553397055277@s.whatsapp.net';
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const log = require('../utils/loggers');
const mensagens = require('../utils/mensagens');

// Todas as mensagens já estão centralizadas em utils/mensagens.js e importadas como 'mensagens'.
const MENSAGENS = mensagens;

const CONTATOS_PATH = path.resolve(__dirname, '../data/contatos.json');

/**
 * Verifica se o usuário é admin
 * @param {string} userId
 * @returns {boolean}
 */
function isAdmin(userId) {
  return userId === ADMIN_ID;
}

/**
 * Função auxiliar para envio de mídia ou texto para um destinatário
 * @param {object} sock
 * @param {string} destinatario
 * @param {object} opts
 * @param {string} texto
 * @param {object} quotedMsg
 * @param {object} msg
 * @param {string} prefixoTexto
 */
async function enviarMensagemComAnexo(sock, destinatario, opts = {}, texto, quotedMsg, msg, prefixoTexto = '') {
  let tipoMensagem = msg ? Object.keys(msg.message || {})[0] : undefined;
  try {
    if (tipoMensagem && ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'].includes(tipoMensagem)) {
      const mediaMsg = msg.messageContextInfo?.quotedMessage || msg.message;
      const buffer = await downloadMediaMessage({ ...msg, message: mediaMsg }, 'buffer', {});
      let sendOpts = {};
      if (tipoMensagem === 'imageMessage') sendOpts = { image: buffer };
      else if (tipoMensagem === 'videoMessage') sendOpts = { video: buffer };
      else if (tipoMensagem === 'audioMessage') sendOpts = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
      else if (tipoMensagem === 'stickerMessage') sendOpts = { sticker: buffer };
      else if (tipoMensagem === 'documentMessage') {
        const docMsg = mediaMsg.documentMessage || msg.message.documentMessage;
        sendOpts = {
          document: buffer,
          mimetype: docMsg.mimetype || 'application/pdf',
          fileName: docMsg.fileName || 'arquivo.pdf'
        };
      }
      if (texto && (tipoMensagem === 'imageMessage' || tipoMensagem === 'videoMessage')) {
        sendOpts.caption = texto;
      }
      if (!buffer || buffer.length === 0) throw new Error('Buffer de mídia vazio');
      await sock.sendMessage(destinatario, sendOpts);
      if (texto && tipoMensagem === 'documentMessage') {
        await sock.sendMessage(destinatario, { text: `${prefixoTexto}${texto}` });
      }
      if (texto && !['imageMessage','videoMessage','documentMessage'].includes(tipoMensagem)) {
        await sock.sendMessage(destinatario, { text: `${prefixoTexto}${texto}` });
      }
    } else if (quotedMsg && quotedMsg.message) {
      await sock.sendMessage(destinatario, quotedMsg.message, { quoted: undefined });
      if (texto) {
        await sock.sendMessage(destinatario, { text: `${prefixoTexto}${texto}` });
      }
    } else if (texto) {
      await sock.sendMessage(destinatario, { text: `${prefixoTexto}${texto}` });
    }
    return true;
  } catch (e) {
    return e;
  }
}

/**
 * Envia comunicado do admin para todos os usuários cadastrados (suporta anexos)
 */
async function handleComunicado(sock, jid, cadastro, texto, quotedMsg, msg) {
  const comunicado = texto.replace(/^\/comunicado\s*/i, '').trim();
  let enviados = 0;
  for (const userId of Object.keys(cadastro)) {
    if (userId === ADMIN_ID) continue;
    const resultado = await enviarMensagemComAnexo(sock, userId, {}, comunicado, quotedMsg, msg, '');
    if (resultado === true) {
      enviados++;
    } else if (resultado instanceof Error) {
      await sock.sendMessage(jid, { text: MENSAGENS.erroEnvio(userId, resultado.message) });
      log.erro('Erro ao enviar mídia: ' + resultado);
    }
  }
  await sock.sendMessage(jid, { text: MENSAGENS.comunicadoEnviado(enviados) });
  // Não retorna nada
}

/**
 * Repassa mensagem do admin para todos os contatos em contatos.json (suporta anexos)
 */
async function handleContatar(sock, jid, texto, quotedMsg, msg) {
  const mensagem = texto.replace(/^\/contatar\s*/i, '').trim();
  let contatos;
  try {
    const data = fs.readFileSync(CONTATOS_PATH, 'utf8');
    const json = JSON.parse(data);
    contatos = Array.isArray(json.contatos) ? json.contatos : [];
  } catch (e) {
    await sock.sendMessage(jid, { text: MENSAGENS.erroContatos });
    return;
  }
  let enviados = 0;
  for (const contato of contatos) {
    const resultado = await enviarMensagemComAnexo(sock, contato, {}, mensagem, quotedMsg, msg, '');
    if (resultado === true) {
      enviados++;
    } else if (resultado instanceof Error) {
      await sock.sendMessage(jid, { text: MENSAGENS.erroEnvio(contato, resultado.message) });
      log.erro('Erro ao enviar mídia: ' + resultado);
    }
  }
  await sock.sendMessage(jid, { text: MENSAGENS.mensagemEnviada(enviados) });
  // Não retorna nada
}

module.exports = {
  isAdmin,
  handleComunicado,
  handleContatar,
  ADMIN_ID
};
