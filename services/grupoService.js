const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function redirecionarMensagemParaUsuarios(sock, grupoId, msg, texto, cadastro, fontesCursos, fontesInteresses) {
  const cursoRelacionado = fontesCursos[grupoId];
  const interesseRelacionado = fontesInteresses[grupoId];

  if (!cursoRelacionado && !interesseRelacionado) return;

  // Obter dados do grupo
  let nomeGrupo = "Grupo desconhecido";
  let linkGrupo = "Sem link disponível";

  try {
    const metadata = await sock.groupMetadata(grupoId);
    if (metadata) {
      nomeGrupo = metadata.subject || nomeGrupo;

      try {
        const code = await sock.groupInviteCode(grupoId);
        linkGrupo = `https://chat.whatsapp.com/${code}`;
      } catch (e) {
        console.log("Não foi possível obter o link do grupo:", e.message);
      }
    }
  } catch (err) {
    console.log("Erro ao buscar informações do grupo:", err.message);
  }

  const remetenteNome = msg.pushName || "Usuário desconhecido";
  const rodapeFinal = `Fonte: ${nomeGrupo}\nLink do Grupo: ${linkGrupo}\nUsuário: ${remetenteNome}`;

  for (const [userJid, dados] of Object.entries(cadastro)) {
    const deveReceber =
      (cursoRelacionado && dados.curso === cursoRelacionado) ||
      (interesseRelacionado && dados.interesses?.includes(interesseRelacionado));

    if (deveReceber) {
      const tipoMensagem = Object.keys(msg.message || {})[0];

      if (tipoMensagem === "imageMessage") {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const legendaOriginal = msg.message.imageMessage.caption || "";
        const legendaFinal = `${legendaOriginal}\n\n${rodapeFinal}`;

        await sock.sendMessage(userJid, {
          image: buffer,
          caption: legendaFinal.trim()
        });

      } else if (tipoMensagem === "videoMessage") {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const legendaOriginal = msg.message.videoMessage.caption || "";
        const legendaFinal = `${legendaOriginal}\n\n${rodapeFinal}`;

        await sock.sendMessage(userJid, {
          video: buffer,
          caption: legendaFinal.trim()
        });

      } else if (tipoMensagem === "audioMessage") {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});

        await sock.sendMessage(userJid, {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus', // WhatsApp espera esse formato
          ptt: true // envia como "áudio de voz"
        });

      } else if (tipoMensagem === "stickerMessage") {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});

        await sock.sendMessage(userJid, {
          sticker: buffer
        });

      } else if (tipoMensagem === "locationMessage") {
        const localizacao = msg.message.locationMessage;

        if (localizacao.degreesLatitude && localizacao.degreesLongitude && !localizacao.liveLocation) {
          await sock.sendMessage(userJid, {
            location: {
              degreesLatitude: localizacao.degreesLatitude,
              degreesLongitude: localizacao.degreesLongitude,
              name: localizacao.name || "Localização",
              address: localizacao.address || ""
            }
          });
        } else {
          console.log("Ignorando localização em tempo real.");
        }

      } else {
        // Se for texto ou tipo desconhecido
        const textoFinal = `${texto}\n\n${rodapeFinal}`;

        await sock.sendMessage(userJid, {
          text: textoFinal.trim()
        });
      }
    }
  }
}

const grupoService = { redirecionarMensagemParaUsuarios };

module.exports = { grupoService };
