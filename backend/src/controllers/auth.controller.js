const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { nom, prenom, email, mot_de_passe, role } = req.body;

  try {
    const existingUser = await query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await transaction(async (client) => {
      const userInsert = await client.query(
        `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, created_at`,
        [nom, prenom, email, hashedPassword, role]
      );
      const newUser = userInsert.rows[0];
      if (role === 'mentor') {
        await client.query('INSERT INTO profils_mentor (utilisateur_id, disponible) VALUES ($1, $2)', [newUser.id, true]);
      } else {
        await client.query('INSERT INTO profils_mentore (utilisateur_id, progression) VALUES ($1, $2)', [newUser.id, 0]);
      }
      return newUser;
    });

    const token = signToken({ id: result.id, email: result.email, role: result.role });
    res.status(201).json({
      success: true, message: 'Utilisateur créé avec succès', token,
      user: { id: result.id, email: result.email, role: result.role, nom, prenom, photo_url: null }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, mot_de_passe } = req.body;

  try {
    const result = await query(
      'SELECT id, email, mot_de_passe, role, actif, nom, prenom, photo_url FROM utilisateurs WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const user = result.rows[0];
    if (!user.actif) return res.status(401).json({ success: false, message: 'Compte désactivé.' });
    if (!user.mot_de_passe) return res.status(401).json({ success: false, message: 'Utilisez Google pour vous connecter.' });

    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);
    const token = signToken(user);

    res.json({
      success: true, message: 'Connexion réussie', token,
      user: { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, photo_url: user.photo_url }
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
// GOOGLE AUTH - AVEC DIAGNOSTIC
// ═══════════════════════════════════════════════════
const googleAuth = async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Token Google manquant' });
  }

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    console.log('🔑 GOOGLE_CLIENT_ID configuré:', googleClientId ? googleClientId.substring(0, 35) + '...' : 'NON DÉFINI');

    if (!googleClientId) {
      return res.status(500).json({ success: false, message: 'Configuration Google manquante' });
    }

    // ═══ DIAGNOSTIC : Décoder le token SANS vérifier ═══
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('🔍 DIAGNOSTIC - Audience dans le token:', payload.aud);
        console.log('🔍 DIAGNOSTIC - Client ID configuré:', googleClientId);
        console.log('🔍 DIAGNOSTIC - ÉGAUX ?', payload.aud === googleClientId);
        console.log('🔍 DIAGNOSTIC - Email:', payload.email);
        console.log('🔍 DIAGNOSTIC - Issuer:', payload.iss);
      }
    } catch (decodeErr) {
      console.error('❌ Erreur décodage token:', decodeErr.message);
    }

    // ═══ VÉRIFICATION DU TOKEN ═══
    const googleClient = new OAuth2Client(googleClientId);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    console.log('✅ Token vérifié avec succès pour:', payload.email);
    
    const { sub: googleId, email, given_name, family_name, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ success: false, message: 'Email Google non vérifié.' });
    }

    // 1. Compte déjà lié via google_id
    let result = await query(
      'SELECT id, email, role, nom, prenom, actif, photo_url FROM utilisateurs WHERE google_id = $1',
      [googleId]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (!user.actif) return res.status(401).json({ success: false, message: 'Compte désactivé.' });
      await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id]);
      return res.json({
        success: true, token: signToken(user),
        user: { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, photo_url: user.photo_url },
        needsRole: !user.role
      });
    }

    // 2. Email existant → lier Google
    result = await query(
      'SELECT id, email, role, nom, prenom, actif, photo_url FROM utilisateurs WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (!user.actif) return res.status(401).json({ success: false, message: 'Compte désactivé.' });
      await query('UPDATE utilisateurs SET google_id = $1, derniere_connexion = NOW() WHERE id = $2', [googleId, user.id]);
      return res.json({
        success: true, token: signToken(user),
        user: { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, photo_url: user.photo_url },
        needsRole: !user.role
      });
    }

    // 3. Nouvel utilisateur
    const insertResult = await query(
      'INSERT INTO utilisateurs (nom, prenom, email, google_id, role, email_verifie) VALUES ($1, $2, $3, $4, NULL, true) RETURNING id, email, role, nom, prenom, photo_url',
      [family_name || '', given_name || '', email, googleId]
    );
    const newUser = insertResult.rows[0];

    return res.status(201).json({
      success: true, token: signToken(newUser),
      user: { id: newUser.id, email: newUser.email, role: newUser.role, nom: newUser.nom, prenom: newUser.prenom, photo_url: null },
      needsRole: true
    });

  } catch (error) {
    console.error('❌ Erreur Google Auth:', error.message);
    return res.status(401).json({ success: false, message: 'Authentification Google invalide.' });
  }
};

const completeProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const { role } = req.body;

  try {
    const existing = await query('SELECT role FROM utilisateurs WHERE id = $1', [req.user.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    if (existing.rows[0].role) return res.status(409).json({ success: false, message: 'Rôle déjà défini.' });

    await transaction(async (client) => {
      await client.query('UPDATE utilisateurs SET role = $1 WHERE id = $2', [role, req.user.id]);
      if (role === 'mentor') {
        await client.query('INSERT INTO profils_mentor (utilisateur_id, disponible) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, true]);
      } else {
        await client.query('INSERT INTO profils_mentore (utilisateur_id, progression) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, 0]);
      }
    });

    const newToken = jwt.sign({ userId: req.user.id, email: req.user.email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success: true, message: 'Profil complété', token: newToken, role });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, nom, prenom, email, role, actif, email_verifie, photo_url, created_at, derniere_connexion FROM utilisateurs WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await query('SELECT id, email, role FROM utilisateurs WHERE id = $1 AND actif = true', [req.user.userId]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, token: signToken(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, refreshToken, googleAuth, completeProfile };