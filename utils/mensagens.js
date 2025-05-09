async function enviarSaudacao(sock, jid, usuario) {
  if (!usuario) {
    await sock.sendMessage(jid, { text: `👋 Oi! Você ainda não está cadastrado no Passarinho. Vamos começar?` });
    return;
  }
  await sock.sendMessage(jid, {
    text: `👋 Olá, ${usuario.nome}! Tudo certo? Se quiser saber o que posso fazer, é só mandar /ajuda.`
  });
}

async function enviarInteresses(sock, jid, usuario) {
  if (!usuario || !usuario.interesses || !Array.isArray(usuario.interesses)) {
    await sock.sendMessage(jid, { text: "❌ Você ainda não escolheu nenhum interesse. Que tal escolher agora?" });
    return;
  }
  const interesses = usuario.interesses.join(', ');
  await sock.sendMessage(jid, {
    text: `📚 Seus interesses:
${interesses}`
  });
}

async function enviarAjuda(sock, jid) {
  await sock.sendMessage(jid, {
    text: `📝 Comandos disponíveis:

/interesses - Ver seus interesses
/atualizar - Atualizar seu cadastro
/ajuda - Mostrar este menu`
  });
}

async function enviarMensagemPadrao(sock, jid) {
  await sock.sendMessage(jid, {
    text: "🤖 Não entendi. Manda um /ajuda para ver o que posso fazer."
  });
}

module.exports = {
  enviarSaudacao,
  enviarInteresses,
  enviarAjuda,
  enviarMensagemPadrao
};
