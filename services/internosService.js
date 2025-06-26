const stringSimilarity = require('string-similarity');
const linhasInternas = require('../data/itinerariosInternos');
const siglas = require('../data/siglasInternos');

function encontrarPontoMaisProximo(ponto, listaPontos) {
  const match = stringSimilarity.findBestMatch(ponto.toUpperCase(), listaPontos.map(p => p.toUpperCase()));
  const bestIndex = match.bestMatchIndex;
  return listaPontos[bestIndex];
}

function normalizarEntradaPonto(ponto, listaPontos) {
  // Se for sigla conhecida, retorna o ponto completo
  if (siglas[ponto.toUpperCase()]) return siglas[ponto.toUpperCase()];
  // Busca por similaridade
  const match = stringSimilarity.findBestMatch(ponto.toUpperCase(), listaPontos.map(p => p.toUpperCase()));
  const bestIndex = match.bestMatchIndex;
  return listaPontos[bestIndex];
}

function buscarLinhasPorOrigemDestino(origem, destino) {
  const resultados = [];
  for (const linha of linhasInternas) {
    const pontos = linha.itinerario;
    const origemMatch = stringSimilarity.findBestMatch(origem.toUpperCase(), pontos.map(p => p.toUpperCase()));
    const destinoMatch = stringSimilarity.findBestMatch(destino.toUpperCase(), pontos.map(p => p.toUpperCase()));
    const origemIndex = origemMatch.bestMatchIndex;
    const destinoIndex = destinoMatch.bestMatchIndex;
    if (origemIndex < destinoIndex) {
      resultados.push({
        linha: linha.nome,
        origem: pontos[origemIndex],
        destino: pontos[destinoIndex],
        horarios: linha.horarios,
        origemIndex,
        destinoIndex
      });
    }
  }
  return resultados;
}

function proximoHorario(horarios, horaAtualStr) {
  // horaAtualStr no formato 'HH:mm'
  const [h, m] = horaAtualStr.split(':').map(Number);
  const minutosAtual = h * 60 + m;
  for (const hStr of horarios) {
    const [hh, mm] = hStr.split(':').map(Number);
    const min = hh * 60 + mm;
    if (min >= minutosAtual) return hStr;
  }
  return null;
}

function sugerirPontosProximos(ponto, listaPontos, n = 3) {
  // Retorna os n pontos mais similares
  const match = stringSimilarity.findBestMatch(ponto.toUpperCase(), listaPontos.map(p => p.toUpperCase()));
  // Ordena por rating decrescente
  const ordenados = match.ratings
    .map((r, i) => ({ ponto: listaPontos[i], rating: r.rating }))
    .sort((a, b) => b.rating - a.rating);
  return ordenados.slice(0, n);
}

function buscarRotasComBaldeacao(origem, destino) {
  // Busca rotas com baldeação: origem -> intermediário -> destino
  const resultados = [];
  for (const linha1 of linhasInternas) {
    for (const pontoIntermediario of linha1.itinerario) {
      if (pontoIntermediario === origem) continue;
      // Linha 1 cobre origem -> intermediário
      const idxOrigem = linha1.itinerario.indexOf(origem);
      const idxInter = linha1.itinerario.indexOf(pontoIntermediario);
      if (idxOrigem === -1 || idxInter === -1 || idxOrigem >= idxInter) continue;
      // Agora procura uma linha 2 que cubra intermediário -> destino
      for (const linha2 of linhasInternas) {
        if (linha2 === linha1) continue;
        const idxInter2 = linha2.itinerario.indexOf(pontoIntermediario);
        const idxDestino = linha2.itinerario.indexOf(destino);
        if (idxInter2 === -1 || idxDestino === -1 || idxInter2 >= idxDestino) continue;
        resultados.push({
          linha1: linha1.nome,
          origem,
          pontoIntermediario,
          linha2: linha2.nome,
          destino
        });
      }
    }
  }
  return resultados;
}

module.exports = {
  encontrarPontoMaisProximo: normalizarEntradaPonto,
  buscarLinhasPorOrigemDestino,
  proximoHorario,
  sugerirPontosProximos,
  buscarRotasComBaldeacao
};
