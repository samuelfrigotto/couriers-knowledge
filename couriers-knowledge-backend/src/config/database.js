// ARQUIVO: backend/src/config/database.js

require('dotenv').config();
const { Pool } = require('pg');

// --- Lógica para SSL Condicional ---
// A configuração de SSL só será ativada se a variável de ambiente NODE_ENV for 'production'
const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Se estiver em produção (ex: Railway), adiciona a configuração SSL.
  // Se não, o objeto ssl será undefined e a conexão será normal.
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
};

const pool = new Pool(connectionConfig);

pool.on('connect', () => {
  console.log('Base de Dados conectada com sucesso!');
});

pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com a Base de Dados:', err);
  process.exit(-1);
});

// Exportamos o objeto com os métodos, como definido anteriormente.
module.exports = {
  /**
   * Executa uma consulta simples no pool.
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Obtém um cliente do pool para transações.
   */
  connect: () => pool.connect(),
};