const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const matchingController = require('../controllers/matching.controller');

// Routes publiques (top mentors)
router.get('/top-mentors', matchingController.getTopMentors);

// Routes protégées
router.use(authenticate);

// Recommandations pour le mentoré connecté
router.get('/recommendations', authorize('mentore'), matchingController.getRecommendations);

// Recalcul global (pour admin plus tard)
router.post('/recalculate-all', matchingController.recalculateAll);

// Scores d'un mentor spécifique
router.get('/mentor/:mentorId', matchingController.getMentorScores);

module.exports = router;