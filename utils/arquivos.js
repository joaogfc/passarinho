const log = require('./loggers');
const fs = require('fs');

/**
 * Salva o cadastro no caminho especificado.
 * @param {object} cadastro
 * @param {string} pathCadastro
 * @returns {boolean} true se salvou com sucesso, false se houve erro
 */
function salvarCadastro(cadastro, pathCadastro) {
  try {
    fs.writeFileSync(pathCadastro, JSON.stringify(cadastro, null, 2));
    return true;
  } catch (error) {
    log.erro('Erro ao salvar cadastro: ' + error.message);
    return false;
  }
}

/**
 * Carrega um arquivo JSON do caminho especificado.
 * @param {string} path
 * @returns {object} Objeto carregado ou objeto vazio em caso de erro
 */
function carregarArquivo(path) {
  try {
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path);
      const obj = JSON.parse(data);
      if (obj && typeof obj === 'object') return obj;
    }
    return {};
  } catch (error) {
    log.erro('Erro ao carregar arquivo: ' + error.message);
    return {};
  }
}

module.exports = { salvarCadastro, carregarArquivo };
