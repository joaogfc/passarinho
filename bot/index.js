const { conectarWhatsapp } = require('./conexao');
const { tratarMensagemUsuario } = require('../controllers/usuarioController');
const { tratarMensagemGrupo } = require('../controllers/grupoController');
const { carregarArquivo } = require('../utils/arquivos');
const { iniciarFluxoCadastro } = require('../services/cadastroService');
const validarCurso = require('../services/validarCurso');

// Carregar os dados
let cadastro = carregarArquivo('./cadastro.json');
let fontesCursos = carregarArquivo('./fontes_cursos.json');
let fontesInteresses = carregarArquivo('./fontes_interesses.json');

// Estados dos usuários (cadastro e atualização)
const estados = {
  cadastro: {},
  atualizacao: {}
};

// Função principal para tratar mensagens privadas
async function tratarPrivado(sock, jid, texto) {
  if (estados.cadastro[jid]) {
    await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
  } else if (!cadastro[jid]) {
    await iniciarFluxoCadastro(sock, jid, texto, cadastro, estados);
  } else {
    await tratarMensagemUsuario(sock, jid, texto, cadastro, estados);
  }
}

// Função principal para tratar mensagens de grupo
async function tratarGrupo(sock, jid, msg, texto) {
  await tratarMensagemGrupo(sock, jid, msg, texto, cadastro, fontesCursos, fontesInteresses);
}

// Iniciar a conexão com o WhatsApp
async function iniciar() {
  await conectarWhatsapp(tratarPrivado, tratarGrupo);
}

iniciar();
