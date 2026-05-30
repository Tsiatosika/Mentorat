const express = require('express');
const router = express.Router();

// Import des sous-routes
const authRoutes = require('./auth.routes');
const sessionRoutes = require('./session.routes');
const messageRoutes = require('./message.routes');
const matchingRoutes = require('./matching.routes');
const rapportRoutes = require('./rapport.routes');
const competencesRoutes = require('./competences.routes');
const disponibiliteRoutes = require('./disponibilite.routes');

// Import des contrôleurs
const mentorController = require('../controllers/mentor.controller');
const mentoreController = require('../controllers/mentore.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// ============================================
// ROUTES D'AUTHENTIFICATION
// ============================================
router.use('/auth', authRoutes);

// ============================================
// ROUTES DES SESSIONS
// ============================================
router.use('/sessions', sessionRoutes);

// ============================================
// ROUTES DES MESSAGES
// ============================================
router.use('/messages', messageRoutes);

// ============================================
// ROUTES DU MATCHING IA
// ============================================
router.use('/matching', matchingRoutes);

// ============================================
// ROUTES DES RAPPORTS PDF
// ============================================
router.use('/rapports', rapportRoutes);

// ============================================
// ROUTES DES COMPÉTENCES
// ============================================
router.use('/competences', competencesRoutes);

// ============================================
// ROUTES DES DISPONIBILITÉS
// ============================================
router.use('/disponibilites', disponibiliteRoutes);

// ============================================
// ROUTES MENTORS PUBLIQUES
// ============================================
router.get('/mentors', mentorController.searchMentors);
router.get('/mentors/search', mentorController.searchMentors);
router.get('/mentors/:id', mentorController.getMentorById);

// ============================================
// ROUTES MENTORS PROTÉGÉES
// ============================================
router.get('/mentors/profile/me', authenticate, authorize('mentor'), mentorController.getProfile);
router.put('/mentors/profile/me', authenticate, authorize('mentor'), mentorController.updateProfile);
router.post('/mentors/competences', authenticate, authorize('mentor'), mentorController.addCompetence);
router.delete('/mentors/competences/:competence_id', authenticate, authorize('mentor'), mentorController.removeCompetence);

// ============================================
// ROUTES MENTORES PROTÉGÉES
// ============================================
router.get('/mentores/profile/me', authenticate, authorize('mentore'), mentoreController.getProfile);
router.put('/mentores/profile/me', authenticate, authorize('mentore'), mentoreController.updateProfile);
router.get('/mentores/progression', authenticate, authorize('mentore'), mentoreController.getProgression);

// ============================================
// ROUTES DE TEST
// ============================================
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

router.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, message: 'Authentifié', user: req.user });
});

module.exports = router;
