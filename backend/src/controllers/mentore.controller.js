// src/controllers/mentore.controller.js
const axios  = require('axios');
const { query } = require('../config/db');

const IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8001';

// ── Helper recalcul IA ────────────────────────────────────────────────────────
function triggerIARecalcul(mentoreId) {
  axios.post(`${IA_URL}/api/matching/recalculer`, {
    mentore_ids: mentoreId ? [mentoreId] : null
  })
    .then(() => console.log(`[IA] Recalcul déclenché pour mentoré ${mentoreId}`))
    .catch(err => console.warn('[IA] Recalcul échoué (non bloquant):', err.message));
}

// ============================================
// OBTENIR LE PROFIL MENTORÉ
// ============================================
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
      return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
    }

    return res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// METTRE À JOUR LE PROFIL MENTORÉ
// CORRECTION 4 : déclenche recalcul IA
// uniquement pour CE mentoré
// ============================================
const updateProfile = async (req, res, next) => {
  const { niveau_etude, domaine, objectifs, objectifs_tags } = req.body;

  try {
    const result = await query(
      `UPDATE profils_mentore
       SET niveau_etude   = COALESCE($1, niveau_etude),
           domaine        = COALESCE($2, domaine),
           objectifs      = COALESCE($3, objectifs),
           objectifs_tags = COALESCE($4, objectifs_tags),
           updated_at     = NOW()
       WHERE utilisateur_id = $5
       RETURNING *`,
      [niveau_etude, domaine, objectifs, objectifs_tags, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
    }

    // Recalcul uniquement pour ce mentoré (ses tags/domaine ont changé)
    triggerIARecalcul(result.rows[0].id);

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PROGRESSION DU MENTORÉ
// ============================================
const getProgression = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT progression, updated_at as progression_updated_at
       FROM profils_mentore WHERE utilisateur_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
    }

    const statsResult = await query(
      `SELECT
         COUNT(*)                                            AS total_sessions,
         COUNT(CASE WHEN statut = 'terminee'  THEN 1 END)  AS sessions_terminees,
         COUNT(CASE WHEN statut = 'en_cours'  THEN 1 END)  AS sessions_en_cours,
         COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) AS sessions_attente
       FROM sessions s
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE pme.utilisateur_id = $1`,
      [req.user.id]
    );

    return res.json({
      success:     true,
      progression: result.rows[0],
      stats:       statsResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getProgression };