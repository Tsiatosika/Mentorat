// server.js
const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const { initSocket } = require('./src/socket');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Créer les dossiers nécessaires au démarrage
const createRequiredDirectories = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'reports'),
    path.join(__dirname, 'uploads', 'photos'),
    path.join(__dirname, 'uploads', 'cv'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Dossier créé: ${dir}`);
    }
  });
};

// Gestion propre de l'arrêt
const gracefulShutdown = (server) => {
  console.log('\n📴 Signal d\'arrêt reçu, fermeture propre...');
  
  server.close(() => {
    console.log('🔌 Serveur HTTP fermé');
    process.exit(0);
  });
  
  // Forcer la fermeture après 10 secondes
  setTimeout(() => {
    console.error('⚠️ Fermeture forcée après timeout');
    process.exit(1);
  }, 10000);
};

const startServer = async () => {
  try {
    // Créer les dossiers uploads
    createRequiredDirectories();
    
    // Tester la connexion à la base de données avec retry
    console.log('🔍 Test de connexion à la base de données...');
    await testConnection(process.env.NODE_ENV === 'production' ? 10 : 3, 3000);
    
    // Créer le serveur HTTP
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  📡 HTTP:      http://localhost:${PORT}`);
      console.log(`  🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`  🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  💾 Base de données: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
      console.log(`  📁 Uploads:   ${path.join(__dirname, 'uploads')}`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
    
    // Initialiser Socket.IO
    try {
      initSocket(server);
      console.log('✅ Socket.IO initialisé');
    } catch (error) {
      console.warn('⚠️ Socket.IO non initialisé:', error.message);
      console.warn('⚠️ Le chat en temps réel ne sera pas disponible');
    }
    
    // Gestion des signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
    
    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Rejection non gérée:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Exception non capturée:', error.message);
      // Ne pas quitter - laisser Docker gérer le restart
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    console.error('❌ Détails:', error.stack);
    
    // En production, attendre avant de quitter (Docker va restart)
    if (process.env.NODE_ENV === 'production') {
      console.log('⏳ Attente de 10 secondes avant de quitter...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    process.exit(1);
  }
};

startServer();