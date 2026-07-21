const express = require('express');
const router = express.Router();
const {
  getAllCompetences,
  getCompetenceById,
  searchCompetences,
  getCompetencesByCategorie,
  getMentorCompetences,
} = require('../controllers/competence.controller');

// ── Routes publiques en lecture seule ──
// La création et la suppression de compétences sont réservées à l'admin
// (voir routes/admin.js). Il n'existe volontairement pas de route
// d'édition (PUT) : un renommage/recatégorisation se ferait via
// suppression + recréation, ce qui casserait le lien avec les
// profils mentors existants.

router.get('/', getAllCompetences);
router.get('/search', searchCompetences);
router.get('/categorie/:categorie', getCompetencesByCategorie);
router.get('/mentor/:mentorId', getMentorCompetences);
router.get('/:id', getCompetenceById);

module.exports = router;