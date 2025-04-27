const { salvarCadastro } = require('../utils/arquivos');

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
    await sock.sendMessage(jid, { text: "📚 Qual seu curso?\n1 - Ciência da Computação\n2 - Sistemas de Informação" });
    return;
  }

  if (etapa === 2) {
    const cursos = { "1": "Ciência da Computação", "2": "Sistemas de Informação" };
    const cursoEscolhido = cursos[texto.trim()];

    if (!cursoEscolhido) {
      await sock.sendMessage(jid, { text: "❌ Curso inválido. Responda 1 ou 2." });
      return;
    }

    cadastro[jid].curso = cursoEscolhido;
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
      await sock.sendMessage(jid, { text: "📚 Informe o novo curso:\n1 - Ciência da Computação\n2 - Sistemas de Informação" });
    } else if (texto === "3") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'interesses' };
      await sock.sendMessage(jid, { text: "✨ Escolha novos interesses:\n1 - Eventos\n2 - Pesquisa" });
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
      const cursos = { "1": "Ciência da Computação", "2": "Sistemas de Informação" };
      const curso = cursos[texto.trim()];
      if (!curso) {
        await sock.sendMessage(jid, { text: "❌ Curso inválido. Escolha 1 ou 2." });
        return;
      }
      cadastro[jid].curso = curso;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Curso atualizado para: ${curso}` });
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
