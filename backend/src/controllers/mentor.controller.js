const { query } = require('../config/db');

// ============================================
// OBTENIR LE PROFIL MENTOR (connecté)
// ============================================
const getProfile = async (req, res, next) => {
  try {
    console.log('🔍 getProfile - userId:', req.user.id);
    
    const result = await query(
      `SELECT pm.*, u.nom, u.prenom, u.email, u.photo_url
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE pm.utilisateur_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouvé'
      });
    }

    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement du profil',
      error: error.message
    });
  }
};

// ============================================
// METTRE À JOUR LE PROFIL MENTOR
// ============================================
const updateProfile = async (req, res, next) => {
  const { bio, domaine, annees_experience, disponible } = req.body;

  try {
    const result = await query(
      `UPDATE profils_mentor 
       SET bio = COALESCE($1, bio),
           domaine = COALESCE($2, domaine),
           annees_experience = COALESCE($3, annees_experience),
           disponible = COALESCE($4, disponible),
           updated_at = NOW()
       WHERE utilisateur_id = $5
       RETURNING *`,
      [bio, domaine, annees_experience, disponible, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

// ============================================
// AJOUTER UNE COMPÉTENCE
// ============================================
const addCompetence = async (req, res, next) => {
  const { competence_id, niveau } = req.body;

  if (!competence_id) {
    return res.status(400).json({
      success: false,
      message: 'competence_id est requis'
    });
  }

  try {
    const mentorResult = await query(
      'SELECT id FROM profils_mentor WHERE utilisateur_id = $1',
      [req.user.id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouvé'
      });
    }

    const mentorId = mentorResult.rows[0].id;

    const result = await query(
      `INSERT INTO mentor_competences (mentor_id, competence_id, niveau)
       VALUES ($1, $2, $3)
       ON CONFLICT (mentor_id, competence_id) 
       DO UPDATE SET niveau = $3
       RETURNING *`,
      [mentorId, competence_id, niveau || 'intermediaire']
    );

    res.status(201).json({
      success: true,
      message: 'Compétence ajoutée avec succès',
      competence: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur addCompetence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout',
      error: error.message
    });
  }
};

// ============================================
// SUPPRIMER UNE COMPÉTENCE
// ============================================
const removeCompetence = async (req, res, next) => {
  const { competence_id } = req.params;

  try {
    const mentorResult = await query(
      'SELECT id FROM profils_mentor WHERE utilisateur_id = $1',
      [req.user.id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouvé'
      });
    }

    const mentorId = mentorResult.rows[0].id;

    const result = await query(
      'DELETE FROM mentor_competences WHERE mentor_id = $1 AND competence_id = $2',
      [mentorId, competence_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée pour ce mentor'
      });
    }

    res.json({
      success: true,
      message: 'Compétence supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur removeCompetence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// ============================================
// RECHERCHER DES MENTORS (PUBLIC)
// ============================================
const searchMentors = async (req, res, next) => {
  const { domaine, competence, search, disponible, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryText = `
      SELECT DISTINCT
        u.id, u.nom, u.prenom, u.email, u.photo_url,
        pm.id as profil_id, pm.bio, pm.domaine, 
        pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible,
        ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) as competences
      FROM utilisateurs u
      JOIN profils_mentor pm ON pm.utilisateur_id = u.id
      LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
      LEFT JOIN competences c ON c.id = mc.competence_id
      WHERE u.role = 'mentor' AND u.actif = true
    `;

    const params = [];
    let paramIndex = 1;

    if (domaine) {
      queryText += ` AND pm.domaine ILIKE $${paramIndex}`;
      params.push(`%${domaine}%`);
      paramIndex++;
    }

    if (competence) {
      queryText += ` AND c.nom ILIKE $${paramIndex}`;
      params.push(`%${competence}%`);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (u.nom ILIKE $${paramIndex} OR u.prenom ILIKE $${paramIndex} OR pm.bio ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (disponible === 'true') {
      queryText += ` AND pm.disponible = true`;
    }

    queryText += ` GROUP BY u.id, pm.id ORDER BY pm.note_moyenne DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('❌ Erreur searchMentors:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

// ============================================
// OBTENIR UN MENTOR PAR ID (PUBLIC)
// ============================================
const getMentorById = async (req, res, next) => {
  const { id } = req.params;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID mentor invalide'
    });
  }

  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.photo_url,
              pm.id as profil_id, pm.bio, pm.domaine,
              pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé'
      });
    }

    res.json({
      success: true,
      mentor: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur getMentorById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement',
      error: error.message
    });
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
