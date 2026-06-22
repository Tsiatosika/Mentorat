const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const avisController = require('../controllers/avis.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const createAvisValidation = [
  body('session_id').isUUID().withMessage('session_id invalide'),
  body('note_ponctualite').isFloat({ min: 1, max: 5 }),
  body('note_pedagogie').isFloat({ min: 1, max: 5 }),
  body('note_disponibilite').isFloat({ min: 1, max: 5 }),
];

router.post('/', authenticate, authorize('mentore'), createAvisValidation, avisController.createAvis);

// Doit être déclarée AVANT /mentor/:mentorId pour éviter une collision de route
router.get('/mentore/me', authenticate, authorize('mentore'), avisController.getSessionsNoteesByMentore);

router.get('/mentor/:mentorId', avisController.getAvisByMentor);
router.get('/session/:sessionId', authenticate, avisController.getAvisBySession);

module.exports = router;