const fs = require('fs');

function salvarCadastro(cadastro, pathCadastro) {
  try {
    fs.writeFileSync(pathCadastro, JSON.stringify(cadastro, null, 2));
  } catch (error) {
    console.error("❌ Erro ao salvar cadastro:", error);
  }
}

function carregarArquivo(path) {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path));
    }
    return {};
  } catch (error) {
    console.error("❌ Erro ao carregar arquivo:", error);
    return {};
  }
}

module.exports = { salvarCadastro, carregarArquivo };
