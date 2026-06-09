const express = require('express');
const router = express.Router();

const authRoutes         = require('./auth.routes');
const sessionRoutes      = require('./session.routes');
const messageRoutes      = require('./message.routes');
const matchingRoutes     = require('./matching.routes');
const rapportRoutes      = require('./rapport.routes');
const competencesRoutes  = require('./competences.routes');
const disponibiliteRoutes = require('./disponibilite.routes');
const uploadRoutes        = require('./upload.routes');      
const notificationRoutes = require('./notification.routes');


const mentorController  = require('../controllers/mentor.controller');
const mentoreController = require('../controllers/mentore.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use('/auth',           authRoutes);
router.use('/sessions',       sessionRoutes);
router.use('/messages',       messageRoutes);
router.use('/matching',       matchingRoutes);
router.use('/rapports',       rapportRoutes);
router.use('/competences',    competencesRoutes);
router.use('/disponibilites', disponibiliteRoutes);
router.use('/upload',         uploadRoutes);
router.use('/notifications', notificationRoutes);



router.get('/mentors/profile/me',
  authenticate, authorize('mentor'),
  mentorController.getProfile);

router.put('/mentors/profile/me',
  authenticate, authorize('mentor'),
  mentorController.updateProfile);

router.post('/mentors/competences',
  authenticate, authorize('mentor'),
  mentorController.addCompetence);

router.delete('/mentors/competences/:competence_id',
  authenticate, authorize('mentor'),
  mentorController.removeCompetence);

// Routes publiques APRÈS les routes fixes
router.get('/mentors',        mentorController.searchMentors);
router.get('/mentors/search', mentorController.searchMentors);
router.get('/mentors/:id',    mentorController.getMentorById);  // ← en dernier

// ── MENTORÉS ─────────────────────────────────────────────────────────────────
router.get('/mentores/profile/me',
  authenticate, authorize('mentore'),
  mentoreController.getProfile);

router.put('/mentores/profile/me',
  authenticate, authorize('mentore'),
  mentoreController.updateProfile);

router.get('/mentores/progression',
  authenticate, authorize('mentore'),
  mentoreController.getProgression);

// ── TEST ──────────────────────────────────────────────────────────────────────
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

router.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, message: 'Authentifié', user: req.user });
});

module.exports = router;