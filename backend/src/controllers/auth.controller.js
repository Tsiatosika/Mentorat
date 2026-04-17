const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/db');

const register = async (req, res, next) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { nom, prenom, email, mot_de_passe, role } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cet email est déjà utilisé.' 
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'utilisateur dans une transaction
    const result = await transaction(async (client) => {
      // Insertion dans utilisateurs
      const userInsert = await client.query(
        `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, created_at`,
        [nom, prenom, email, hashedPassword, role]
      );

      const newUser = userInsert.rows[0];

      // Créer le profil correspondant (mentor ou mentoré)
      if (role === 'mentor') {
        await client.query(
          `INSERT INTO profils_mentor (utilisateur_id, disponible)
           VALUES ($1, $2)`,
          [newUser.id, true]
        );
      } else {
        await client.query(
          `INSERT INTO profils_mentore (utilisateur_id, progression)
           VALUES ($1, $2)`,
          [newUser.id, 0]
        );
      }

      return newUser;
    });

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: result.id, 
        email: result.email, 
        role: result.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        nom,
        prenom
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { email, mot_de_passe } = req.body;

  try {
    // Récupérer l'utilisateur avec son email
    const result = await query(
      `SELECT id, email, mot_de_passe, role, actif, nom, prenom 
       FROM utilisateurs 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect.' 
      });
    }

    const user = result.rows[0];

    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé. Contactez l\'administrateur.' 
      });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect.' 
      });
    }

    // Mettre à jour la dernière connexion
    await query(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1',
      [user.id]
    );

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  // En stateless JWT, le logout se fait côté client
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nom, prenom, email, role, actif, email_verifie, 
              created_at, derniere_connexion
       FROM utilisateurs 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }

    const user = result.rows[0];

    // Récupérer les infos supplémentaires selon le rôle
    let profile = null;
    if (user.role === 'mentor') {
      const profileResult = await query(
        `SELECT id, bio, domaine, annees_experience, note_moyenne, 
                nb_sessions, disponible
         FROM profils_mentor 
         WHERE utilisateur_id = $1`,
        [user.id]
      );
      profile = profileResult.rows[0];
    } else {
      const profileResult = await query(
        `SELECT id, niveau_etude, domaine, objectifs, objectifs_tags, progression
         FROM profils_mentore 
         WHERE utilisateur_id = $1`,
        [user.id]
      );
      profile = profileResult.rows[0];
    }

    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Vérifier que l'utilisateur existe toujours
    const result = await query(
      'SELECT id, email, role FROM utilisateurs WHERE id = $1 AND actif = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé ou inactif.' 
      });
    }

    const user = result.rows[0];

    // Générer un nouveau token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken
};
