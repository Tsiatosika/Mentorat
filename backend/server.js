const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    
    // Créer le serveur HTTP
    const server = app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 HTTP: http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Base de données: PostgreSQL`);
      console.log('═══════════════════════════════════════════════════');
    });
    
    // Initialiser Socket.IO
    initSocket(server);
    
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
};

startServer();