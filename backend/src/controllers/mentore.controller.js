const { query } = require('../config/db');

const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pme.*, u.nom, u.prenom, u.email, u.photo_url
       FROM profils_mentore pme
       JOIN utilisateurs u ON u.id = pme.utilisateur_id
       WHERE pme.utilisateur_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }

    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { niveau_etude, domaine, objectifs, objectifs_tags } = req.body;

  try {
    const result = await query(
      `UPDATE profils_mentore 
       SET niveau_etude = COALESCE($1, niveau_etude),
           domaine = COALESCE($2, domaine),
           objectifs = COALESCE($3, objectifs),
           objectifs_tags = COALESCE($4, objectifs_tags),
           updated_at = NOW()
       WHERE utilisateur_id = $5
       RETURNING *`,
      [niveau_etude, domaine, objectifs, objectifs_tags, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const getProgression = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT progression, updated_at as progression_updated_at
       FROM profils_mentore
       WHERE utilisateur_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }

    // Récupérer les sessions terminées
    const sessionsResult = await query(
      `SELECT COUNT(*) as total_sessions,
              COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as sessions_terminees,
              COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as sessions_en_cours,
              COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as sessions_attente
       FROM sessions s
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE pme.utilisateur_id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      progression: result.rows[0],
      stats: sessionsResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProgression
};
