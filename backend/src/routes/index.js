const express = require('express');
const router = express.Router();

// Import des sous-routes
const authRoutes = require('./auth.routes');
const mentorRoutes = require('./mentor.routes');
const mentoreRoutes = require('./mentore.routes');
const publicRoutes = require('./public.routes');

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/mentors', mentorRoutes);
router.use('/mentores', mentoreRoutes);

// Route de test public
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Route de test protégée
router.get('/protected', require('../middlewares/auth').authenticate, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Vous êtes authentifié !', 
    user: req.user 
  });
});

module.exports = router;
