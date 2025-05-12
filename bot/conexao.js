const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const log = require('../utils/loggers');
const mensagens = require('../utils/mensagens');

// Centralização de mensagens (ideal: utils/mensagens.js)
const MENSAGENS = mensagens;
const AUTH_PATH = './auth_info';

/**
 * Extrai o texto principal de uma mensagem do WhatsApp
 * @param {object} msg
 * @returns {string}
 */
function extrairTextoMensagem(msg) {
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage) return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
  return '';
}

/**
 * Conecta ao WhatsApp e gerencia eventos de conexão e mensagens
 * @param {function} tratarPrivado
 * @param {function} tratarGrupo
 * @returns {Promise<object>} socket
 */
async function conectarWhatsapp(tratarPrivado, tratarGrupo) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      log.info('Texto base do QR code para conexão:');
      log.info(qr); // Exibe o texto base do QR code
    }
    if (connection === 'close') {
      const erro = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (erro === DisconnectReason.loggedOut) {
        log.erro(MENSAGENS.desconectado);
      } else {
        conectarWhatsapp(tratarPrivado, tratarGrupo);
      }
    } else if (connection === 'open') {
      log.sucesso(MENSAGENS.conectado);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const jid = msg.key.remoteJid;
    const texto = extrairTextoMensagem(msg);
    try {
      if (jid.endsWith('@g.us')) {
        await tratarGrupo(sock, jid, msg, texto);
      } else {
        await tratarPrivado(sock, jid, texto, msg);
      }
    } catch (e) {
      log.erro('Erro ao tratar mensagem: ' + e.message);
    }
  });

  return sock;
}

module.exports = { conectarWhatsapp };
