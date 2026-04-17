const express = require('express');
const router = express.Router();

// Import des sous-routes
const authRoutes = require('./auth.routes');

// Authentification
router.use('/auth', authRoutes);

// Route de test public
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Route de test protégée (pour tester l'authentification)
router.get('/protected', require('../middlewares/auth').authenticate, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Vous êtes authentifié !', 
    user: req.user 
  });
});

module.exports = router;
