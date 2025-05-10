/**
 * Envia uma saudação ao usuário.
 * @param {object} sock - Instância do socket Baileys
 * @param {string} jid - ID do usuário
 * @param {object} usuario - Dados do usuário (pode ser undefined)
 */
async function enviarSaudacao(sock, jid, usuario) {
  if (!usuario) {
    await sock.sendMessage(jid, { text: `👋 Oi! Você ainda não está cadastrado no Passarinho. Vamos começar?` });
    return;
  }
  await sock.sendMessage(jid, {
    text: `👋 Olá, ${usuario.nome}! Tudo certo? Se quiser saber o que posso fazer, é só mandar /ajuda.`
  });
}

/**
 * Envia os interesses cadastrados do usuário.
 * @param {object} sock
 * @param {string} jid
 * @param {object} usuario
 */
async function enviarInteresses(sock, jid, usuario) {
  if (!usuario || !usuario.interesses || !Array.isArray(usuario.interesses)) {
    await sock.sendMessage(jid, { text: "❌ Você ainda não escolheu nenhum interesse. Que tal escolher agora?" });
    return;
  }
  const interesses = usuario.interesses.join(', ');
  await sock.sendMessage(jid, {
    text: `📚 Seus interesses:\n${interesses}`
  });
}

/**
 * Envia o menu de ajuda para o usuário.
 * @param {object} sock
 * @param {string} jid
 */
async function enviarAjuda(sock, jid) {
  await sock.sendMessage(jid, {
    text: `📝 Comandos disponíveis:\n\n/ajuda - Mostrar este menu\n/atualizar - Atualizar seu cadastro\n/cardapio - Cadastrar preferências de cardápio\n/interesses - Ver seus interesses\n/figurinha - Transforme uma imagem ou vídeo curto em figurinha!`
  });
}

/**
 * Envia uma mensagem padrão quando o bot não entende o comando.
 * @param {object} sock
 * @param {string} jid
 */
async function enviarMensagemPadrao(sock, jid) {
  await sock.sendMessage(jid, {
    text: "🤖 Não entendi. Manda um /ajuda para ver o que posso fazer."
  });
}

/**
 * Mensagem de sucesso ao enviar comunicado para N usuários
 * @param {number} enviados
 * @returns {string}
 */
function comunicadoEnviado(enviados) {
  return `✅ Comunicado enviado para ${enviados} usuário(s).`;
}

/**
 * Mensagem de sucesso ao enviar mensagem para N contatos
 * @param {number} enviados
 * @returns {string}
 */
function mensagemEnviada(enviados) {
  return `✅ Mensagem enviada para ${enviados} contato(s).`;
}

/**
 * Mensagem de erro ao enviar para um destinatário
 * @param {string} destinatario
 * @param {string} erro
 * @returns {string}
 */
function erroEnvio(destinatario, erro) {
  return `❌ Erro ao enviar para ${destinatario}: ${erro}`;
}

/**
 * Mensagem de erro ao ler contatos
 */
const erroContatos = '❌ Erro ao ler a lista de contatos.';

const permissaoNegada = '❌ Você não tem permissão para usar este comando.';
const resetAtencao = '⚠️ Atenção: Este processo irá limpar todos os cadastros de usuários!';
const resetPergunta = 'Deseja realmente continuar? (sim/não): ';
const resetCancelado = '❌ Reset cancelado.';
const resetBackupCriado = (path) => `🗂 Backup criado em: ${path}`;
const resetSucesso = '✅ Cadastro resetado com sucesso!';

// Mensagens faltantes usadas em outros pontos do sistema
const naoCadastrouCardapio = '❌ Você ainda não cadastrou preferências de cardápio. Use /atualizar para configurar.';
const nenhumCardapio = '❌ Não foi possível obter o cardápio de hoje para nenhum RU.';

// Centralização de mensagens do fluxo de cadastro de cardápio
const msgCardapio = {
  perguntaReceber: 'Deseja receber diariamente o cardápio dos restaurantes da UFMG? (sim ou não)',
  respostaNegativa: 'Tudo bem! Você não receberá o cardápio diário.',
  respostaInvalida: "Resposta inválida. Por favor, digite 'sim' ou 'não'.",
  selecaoRU: 'Selecione quais RUs você deseja acompanhar (digite os números separados por vírgula):',
  nenhumRUValido: 'Nenhum número válido identificado. Por favor, digite números válidos separados por vírgula. Exemplo: 1,3.',
  selecaoRefeicao: 'Para quais refeições deseja receber o cardápio? (digite o número):',
  opcaoRefeicaoInvalida: 'Opção inválida. Digite 1 para Almoço, 2 para Jantar ou 3 para Ambos.',
  preferenciasSalvas: 'Preferências salvas com sucesso! ✅',
  erroCadastro: 'Ocorreu um erro no cadastro de preferências. Tente novamente mais tarde.'
};

module.exports = {
  enviarSaudacao,
  enviarInteresses,
  enviarAjuda,
  enviarMensagemPadrao,
  permissaoNegada,
  resetAtencao,
  resetPergunta,
  resetCancelado,
  resetBackupCriado,
  resetSucesso,
  comunicadoEnviado,
  mensagemEnviada,
  erroEnvio,
  erroContatos,
  naoCadastrouCardapio,
  nenhumCardapio,
  msgCardapio
};
