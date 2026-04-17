const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

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


// Inscription
router.post('/register', registerValidation, authController.register);

// Connexion
router.post('/login', loginValidation, authController.login);

// Déconnexion
router.post('/logout', authenticate, authController.logout);

// Profil utilisateur courant
router.get('/me', authenticate, authController.getMe);

// Rafraîchir le token
router.post('/refresh-token', authenticate, authController.refreshToken);

module.exports = router;
