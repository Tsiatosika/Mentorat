const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { updateMe, changePassword } = require('../controllers/auth.controller');

// Validation pour l'inscription
const registerValidation = [
  body('nom')
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit faire entre 2 et 100 caractères'),
  body('prenom')
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit faire entre 2 et 100 caractères'),
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('mot_de_passe')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('role')
    .isIn(['mentor', 'mentore']).withMessage('Le rôle doit être mentor ou mentore')
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis')
];

// Validation pour la connexion Google
const googleAuthValidation = [
  body('credential')
    .notEmpty().withMessage('Le credential Google est requis')
];

// Validation pour compléter le profil (choix du rôle après Google)
const completeProfileValidation = [
  body('role')
    .isIn(['mentor', 'mentore']).withMessage('Le rôle doit être mentor ou mentore')
];

// Inscription
router.post('/register', registerValidation, authController.register);

// Connexion
router.post('/login', loginValidation, authController.login);

// Connexion / inscription via Google
router.post('/google', googleAuthValidation, authController.googleAuth);

// Compléter le profil après connexion Google (choix du rôle)
router.put('/complete-profile', authenticate, completeProfileValidation, authController.completeProfile);

// Déconnexion
router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, updateMe);
router.put('/change-password', authenticate, changePassword);
router.post('/verify-email', authController.verifyEmail);
// Rafraîchir le token
router.post('/refresh-token', authenticate, authController.refreshToken);

module.exports = router;