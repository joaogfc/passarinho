const { salvarPreferenciaCardapio, removerPreferenciaCardapio } = require('../repositories/usuarioRepository');

async function fluxoCadastroCardapio(sock, jid, cadastro) {

  // 1. Confirma envio diário com validação
  let resposta1;
  while (true) {
    await sock.sendMessage(jid, { text: 'Deseja receber diariamente o cardápio dos restaurantes da UFMG? (sim ou não)' });
    resposta1 = await esperarResposta(sock, jid);
    const resp = resposta1.toLowerCase().trim();
    if (resp === 'sim' || resp === 's') break;
    if (resp === 'não' || resp === 'nao' || resp === 'n') {
      await sock.sendMessage(jid, { text: 'Tudo bem! Você não receberá o cardápio diário.' });
      // Remove preferências do cadastro.json se existir
      await removerPreferenciaCardapio(jid);
      return;
    }
    await sock.sendMessage(jid, { text: "Resposta inválida. Por favor, digite 'sim' ou 'não'." });
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
    let msgRU = 'Selecione quais RUs você deseja acompanhar (digite os números separados por vírgula):\n';
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
    await sock.sendMessage(jid, { text: 'Nenhum número válido identificado. Por favor, digite números válidos separados por vírgula. Exemplo: 1,3.' });
  }

  // 3. Seleção de refeições via número com validação
  const refeicoes = ['Almoço', 'Jantar', 'Ambos'];
  let resposta3, numRef, tipos;
  while (true) {
    let msgRef = 'Para quais refeições deseja receber o cardápio? (digite o número):\n';
    refeicoes.forEach((ref, idx) => {
      msgRef += `${idx + 1}. ${ref}\n`;
    });
    await sock.sendMessage(jid, { text: msgRef });

    resposta3 = await esperarResposta(sock, jid);
    numRef = parseInt(resposta3.trim(), 10);
    if (numRef === 1) { tipos = ['Almoço']; break; }
    if (numRef === 2) { tipos = ['Jantar']; break; }
    if (numRef === 3) { tipos = ['Almoço', 'Jantar']; break; }
    await sock.sendMessage(jid, { text: 'Opção inválida. Digite 1 para Almoço, 2 para Jantar ou 3 para Ambos.' });
  }

  // 4. Persistência e confirmação
  await salvarPreferenciaCardapio(jid, selecionadosRU, tipos);
  await sock.sendMessage(jid, { text: 'Preferências salvas com sucesso! ✅' });
}

// Função utilitária para aguardar mensagens do usuário
async function esperarResposta(sock, jid) {
  return await new Promise((resolve, reject) => {
    global.esperandoRespostas = global.esperandoRespostas || {};
    global.esperandoRespostas[jid] = resolve;
    // Timeout de 2 minutos
    const timeout = setTimeout(async () => {
      if (global.esperandoRespostas[jid]) {
        delete global.esperandoRespostas[jid];
        // Limpa estados de fluxo de cadastro/atualização, se existirem
        if (global.estados && global.estados.cadastro) delete global.estados.cadastro[jid];
        if (global.estados && global.estados.atualizacao) delete global.estados.atualizacao[jid];
        await sock.sendMessage(jid, { text: '😅 Opa! Você ficou um tempinho sem responder, então encerrei o cadastro por aqui. Quando quiser, é só chamar de novo! 🐦' });
        reject(new Error('Timeout de resposta do usuário.'));
      }
    }, 2 * 60 * 1000); // 2 minutos
    // Quando o usuário responder, limpa o timeout
    const originalResolve = resolve;
    global.esperandoRespostas[jid] = (resposta) => {
      clearTimeout(timeout);
      originalResolve(resposta);
    };
  });
}

module.exports = { fluxoCadastroCardapio };
