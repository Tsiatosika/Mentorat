const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Base de données: PostgreSQL`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
};

startServer();