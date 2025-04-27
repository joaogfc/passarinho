const fs = require('fs');
const readline = require('readline');

// Caminhos dos arquivos
const pathCadastro = './cadastro.json';
const pathBackup = `./backup/cadastro_backup_${Date.now()}.json`; // Cria pasta backup automática

// Função para confirmar no terminal
function perguntarConfirmacao(pergunta) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      rl.close();
      resolve(resposta.toLowerCase());
    });
  });
}

// Função principal de reset
async function resetarCadastro() {
  console.log('⚠️ Atenção: Este processo irá limpar todos os cadastros de usuários!');

  const resposta = await perguntarConfirmacao('Deseja realmente continuar? (sim/não): ');

  if (resposta !== 'sim') {
    console.log('❌ Reset cancelado.');
    return;
  }

  // Criar a pasta de backup se não existir
  if (!fs.existsSync('./backup')) {
    fs.mkdirSync('./backup');
  }

  // Criar backup
  if (fs.existsSync(pathCadastro)) {
    fs.copyFileSync(pathCadastro, pathBackup);
    console.log(`🗂 Backup criado em: ${pathBackup}`);
  }

  // Resetar cadastro
  fs.writeFileSync(pathCadastro, JSON.stringify({}, null, 2));
  console.log('✅ Cadastro resetado com sucesso!');
}

resetarCadastro();
