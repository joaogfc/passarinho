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

let cadastro = carregarArquivo('./cadastro.json');
let fontesCursos = carregarArquivo('./fontes_cursos.json');
let fontesInteresses = carregarArquivo('./fontes_interesses.json');

log.sucesso('Arquivos carregados com sucesso.');

const estados = {
  cadastro: {},
  atualizacao: {}
};

async function tratarPrivado(sock, jid, texto, msg) {
  // Simula que o bot está digitando
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

  if (estados.cadastro[jid]) {
    log.info(`Usuário ${jid} está no meio do cadastro. Encaminhando fluxo...`);
    await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
  } else if (!cadastro[jid]) {
    log.info(`Usuário ${jid} ainda não cadastrado. Iniciando cadastro do zero.`);
    await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
  } else {
    log.info(`Usuário ${jid} já está cadastrado. Encaminhando mensagem ao controlador de usuário.`);
    await tratarMensagemUsuario(sock, jid, texto, cadastro, estados, msg); // Passa msg para o handler
  }
}

async function tratarGrupo(sock, jid, msg, texto) {
  log.recebido(`Mensagem em grupo de ${jid}: "${texto}"`);
  await tratarMensagemGrupo(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses);
}

async function iniciar() {
  log.info('Estabelecendo conexão com o WhatsApp...');
  const sock = await conectarWhatsapp(tratarPrivado, tratarGrupo);
  log.sucesso('Conexão com o WhatsApp estabelecida com sucesso.');

  // Agenda envios de cardápio após conexão
  agendarEnvios(sock);
}

iniciar();
