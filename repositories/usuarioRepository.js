const fs   = require('fs');
const path = require('path');
const arquivo = path.resolve(__dirname, '../cadastro.json');

/**
 * Persiste preferências de cardápio sem apagar outras infos do usuário.
 * Mescla com dados existentes no arquivo JSON.
 */
async function salvarPreferenciaCardapio(jid, rus, tiposRefeicao) {
  // 1. Lê o JSON atual (ou inicializa vazio)
  let dados = {};
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  } catch (e) {
    dados = {};
  }

  // 2. Mescla campos existentes do usuário
  const existente = dados[jid] || {};
  dados[jid] = {
    ...existente,
    rus,
    tiposRefeicao,
  };

  // 3. Grava de volta com identação
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
}

/**
 * Retorna lista de usuários e RUs que pediram um tipo específico de refeição.
 */
async function obterTodosComPreferenciaDeCardapio(tipo) {
  let dados = {};
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  } catch (e) {
    return [];
  }

  const result = [];
  for (const [jid, u] of Object.entries(dados)) {
    const tipos = u.tiposRefeicao || [];
    const rus = u.rus || [];
    if (tipos.includes(tipo)) {
      rus.forEach(ru => result.push({ jid, ru }));
    }
  }
  return result;
}

/**
 * Remove preferências de cardápio do usuário (rus e tiposRefeicao)
 */
async function removerPreferenciaCardapio(jid) {
  let dados = {};
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  } catch (e) {
    return;
  }
  if (dados[jid]) {
    delete dados[jid].rus;
    delete dados[jid].tiposRefeicao;
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
  }
}

module.exports = {
  salvarPreferenciaCardapio,
  obterTodosComPreferenciaDeCardapio,
  removerPreferenciaCardapio
};
