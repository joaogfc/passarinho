// Funções e utilidades exclusivas do ADMIN

const ADMIN_ID = '553397055277@s.whatsapp.net';
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

// Exemplo de função exclusiva do admin
function adminOnlyFunction() {
  // ... código restrito ao admin ...
  return 'Função exclusiva do admin executada!';
}

// Função exclusiva do admin para responder ao comando /ping
function adminPing() {
  return 'Pong! (admin)';
}

// Função exclusiva do admin para lidar com o comando /cardapiododia
async function handleCardapioDoDia(sock, jid, cadastro, obterCardapio) {
  const user = cadastro[jid];
  if (!user || !Array.isArray(user.rus) || user.rus.length === 0 || !Array.isArray(user.tiposRefeicao) || user.tiposRefeicao.length === 0) {
    await sock.sendMessage(jid, { text: 'Você ainda não cadastrou preferências de cardápio. Use /cardapio para configurar.' });
    return;
  }
  const ruMap = {
    'RU Setorial I': '6',
    'RU Setorial II': '1',
    'RU Saúde e Direito': '2',
    'RU ICA': '5',
  };
  const today = new Date().toISOString().slice(0, 10);
  let consultas = [];
  let informativo = 'Consultando cardápio para:\n';
  for (const ruNome of user.rus) {
    for (const tipo of user.tiposRefeicao) {
      if (ruNome === 'RU Setorial II' && tipo === 'Jantar') continue; // Ignora Jantar para RU Setorial II
      informativo += `- ${ruNome} (${tipo})\n`;
      consultas.push({ ruNome, ruId: ruMap[ruNome] || ruNome, tipo });
    }
  }
  await sock.sendMessage(jid, { text: informativo.trim() });
  let algumSucesso = false;
  let respostas = [];
  for (const consulta of consultas) {
    try {
      const textoCardapio = await obterCardapio(consulta.ruId, today, consulta.tipo);
      respostas.push(textoCardapio);
      algumSucesso = true;
    } catch (e) {
      respostas.push(`❌ Não foi possível obter o cardápio de hoje para ${consulta.ruNome} (${consulta.tipo}).`);
    }
  }
  await sock.sendMessage(jid, { text: respostas.join('\n\n') });
  if (!algumSucesso) {
    await sock.sendMessage(jid, { text: 'Não foi possível obter nenhum cardápio de hoje para suas preferências.' });
  }
}

// Função para enviar comunicado do admin para todos os usuários cadastrados (suporta anexos)
async function handleComunicado(sock, jid, cadastro, texto, quotedMsg, msg) {
  const comunicado = texto.replace(/^\/comunicado\s*/i, '').trim();
  let enviados = 0;
  let tipoMensagem = msg ? Object.keys(msg.message || {})[0] : undefined;
  for (const userId of Object.keys(cadastro)) {
    if (userId === ADMIN_ID) continue;
    try {
      if (tipoMensagem && ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'].includes(tipoMensagem)) {
        // Garante que está pegando a mensagem correta (caso seja uma mensagem encaminhada, use msg.messageContextInfo?.quotedMessage)
        const mediaMsg = msg.messageContextInfo?.quotedMessage || msg.message;
        const buffer = await downloadMediaMessage({ ...msg, message: mediaMsg }, 'buffer', {});
        let sendOpts = {};
        if (tipoMensagem === 'imageMessage') sendOpts = { image: buffer };
        else if (tipoMensagem === 'videoMessage') sendOpts = { video: buffer };
        else if (tipoMensagem === 'audioMessage') sendOpts = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
        else if (tipoMensagem === 'stickerMessage') sendOpts = { sticker: buffer };
        else if (tipoMensagem === 'documentMessage') {
          const docMsg = mediaMsg.documentMessage || msg.message.documentMessage;
          sendOpts = {
            document: buffer,
            mimetype: docMsg.mimetype || 'application/pdf',
            fileName: docMsg.fileName || 'arquivo.pdf'
          };
        }
        // Adiciona legenda/caption se houver texto (exceto para documentMessage)
        if (comunicado && (tipoMensagem === 'imageMessage' || tipoMensagem === 'videoMessage')) {
          sendOpts.caption = comunicado;
        }
        if (!buffer || buffer.length === 0) throw new Error('Buffer de mídia vazio');
        await sock.sendMessage(userId, sendOpts);
        // Para documentMessage, envia o texto separado se houver
        if (comunicado && tipoMensagem === 'documentMessage') {
          await sock.sendMessage(userId, { text: `*Comunicado do Administrador:*\n${comunicado}` });
        }
        // Se for só mídia, não envia texto separado para outros tipos
        if (comunicado && !['imageMessage','videoMessage','documentMessage'].includes(tipoMensagem)) {
          await sock.sendMessage(userId, { text: `*Comunicado do Administrador:*\n${comunicado}` });
        }
      } else if (quotedMsg && quotedMsg.message) {
        await sock.sendMessage(userId, quotedMsg.message, { quoted: undefined });
        if (comunicado) {
          await sock.sendMessage(userId, { text: `*Comunicado do Administrador:*\n${comunicado}` });
        }
      } else if (comunicado) {
        await sock.sendMessage(userId, { text: `*Comunicado do Administrador:*\n${comunicado}` });
      }
      enviados++;
    } catch (e) {
      await sock.sendMessage(jid, { text: `Erro ao enviar para ${userId}: ${e.message}` });
      console.error('Erro ao enviar mídia:', e);
    }
  }
  await sock.sendMessage(jid, { text: `Comunicado enviado para ${enviados} usuário(s).` });
}

// Função para repassar mensagem do admin para todos os contatos em contatos.json (suporta anexos)
async function handleContatar(sock, jid, texto, quotedMsg, msg) {
  const mensagem = texto.replace(/^\/contatar\s*/i, '').trim();
  const contatosPath = path.resolve(__dirname, '../contatos.json');
  let contatos;
  try {
    const data = fs.readFileSync(contatosPath, 'utf8');
    contatos = JSON.parse(data).contatos || [];
  } catch (e) {
    await sock.sendMessage(jid, { text: 'Não foi possível carregar a lista de contatos.' });
    return;
  }
  let enviados = 0;
  let tipoMensagem = msg ? Object.keys(msg.message || {})[0] : undefined;
  for (const contato of contatos) {
    try {
      if (tipoMensagem && ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'].includes(tipoMensagem)) {
        // Garante que está pegando a mensagem correta (caso seja uma mensagem encaminhada, use msg.messageContextInfo?.quotedMessage)
        const mediaMsg = msg.messageContextInfo?.quotedMessage || msg.message;
        const buffer = await downloadMediaMessage({ ...msg, message: mediaMsg }, 'buffer', {});
        let sendOpts = {};
        if (tipoMensagem === 'imageMessage') sendOpts = { image: buffer };
        else if (tipoMensagem === 'videoMessage') sendOpts = { video: buffer };
        else if (tipoMensagem === 'audioMessage') sendOpts = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
        else if (tipoMensagem === 'stickerMessage') sendOpts = { sticker: buffer };
        else if (tipoMensagem === 'documentMessage') {
          const docMsg = mediaMsg.documentMessage || msg.message.documentMessage;
          sendOpts = {
            document: buffer,
            mimetype: docMsg.mimetype || 'application/pdf',
            fileName: docMsg.fileName || 'arquivo.pdf'
          };
        }
        // Adiciona legenda/caption se houver texto (exceto para documentMessage)
        if (mensagem && (tipoMensagem === 'imageMessage' || tipoMensagem === 'videoMessage')) {
          sendOpts.caption = mensagem;
        }
        if (!buffer || buffer.length === 0) throw new Error('Buffer de mídia vazio');
        await sock.sendMessage(contato, sendOpts);
        // Para documentMessage, envia o texto separado se houver
        if (mensagem && tipoMensagem === 'documentMessage') {
          await sock.sendMessage(contato, { text: `*Mensagem do Administrador:*\n${mensagem}` });
        }
        // Se for só mídia, não envia texto separado para outros tipos
        if (mensagem && !['imageMessage','videoMessage','documentMessage'].includes(tipoMensagem)) {
          await sock.sendMessage(contato, { text: `*Mensagem do Administrador:*\n${mensagem}` });
        }
      } else if (quotedMsg && quotedMsg.message) {
        await sock.sendMessage(contato, quotedMsg.message, { quoted: undefined });
        if (mensagem) {
          await sock.sendMessage(contato, { text: `*Mensagem do Administrador:*\n${mensagem}` });
        }
      } else if (mensagem) {
        await sock.sendMessage(contato, { text: `*Mensagem do Administrador:*\n${mensagem}` });
      }
      enviados++;
    } catch (e) {
      await sock.sendMessage(jid, { text: `Erro ao enviar para ${contato}: ${e.message}` });
      console.error('Erro ao enviar mídia:', e);
    }
  }
  await sock.sendMessage(jid, { text: `Mensagem enviada para ${enviados} contato(s).` });
}

module.exports = {
  isAdmin,
  adminOnlyFunction,
  adminPing,
  handleCardapioDoDia,
  handleComunicado,
  handleContatar,
  ADMIN_ID
};
