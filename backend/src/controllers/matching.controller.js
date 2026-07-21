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

// Récupère, pour une liste de mentor_id (profils_mentor.id), leurs noms de compétences
// groupés par mentor_id. Une seule requête, réutilisée par les deux chemins (IA / fallback).
async function getCompetencesParMentor(mentorIds) {
  if (!mentorIds.length) return {};
  const result = await query(
    `SELECT mc.mentor_id, c.nom
     FROM mentor_competences mc
     JOIN competences c ON c.id = mc.competence_id
     WHERE mc.mentor_id = ANY($1::uuid[])`,
    [mentorIds]
  );
  return result.rows.reduce((acc, row) => {
    if (!acc[row.mentor_id]) acc[row.mentor_id] = [];
    acc[row.mentor_id].push(row.nom);
    return acc;
  }, {});
}

// Intersection insensible à la casse entre les tags objectifs du mentoré
// et les compétences du mentor — sert à afficher "3 points communs : X, Y, Z"
function trouverCompetencesCommunes(objectifsTags, competencesMentor) {
  const mentoreSet = new Set((objectifsTags || []).map(t => t.toLowerCase().trim()));
  const communes = (competencesMentor || []).filter(c => mentoreSet.has(c.toLowerCase().trim()));
  return communes;
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
    const mentoreTags = mentoreResult.rows[0].objectifs_tags || [];
    const mentoreDomaine = mentoreResult.rows[0].domaine || '';
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
        const mentorIds = iaResponse.recommandations.map(r => r.mentor_id);

        const usersResult = await query(
          `SELECT pm.id AS profil_id, u.id AS user_id, u.photo_url
           FROM utilisateurs u
           JOIN profils_mentor pm ON pm.utilisateur_id = u.id
           WHERE pm.id = ANY($1::uuid[])`,
          [mentorIds]
        );
        const userIdMap = Object.fromEntries(
          usersResult.rows.map(r => [r.profil_id, r.user_id])
        );
        const photoMap = Object.fromEntries(
          usersResult.rows.map(r => [r.profil_id, r.photo_url])
        );

        const competencesParMentor = await getCompetencesParMentor(mentorIds);

        for (const rec of iaResponse.recommandations) {
          const userId = userIdMap[rec.mentor_id] || rec.mentor_id;
          const competencesMentor = competencesParMentor[rec.mentor_id] || rec.competences || [];

          recommendations.push({
            mentor_id: rec.mentor_id,
            mentor_user_id: userId,
            mentor_nom: rec.prenom ? `${rec.prenom} ${rec.nom}`.trim() : `Mentor ${rec.mentor_id.substring(0, 8)}`,
            mentor_domaine: rec.domaine || 'Non spécifié',
            mentor_note: rec.note_moyenne || 0,
            mentor_photo_url: photoMap[rec.mentor_id] || rec.photo_url || null,
            score: rec.score,
            // 4 vraies composantes, alignées sur scorer.py (40 / 25 / 20 / 15)
            score_competences: rec.score_competences,
            score_dispo: rec.score_dispo,
            score_objectifs: rec.score_objectifs,
            score_reputation: rec.score_reputation,
            competences_communes: trouverCompetencesCommunes(mentoreTags, competencesMentor),
            meme_domaine: !!(mentoreDomaine && rec.domaine && mentoreDomaine.toLowerCase() === rec.domaine.toLowerCase()),
          });
        }
        source = 'python-ia';
        console.log(`✅ ${recommendations.length} recommandations via IA Python`);
      }
    } catch (iaError) {
      console.warn(`⚠️ Service IA indisponible: ${iaError.message}`);

      // Fallback JavaScript — mêmes poids et mêmes composantes que scorer.py (40/25/20/15)
      const mentorsResult = await query(
        `SELECT pm.id, pm.domaine, pm.note_moyenne, pm.nb_sessions,
                u.id as user_id, u.nom, u.prenom, u.photo_url
         FROM profils_mentor pm
         JOIN utilisateurs u ON u.id = pm.utilisateur_id
         WHERE u.actif = true AND pm.disponible = true`
      );

      const mentoreSet = new Set(mentoreTags.map(t => t.toLowerCase().trim()));
      const mentorIdsAll = mentorsResult.rows.map(m => m.id);

      const competencesParMentor = await getCompetencesParMentor(mentorIdsAll);

      // Disponibilités par mentor (jours distincts), même logique que calculer_score_disponibilite
      // côté Python quand le mentoré n'a pas renseigné de préférence de créneaux.
      let joursParMentor = {};
      if (mentorIdsAll.length > 0) {
        const dispoResult = await query(
          `SELECT mentor_id, jour_semaine FROM disponibilites WHERE mentor_id = ANY($1::uuid[])`,
          [mentorIdsAll]
        );
        joursParMentor = dispoResult.rows.reduce((acc, row) => {
          if (!acc[row.mentor_id]) acc[row.mentor_id] = new Set();
          acc[row.mentor_id].add((row.jour_semaine || '').toLowerCase().trim());
          return acc;
        }, {});
      }

      for (const mentor of mentorsResult.rows) {
        const competencesMentor = competencesParMentor[mentor.id] || [];
        const mentorSet = new Set(competencesMentor.map(c => c.toLowerCase().trim()));

        // Compétences (40%) — similarité simple (intersection / nb tags mentoré)
        let scoreCompetences = 0.0;
        if (mentoreSet.size > 0 && mentorSet.size > 0) {
          let matchCount = 0;
          for (const tag of mentoreSet) if (mentorSet.has(tag)) matchCount++;
          scoreCompetences = matchCount / mentoreSet.size;
        }

        // Disponibilité (25%) — nb de jours distincts / 5, plafonné à 1
        const joursMentor = joursParMentor[mentor.id] || new Set();
        const scoreDispo = joursMentor.size > 0 ? Math.min(joursMentor.size / 5.0, 1.0) : 0.0;

        // Objectifs / domaine (20%) — identique = 1.0, sinon neutre à 0.3
        let scoreObjectifs = 0.3;
        if (mentor.domaine && mentoreDomaine) {
          scoreObjectifs = mentor.domaine.toLowerCase() === mentoreDomaine.toLowerCase() ? 1.0 : 0.0;
        }

        // Réputation (15%) — note normalisée × facteur de confiance (nb sessions / 10)
        // note_moyenne est un DECIMAL PostgreSQL → renvoyé comme string par node-postgres
        const note = Number(mentor.note_moyenne) || 0;
        const sessions = Number(mentor.nb_sessions) || 0;
        const scoreReputation = note > 0 && sessions > 0
          ? (note / 5.0) * Math.min(sessions / 10.0, 1.0)
          : 0.0;

        const scoreGlobal =
          (scoreCompetences * 0.40) +
          (scoreDispo * 0.25) +
          (scoreObjectifs * 0.20) +
          (scoreReputation * 0.15);

        // Pas de filtre par seuil ici : contrairement au moteur Python (cache dédié,
        // données de prod potentiellement riches), le fallback doit rester utilisable
        // même avec des données de démo éparses. On trie par score et on montre le classement,
        // plutôt que de risquer une liste vide qui casse la démo.
        recommendations.push({
          mentor_id: mentor.id,
          mentor_user_id: mentor.user_id,
          mentor_nom: `${mentor.prenom} ${mentor.nom}`,
          mentor_domaine: mentor.domaine || 'Non spécifié',
          mentor_note: parseFloat((note || 0).toFixed(1)),
          mentor_photo_url: mentor.photo_url || null,
          score: parseFloat(scoreGlobal.toFixed(4)),
          score_competences: parseFloat(scoreCompetences.toFixed(4)),
          score_dispo: parseFloat(scoreDispo.toFixed(4)),
          score_objectifs: parseFloat(scoreObjectifs.toFixed(4)),
          score_reputation: parseFloat(scoreReputation.toFixed(4)),
          competences_communes: trouverCompetencesCommunes(mentoreTags, competencesMentor),
          meme_domaine: !!(mentoreDomaine && mentor.domaine && mentoreDomaine.toLowerCase() === mentor.domaine.toLowerCase()),
        });
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
const recalculateAll = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : action réservée.'
      });
    }

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