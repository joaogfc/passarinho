const { iniciarAtualizacao, atualizarCadastro } = require('../services/cadastroService');
const { enviarSaudacao, enviarInteresses, enviarAjuda, enviarMensagemPadrao } = require('../utils/mensagens');
const { fluxoCadastroCardapio } = require('../services/onboardingService');
const { obterCardapio } = require('../services/cardapioService');
const { carregarArquivo } = require('../utils/arquivos');
const { isAdmin, adminPing, handleCardapioDoDia, handleComunicado, handleContatar } = require('../bot/admin');

async function tratarMensagemUsuario(sock, jid, texto, cadastro, estados, msg) {
  const mensagemTexto = texto.toLowerCase().trim();

  // Sempre recarrega o cadastro do disco para garantir dados atualizados
  cadastro = carregarArquivo('./cadastro.json');

  // Se o usuário estiver em processo de atualização de cadastro
  if (estados.atualizacao[jid]) {
    await atualizarCadastro(sock, jid, texto, cadastro, estados);
    return;
  }

  // Comando para (re)iniciar fluxo de cardápio a qualquer momento
  if (mensagemTexto === '/cardapio') {
    // Verifica se o usuário já está cadastrado no cardápio
    const user = cadastro[jid];
    if (user && Array.isArray(user.rus) && user.rus.length > 0 && Array.isArray(user.tiposRefeicao) && user.tiposRefeicao.length > 0) {
      await sock.sendMessage(jid, { text: 'Você já está cadastrado para receber o cardápio. Para alterar suas preferências, utilize o comando /atualizar.' });
      return;
    }
    await fluxoCadastroCardapio(sock, jid);
    return;
  }

  // Comando para retornar o cardápio do dia
  if (mensagemTexto === '/cardapiododia') {
    if (!isAdmin(jid)) {
      await sock.sendMessage(jid, { text: '❌ Você não tem permissão para usar este comando.' });
      return;
    }
    await handleCardapioDoDia(sock, jid, cadastro, obterCardapio);
    return;
  }

  // Comando para enviar comunicado do admin para todos os usuários (suporte a anexos)
  if (mensagemTexto.startsWith('/comunicado')) {
    if (!isAdmin(jid)) {
      await sock.sendMessage(jid, { text: '❌ Você não tem permissão para usar este comando.' });
      return;
    }
    await handleComunicado(sock, jid, cadastro, texto, undefined, msg); // Passa msg para o handler
    return;
  }

  // Comando para enviar mensagem do admin para todos os contatos em contatos.json (suporte a anexos)
  if (mensagemTexto.startsWith('/contatar')) {
    if (!isAdmin(jid)) {
      await sock.sendMessage(jid, { text: '❌ Você não tem permissão para usar este comando.' });
      return;
    }
    await handleContatar(sock, jid, texto, undefined, msg); // Passa msg para o handler
    return;
  }

  // Saudações automáticas
  if (['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'].includes(mensagemTexto)) {
    await enviarSaudacao(sock, jid, cadastro[jid]);
    return;
  }

  // Ver interesses cadastrados
  if (mensagemTexto === '/interesses') {
    await enviarInteresses(sock, jid, cadastro[jid]);
    return;
  }

  // Atualizar cadastro
  if (mensagemTexto === '/atualizar') {
    await iniciarAtualizacao(sock, jid, cadastro, estados);
    return;
  }

  // Mostrar comandos de ajuda
  if (mensagemTexto === '/ajuda') {
    await enviarAjuda(sock, jid);
    return;
  }

  // Caso mensagem não seja reconhecida
  await enviarMensagemPadrao(sock, jid);
}

module.exports = { tratarMensagemUsuario };
