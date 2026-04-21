const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const rapportController = require('../controllers/rapport.controller');

// Toutes les routes nécessitent authentification
router.use(authenticate);

// Générer un rapport pour une session
router.post('/session/:session_id/generate', rapportController.generateSessionRapport);

// Télécharger un rapport
router.get('/session/:session_id/download', rapportController.downloadRapport);

// Lister les rapports d'une session
router.get('/session/:session_id', rapportController.getSessionRapports);

// Générer un rapport de progression (pour mentoré)
router.post('/progression/generate', rapportController.generateProgressRapport);

module.exports = router;