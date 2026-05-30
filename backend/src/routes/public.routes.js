const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');

// Routes publiques (pas d'authentification requise)
// L'ordre est important: /search avant /:id
router.get('/search', mentorController.searchMentors);
router.get('/:id', mentorController.getMentorById);
router.get('/', mentorController.searchMentors);

module.exports = router;
