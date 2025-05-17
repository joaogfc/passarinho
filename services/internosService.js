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

module.exports = {
  encontrarPontoMaisProximo: normalizarEntradaPonto,
  buscarLinhasPorOrigemDestino,
  proximoHorario
};
