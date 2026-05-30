const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const mentorController = require('../controllers/mentor.controller');

// Toutes ces routes nécessitent authentification ET rôle mentor
router.use(authenticate);
router.use(authorize('mentor'));

// Routes spécifiques (ordre important: les routes fixes avant les routes paramétrées)
router.get('/profile', mentorController.getProfile);
router.put('/profile', mentorController.updateProfile);
router.post('/competences', mentorController.addCompetence);
router.delete('/competences/:competence_id', mentorController.removeCompetence);

module.exports = router;
