const axios = require('axios');
const { query } = require('../config/db');

const IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || null;

async function callIA(method, path, data = null) {
  try {
    const response = await axios({
      method,
      url: `${IA_URL}${path}`,
      data,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    const status = err.response?.status || 503;
    console.error(`❌ Erreur IA Service (${status}): ${msg}`);
    throw new Error(`Service IA indisponible: ${msg}`);
  }
}

// ============================================
// RECOMMANDATIONS
// ============================================
const getRecommendations = async (req, res, next) => {
  try {
    const mentoreResult = await query(
      'SELECT id, domaine, objectifs_tags FROM profils_mentore WHERE utilisateur_id = $1',
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

    let recommendations = [];
    let source = 'fallback';

    try {
      const iaResponse = await callIA('POST', `/api/matching/recommandations`, {
        mentore_id: mentoreId,
        force_recalcul: forceRecalcul
      });

      if (iaResponse.recommandations && Array.isArray(iaResponse.recommandations) && iaResponse.recommandations.length > 0) {
        // Récupérer tous les user_id en UNE seule requête (au lieu d'une boucle)
        const mentorIds = iaResponse.recommandations.map(r => r.mentor_id);
        const usersResult = await query(
          `SELECT pm.id AS profil_id, u.id AS user_id
           FROM utilisateurs u
           JOIN profils_mentor pm ON pm.utilisateur_id = u.id
           WHERE pm.id = ANY($1::uuid[])`,
          [mentorIds]
        );
        const userIdMap = Object.fromEntries(
          usersResult.rows.map(r => [r.profil_id, r.user_id])
        );

        for (const rec of iaResponse.recommandations) {
          const userId = userIdMap[rec.mentor_id] || rec.mentor_id;

          recommendations.push({
            mentor_id: rec.mentor_id,
            mentor_user_id: userId,
            mentor_nom: rec.prenom ? `${rec.prenom} ${rec.nom}`.trim() : `Mentor ${rec.mentor_id.substring(0, 8)}`,
            mentor_domaine: rec.domaine || 'Non spécifié',
            mentor_note: rec.note_moyenne || 0,
            score: rec.score,
            score_competences: rec.score_competences,
            score_domaine: rec.score_objectifs || 0,
            score_reputation: rec.score_reputation,
            score_experience: 0
          });
        }
        source = 'python-ia';
        console.log(`✅ ${recommendations.length} recommandations via IA Python`);
      }
    } catch (iaError) {
      console.warn(`⚠️ Service IA indisponible: ${iaError.message}`);

      // Fallback: calcul JavaScript
      const mentorsResult = await query(
        `SELECT pm.id, pm.domaine, pm.note_moyenne, pm.nb_sessions, 
                pm.annees_experience, pm.disponible,
                u.id as user_id, u.nom, u.prenom, u.photo_url
         FROM profils_mentor pm
         JOIN utilisateurs u ON u.id = pm.utilisateur_id
         WHERE u.actif = true AND pm.disponible = true`
      );

      const mentoreTags = mentoreResult.rows[0]?.objectifs_tags || [];
      const mentoreSet = new Set(mentoreTags.map(t => t.toLowerCase()));
      const mentoreDomaine = mentoreResult.rows[0]?.domaine || '';

      // Récupérer les compétences de TOUS les mentors en UNE seule requête (au lieu d'une boucle)
      const mentorIdsAll = mentorsResult.rows.map(m => m.id);
      let competencesParMentor = {};
      if (mentorIdsAll.length > 0) {
        const allCompetencesResult = await query(
          `SELECT mc.mentor_id, c.nom
           FROM mentor_competences mc
           JOIN competences c ON c.id = mc.competence_id
           WHERE mc.mentor_id = ANY($1::uuid[])`,
          [mentorIdsAll]
        );
        competencesParMentor = allCompetencesResult.rows.reduce((acc, row) => {
          if (!acc[row.mentor_id]) acc[row.mentor_id] = [];
          acc[row.mentor_id].push(row.nom);
          return acc;
        }, {});
      }

      for (const mentor of mentorsResult.rows) {
        const mentorCompetences = competencesParMentor[mentor.id] || [];
        const mentorSet = new Set(mentorCompetences.map(c => c.toLowerCase()));

        let scoreCompetences = 0.5;
        if (mentoreSet.size > 0 && mentorSet.size > 0) {
          let matchCount = 0;
          for (const tag of mentoreSet) {
            if (mentorSet.has(tag)) matchCount++;
          }
          scoreCompetences = matchCount / mentoreSet.size;
        }

        let scoreDomaine = 0.3;
        if (mentor.domaine && mentoreDomaine) {
          scoreDomaine = mentor.domaine.toLowerCase() === mentoreDomaine.toLowerCase() ? 1.0 : 0.3;
        }

        const note = mentor.note_moyenne || 0;
        const sessions = mentor.nb_sessions || 0;
        const scoreReputation = Math.min((note / 5) + Math.min(sessions / 50, 0.2), 1.0);
        const exp = mentor.annees_experience || 0;
        const scoreExperience = Math.min(exp / 10, 1.0);
        const scoreGlobal = (scoreCompetences * 0.35) + (scoreDomaine * 0.20) +
                            (scoreReputation * 0.25) + (scoreExperience * 0.20);

        if (scoreGlobal >= 0.1) {
          recommendations.push({
            mentor_id: mentor.id,
            mentor_user_id: mentor.user_id,
            mentor_nom: `${mentor.prenom} ${mentor.nom}`,
            mentor_domaine: mentor.domaine || 'Non spécifié',
            mentor_note: parseFloat((note || 0).toFixed(1)),
            score: parseFloat(scoreGlobal.toFixed(4)),
            score_competences: parseFloat(scoreCompetences.toFixed(4)),
            score_domaine: parseFloat(scoreDomaine.toFixed(4)),
            score_reputation: parseFloat(scoreReputation.toFixed(4)),
            score_experience: parseFloat(scoreExperience.toFixed(4))
          });
        }
      }
      source = 'javascript-fallback';
    }

    recommendations.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      recommendations: recommendations.slice(0, 20),
      source: source,
      total: recommendations.length
    });

  } catch (error) {
    console.error('❌ Erreur getRecommendations:', error);
    return res.json({
      success: true,
      recommendations: [],
      source: 'error',
      total: 0
    });
  }
};

// ============================================
// TOP MENTORS
// ============================================
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

// ============================================
// RECALCUL GLOBAL — PROTÉGÉ
// ============================================
// Double protection :
//   1) Le rôle 'mentor' uniquement (empêche un mentoré lambda de déclencher un recalcul global)
//   2) Une clé interne optionnelle (INTERNAL_API_KEY) pour un usage machine-à-machine (cron, admin panel)
//      Si INTERNAL_API_KEY est définie dans l'environnement, elle devient obligatoire via le header X-Internal-Key.
const recalculateAll = async (req, res, next) => {
  try {
    // Protection 1 : rôle
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : action réservée.'
      });
    }

    // Protection 2 : clé interne (si configurée dans l'environnement)
    if (INTERNAL_API_KEY) {
      const providedKey = req.headers['x-internal-key'];
      if (providedKey !== INTERNAL_API_KEY) {
        return res.status(403).json({
          success: false,
          message: 'Clé interne invalide ou manquante.'
        });
      }
    }

    const { mentore_ids } = req.body;
    const data = await callIA('POST', '/api/matching/recalculer', {
      mentore_ids: mentore_ids || null,
    });
    return res.json({ success: true, message: data.message, count: data.traites });
  } catch (error) {
    next(error);
  }
};

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