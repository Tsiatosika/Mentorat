const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Token invalide.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expiré.' });
      }
      throw error;
    }

    const result = await query(
      'SELECT id, email, role, actif FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const user = result.rows[0];

    if (!user.actif) {
      return res.status(401).json({ success: false, message: 'Compte désactivé.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }

    if (!req.user.role) {
      return res.status(403).json({ success: false, message: 'Complétez votre profil.' });
    }

    // ⚠️ MODIFICATION : Accepter le rôle 'admin' ou autoriser tous les rôles pour l'admin
    // Pour l'instant, on autorise tout le monde à voir l'admin (à restreindre plus tard)
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      // Vérifier aussi si c'est un admin
      if (req.user.role === 'admin') {
        return next(); // Les admins ont accès à tout
      }
      return res.status(403).json({ success: false, message: 'Accès interdit.' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };