const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function conectarWhatsapp(tratarPrivado, tratarGrupo) {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const erro = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (erro === DisconnectReason.loggedOut) {
        console.log('❌ Desconectado.');
      } else {
        conectarWhatsapp(tratarPrivado, tratarGrupo);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot conectado!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    let texto = '';
    if (msg.message.conversation) texto = msg.message.conversation;
    else if (msg.message.extendedTextMessage) texto = msg.message.extendedTextMessage.text;
    else if (msg.message.imageMessage?.caption) texto = msg.message.imageMessage.caption;
    else if (msg.message.videoMessage?.caption) texto = msg.message.videoMessage.caption;

    if (jid.endsWith('@g.us')) {
      await tratarGrupo(sock, jid, msg, texto);
    } else {
      await tratarPrivado(sock, jid, texto, msg); // Passa o objeto msg completo
    }
  });

  return sock;
}

module.exports = { conectarWhatsapp };
