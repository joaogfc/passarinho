const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function redirecionarMensagemParaUsuarios(
  sock,
  grupoId,
  msg,
  texto,
  cadastro,
  fontesCursos,
  fontesInteresses
) {
  let cursosRelacionados = fontesCursos[grupoId] || [];
  if (!Array.isArray(cursosRelacionados)) cursosRelacionados = [cursosRelacionados];

  let interessesRelacionados = fontesInteresses[grupoId] || [];
  if (!Array.isArray(interessesRelacionados)) interessesRelacionados = [interessesRelacionados];

  if (cursosRelacionados.length === 0 && interessesRelacionados.length === 0) return;

  for (const [userJid, dados] of Object.entries(cadastro)) {
    const { curso, interesses } = dados;
    const temCurso = cursosRelacionados.includes(curso);
    const temInteresse = Array.isArray(interesses) && interesses.some(i => interessesRelacionados.includes(i));

    if (!temCurso && !temInteresse) continue;

    const categoriaValor = temCurso ? curso : interesses.find(i => interessesRelacionados.includes(i));
    const rodape = `*Categoria: ${categoriaValor}*`;

    const tipoMensagem = Object.keys(msg.message || {})[0];

    try {
      if (!tipoMensagem) continue;

      if ([
        'pollCreationMessage',
        'liveLocationMessage',
        'protocolMessage'
      ].includes(tipoMensagem)) {
        continue;
      }

      switch (tipoMensagem) {
        case 'imageMessage': {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          const caption = msg.message.imageMessage.caption || '';
          await sock.sendMessage(userJid, {
            image: buffer,
            caption: `${caption}\n\n${rodape}`.trim()
          });
          break;
        }
        case 'videoMessage': {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          const caption = msg.message.videoMessage.caption || '';
          await sock.sendMessage(userJid, {
            video: buffer,
            caption: `${caption}\n\n${rodape}`.trim()
          });
          break;
        }
        case 'audioMessage': {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          await sock.sendMessage(userJid, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
          });
          break;
        }
        case 'stickerMessage': {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          await sock.sendMessage(userJid, {
            sticker: buffer
          });
          break;
        }
        case 'locationMessage': {
          const loc = msg.message.locationMessage;
          if (loc.degreesLatitude && loc.degreesLongitude && !loc.liveLocation) {
            await sock.sendMessage(userJid, {
              location: {
                degreesLatitude: loc.degreesLatitude,
                degreesLongitude: loc.degreesLongitude
              }
            });
          }
          break;
        }
        case 'contactMessage': {
          const contact = msg.message.contactMessage;
          await sock.sendMessage(userJid, {
            contacts: {
              displayName: contact.displayName,
              contacts: [contact]
            }
          });
          break;
        }
        case 'contactsArrayMessage': {
          const list = msg.message.contactsArrayMessage.contacts;
          await sock.sendMessage(userJid, {
            contacts: {
              displayName: '',
              contacts: list
            }
          });
          break;
        }
        default: {
          await sock.sendMessage(userJid, {
            text: `${texto}\n\n${rodape}`.trim()
          });
        }
      }

      console.log(`Mensagem para ${userJid} (curso: ${curso}).`);
    } catch (err) {
      console.log(`Erro ao enviar para ${userJid}:`, err.message);
    }
  }
}

module.exports = { redirecionarMensagemParaUsuarios };
