const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// Authentification + vérification rôle admin sur toutes les routes
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
// IMPORTANT : les routes spécifiques (/users/...) AVANT les routes paramétrées (/users/:id)
router.get('/users', adminController.getUsers);

// Routes paramétrées — une seule déclaration par méthode+path
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/toggle', adminController.toggleUser);
router.delete('/users/:id', adminController.deleteUser);

// ── Catégories (référentiel : nom + icône + couleur) ──
router.get('/categories', adminController.getAllCategoriesAdmin);
router.post('/categories', adminController.addCategory);
router.get('/categories/:id/usage', adminController.getCategoryUsage);
router.put('/categories/:id', adminController.editCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ── Compétences (ajout / édition / suppression) ──
router.post('/competences', adminController.addCompetence);
router.get('/competences/:id/usage', adminController.getCompetenceUsage);
router.put('/competences/:id', adminController.editCompetence);
router.delete('/competences/:id', adminController.deleteCompetence);

// ── Rapports ──
router.get('/reports', adminController.getAllReports);

module.exports = router;