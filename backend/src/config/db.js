// src/config/db.js
const { Pool } = require('pg');

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'mentorat_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: process.env.NODE_ENV === 'production' ? 10000 : 5000,
});

// Logs des événements du pool
pool.on('connect', () => {
  console.log('🔌 Nouvelle connexion PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur pool PostgreSQL:', err.message);
});

pool.on('remove', () => {
  console.log('🔌 Connexion PostgreSQL fermée');
});

/**
 * Test de connexion avec retry
 * @param {number} retries - Nombre de tentatives
 * @param {number} delay - Délai entre les tentatives en ms
 */
const testConnection = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as now, version() as version');
      console.log('✅ PostgreSQL connecté avec succès');
      console.log(`   📅 Heure serveur: ${result.rows[0].now}`);
      console.log(`   🐘 ${result.rows[0].version.split(',')[0]}`);
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Tentative ${i + 1}/${retries}: ${error.message}`);
      if (i < retries - 1) {
        console.log(`   ⏳ Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Impossible de se connecter après ${retries} tentatives: ${error.message}`);
      }
    }
  }
};

/**
 * Exécuter une requête SQL
 */
const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️ Requête lente (${duration}ms): ${text.substring(0, 100)}...`);
    }
    
    return result;
  } finally {
    client.release();
  }
};

/**
 * Exécuter une transaction
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Fermer le pool proprement
 */
const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool PostgreSQL fermé');
};

module.exports = { pool, query, transaction, testConnection, closePool };