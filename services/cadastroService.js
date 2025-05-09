const { salvarCadastro } = require('../utils/arquivos');
const { identificarCurso } = require('../services/validarCurso'); // nova importação
const { fluxoCadastroCardapio } = require('../services/onboardingService');
// Fluxo de cadastro automático
async function iniciarFluxoCadastro(sock, jid, texto, cadastro, estados) {
  if (!estados.cadastro) estados.cadastro = {};

  if (!estados.cadastro[jid]) {
    estados.cadastro[jid] = { etapa: 1 };
    await sock.sendMessage(jid, { text: "👋 Opa! Bão? Bora se cadastrar? Como você gosta de ser chamado?"});
    return;
  }

  const etapa = estados.cadastro[jid].etapa;

  if (etapa === 1) {
    cadastro[jid] = { nome: texto };
    estados.cadastro[jid].etapa = 2;
    await sock.sendMessage(jid, { text: "📚 Manda aí o nome do teu curso (pode ser do jeitinho que tu fala que eu entendo)" });
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
        text: `✅ Fechou! Curso é *${sugestao}* mesmo. Agora me conta teus interesses:
1 - Eventos
2 - Pesquisa
(Manda os números separados por vírgula, tipo: 1,2)`
      });
    } else {
      estados.cadastro[jid].etapa = 2;
      delete estados.cadastro[jid].confirmarCurso;
      await sock.sendMessage(jid, {
        text: '🔁 Deu ruim! Tenta digitar o nome do curso de novo, por favor.'
      });
    }
    return;
  }

  if (etapa === 2) {
    const cursoIdentificado = identificarCurso(texto.trim(), true); // modo detalhado

    if (!cursoIdentificado) {
      await sock.sendMessage(jid, { text: "❌ Não achei esse curso não, hein! Tenta de novo, mas sem preguiça!" });
      return;
    }

    if (cursoIdentificado.rating < 0.9) {
      estados.cadastro[jid].etapa = 2.5;
      estados.cadastro[jid].confirmarCurso = cursoIdentificado.nome;
      await sock.sendMessage(jid, {
        text: `🤔 Tu quis dizer *${cursoIdentificado.nome}*? (responde sim ou não, sem medo!)`
      });
      return;
    }

    cadastro[jid].curso = cursoIdentificado.nome;
    estados.cadastro[jid].etapa = 3;
    await sock.sendMessage(jid, { text: "✨ Agora me diz teus interesses:\n1 - Eventos\n2 - Pesquisa\n(Manda os números separados por vírgula, tipo: 1,2)" });
    return;
  }

  if (etapa === 3) {
    const opcoes = { "1": "Eventos", "2": "Pesquisa" };
    const interesses = texto.split(',').map(v => v.trim()).map(v => opcoes[v]).filter(Boolean);

    if (!interesses.length) {
      await sock.sendMessage(jid, { text: "❌ Não entendi nada dos teus interesses! Tenta de novo, vai!" });
      return;
    }

    cadastro[jid].interesses = interesses;
    salvarCadastro(cadastro, './cadastro.json');
    delete estados.cadastro[jid];
    await sock.sendMessage(jid, { text: "✅ Cadastro feito! Agora é só alegria 😁\n\nVocê pode usar /ajuda pra ver o que eu posso fazer! ✨" });

    const { fluxoCadastroCardapio } = require('../services/onboardingService');
    await fluxoCadastroCardapio(sock, jid);
  }
}

// Fluxo de atualização de dados
async function iniciarAtualizacao(sock, jid, cadastro, estados) {
  const dados = cadastro[jid];

  if (!dados) {
    await sock.sendMessage(jid, { text: "❌ Tu nem tá cadastrado ainda, pô!" });
    return;
  }

  const interesses = (dados.interesses && Array.isArray(dados.interesses))
    ? dados.interesses.join(', ')
    : 'Nada cadastrado ainda';
  const rus = (dados.rus && Array.isArray(dados.rus)) ? dados.rus.join(', ') : 'Nada cadastrado ainda';
  const tiposRefeicao = (dados.tiposRefeicao && Array.isArray(dados.tiposRefeicao)) ? dados.tiposRefeicao.join(', ') : 'Nada cadastrado ainda';

  await sock.sendMessage(jid, {
    text: `🔎 Olha teu cadastro:

👤 Nome: ${dados.nome}
📚 Curso: ${dados.curso}
✨ Interesses: ${interesses}
🍽️ RUs: ${rus}
🍴 Tipos de Refeição: ${tiposRefeicao}

O que tu quer mudar?

1 - Nome
2 - Curso
3 - Interesses
4 - Preferências do Cardápio

Manda 0 pra cancelar!`
  });

  estados.atualizacao[jid] = { etapa: 1 };
}

async function atualizarCadastro(sock, jid, texto, cadastro, estados) {
  const etapa = estados.atualizacao[jid]?.etapa;

  if (!etapa) return;

  if (texto === "0") {
    delete estados.atualizacao[jid];
    await sock.sendMessage(jid, { text: "❌ Relaxa, atualização cancelada!" });
    return;
  }

  if (etapa === 1) {
    if (texto === "1") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'nome' };
      await sock.sendMessage(jid, { text: "✏️ Manda teu novo nome ou apelido aí:" });
    } else if (texto === "2") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'curso' };
      await sock.sendMessage(jid, { text: "📚 Qual o novo curso?" });
    } else if (texto === "3") {
      estados.atualizacao[jid] = { etapa: 2, tipo: 'interesses' };
      await sock.sendMessage(jid, { text: "✨ Escolhe teus novos interesses:\n1 - Eventos\n2 - Pesquisa\n\n*Pode escolher mais de um, só separar por vírgula (tipo: 1,2)*" });
    } else if (texto === "4") {
      // Chama o fluxo de atualização do cardápio
      delete estados.atualizacao[jid];
      await fluxoCadastroCardapio(sock, jid);
      return;
    } else {
      await sock.sendMessage(jid, { text: "❌ Escolhe 1, 2, 3 ou 4, vai!" });
    }
    return;
  }

  if (etapa === 2) {
    const tipo = estados.atualizacao[jid].tipo;
    if (tipo === 'nome') {
      cadastro[jid].nome = texto;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Nome atualizado! Agora tu é oficialmente: ${cadastro[jid].nome}` });
    } else if (tipo === 'curso') {
      const cursoIdentificado = identificarCurso(texto.trim(), true);
      if (!cursoIdentificado) {
        await sock.sendMessage(jid, { text: "❌ Não achei esse curso não, tenta de novo!" });
        return;
      }
      cadastro[jid].curso = cursoIdentificado.nome;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Curso atualizado! Agora tu é do: ${cursoIdentificado.nome}` });
    } else if (tipo === 'interesses') {
      const opcoes = { "1": "Eventos", "2": "Pesquisa" };
      const novos = texto.split(',').map(v => v.trim()).map(v => opcoes[v]).filter(Boolean);

      if (!novos.length) {
        await sock.sendMessage(jid, { text: "❌ Não entendi teus interesses! Tenta de novo, por favor." });
        return;
      }

      cadastro[jid].interesses = novos;
      salvarCadastro(cadastro, './cadastro.json');
      delete estados.atualizacao[jid];
      await sock.sendMessage(jid, { text: `✅ Interesses atualizados! Agora tu curte: ${cadastro[jid].interesses.join(', ')}` });
    }
    return;
  }
}

module.exports = { iniciarFluxoCadastro, iniciarAtualizacao, atualizarCadastro };
