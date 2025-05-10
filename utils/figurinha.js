const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
// sharp removido

/**
 * Converte uma imagem em figurinha e envia ao usuário
 * @param {object} sock - Instância do socket Baileys
 * @param {string} jid - JID do usuário
 * @param {object} msg - Mensagem original
 */
async function processarFigurinha(sock, jid, msg) {
  const tipoMensagem = Object.keys(msg.message || {})[0];
  if (tipoMensagem === 'videoMessage') {
    await sock.sendMessage(jid, { text: 'Não é possível criar figurinha a partir de vídeo ou GIF neste bot. Envie uma foto/imagem para transformar em figurinha.' });
    return;
  }
  if (tipoMensagem !== 'imageMessage') {
    await sock.sendMessage(jid, { text: 'Envie uma foto ou imagem junto com o comando /figurinha.' });
    return;
  }
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    // Não faz mais corte 1:1, apenas converte direto
    const sticker = await createSticker(buffer, {
      type: StickerTypes.FULL,
      pack: 'Passarinho',
      author: 'UFMG',
      quality: 70,
      categories: ['🤖','🎓']
    });
    await sock.sendMessage(jid, { sticker });
  } catch (e) {
    await sock.sendMessage(jid, { text: 'Não consegui criar a figurinha. Tente novamente.' });
  }
}

module.exports = { processarFigurinha };
