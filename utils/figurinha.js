const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const { videoOuGifParaWebp } = require('./videoSticker');
const path = require('path');

/**
 * Converte uma imagem, vídeo ou GIF em figurinha e envia ao usuário
 * @param {object} sock - Instância do socket Baileys
 * @param {string} jid - JID do usuário
 * @param {object} msg - Mensagem original
 */
async function processarFigurinha(sock, jid, msg) {
  const tipoMensagem = Object.keys(msg.message || {})[0];
  if (tipoMensagem !== 'imageMessage' && tipoMensagem !== 'videoMessage' && tipoMensagem !== 'documentMessage') {
    await sock.sendMessage(jid, { text: 'Envie uma foto, vídeo (até 5s) ou GIF junto com o comando /figurinha.' });
    return;
  }
  try {
    let buffer, sticker;
    if (tipoMensagem === 'imageMessage') {
      buffer = await downloadMediaMessage(msg, 'buffer', {});
      sticker = await createSticker(buffer, {
        type: StickerTypes.FULL,
        pack: 'Passarinho',
        author: 'UFMG',
        quality: 70,
        categories: ['🤖','🎓']
      });
    } else if (tipoMensagem === 'videoMessage' || (tipoMensagem === 'documentMessage' && msg.message.documentMessage.mimetype && msg.message.documentMessage.mimetype.startsWith('image/gif'))) {
      buffer = await downloadMediaMessage(msg, 'buffer', {});
      let ext = 'mp4';
      if (tipoMensagem === 'documentMessage') ext = 'gif';
      try {
        const webpBuffer = await videoOuGifParaWebp(buffer, ext);
        sticker = webpBuffer;
      } catch (err) {
        await sock.sendMessage(jid, { text: 'Erro ao converter vídeo/GIF em figurinha. Certifique-se que o vídeo tem até 5 segundos e o ffmpeg está instalado.' });
        return;
      }
    } else {
      await sock.sendMessage(jid, { text: 'Envie uma foto, vídeo (até 5s) ou GIF para transformar em figurinha.' });
      return;
    }
    await sock.sendMessage(jid, { sticker });
  } catch (e) {
    await sock.sendMessage(jid, { text: 'Não consegui criar a figurinha. Tente novamente.' });
  }
}

module.exports = { processarFigurinha };
