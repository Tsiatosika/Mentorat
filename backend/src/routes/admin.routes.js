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

// ── Dashboard ──
router.get('/dashboard', adminController.getDashboardStats);

// ── Utilisateurs ──
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/toggle', adminController.toggleUser);
router.delete('/users/:id', adminController.deleteUser);

// ── Catégories ──
router.get('/categories', adminController.getAllCategoriesAdmin);
router.post('/categories', adminController.addCategory);
router.get('/categories/:id/usage', adminController.getCategoryUsage);
router.put('/categories/:id', adminController.editCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ── Compétences ──
router.post('/competences', adminController.addCompetence);
router.get('/competences/:id/usage', adminController.getCompetenceUsage);
router.put('/competences/:id', adminController.editCompetence);
router.delete('/competences/:id', adminController.deleteCompetence);

// ── Rapports ──
router.get('/reports', adminController.getAllReports);

// ── Sessions ──
router.get('/sessions', adminController.getAllSessionsAdmin);
router.get('/sessions/:id', adminController.getAdminSessionDetail);
router.put('/sessions/:id/cancel', adminController.adminCancelSession);

// ── Modération des avis ──
router.get('/avis', adminController.getAllAvisAdmin);
router.put('/avis/:id/toggle-visibility', adminController.toggleAvisVisibility);
router.delete('/avis/:id', adminController.deleteAvisAdmin);

module.exports = router;