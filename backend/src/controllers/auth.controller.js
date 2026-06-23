const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/db');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { nom, prenom, email, mot_de_passe, role } = req.body;

  try {
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

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await transaction(async (client) => {
      const userInsert = await client.query(
        `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, created_at`,
        [nom, prenom, email, hashedPassword, role]
      );

      const newUser = userInsert.rows[0];

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

    const token = signToken({ id: result.id, email: result.email, role: result.role });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        nom,
        prenom,
        photo_url: null
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, mot_de_passe } = req.body;

  try {
    const result = await query(
      `SELECT id, email, mot_de_passe, role, actif, nom, prenom, photo_url 
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

    if (!user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    if (!user.mot_de_passe) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte utilise la connexion Google. Veuillez vous connecter avec Google.'
      });
    }

    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    await query(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1',
      [user.id]
    );

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        photo_url: user.photo_url
      }
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email Google non vérifié.'
      });
    }

    // 1. Compte déjà lié via google_id
    let result = await query(
      `SELECT id, email, role, nom, prenom, actif, photo_url 
       FROM utilisateurs 
       WHERE google_id = $1`,
      [googleId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (!user.actif) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé. Contactez l\'administrateur.'
        });
      }

      await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);

      return res.json({
        success: true,
        message: 'Connexion réussie',
        token: signToken(user),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          photo_url: user.photo_url
        },
        needsRole: !user.role
      });
    }

    // 2. Email existant (inscrit via mot de passe) → on lie le compte Google
    result = await query(
      `SELECT id, email, role, nom, prenom, actif, photo_url 
       FROM utilisateurs 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (!user.actif) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé. Contactez l\'administrateur.'
        });
      }

      await query(
        'UPDATE utilisateurs SET google_id = $1, derniere_connexion = NOW() WHERE id = $2',
        [googleId, user.id]
      );

      return res.json({
        success: true,
        message: 'Compte Google lié avec succès',
        token: signToken(user),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          photo_url: user.photo_url
        },
        needsRole: !user.role
      });
    }

    // 3. Nouvel utilisateur — role à compléter après coup
    const insertResult = await query(
      `INSERT INTO utilisateurs (nom, prenom, email, google_id, role, email_verifie)
       VALUES ($1, $2, $3, $4, NULL, true)
       RETURNING id, email, role, nom, prenom, photo_url`,
      [family_name || '', given_name || '', email, googleId]
    );

    const newUser = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès via Google',
      token: signToken(newUser),
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        nom: newUser.nom,
        prenom: newUser.prenom,
        photo_url: null
      },
      needsRole: true
    });
  } catch (error) {
    console.error('Erreur Google Auth:', error);
    res.status(401).json({
      success: false,
      message: 'Authentification Google invalide ou expirée.'
    });
  }
};

const completeProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { role } = req.body;

  try {
    const existing = await query('SELECT role FROM utilisateurs WHERE id = $1', [req.user.id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    if (existing.rows[0].role) {
      return res.status(409).json({
        success: false,
        message: 'Le rôle a déjà été défini pour ce compte.'
      });
    }

    await transaction(async (client) => {
      await client.query('UPDATE utilisateurs SET role = $1 WHERE id = $2', [role, req.user.id]);

      if (role === 'mentor') {
        await client.query(
          `INSERT INTO profils_mentor (utilisateur_id, disponible)
           VALUES ($1, $2)
           ON CONFLICT (utilisateur_id) DO NOTHING`,
          [req.user.id, true]
        );
      } else {
        await client.query(
          `INSERT INTO profils_mentore (utilisateur_id, progression)
           VALUES ($1, $2)
           ON CONFLICT (utilisateur_id) DO NOTHING`,
          [req.user.id, 0]
        );
      }
    });

    const newToken = jwt.sign(
      { userId: req.user.id, email: req.user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Profil complété avec succès',
      token: newToken,
      role
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nom, prenom, email, role, actif, email_verifie, 
              photo_url, created_at, derniere_connexion
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
    } else if (user.role === 'mentore') {
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

    const newToken = signToken(user);

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
  refreshToken,
  googleAuth,
  completeProfile
};