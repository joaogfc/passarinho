// utils/logger.js

function timestamp() {
    return new Date().toISOString().replace('T', ' ').split('.')[0];
  }
  
  function log(tipo, mensagem) {
    console.log(`[${timestamp()}] [${tipo}] ${mensagem}`);
  }
  
  module.exports = {
    info: (msg) => log('INFO', msg),
    sucesso: (msg) => log('OK', msg),
    erro: (msg) => log('ERRO', msg),
    recebido: (msg) => log('RECEBIDO', msg),
  };
  