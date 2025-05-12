// utils/cardapioCache.js
// Singleton para cache de cardápio

let cacheCardapio = {};

function getCardapio() {
  return cacheCardapio;
}

function setCardapio(cardapio) {
  cacheCardapio = cardapio;
}

function clearCardapio() {
  cacheCardapio = {};
}

module.exports = {
  getCardapio,
  setCardapio,
  clearCardapio
};
