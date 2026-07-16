const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

router.use(authenticate);

router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }
  next();
});

// ⚠️ IMPORTANT : La route dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Utilisateurs
router.get('/users', adminController.getUsers);
router.put('/users/:id/toggle', adminController.toggleUser);

// Compétences
router.post('/competences', adminController.addCompetence);
router.delete('/competences/:id', adminController.deleteCompetence);

// Rapports
router.get('/reports', adminController.getAllReports);

module.exports = router;