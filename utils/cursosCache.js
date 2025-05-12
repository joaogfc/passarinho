// utils/cursosCache.js
// Singleton para cache de cursos

const fs = require('fs');
let cursosCache = null;

function carregarCursos() {
  if (!cursosCache) {
    cursosCache = JSON.parse(fs.readFileSync('data/fontes_cursos.json', 'utf8'));
  }
  return cursosCache;
}

function limparCacheCursos() {
  cursosCache = null;
}

module.exports = {
  carregarCursos,
  limparCacheCursos
};
