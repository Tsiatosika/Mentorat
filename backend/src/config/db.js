const { Pool } = require('pg');

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                     // Nombre maximum de connexions
  idleTimeoutMillis: 30000,    // Temps avant fermeture d'une connexion inactive
  connectionTimeoutMillis: 2000,
});

// Test de connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connecté avec succès');
    
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log(`📅 Heure serveur: ${result.rows[0].now}`);
    console.log(`🐘 Version PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    throw error;
  }
};

// Fonction utilitaire pour exécuter des requêtes
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, transaction, testConnection };