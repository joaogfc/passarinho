const { salvarCadastro } = require('../utils/arquivos');
const { identificarCurso } = require('../services/validarCurso'); // nova importação

// Fluxo de cadastro automático
async function iniciarFluxoCadastro(sock, jid, texto, cadastro, estados) {
  if (!estados.cadastro) estados.cadastro = {};

  if (!estados.cadastro[jid]) {
    estados.cadastro[jid] = { etapa: 1 };
    await sock.sendMessage(jid, { text: "👋 Olá! Seja bem-vindo! Qual seu nome completo?" });
    return;
  }

  const etapa = estados.cadastro[jid].etapa;

  if (etapa === 1) {
    cadastro[jid] = { nome: texto };
    estados.cadastro[jid].etapa = 2;
    await sock.sendMessage(jid, { text: "📚 Qual seu curso? (Digite livremente o nome do curso)" });
    return;
  }

  if (etapa === 2.5) {
    const resposta = texto.trim().toLowerCase();
    const sugestao = estados.cadastro[jid].confirmarCurso;

    if (resposta === 'sim' && sugestao) {
      cadastro[jid].curso = sugestao;
      estados.cadastro[jid].etapa = 3;
      delete estados.cadastro[jid].confirmarCurso;
      await sock.sendMessage(jid, {
        text: `✅ Curso confirmado: *${sugestao}*\nAgora me diga seus interesses:\n1 - Eventos\n2 - Pesquisa\n(Envie os números separados por vírgula, ex: 1,2)`
      });
    } else {
      estados.cadastro[jid].etapa = 2;
      delete estados.cadastro[jid].confirmarCurso;
      await sock.sendMessage(jid, {
        text: '🔁 Ok, tente escrever o nome do curso novamente.'
      });
    }
    return;
  }

  if (etapa === 2) {
    const cursoIdentificado = identificarCurso(texto.trim(), true); // modo detalhado

    if (!cursoIdentificado) {
      await sock.sendMessage(jid, { text: "❌ Não consegui identificar o curso. Tente escrever o nome completo ou de outra forma." });
      return;
    }

    if (cursoIdentificado.rating < 0.9) {
      estados.cadastro[jid].etapa = 2.5;
      estados.cadastro[jid].confirmarCurso = cursoIdentificado.nome;
      await sock.sendMessage(jid, {
        text: `🤔 Você quis dizer *${cursoIdentificado.nome}*? (responda sim ou não)`
      });
      return;
    }

    cadastro[jid].curso = cursoIdentificado.nome;
    estados.cadastro[jid].etapa = 3;
    await sock.sendMessage(jid, { text: "✨ Agora me diga seus interesses:\n1 - Eventos\n2 - Pesquisa\n(Envie os números separados por vírgula, ex: 1,2)" });
    return;
  }

  if (etapa === 3) {
    const opcoes = { "1": "Eventos", "2": "Pesquisa" };
    const interesses = texto.split(',').map(v => v.trim()).map(v => opcoes[v]).filter(Boolean);

    if (!interesses.length) {
      await sock.sendMessage(jid, { text: "❌ Nenhum interesse válido detectado. Tente novamente." });
      return;
    }

    cadastro[jid].interesses = interesses;
    salvarCadastro(cadastro, './cadastro.json');
    delete estados.cadastro[jid];
    await sock.sendMessage(jid, { text: "✅ Cadastro concluído com sucesso! Agora você pode usar /ajuda para ver opções." });
  }
}

// Fluxo de atualização de dados
async function iniciarAtualizacao(sock, jid, cadastro, estados) {
  const dados = cadastro[jid];

  if (!dados) {
    await sock.sendMessage(jid, { text: "❌ Você ainda não está cadastrado." });
    return;
  }

  const interesses = (dados.interesses && Array.isArray(dados.interesses))
    ? dados.interesses.join(', ')
    : 'Nenhum interesse cadastrado';

  await sock.sendMessage(jid, {
    text: `🔎 Seu cadastro atual:\n\n👤 Nome: ${dados.nome}\n📚 Curso: ${dados.curso}\n✨ Interesses: ${interesses}\n\nO que deseja atualizar?\n\n1 - Nome\n2 - Curso\n3 - Interesses\n\nDigite 0 para cancelar.`
  });

  estados.atualizacao[jid] = { etapa: 1 };
}

async function atualizarCadastro(sock, jid, texto, cadastro, estados) {
  const etapa = estados.atualizacao[jid]?.etapa;

  if (!etapa) return;

  if (texto === "0") {
    delete estados.atualizacao[jid];
    await sock.sendMessage(jid, { text: "❌ Atualização cancelada." });
    return;
  }

  if (etapa === 1) {
    if (texto === "1") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'nome' };
      await sock.sendMessage(jid, { text: "✏️ Informe o novo nome completo:" });
    } else if (texto === "2") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'curso' };
      await sock.sendMessage(jid, { text: "📚 Informe o novo curso (digite o nome completo):" });
    } else if (texto === "3") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'interesses' };
      await sock.sendMessage(jid, { text: "✨ Escolha novos interesses:\n1 - Eventos\n2 - Pesquisa\n\n*Você pode escolher mais de um, separados por vírgula (ex: 1,2)*" });
    } else {
      await sock.sendMessage(jid, { text: "❌ Escolha 1, 2 ou 3." });
    }
    return;
  }

  if (etapa === 2) {
    const tipo = estados.atualizacao[jid].tipo;
    if (tipo === 'nome') {
      cadastro[jid].nome = texto;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Nome atualizado para: ${cadastro[jid].nome}` });
    } else if (tipo === 'curso') {
      const cursoIdentificado = identificarCurso(texto.trim(), true);
      if (!cursoIdentificado) {
        await sock.sendMessage(jid, { text: "❌ Não consegui identificar o curso. Tente novamente com o nome completo." });
        return;
      }
      cadastro[jid].curso = cursoIdentificado.nome;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Curso atualizado para: ${cursoIdentificado.nome}` });
    } else if (tipo === 'interesses') {
      const opcoes = { "1": "Eventos", "2": "Pesquisa" };
      const novos = texto.split(',').map(v => v.trim()).map(v => opcoes[v]).filter(Boolean);

      if (!novos.length) {
        await sock.sendMessage(jid, { text: "❌ Nenhum interesse válido detectado. Tente novamente." });
        return;
      }

      cadastro[jid].interesses = novos;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Interesses atualizados para: ${cadastro[jid].interesses.join(', ')}` });
    }
    return;
  }
}

module.exports = { iniciarFluxoCadastro, iniciarAtualizacao, atualizarCadastro };
