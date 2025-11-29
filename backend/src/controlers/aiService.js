const axios = require('axios');

/**
 * Servicio de generación de preguntas de trivia
 * Usa Open Trivia Database API
 */

const NO_TRANSLATE_WORDS = {
  'gamecube', 'dreamcast', 'playstation', 'xbox', 'wii', 'switch',
  'snes', 'nes', 'n64', 'ps1', 'ps2', 'ps3', 'ps4', 'ps5',
  'gameboy', 'ds', 'psp', 'vita', 'atari', 'sega',
  'christopher', 'rodrigo', 'alexander', 'elizabeth',
  'nintendo', 'sony', 'microsoft', 'apple', 'google',
  'facebook', 'twitter', 'youtube', 'netflix',
};

/**
 * Decodifica entidades HTML
 */
const decodeHtmlEntities = (text) => {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  return decoded;
};

/**
 * Obtiene una pregunta de Open Trivia Database API
 */
const getQuestionFromOpenTDB = async (difficulty = 'medium', retry = 0) => {
  try {
    const url = `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=${difficulty}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = response.data;
    
    if (data.response_code !== 0) {
      throw new Error(`API returned code: ${data.response_code}`);
    }
    
    const questionData = data.results[0];
    
    // Decodificar entidades HTML
    const questionText = decodeHtmlEntities(questionData.question);
    const correct = decodeHtmlEntities(questionData.correct_answer);
    const incorrect = questionData.incorrect_answers.map(ans => decodeHtmlEntities(ans));
    const category = decodeHtmlEntities(questionData.category);
    
    // Preparar opciones
    const allOptions = [correct, ...incorrect];
    
    // Mezclar opciones
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    // Encontrar índice de la respuesta correcta
    const correctIndex = shuffledOptions.indexOf(correct);
    
    return {
      question: questionText,
      options: shuffledOptions,
      correct_answer: correctIndex,
      difficulty: difficulty,
      category: category,
      explanation: `La respuesta correcta es: ${correct}`
    };
  } catch (error) {
    console.error(`⚠️ Error obteniendo pregunta de OpenTDB: ${error.message}`);
    
    // Reintentar si es rate limit
    if (error.response?.status === 429 && retry < 2) {
      const waitTime = 2 * (retry + 1);
      console.log(`  ⏳ Rate limit, esperando ${waitTime}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return getQuestionFromOpenTDB(difficulty, retry + 1);
    }
    
    return null;
  }
};

/**
 * Genera una pregunta de forma síncrona
 */
const generateSingleQuestionSync = async (difficulty = 'medium') => {
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
  const actualDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  
  const question = await getQuestionFromOpenTDB(actualDifficulty);
  
  if (!question) {
    console.log('⚠️ No se pudo obtener pregunta');
    return null;
  }
  
  return question;
};

/**
 * Genera múltiples preguntas para una ronda
 */
const generateRoundQuestions = async (numQuestions = 5) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generando ${numQuestions} preguntas de trivia...`);
  console.log(`${'='.repeat(60)}`);
  
  const questions = [];
  
  for (let i = 0; i < numQuestions; i++) {
    // Delay escalonado para evitar rate limit
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Variar dificultad progresivamente
    let currentDifficulty = 'easy';
    if (i >= 2 && i < 4) {
      currentDifficulty = 'medium';
    } else if (i >= 4) {
      currentDifficulty = 'hard';
    }
    
    console.log(`\n${i + 1}. Obteniendo pregunta (${currentDifficulty})...`);
    
    const question = await getQuestionFromOpenTDB(currentDifficulty);
    
    if (question) {
      questions.push(question);
      console.log(`  ✓ Pregunta ${i + 1} obtenida`);
    } else {
      console.log(`  ⚠️ No se pudo obtener pregunta ${i + 1}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ ${questions.length} preguntas generadas exitosamente`);
  console.log(`${'='.repeat(60)}\n`);
  
  return questions;
};

module.exports = {
  generateSingleQuestionSync,
  generateRoundQuestions,
  getQuestionFromOpenTDB
};
