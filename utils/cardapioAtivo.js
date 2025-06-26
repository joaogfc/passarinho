// utils/cardapioAtivo.js
// Centraliza o controle de ativação/desativação do cardápio

let cardapioAtivo = true;
let onboardingCardapioAtivo = true;

function setCardapioAtivo(valor) {
  cardapioAtivo = valor;
}
function getCardapioAtivo() {
  return cardapioAtivo;
}
function setOnboardingCardapioAtivo(valor) {
  onboardingCardapioAtivo = valor;
}
function getOnboardingCardapioAtivo() {
  return onboardingCardapioAtivo;
}

module.exports = {
  setCardapioAtivo,
  getCardapioAtivo,
  setOnboardingCardapioAtivo,
  getOnboardingCardapioAtivo
};
