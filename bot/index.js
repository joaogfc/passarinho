const { conectarWhatsapp } = require('./conexao');
const { tratarMensagemUsuario } = require('../controllers/usuarioController');
const { tratarMensagemGrupo } = require('../controllers/grupoController');
const { carregarArquivo } = require('../utils/arquivos');
const { iniciarFluxoCadastro } = require('../services/cadastroService');
const validarCurso = require('../services/validarCurso');
const log = require('../utils/loggers');
const { agendarEnvios } = require('../controllers/cardapioController');

log.info('Bot Passarinho iniciado.');
log.info('Carregando arquivos de dados...');

// Validação dos arquivos carregados
function validarObjeto(obj, nome) {
  if (!obj || typeof obj !== 'object') {
    log.erro(`Arquivo de dados inválido: ${nome}`);
    throw new Error(`Arquivo de dados essencial corrompido: ${nome}. Corrija ou restaure o arquivo antes de iniciar o bot.`);
  }
  return obj;
}

let cadastro, fontesCursos, fontesInteresses;

try {
  cadastro = validarObjeto(carregarArquivo('./data/cadastro.json'), 'cadastro.json');
  fontesCursos = validarObjeto(carregarArquivo('./data/fontes_cursos.json'), 'fontes_cursos.json');
  fontesInteresses = validarObjeto(carregarArquivo('./data/fontes_interesses.json'), 'fontes_interesses.json');
  log.sucesso('Arquivos carregados com sucesso.');
} catch (e) {
  log.erro(e.message);
  process.exit(1);
}

const estados = {
  cadastro: {},
  atualizacao: {}
};

/**
 * Lida com mensagens privadas recebidas
 */
async function tratarPrivado(sock, jid, texto, msg) {
  try {
    await sock.sendPresenceUpdate('composing', jid);
    const delay = Math.floor(Math.random() * (1500 - 500 + 1)) + 500; // Gera um delay aleatório entre 500ms e 1500ms
    await new Promise(resolve => setTimeout(resolve, delay));
    await sock.sendPresenceUpdate('paused', jid);

    if (global.esperandoRespostas?.[jid]) {
      const resolver = global.esperandoRespostas[jid];
      delete global.esperandoRespostas[jid];
      return resolver(texto);
    }

    log.recebido(`Mensagem privada de ${jid}: "${texto}"`);

    let quotedMsg = undefined;
    if (msg && msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.quotedMessage) {
      quotedMsg = {
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        stanzaId: msg.message.extendedTextMessage.contextInfo.stanzaId,
        participant: msg.message.extendedTextMessage.contextInfo.participant
      };
    }

    // Generalização: detectar quotedMsg para todos os fluxos principais
    if (quotedMsg && quotedMsg.message && quotedMsg.message.conversation) {
      const quotedText = quotedMsg.message.conversation;
      // Fluxo de atualização
      if (!estados.atualizacao[jid] && quotedText.includes('Olha teu cadastro:') && quotedText.includes('O que tu quer mudar?')) {
        log.info(`Usuário ${jid} respondeu quoted à mensagem de atualização. Iniciando fluxo de atualização.`);
        await require('../services/cadastroService').iniciarAtualizacao(sock, jid, cadastro, estados);
        estados.atualizacao[jid] = { etapa: 2, tipo: undefined };
        await require('../services/cadastroService').atualizarCadastro(sock, jid, texto, cadastro, estados);
        return;
      }
      // Fluxo de cadastro (onboarding)
      if (!estados.cadastro[jid] && quotedText.includes('Bão? Bora se cadastrar? Como você gosta de ser chamado?')) {
        log.info(`Usuário ${jid} respondeu quoted à mensagem de cadastro. Iniciando fluxo de cadastro.`);
        await require('../services/cadastroService').iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
        return;
      }
      // Fluxo de preferências de cardápio
      if (quotedText.includes('Deseja receber diariamente o cardápio dos restaurantes da UFMG?')) {
        log.info(`Usuário ${jid} respondeu quoted à mensagem de cardápio. Iniciando fluxo de cardápio.`);
        await require('../services/onboardingService').fluxoCadastroCardapio(sock, jid, cadastro);
        return;
      }
      // Adicione aqui outros fluxos conforme necessário
    }

    if (estados.cadastro[jid]) {
      log.info(`Usuário ${jid} está no meio do cadastro. Encaminhando fluxo...`);
      await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
    } else if (!cadastro[jid]) {
      log.info(`Usuário ${jid} ainda não cadastrado. Iniciando cadastro do zero.`);
      await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
    } else {
      log.info(`Usuário ${jid} já está cadastrado. Encaminhando mensagem ao controlador de usuário.`);
      await tratarMensagemUsuario(sock, jid, texto, cadastro, estados, msg, quotedMsg); // Passa quotedMsg para o handler
    }
  } catch (e) {
    log.erro(`Erro ao tratar mensagem privada de ${jid}: ${e.message}`);
  }
}

/**
 * Lida com mensagens de grupo recebidas
 */
async function tratarGrupo(sock, jid, msg, texto) {
  try {
    log.recebido(`Mensagem em grupo de ${jid}: "${texto}"`);
    await tratarMensagemGrupo(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses);
  } catch (e) {
    log.erro(`Erro ao tratar mensagem de grupo de ${jid}: ${e.message}`);
  }
}

/**
 * Inicializa o bot e agenda envios
 */
async function iniciar() {
  try {
    log.info('Estabelecendo conexão com o WhatsApp...');
    const sock = await conectarWhatsapp(tratarPrivado, tratarGrupo);
    log.sucesso('Conexão com o WhatsApp estabelecida com sucesso.');

    // Agenda envios de cardápio após conexão
    await agendarEnvios(sock);
  } catch (e) {
    log.erro(`Erro ao iniciar o bot: ${e.message}`);
  }
}

iniciar();
