const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// Toutes les routes admin nécessitent d'être admin
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    // Pour l'instant, on autorise les mentors et mentores aussi
    // Plus tard : restreindre aux admins uniquement
    // return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }
  next();
});

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);

module.exports = router;