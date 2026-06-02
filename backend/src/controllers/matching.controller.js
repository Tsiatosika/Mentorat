// controllers/matching.controller.js
// Appelle le microservice IA Python (FastAPI) via HTTP
// Plus besoin de matchingService local

const axios = require('axios');
const { query } = require('../config/db');

const IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8001';

// ── Helper appel microservice IA ─────────────────────────────────────────────
async function callIA(method, path, data = null) {
  try {
    const response = await axios({
      method,
      url: `${IA_URL}${path}`,
      data,
      timeout: 15000,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    const status = err.response?.status || 503;
    const error = new Error(`[IA Service] ${msg}`);
    error.statusCode = status;
    throw error;
  }
}

// ── GET /api/matching/recommendations ────────────────────────────────────────
const getRecommendations = async (req, res, next) => {
  try {
    // Récupérer l'UUID du profil mentoré (même logique que votre code original)
    const mentoreResult = await query(
      'SELECT id FROM profils_mentore WHERE utilisateur_id = $1',
      [req.user.id]
    );

    if (mentoreResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }

    const mentoreId     = mentoreResult.rows[0].id;
    const forceRecalcul = req.query.force_recalc === 'true';

    // Appel au microservice IA Python
    const data = await callIA('POST', '/api/matching/recommandations', {
      mentore_id:     mentoreId,
      force_recalcul: forceRecalcul,
    });

    return res.json({
      success:         true,
      recommendations: data.recommandations,
      recalculated:    !data.depuis_cache,
      total:           data.total,
    });

  } catch (error) {
    next(error);
  }
};

// ── GET /api/matching/top-mentors ─────────────────────────────────────────────
// Pas de changement — cette route lit directement PostgreSQL, pas besoin de l'IA
const getTopMentors = async (req, res, next) => {
  const { limit = 10 } = req.query;

  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.photo_url,
              pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions,
              ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) AS competences
       FROM profils_mentor pm
       JOIN utilisateurs u         ON u.id  = pm.utilisateur_id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c         ON c.id = mc.competence_id
       WHERE u.actif = true AND pm.disponible = true
       GROUP BY u.id, pm.id
       ORDER BY pm.note_moyenne DESC, pm.nb_sessions DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({
      success:     true,
      top_mentors: result.rows
    });

  } catch (error) {
    next(error);
  }
};

// ── POST /api/matching/recalculate-all ────────────────────────────────────────
const recalculateAll = async (req, res, next) => {
  try {
    const { mentore_ids } = req.body; // optionnel

    const data = await callIA('POST', '/api/matching/recalculer', {
      mentore_ids: mentore_ids || null,
    });

    return res.json({
      success: true,
      message: data.message,
      count:   data.traites,
    });

  } catch (error) {
    next(error);
  }
};

// ── GET /api/matching/mentor/:mentorId ────────────────────────────────────────
// Pas de changement — lecture directe PostgreSQL
const getMentorScores = async (req, res, next) => {
  const { mentorId } = req.params;

  try {
    const result = await query(
      `SELECT ms.*, pme.objectifs
       FROM matching_scores ms
       JOIN profils_mentore pme ON pme.id = ms.mentore_id
       WHERE ms.mentor_id = $1
       ORDER BY ms.score DESC`,
      [mentorId]
    );

    return res.json({
      success: true,
      scores:  result.rows
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getTopMentors,
  recalculateAll,
  getMentorScores,
};