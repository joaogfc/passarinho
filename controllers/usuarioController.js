const log = require('../utils/loggers');
const { iniciarAtualizacao, atualizarCadastro, descadastrarUsuario } = require('../services/cadastroService');
const { enviarSaudacao, enviarInteresses, enviarAjuda, enviarMensagemPadrao } = require('../utils/mensagens');
const { fluxoCadastroCardapio } = require('../services/onboardingService');
const { obterCardapio } = require('../services/cardapioService');
const { carregarArquivo } = require('../utils/arquivos');
const { isAdmin, adminPing, handleCardapioDoDia, handleComunicado, handleContatar } = require('../bot/admin');
const { processarFigurinha } = require('../utils/figurinha');

/**
 * Lida com mensagens recebidas de usuários privados e executa comandos ou fluxos apropriados.
 * @param {object} sock - Instância do socket Baileys
 * @param {string} jid - ID do usuário
 * @param {string} texto - Texto da mensagem
 * @param {object} cadastro - Cadastro de usuários
 * @param {object} estados - Estados de cadastro/atualização
 * @param {object} msg - Mensagem original
 */
async function tratarMensagemUsuario(sock, jid, texto, cadastro, estados, msg, quotedMsg) {
  try {
    if (!estados.atualizacao) estados.atualizacao = {};
    const mensagemTexto = texto.toLowerCase().trim();
    // Sempre recarrega o cadastro do disco para garantir dados atualizados
    cadastro = carregarArquivo('./data/cadastro.json');
    if (!cadastro || typeof cadastro !== 'object') {
      log.erro('Arquivo de cadastro inválido ou corrompido.');
      await sock.sendMessage(jid, { text: 'Erro ao acessar seu cadastro. Tente novamente mais tarde.' });
      return;
    }
    // Se o usuário estiver em processo de atualização de cadastro
    if (estados.atualizacao[jid]) {
      await atualizarCadastro(sock, jid, texto, cadastro, estados);
      return;
    }
    // Comando para (re)iniciar fluxo de cardápio a qualquer momento
    if (mensagemTexto === '/cardapio') {
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
        await sock.sendMessage(jid, { text: require('../utils/mensagens').permissaoNegada });
        return;
      }
      await handleCardapioDoDia(sock, jid, cadastro, obterCardapio);
      return;
    }
    // Comando para enviar comunicado do admin para todos os usuários (suporte a anexos)
    if (mensagemTexto.startsWith('/comunicado')) {
      if (!isAdmin(jid)) {
        await sock.sendMessage(jid, { text: require('../utils/mensagens').permissaoNegada });
        return;
      }
      try {
        const resultado = await handleComunicado(sock, jid, cadastro, texto, quotedMsg, msg);
        if (resultado instanceof Error) throw resultado;
      } catch (e) {
        log.erro(`Erro ao enviar comunicado: ${e.message}`);
        await sock.sendMessage(jid, { text: 'Ocorreu um erro ao enviar o comunicado. Tente novamente mais tarde.' });
      }
      return;
    }
    // Comando para enviar mensagem do admin para todos os contatos em contatos.json (suporte a anexos)
    if (mensagemTexto.startsWith('/contatar')) {
      if (!isAdmin(jid)) {
        await sock.sendMessage(jid, { text: require('../utils/mensagens').permissaoNegada });
        return;
      }
      try {
        const resultado = await handleContatar(sock, jid, texto, quotedMsg, msg);
        if (resultado instanceof Error) throw resultado;
      } catch (e) {
        log.erro(`Erro ao enviar mensagem para contatos: ${e.message}`);
        await sock.sendMessage(jid, { text: 'Ocorreu um erro ao enviar a mensagem para os contatos. Tente novamente mais tarde.' });
      }
      return;
    }
    // Comando para transformar mídia em figurinha
    if (mensagemTexto === '/figurinha') {
      await processarFigurinha(sock, jid, msg);
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
  } catch (e) {
    log.erro(`Erro ao tratar mensagem de usuário (${jid}): ${e.message}`);
    await sock.sendMessage(jid, { text: 'Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.' });
  }
}

module.exports = { tratarMensagemUsuario };
