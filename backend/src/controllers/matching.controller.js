const axios = require('axios');
const { query } = require('../config/db');

const IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8001';

// ── Helper appel microservice IA ─────────────────────────────────────────────
async function callIA(method, path, data = null) {
  const fullUrl = `${IA_URL}${path}`;
  console.log(`📡 Appel IA: ${method} ${fullUrl}`);
  
  try {
    const response = await axios({
      method,
      url: fullUrl,
      data,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`✅ Réponse IA: ${response.status}`);
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    const status = err.response?.status || 503;
    console.error(`❌ Erreur IA Service (${status}): ${msg}`);
    console.error(`❌ URL appelée: ${fullUrl}`);
    throw new Error(`Service IA indisponible: ${msg}`);
  }
}

// ── GET /api/matching/recommendations ────────────────────────────────────────
const getRecommendations = async (req, res, next) => {
  try {
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

    const mentoreId = mentoreResult.rows[0].id;
    const forceRecalcul = req.query.force_recalc === 'true';

    console.log(`📊 Matching IA pour mentoré: ${mentoreId}`);
    console.log(`📊 Force recalcul: ${forceRecalcul}`);

    // Appel au service Python
    const iaResponse = await callIA('POST', '/api/matching/recommandations', {
      mentore_id: mentoreId,
      force_recalcul: forceRecalcul
    });
    
    console.log(`✅ ${iaResponse.recommandations?.length || 0} recommandations reçues`);

    // Transformer la réponse
    const recommendations = (iaResponse.recommandations || []).map(rec => ({
      mentor_id: rec.mentor_id,
      mentor_user_id: rec.mentor_id,
      mentor_nom: `${rec.prenom || ''} ${rec.nom || ''}`.trim(),
      mentor_domaine: rec.domaine || 'Non spécifié',
      mentor_note: rec.note_moyenne || 0,
      score: rec.score,
      score_competences: rec.score_competences,
      score_domaine: rec.score_objectifs || 0,
      score_reputation: rec.score_reputation,
      score_experience: 0
    }));

    return res.json({
      success: true,
      recommendations: recommendations,
      source: 'python-ia',
      total: recommendations.length
    });

  } catch (error) {
    console.error('❌ Erreur getRecommendations:', error.message);
    return res.json({
      success: true,
      recommendations: [],
      source: 'error',
      total: 0
    });
  }
};

// ── GET /api/matching/top-mentors ─────────────────────────────────────────────
const getTopMentors = async (req, res, next) => {
  const { limit = 10 } = req.query;
  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.photo_url,
              pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions,
              ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) AS competences
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c ON c.id = mc.competence_id
       WHERE u.actif = true AND pm.disponible = true
       GROUP BY u.id, pm.id
       ORDER BY pm.note_moyenne DESC, pm.nb_sessions DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ success: true, top_mentors: result.rows });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/matching/recalculate-all ────────────────────────────────────────
const recalculateAll = async (req, res, next) => {
  try {
    const { mentore_ids } = req.body;
    const data = await callIA('POST', '/api/matching/recalculer', {
      mentore_ids: mentore_ids || null,
    });
    return res.json({ success: true, message: data.message, count: data.traites });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/matching/mentor/:mentorId ────────────────────────────────────────
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
    return res.json({ success: true, scores: result.rows });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/matching/health ──────────────────────────────────────────────────
const getHealth = async (req, res, next) => {
  try {
    await callIA('GET', '/api/matching/health');
    return res.json({ success: true, status: 'ok', ia_service: 'available' });
  } catch (error) {
    return res.json({ success: true, status: 'ok', ia_service: 'unavailable' });
  }
};

module.exports = {
  getRecommendations,
  getTopMentors,
  recalculateAll,
  getMentorScores,
  getHealth
};