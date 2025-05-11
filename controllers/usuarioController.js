const log = require('../utils/loggers');
const { iniciarAtualizacao, atualizarCadastro, descadastrarUsuario } = require('../services/cadastroService');
const { enviarSaudacao, enviarInteresses, enviarAjuda, enviarMensagemPadrao } = require('../utils/mensagens');
const { fluxoCadastroCardapio } = require('../services/onboardingService');
const { obterCardapio } = require('../services/cardapioService');
const { carregarArquivo } = require('../utils/arquivos');
const { isAdmin, adminPing, handleComunicado, handleContatar } = require('../bot/admin');
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
    // Comando para retornar o cardápio do dia (agora liberado para todos)
    if (mensagemTexto === '/bandejao') {
      global._cacheCardapio = global._cacheCardapio || {};
      const hoje = new Date().toISOString().slice(0, 10);
      global._cacheCardapio[hoje] = global._cacheCardapio[hoje] || {};
      // Limpa cache de dias anteriores
      Object.keys(global._cacheCardapio).forEach(data => {
        if (data !== hoje) delete global._cacheCardapio[data];
      });

      const user = cadastro[jid];
      const rus = [
        'RU Setorial I',
        'RU Setorial II',
        'RU Saúde e Direito',
        'RU ICA',
      ];
      const tipos = ['Almoço', 'Jantar'];
      let consultarRus, consultarTipos;
      if (user && Array.isArray(user.rus) && user.rus.length > 0 && Array.isArray(user.tiposRefeicao) && user.tiposRefeicao.length > 0) {
        consultarRus = user.rus;
        consultarTipos = user.tiposRefeicao;
      } else {
        // Pergunta quais RUs o usuário quer consultar
        let msgRU = 'Para qual restaurante você quer consultar o cardápio?\n';
        rus.forEach((ru, idx) => {
          msgRU += `${idx + 1}. ${ru}\n`;
        });
        msgRU += 'Digite os números separados por vírgula (ex: 1,3):';
        await sock.sendMessage(jid, { text: msgRU });
        let respostaRU = await new Promise((resolve) => {
          global.esperandoRespostas = global.esperandoRespostas || {};
          const timeout = setTimeout(() => {
            delete global.esperandoRespostas[jid];
            resolve('');
          }, 2 * 60 * 1000);
          global.esperandoRespostas[jid] = (resposta) => {
            clearTimeout(timeout);
            delete global.esperandoRespostas[jid];
            resolve(resposta.trim());
          };
        });
        let indicesRU = respostaRU.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(i => Number.isInteger(i) && i >= 0 && i < rus.length);
        consultarRus = [...new Set(indicesRU)].map(i => rus[i]);
        if (!consultarRus.length) consultarRus = rus; // fallback: todos
        // Pergunta quais tipos de refeição
        let msgTipo = 'Para qual refeição?\n1. Almoço\n2. Jantar\n3. Ambos';
        await sock.sendMessage(jid, { text: msgTipo });
        let respostaTipo = await new Promise((resolve) => {
          global.esperandoRespostas = global.esperandoRespostas || {};
          const timeout = setTimeout(() => {
            delete global.esperandoRespostas[jid];
            resolve('');
          }, 2 * 60 * 1000);
          global.esperandoRespostas[jid] = (resposta) => {
            clearTimeout(timeout);
            delete global.esperandoRespostas[jid];
            resolve(resposta.trim());
          };
        });
        if (respostaTipo === '1') consultarTipos = ['Almoço'];
        else if (respostaTipo === '2') consultarTipos = ['Jantar'];
        else if (respostaTipo === '3') consultarTipos = ['Almoço', 'Jantar'];
        else consultarTipos = tipos; // fallback: ambos
      }
      // Consulta o cardápio do dia para os RUs e tipos escolhidos
      let informativo = 'Consultando cardápio para hoje:\n';
      let consultas = [];
      const ruMap = {
        'RU Setorial I': '6',
        'RU Setorial II': '1',
        'RU Saúde e Direito': '2',
        'RU ICA': '5',
      };
      for (const ruNome of consultarRus) {
        for (const tipo of consultarTipos) {
          if (ruNome === 'RU Setorial II' && tipo === 'Jantar') continue;
          informativo += `- ${ruNome} (${tipo})\n`;
          consultas.push({ ruNome, ruId: ruMap[ruNome] || ruNome, tipo });
        }
      }
      await sock.sendMessage(jid, { text: informativo.trim() });

      let respostas = [];
      let falhas = 0;
      for (const consulta of consultas) {
        const cacheKey = `${consulta.ruId}_${consulta.tipo}`;
        // Usa cache se existir
        if (Object.prototype.hasOwnProperty.call(global._cacheCardapio[hoje], cacheKey)) {
          require('../utils/loggers').info(`[CACHE] Usando cache para ${cacheKey}`);
          respostas.push(global._cacheCardapio[hoje][cacheKey]);
        } else {
          require('../utils/loggers').info(`[CACHE] Consultando API para ${cacheKey}`);
          try {
            const textoCardapio = await obterCardapio(consulta.ruId, hoje, consulta.tipo);
            global._cacheCardapio[hoje][cacheKey] = textoCardapio;
            respostas.push(textoCardapio);
          } catch (e) {
            const erroMsg = `❌ Não foi possível obter o cardápio de hoje para ${consulta.ruNome} (${consulta.tipo}).`;
            global._cacheCardapio[hoje][cacheKey] = erroMsg;
            respostas.push(erroMsg);
            falhas++;
          }
        }
      }
      // Se só há uma consulta, envie só a resposta (erro ou sucesso)
      if (consultas.length === 1) {
        await sock.sendMessage(jid, { text: respostas[0] });
      } else {
        // Se todas falharam, envie só a mensagem geral
        if (falhas === consultas.length) {
          await sock.sendMessage(jid, { text: require('../utils/mensagens').nenhumCardapio });
        } else {
          // Envie apenas os sucessos e falhas específicas (sem duplicar mensagem geral)
          await sock.sendMessage(jid, { text: respostas.filter(r => !r.startsWith('❌') || consultas.length > 1).join('\n\n') });
        }
      }
      // Só oferece cadastro de preferências se o usuário NÃO tiver preferências cadastradas
      if (!user || !Array.isArray(user.rus) || user.rus.length === 0 || !Array.isArray(user.tiposRefeicao) || user.tiposRefeicao.length === 0) {
        await sock.sendMessage(jid, { text: 'Deseja receber diariamente o cardápio dos restaurantes da UFMG? (sim ou não)' });
        const resposta = await new Promise((resolve, reject) => {
          global.esperandoRespostas = global.esperandoRespostas || {};
          const timeout = setTimeout(() => {
            delete global.esperandoRespostas[jid];
            resolve('');
          }, 2 * 60 * 1000);
          global.esperandoRespostas[jid] = (resposta) => {
            clearTimeout(timeout);
            delete global.esperandoRespostas[jid];
            resolve(resposta.toLowerCase().trim());
          };
        });
        if (resposta === 'sim' || resposta === 's') {
          await fluxoCadastroCardapio(sock, jid, cadastro);
        } else {
          await sock.sendMessage(jid, { text: 'Tudo bem! Você pode consultar o cardápio quando quiser usando /bandejao.' });
        }
      }
      return;
    }
    // Comando antigo /cardapiododia removido (restrito ao admin)
    // Removido: handler para /cardapiododia, pois foi substituído por /bandejao
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
    // Comando para listar todas as pessoas cadastradas (admin)
    if (mensagemTexto === '/listarpessoas') {
      if (!isAdmin(jid)) {
        await sock.sendMessage(jid, { text: require('../utils/mensagens').permissaoNegada });
        return;
      }
      // Lista todos os usuários cadastrados (exceto admin)
      const pessoas = Object.entries(cadastro)
        .filter(([userJid]) => userJid !== jid && userJid !== process.env.ADMIN_ID)
        .map(([userJid, dados]) => `• ${dados.nome || 'Sem nome'} (${userJid}) - ${dados.curso || 'Sem curso'}`);
      if (pessoas.length === 0) {
        await sock.sendMessage(jid, { text: 'Nenhuma pessoa cadastrada.' });
      } else {
        await sock.sendMessage(jid, { text: `👥 Pessoas cadastradas:\n\n${pessoas.join('\n')}` });
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