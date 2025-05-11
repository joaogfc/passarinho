const log = require('../utils/loggers');
const puppeteer = require('puppeteer');

/**
 * Obtém o cardápio do RU para uma data e tipo de refeição.
 * @param {string} ru - ID ou nome do RU
 * @param {string} date - Data no formato yyyy-mm-dd
 * @param {string} tipo - "Almoço" ou "Jantar"
 * @returns {Promise<string>} Cardápio formatado
 */
async function obterCardapio(ru, date, tipo) {
  const url = 'https://fump.ufmg.br/cardapio-do-dia/';
  let browser;
  let msg = null;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Tenta fechar/aceitar o banner de cookies se aparecer
    try {
      await page.waitForSelector('.cky-consent-container .cky-btn-accept', { timeout: 3000 });
      await page.evaluate(() => {
        const btn = document.querySelector('.cky-consent-container .cky-btn-accept');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {}
    try {
      await page.waitForSelector('button#cookie_action_close_header, .cookie-notice-container button, .cc-btn', { timeout: 3000 });
      await page.evaluate(() => {
        const btn = document.querySelector('button#cookie_action_close_header')
          || document.querySelector('.cookie-notice-container button')
          || document.querySelector('.cc-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {}
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
    await new Promise(r => setTimeout(r, 300));
    const tipoValue = tipo.normalize('NFD').replace(/\p{Diacritic}/gu, '') === 'Almoco' ? 'Almoço' : tipo === 'Jantar' ? 'Jantar' : tipo;
    await page.select('select[name="tipoRefeicao"]', tipoValue);
    await new Promise(r => setTimeout(r, 300));
    const selectedTipo = await page.evaluate(() => document.querySelector('select[name="tipoRefeicao"]').value);
    log.info('[CARDAPIO] tipoRefeicao selecionado: ' + selectedTipo);
    await page.evaluate(() => {
      document.querySelector('#form-cardapio').requestSubmit();
    });
    await page.waitForSelector('#resultado', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 5000));
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
    if (!texto || texto.toLowerCase().includes('não há cardápio')) {
      log.warn('[CARDAPIO RAW] ' + textoBruto);
      // Se for a mensagem padrão do site, propague para o usuário
      if (textoBruto && textoBruto.trim() === 'Não há cardápio disponível para a data selecionada.') {
        throw new Error('Não há cardápio disponível para a data selecionada.');
      }
      throw new Error(textoBruto || 'Cardápio não encontrado');
    }
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
    const [yyyy, mm, dd] = date.split('-');
    const dataFormatada = `${dd}/${mm}/${yyyy}`;
    msg = `🍽️ *Cardápio ${tipo} - ${dataFormatada} - ${ruNome}*`;
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
        msg += '\n' + l.replace(/^[-\s]+/, '');
      }
    });
    msg = msg.replace(/\n{3,}/g, '\n\n').trim();
  } catch (e) {
    log.erro(`[CARDAPIO] Erro ao obter cardápio para RU ${ru}, data ${date}, tipo ${tipo}: ${e.message}`);
    throw e;
  } finally {
    if (browser) await browser.close();
  }
  return msg;
}

module.exports = { obterCardapio };