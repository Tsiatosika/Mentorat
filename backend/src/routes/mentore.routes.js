const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const mentoreController = require('../controllers/mentore.controller');

// Toutes les routes nécessitent authentification ET rôle mentoré
router.use(authenticate);
router.use(authorize('mentore'));

// Profil
router.get('/profile', mentoreController.getProfile);
router.put('/profile', mentoreController.updateProfile);

// Progression
router.get('/progression', mentoreController.getProgression);

module.exports = router;