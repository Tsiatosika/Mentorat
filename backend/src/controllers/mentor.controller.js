// src/controllers/mentor.controller.js
const axios  = require('axios');
const { query } = require('../config/db');

const IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8001';

// ── Helper : déclenche le recalcul IA en arrière-plan (non bloquant) ─────────
function triggerIARecalcul(mentoreIds = null) {
  axios.post(`${IA_URL}/api/matching/recalculer`, { mentore_ids: mentoreIds })
    .then(() => console.log('[IA] Recalcul déclenché'))
    .catch(err => console.warn('[IA] Recalcul échoué (non bloquant):', err.message));
}

// ============================================
// OBTENIR LE PROFIL MENTOR (connecté)
// ============================================
const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pm.*, u.nom, u.prenom, u.email, u.photo_url
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE pm.utilisateur_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
    }

    return res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// METTRE À JOUR LE PROFIL MENTOR
// CORRECTION 4 : déclenche recalcul IA global
// car les compétences/domaine du mentor
// affectent TOUS les scores des mentorés
// ============================================
const updateProfile = async (req, res, next) => {
  const { bio, domaine, annees_experience, disponible } = req.body;

  try {
    const result = await query(
      `UPDATE profils_mentor
       SET bio               = COALESCE($1, bio),
           domaine           = COALESCE($2, domaine),
           annees_experience = COALESCE($3, annees_experience),
           disponible        = COALESCE($4, disponible),
           updated_at        = NOW()
       WHERE utilisateur_id = $5
       RETURNING *`,
      [bio, domaine, annees_experience, disponible, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
    }

    // Recalcul global car ce mentor apparaît dans les scores de tous les mentorés
    triggerIARecalcul(null);

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
// AJOUTER UNE COMPÉTENCE
// CORRECTION 4 (suite) : recalcul après ajout
// ============================================
const addCompetence = async (req, res, next) => {
  const { competence_id, niveau } = req.body;

  if (!competence_id) {
    return res.status(400).json({ success: false, message: 'competence_id est requis' });
  }

  try {
    const mentorResult = await query(
      'SELECT id FROM profils_mentor WHERE utilisateur_id = $1', [req.user.id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
    }

    const result = await query(
      `INSERT INTO mentor_competences (mentor_id, competence_id, niveau)
       VALUES ($1, $2, $3)
       ON CONFLICT (mentor_id, competence_id) DO UPDATE SET niveau = $3
       RETURNING *`,
      [mentorResult.rows[0].id, competence_id, niveau || 'intermediaire']
    );

    // Recalcul global
    triggerIARecalcul(null);

    return res.status(201).json({
      success: true,
      message: 'Compétence ajoutée avec succès',
      competence: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SUPPRIMER UNE COMPÉTENCE
// ============================================
const removeCompetence = async (req, res, next) => {
  const { competence_id } = req.params;

  try {
    const mentorResult = await query(
      'SELECT id FROM profils_mentor WHERE utilisateur_id = $1', [req.user.id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
    }

    const result = await query(
      'DELETE FROM mentor_competences WHERE mentor_id = $1 AND competence_id = $2',
      [mentorResult.rows[0].id, competence_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    }

    // Recalcul global
    triggerIARecalcul(null);

    return res.json({ success: true, message: 'Compétence supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RECHERCHER DES MENTORS (PUBLIC)
// CORRECTION 5 : pagination avec COUNT réel
// ============================================
const searchMentors = async (req, res, next) => {
  const { domaine, competence, search, disponible, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const conditions = [`u.role = 'mentor'`, `u.actif = true`];
    const params     = [];
    let   idx        = 1;

    if (domaine) {
      conditions.push(`pm.domaine ILIKE $${idx}`);
      params.push(`%${domaine}%`); idx++;
    }
    if (competence) {
      conditions.push(`c.nom ILIKE $${idx}`);
      params.push(`%${competence}%`); idx++;
    }
    if (search) {
      conditions.push(`(u.nom ILIKE $${idx} OR u.prenom ILIKE $${idx} OR pm.bio ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (disponible === 'true') conditions.push(`pm.disponible = true`);

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Requête COUNT pour la pagination réelle
    const countResult = await query(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c         ON c.id = mc.competence_id
       ${where}`,
      params
    );

    // Requête principale
    const dataResult = await query(
      `SELECT DISTINCT
         u.id, u.nom, u.prenom, u.email, u.photo_url,
         pm.id as profil_id, pm.bio, pm.domaine,
         pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible,
         ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) as competences
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c         ON c.id = mc.competence_id
       ${where}
       GROUP BY u.id, pm.id
       ORDER BY pm.note_moyenne DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)  // ← total réel
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENIR UN MENTOR PAR ID (PUBLIC)
// ============================================
const getMentorById = async (req, res, next) => {
  const { id } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ success: false, message: 'ID mentor invalide' });
  }

  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.photo_url,
              pm.id as profil_id, pm.bio, pm.domaine,
              pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible,
              ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) as competences
       FROM utilisateurs u
       JOIN profils_mentor pm      ON pm.utilisateur_id = u.id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c         ON c.id = mc.competence_id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true
       GROUP BY u.id, pm.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor non trouvé' });
    }

    return res.json({ success: true, mentor: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addCompetence,
  removeCompetence,
  searchMentors,
  getMentorById
};