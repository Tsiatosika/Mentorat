const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');

// Routes publiques (pas d'authentification requise)
router.get('/mentors', mentorController.searchMentors);
router.get('/mentors/:id', mentorController.getMentorById);

module.exports = router;