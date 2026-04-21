const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const sessionController = require('../controllers/session.controller');

// Toutes les routes nécessitent authentification
router.use(authenticate);

// Routes générales
router.get('/', sessionController.getSessions);
router.post('/', sessionController.createSession);
router.get('/:id', sessionController.getSessionById);

// Actions sur une session
router.put('/:id/confirm', sessionController.confirmSession);  // Mentor uniquement
router.put('/:id/cancel', sessionController.cancelSession);    // Mentor ou mentoré
router.put('/:id/start', sessionController.startSession);      // Mentor uniquement
router.put('/:id/complete', sessionController.completeSession); // Mentor ou mentoré
router.put('/:id/visio', sessionController.addVisioLink);      // Mentor uniquement

module.exports = router;