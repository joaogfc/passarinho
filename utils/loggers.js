// utils/loggers.js
/**
 * Retorna timestamp no formato yyyy-mm-dd HH:MM:SS
 */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Loga mensagem no console com tipo e timestamp
 * @param {string} tipo
 * @param {string} mensagem
 * @returns {string} A string logada
 */
function log(tipo, mensagem) {
  const str = `[${timestamp()}] [${tipo}] ${mensagem}`;
  process.stdout.write(str + '\n');
  return str;
}

module.exports = {
  info: (msg) => log('INFO', msg),
  sucesso: (msg) => log('OK', msg),
  erro: (msg) => log('ERRO', msg),
  recebido: (msg) => log('RECEBIDO', msg),
  warn: (msg) => log('WARN', msg),
};
