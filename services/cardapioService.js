const puppeteer = require('puppeteer');

async function obterCardapio(ru, date, tipo) {
  const url = 'https://fump.ufmg.br/cardapio-do-dia/';
  // Para depuração visual, descomente a linha abaixo e comente a linha headless:true
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Tenta fechar/aceitar o banner de cookies se aparecer
  try {
    await page.waitForSelector('.cky-consent-container .cky-btn-accept', { timeout: 3000 });
    await page.evaluate(() => {
      const btn = document.querySelector('.cky-consent-container .cky-btn-accept');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500)); // Pequeno delay para sumir o banner
  } catch (e) {
    // Se não aparecer, segue normalmente
  }

  try {
    await page.waitForSelector('button#cookie_action_close_header, .cookie-notice-container button, .cc-btn', { timeout: 3000 });
    // Tenta clicar em botões comuns de cookies
    await page.evaluate(() => {
      const btn = document.querySelector('button#cookie_action_close_header')
        || document.querySelector('.cookie-notice-container button')
        || document.querySelector('.cc-btn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500)); // Pequeno delay para sumir o banner
  } catch (e) {
    // Se não aparecer, segue normalmente
  }

  await page.waitForSelector('select[name="restaurante"]');
  await page.waitForSelector('input[name="data"]');
  await page.waitForSelector('select[name="tipoRefeicao"]');

  await page.select('select[name="restaurante"]', ru);
  await page.evaluate(d => {
    const input = document.querySelector('input[name="data"]');
    input.value = d;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, date);
  await new Promise(r => setTimeout(r, 300)); // Pequeno delay para garantir que o JS processe

  // Seleciona o tipo de refeição exatamente pelo value (com acento)
  const tipoValue = tipo === 'Almoco' ? 'Almoço' : tipo === 'Jantar' ? 'Jantar' : tipo;
  await page.select('select[name="tipoRefeicao"]', tipoValue);
  await new Promise(r => setTimeout(r, 300)); // Pequeno delay para garantir que o JS processe a seleção
  // Loga o valor realmente selecionado para depuração
  const selectedTipo = await page.evaluate(() => document.querySelector('select[name="tipoRefeicao"]').value);
  console.log('[DEBUG] tipoRefeicao selecionado:', selectedTipo);

  await page.evaluate(() => {
    document.querySelector('#form-cardapio').requestSubmit();
  });

  // Aguarda o resultado e deixa visível por alguns segundos
  await page.waitForSelector('#resultado', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 5000)); // 5 segundos para visualização

  const { texto, textoBruto } = await page.$eval('#resultado', div => {
    function extrair(node) {
      let texto = '';
      for (const child of node.children) {
        if (child.tagName === 'H3') {
          texto += `\n${child.innerText}\n`;
        } else if (child.tagName === 'P') {
          texto += `- ${child.innerText}\n`;
        } else if (child.children && child.children.length > 0) {
          texto += extrair(child);
        }
      }
      return texto;
    }
    const txt = extrair(div).trim();
    return { texto: txt, textoBruto: div.innerText.trim() };
  });

  await browser.close();
  if (!texto || texto.toLowerCase().includes('não há cardápio')) {
    console.log('[CARDAPIO RAW]', textoBruto);
    throw new Error(textoBruto || 'Cardápio não encontrado');
  }

  // Mapeia RU para nome
  const ruNomeMap = {
    '1': 'RU Setorial II',
    '2': 'RU Saúde e Direito',
    '5': 'RU ICA',
    '6': 'RU Setorial I',
    'RU Setorial I': 'RU Setorial I',
    'RU Setorial II': 'RU Setorial II',
    'RU Saúde e Direito': 'RU Saúde e Direito',
    'RU ICA': 'RU ICA',
  };
  const ruNome = ruNomeMap[ru] || ru;
  // Formata data para dd/mm/yyyy
  const [yyyy, mm, dd] = date.split('-');
  const dataFormatada = `${dd}/${mm}/${yyyy}`;

  // Formata mensagem bonita
  let msg = `🍽️ *Cardápio ${tipo} - ${dataFormatada} - ${ruNome}*`;
  let secaoAtual = '';
  texto.split(/\n+/).forEach(linha => {
    const l = linha.trim();
    if (!l) return;
    if (/entrada/i.test(l)) {
      msg += '\n\n🥗 *Entrada*';
      secaoAtual = 'entrada';
    } else if (/prato principal/i.test(l)) {
      msg += '\n\n🍛 *Prato Principal*';
      secaoAtual = 'principal';
    } else if (/sobremesa/i.test(l)) {
      msg += '\n\n🍮 *Sobremesa*';
      secaoAtual = 'sobremesa';
    } else {
      // Remove hífen e espaços extras
      msg += '\n' + l.replace(/^[-\s]+/, '');
    }
  });
  msg = msg.replace(/\n{3,}/g, '\n\n').trim();

  return msg;
}

module.exports = { obterCardapio };