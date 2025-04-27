async function enviarSaudacao(sock, jid, usuario) {
  if (!usuario) {
    await sock.sendMessage(jid, { text: `👋 Olá! Parece que você ainda não está cadastrado.` });
    return;
  }

  await sock.sendMessage(jid, {
    text: `👋 Olá ${usuario.nome}! Como posso te ajudar hoje?\n\nUse /ajuda para ver todas as opções disponíveis.`
  });
}

async function enviarInteresses(sock, jid, usuario) {
  if (!usuario || !usuario.interesses || !Array.isArray(usuario.interesses)) {
    await sock.sendMessage(jid, { text: "❌ Você ainda não cadastrou seus interesses." });
    return;
  }

  const interesses = usuario.interesses.join(', ');
  await sock.sendMessage(jid, {
    text: `📚 Seus interesses atuais são:\n\n✨ ${interesses}`
  });
}

async function enviarAjuda(sock, jid) {
  await sock.sendMessage(jid, {
    text: "📋 Comandos disponíveis:\n\n/interesses - Ver seus interesses cadastrados\n/atualizar - Atualizar seu cadastro\n/ajuda - Mostrar esta lista de comandos"
  });
}

async function enviarMensagemPadrao(sock, jid) {
  await sock.sendMessage(jid, {
    text: "🤖 Comando não reconhecido! Digite /ajuda para ver o que eu posso fazer."
  });
}

module.exports = {
  enviarSaudacao,
  enviarInteresses,
  enviarAjuda,
  enviarMensagemPadrao
};
