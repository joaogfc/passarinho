const { iniciarAtualizacao, atualizarCadastro } = require('../services/cadastroService');
const { enviarSaudacao, enviarInteresses, enviarAjuda, enviarMensagemPadrao } = require('../utils/mensagens');

async function tratarMensagemUsuario(sock, jid, texto, cadastro, estados) {
  const msg = texto.toLowerCase().trim();

  // simula que o bot está digitando
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise(resolve => setTimeout(resolve, 2500)); // espera 3 segundos fingindo digitar
    await sock.sendPresenceUpdate('paused', jid);

  // Se o usuário estiver em processo de atualização de cadastro
  if (estados.atualizacao[jid]) {
    await atualizarCadastro(sock, jid, texto, cadastro, estados);
    return;
  }

  // Saudações automáticas
  if (["oi", "olá", "bom dia", "boa tarde", "boa noite"].includes(msg)) {
    await enviarSaudacao(sock, jid, cadastro[jid]);
    return;
  }

  // Ver interesses cadastrados
  if (msg === "/interesses") {
    await enviarInteresses(sock, jid, cadastro[jid]);
    return;
  }

  // Atualizar cadastro
  if (msg === "/atualizar") {
    await iniciarAtualizacao(sock, jid, cadastro, estados);
    return;
  }

  // Mostrar comandos de ajuda
  if (msg === "/ajuda") {
    await enviarAjuda(sock, jid);
    return;
  }

  // Caso mensagem não seja reconhecida
  await enviarMensagemPadrao(sock, jid);
}

module.exports = { tratarMensagemUsuario };
