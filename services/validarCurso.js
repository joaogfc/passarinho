const log = require('../utils/loggers');
const stringSimilarity = require('string-similarity');

const cursos = [
  "Ciência da Computação", "Ciências Atuariais", "Estatística", "Física", "Matemática",
  "Matemática Computacional", "Química", "Química Tecnológica", "Sistemas de Informação",
  "Ciências Biológicas", "Administração (Campus Montes Claros)", "Agronomia",
  "Engenharia Agrícola e Ambiental", "Engenharia de Alimentos", "Engenharia Florestal",
  "Zootecnia", "Odontologia", "Curso Superior de Tecnologia em Radiologia", "Fonoaudiologia",
  "Medicina", "Letras", "Antropologia", "Ciências Sociais", "Ciências Socioamabientais",
  "Gestão Pública", "Filosofia", "História", "Jornalismo", "Psicologia",
  "Publicidade e Propaganda", "Relações Públicas", "Biomedicina", "Farmácia",
  "Formação Intercultural para Educadores Indígenas", "Licenciatura em Educação do Campo",
  "Pedagogia", "Ciências do Estado", "Direito", "Administração", "Ciências Contábeis",
  "Ciências Econômicas", "Controladoria e Finanças", "Relações Econômicas Internacionais",
  "Aquacultura", "Medicina Veterinária", "Música", "Engenharia Aeroespacial",
  "Engenharia Ambiental", "Engenharia Civil", "Engenharia de Controle e Automação",
  "Engenharia de Minas", "Engenharia de Produção", "Engenharia de Sistemas",
  "Engenharia Elétrica", "Engenharia Mecânica", "Engenharia Metalúrgica",
  "Engenharia Química", "Engenharia de Computação", "Ciência de dados", "Enfermagem",
  "Gestão de Serviços de Saúde", "Nutrição", "Educação Física", "Fisioterapia",
  "Terapia Ocupacional", "Arquivologia", "Biblioteconomia", "Museologia",
  "Artes Visuais", "Cinema de Animação e Artes Visuais", "Conservação e Restauração de Bens Móveis",
  "Dança", "Design de Moda", "Teatro", "Arquitetura e Urbanismo", "Design"
];

/**
 * Identifica o curso mais próximo do input do usuário usando similaridade de strings.
 * @param {string} inputUsuario - Nome do curso informado pelo usuário
 * @returns {{ nome: string, rating: number }}
 */
function identificarCurso(inputUsuario) {
  if (typeof inputUsuario !== 'string' || !inputUsuario.trim()) {
    log.erro('[VALIDAR CURSO] Entrada inválida para identificação de curso.');
    return { nome: '', rating: 0 };
  }
  const match = stringSimilarity.findBestMatch(inputUsuario.toLowerCase(), cursos.map(c => c.toLowerCase()));
  const melhorIndice = match.bestMatchIndex;
  const melhorNota = match.bestMatch.rating;
  const cursoCorrespondente = cursos[melhorIndice];
  log.info(`[VALIDAR CURSO] Usuário digitou: "${inputUsuario}" | Correspondência: "${cursoCorrespondente}" (score: ${melhorNota})`);
  return {
    nome: cursoCorrespondente,
    rating: melhorNota
  };
}

module.exports = { identificarCurso, cursos };
