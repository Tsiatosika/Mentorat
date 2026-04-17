const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Accès non autorisé. Token manquant.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token invalide.' 
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expiré. Veuillez vous reconnecter.' 
        });
      }
      throw error;
    }
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const result = await query(
      'SELECT id, email, role, actif FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur introuvable.' 
      });
    }
    
    const user = result.rows[0];
    
    if (!user.actif) {
      return res.status(401).json({ 
        success: false,
        message: 'Compte désactivé.' 
      });
    }
    
    // Attacher l'utilisateur à la requête
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
      return res.status(401).json({ 
        success: false,
        message: 'Non authentifié.' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Accès interdit. Vous n\'avez pas les droits nécessaires.' 
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };
