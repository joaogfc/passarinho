const log = require('../utils/loggers');
const { iniciarAtualizacao, atualizarCadastro, descadastrarUsuario } = require('../services/cadastroService');
const { enviarSaudacao, enviarInteresses, enviarAjuda, enviarMensagemPadrao } = require('../utils/mensagens');
const { fluxoCadastroCardapio } = require('../services/onboardingService');
const { obterCardapio } = require('../services/cardapioService');
const { carregarArquivo } = require('../utils/arquivos');
const { isAdmin, adminPing, handleComunicado, handleContatar } = require('../bot/admin');
const { processarFigurinha } = require('../utils/figurinha');
const cardapioCache = require('../utils/cardapioCache');

// Para ativar/desativar as funções de cardápio, altere para true/false abaixo:
const CARDAPIO_ATIVO = false;

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
      if (!CARDAPIO_ATIVO) {
        await sock.sendMessage(jid, { text: 'A função de cardápio está temporariamente desativada. Tente novamente mais tarde.' });
        return;
      }
      // Substitui global._cacheCardapio por cardapioCache
      let cacheCardapio = cardapioCache.getCardapio();
      const hoje = new Date().toISOString().slice(0, 10);
      cacheCardapio[hoje] = cacheCardapio[hoje] || {};
      // Limpa cache de dias anteriores
      Object.keys(cacheCardapio).forEach(data => {
        if (data !== hoje) delete cacheCardapio[data];
      });
      cardapioCache.setCardapio(cacheCardapio);

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
        if (Object.prototype.hasOwnProperty.call(cacheCardapio[hoje], cacheKey)) {
          require('../utils/loggers').info(`[CACHE] Usando cache para ${cacheKey}`);
          respostas.push(cacheCardapio[hoje][cacheKey]);
        } else {
          require('../utils/loggers').info(`[CACHE] Consultando API para ${cacheKey}`);
          try {
            const textoCardapio = await obterCardapio(consulta.ruId, hoje, consulta.tipo);
            cacheCardapio[hoje][cacheKey] = textoCardapio;
            respostas.push(textoCardapio);
          } catch (e) {
            const erroMsg = `❌ Não foi possível obter o cardápio de hoje para ${consulta.ruNome} (${consulta.tipo}).`;
            cacheCardapio[hoje][cacheKey] = erroMsg;
            respostas.push(erroMsg);
            falhas++;
          }
        }
      }
      cardapioCache.setCardapio(cacheCardapio);
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
    if (mensagemTexto === '/internos') {
      const { encontrarPontoMaisProximo, buscarLinhasPorOrigemDestino, proximoHorario } = require('../services/internosService');
      const linhasInternas = require('../data/itinerariosInternos');
      const todosPontos = [...new Set([].concat(...linhasInternas.map(l => l.itinerario)))];
      // Mensagem inicial
      await sock.sendMessage(jid, { text: '🚍 Olá! Vou te ajudar a encontrar a melhor linha interna da UFMG para o seu trajeto.\n\nDica: você pode digitar siglas ou nomes abreviados, como ICEX, CAD 1, RU II, etc.' });
      // Pergunta origem
      let pontoOrigem;
      while (true) {
        await sock.sendMessage(jid, { text: 'Por favor, informe o ponto de partida:' });
        let origem = await new Promise((resolve) => {
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
        if (!origem) {
          await sock.sendMessage(jid, { text: '⏰ Tempo esgotado. Tente novamente usando /internos.' });
          return;
        }
        // Avalia similaridade
        const stringSimilarity = require('string-similarity');
        const { encontrarPontoMaisProximo } = require('../services/internosService');
        const sugestao = encontrarPontoMaisProximo(origem, todosPontos);
        const match = stringSimilarity.findBestMatch(origem.toUpperCase(), todosPontos.map(p => p.toUpperCase()));
        if (match.bestMatch.rating >= 0.92) {
          pontoOrigem = sugestao;
          break;
        } else if (sugestao.toUpperCase() !== origem.toUpperCase()) {
          await sock.sendMessage(jid, { text: `Você quis dizer: *${sugestao}*? (responda sim ou não)` });
          let confirmacao = await new Promise((resolve) => {
            global.esperandoRespostas = global.esperandoRespostas || {};
            const timeout = setTimeout(() => {
              delete global.esperandoRespostas[jid];
              resolve('');
            }, 2 * 60 * 1000);
            global.esperandoRespostas[jid] = (resposta) => {
              clearTimeout(timeout);
              delete global.esperandoRespostas[jid];
              resolve(resposta.trim().toLowerCase());
            };
          });
          if (confirmacao === 'sim' || confirmacao === 's') {
            pontoOrigem = sugestao;
            break;
          } else {
            await sock.sendMessage(jid, { text: 'Sem problemas! Tente digitar novamente o ponto de partida.' });
            continue;
          }
        } else {
          pontoOrigem = sugestao;
          break;
        }
      }
      // Pergunta destino
      let pontoDestino;
      while (true) {
        await sock.sendMessage(jid, { text: 'Agora, me diga o destino desejado:' });
        let destino = await new Promise((resolve) => {
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
        if (!destino) {
          await sock.sendMessage(jid, { text: '⏰ Tempo esgotado. Tente novamente usando /internos.' });
          return;
        }
        // Avalia similaridade
        const stringSimilarity = require('string-similarity');
        const { encontrarPontoMaisProximo } = require('../services/internosService');
        const sugestao = encontrarPontoMaisProximo(destino, todosPontos);
        const match = stringSimilarity.findBestMatch(destino.toUpperCase(), todosPontos.map(p => p.toUpperCase()));
        if (match.bestMatch.rating >= 0.92) {
          pontoDestino = sugestao;
          break;
        } else if (sugestao.toUpperCase() !== destino.toUpperCase()) {
          await sock.sendMessage(jid, { text: `Você quis dizer: *${sugestao}*? (responda sim ou não)` });
          let confirmacao = await new Promise((resolve) => {
            global.esperandoRespostas = global.esperandoRespostas || {};
            const timeout = setTimeout(() => {
              delete global.esperandoRespostas[jid];
              resolve('');
            }, 2 * 60 * 1000);
            global.esperandoRespostas[jid] = (resposta) => {
              clearTimeout(timeout);
              delete global.esperandoRespostas[jid];
              resolve(resposta.trim().toLowerCase());
            };
          });
          if (confirmacao === 'sim' || confirmacao === 's') {
            pontoDestino = sugestao;
            break;
          } else {
            await sock.sendMessage(jid, { text: 'Sem problemas! Tente digitar novamente o destino.' });
            continue;
          }
        } else {
          pontoDestino = sugestao;
          break;
        }
      }
      // Determina o dia da semana
      const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const hoje = new Date();
      const diaSemana = diasSemana[hoje.getDay()];
      // Filtra linhas do dia
      let linhasDoDia = [];
      if (diaSemana === 'sábado') {
        linhasDoDia = linhasInternas.filter(l => l.nome.toLowerCase().includes('sábado'));
      } else {
        linhasDoDia = linhasInternas.filter(l => !l.nome.toLowerCase().includes('sábado'));
      }
      // Busca linhas compatíveis
      const resultados = buscarLinhasPorOrigemDestino(pontoOrigem, pontoDestino).filter(r =>
        linhasDoDia.some(l => l.nome === r.linha)
      );
      if (!resultados.length) {
        await sock.sendMessage(jid, { text: 'Não encontrei nenhuma linha interna para esse trajeto hoje. 😕' });
        await sock.sendMessage(jid, { text: 'Para ter acesso a um mapa interativo, acesse: https://internorotas.github.io/ufmg/' });
        return;
      }
      // Horário atual
      const agora = new Date();
      const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
      // Só mostra o próximo horário de cada linha, ordenado pelo mais próximo
      let proximos = resultados.map(r => {
        const prox = proximoHorario(r.horarios, horaAtual);
        return prox ? { ...r, proximo: prox } : null;
      }).filter(Boolean);
      if (!proximos.length) {
        await sock.sendMessage(jid, { text: 'Não há mais horários disponíveis para hoje nesse trajeto.' });
        await sock.sendMessage(jid, { text: 'Para ter acesso a um mapa interativo, acesse: https://internorotas.github.io/ufmg/' });
        return;
      }
      proximos.sort((a, b) => {
        const [ha, ma] = a.proximo.split(':').map(Number);
        const [hb, mb] = b.proximo.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
      });
      // Envia cada linha em uma mensagem separada
      for (const r of proximos) {
        await sock.sendMessage(jid, {
          text: `🚌 *${r.linha}*\nDe: ${r.origem}\nPara: ${r.destino}\nPróximo horário: ${r.proximo}`
        });
        // Removido: envio de link Google Maps
      }
      // Envia o link do mapa interativo como última mensagem
      await sock.sendMessage(jid, { text: 'Para ter acesso a um mapa interativo, acesse: https://internorotas.github.io/ufmg/' });
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