const grupoService = require('../services/grupoService');

async function tratarMensagemGrupo(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses) {
  await grupoService.redirecionarMensagemParaUsuarios(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses);
}

module.exports = { tratarMensagemGrupo };
