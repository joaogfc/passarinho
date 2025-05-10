const log = require('../utils/loggers');
const fs = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile'); // Adicionado para controle de concorrência
const arquivo = path.resolve(__dirname, '../data/cadastro.json');

/**
 * Persiste preferências de cardápio sem apagar outras infos do usuário.
 * Mescla com dados existentes no arquivo JSON.
 * ALERTA: Uso de lock para evitar corrupção por concorrência
 * @param {string} jid
 * @param {Array<string>} rus
 * @param {Array<string>} tiposRefeicao
 */
async function salvarPreferenciaCardapio(jid, rus, tiposRefeicao) {
  let release;
  try {
    release = await lockfile.lock(arquivo, { retries: 3, stale: 5000 });
    let dados = {};
    try {
      dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
      if (!dados || typeof dados !== 'object') dados = {};
    } catch (e) {
      log.erro('Erro ao ler cadastro.json para salvar preferências: ' + e.message);
      dados = {};
    }
    const existente = dados[jid] || {};
    dados[jid] = {
      ...existente,
      rus,
      tiposRefeicao,
    };
    try {
      fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
    } catch (e) {
      log.erro('Erro ao salvar cadastro.json: ' + e.message);
    }
  } finally {
    if (release) await release();
  }
}

/**
 * Retorna lista de usuários e RUs que pediram um tipo específico de refeição.
 * @param {string} tipo
 * @returns {Promise<Array<{jid: string, ru: string}>>}
 */
async function obterTodosComPreferenciaDeCardapio(tipo) {
  let dados = {};
  try {
    dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
    if (!dados || typeof dados !== 'object') return [];
  } catch (e) {
    log.erro('Erro ao ler cadastro.json para obter preferências: ' + e.message);
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
 * ALERTA: Uso de lock para evitar corrupção por concorrência
 * @param {string} jid
 */
async function removerPreferenciaCardapio(jid) {
  let release;
  try {
    release = await lockfile.lock(arquivo, { retries: 3, stale: 5000 });
    let dados = {};
    try {
      dados = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
      if (!dados || typeof dados !== 'object') return;
    } catch (e) {
      log.erro('Erro ao ler cadastro.json para remover preferências: ' + e.message);
      return;
    }
    if (dados[jid]) {
      delete dados[jid].rus;
      delete dados[jid].tiposRefeicao;
      try {
        fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
      } catch (e) {
        log.erro('Erro ao salvar cadastro.json ao remover preferências: ' + e.message);
      }
    } else {
      log.warn(`Usuário ${jid} não encontrado ao tentar remover preferências.`);
    }
  } finally {
    if (release) await release();
  }
}

module.exports = {
  salvarPreferenciaCardapio,
  obterTodosComPreferenciaDeCardapio,
  removerPreferenciaCardapio
};
