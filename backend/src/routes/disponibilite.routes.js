const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const disponibiliteController = require('../controllers/disponibilite.controller');

// Routes publiques (voir les disponibilités d'un mentor)
router.get('/mentor/:mentorId', disponibiliteController.getDisponibilitesByMentorId);

// Routes protégées (réservées aux mentors)
router.use(authenticate);
router.use(authorize('mentor'));

router.get('/', disponibiliteController.getDisponibilites);
router.post('/', disponibiliteController.addDisponibilite);
router.put('/:id', disponibiliteController.updateDisponibilite);
router.delete('/:id', disponibiliteController.deleteDisponibilite);

module.exports = router;