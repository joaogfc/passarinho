const log = require('../utils/loggers');
const { salvarPreferenciaCardapio, removerPreferenciaCardapio } = require('../repositories/usuarioRepository');
const { msgCardapio } = require('../utils/mensagens');

/**
 * Fluxo de cadastro de preferências de cardápio do usuário.
 */
async function fluxoCadastroCardapio(sock, jid, cadastro = {}) {
  await sock.sendMessage(jid, { text: '⚠️ O serviço de cadastro de preferências de cardápio está temporariamente em manutenção. Por favor, tente novamente mais tarde.' });
  return;
  // ...restante do código não será executado durante manutenção...
  if (!sock || !jid) {
    throw new Error('Parâmetros obrigatórios ausentes em fluxoCadastroCardapio');
  }
  try {
    // 1. Confirma envio diário com validação
    let resposta1;
    while (true) {
      await sock.sendMessage(jid, { text: msgCardapio.perguntaReceber });
      resposta1 = await esperarResposta(sock, jid);
      const resp = resposta1.toLowerCase().trim();
      if (resp === 'sim' || resp === 's') break;
      if (resp === 'não' || resp === 'nao' || resp === 'n') {
        await sock.sendMessage(jid, { text: msgCardapio.respostaNegativa });
        await removerPreferenciaCardapio(jid);
        return;
      }
      await sock.sendMessage(jid, { text: msgCardapio.respostaInvalida });
    }
    // 2. Seleção de RUs via números com validação
    const rus = [
      'RU Setorial I',
      'RU Setorial II',
      'RU Saúde e Direito',
      'RU ICA',
    ];
    let resposta2, indicesRU, selecionadosRU;
    while (true) {
      let msgRU = msgCardapio.selecaoRU + '\n';
      rus.forEach((ru, idx) => {
        msgRU += `${idx + 1}. ${ru}\n`;
      });
      await sock.sendMessage(jid, { text: msgRU });
      resposta2 = await esperarResposta(sock, jid);
      indicesRU = resposta2
        .split(',')
        .map(s => parseInt(s.trim(), 10) - 1)
        .filter(i => Number.isInteger(i) && i >= 0 && i < rus.length);
      selecionadosRU = [...new Set(indicesRU)].map(i => rus[i]);
      if (selecionadosRU.length > 0) break;
      await sock.sendMessage(jid, { text: msgCardapio.nenhumRUValido });
    }
    // 3. Seleção de refeições via número com validação
    const refeicoes = ['Almoço', 'Jantar', 'Ambos'];
    let resposta3, numRef, tipos;
    while (true) {
      let msgRef = msgCardapio.selecaoRefeicao + '\n';
      refeicoes.forEach((ref, idx) => {
        msgRef += `${idx + 1}. ${ref}\n`;
      });
      await sock.sendMessage(jid, { text: msgRef });
      resposta3 = await esperarResposta(sock, jid);
      numRef = parseInt(resposta3.trim(), 10);
      if (numRef === 1) { tipos = ['Almoço']; break; }
      if (numRef === 2) { tipos = ['Jantar']; break; }
      if (numRef === 3) { tipos = ['Almoço', 'Jantar']; break; }
      await sock.sendMessage(jid, { text: msgCardapio.opcaoRefeicaoInvalida });
    }
    // 4. Persistência e confirmação
    await salvarPreferenciaCardapio(jid, selecionadosRU, tipos);
    await sock.sendMessage(jid, { text: msgCardapio.preferenciasSalvas });
  } catch (e) {
    log.erro(`[ONBOARDING] Erro no fluxo de cadastro de cardápio para ${jid}: ${e.message}`);
    await sock.sendMessage(jid, { text: msgCardapio.erroCadastro });
  }
}

/**
 * Função utilitária para aguardar mensagens do usuário
 */
async function esperarResposta(sock, jid) {
  return await new Promise((resolve, reject) => {
    global.esperandoRespostas = global.esperandoRespostas || {};
    // Timeout de 2 minutos
    const timeout = setTimeout(async () => {
      if (global.esperandoRespostas[jid]) {
        delete global.esperandoRespostas[jid];
        if (global.estados && global.estados.cadastro) delete global.estados.cadastro[jid];
        if (global.estados && global.estados.atualizacao) delete global.estados.atualizacao[jid];
        await sock.sendMessage(jid, { text: '😅 Opa! Você ficou um tempinho sem responder, então encerrei o cadastro por aqui. Quando quiser, é só chamar de novo! 🐦' });
        reject(new Error('Timeout de resposta do usuário.'));
      }
    }, 2 * 60 * 1000); // 2 minutos
    global.esperandoRespostas[jid] = (resposta) => {
      clearTimeout(timeout);
      delete global.esperandoRespostas[jid];
      resolve(resposta);
    };
  });
}

module.exports = { fluxoCadastroCardapio };
