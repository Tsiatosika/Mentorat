const { query } = require('../config/db');

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
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouvé'
      });
    }

    // Récupérer les compétences du mentor
    const competencesResult = await query(
      `SELECT c.id, c.nom, c.categorie, mc.niveau
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = $1`,
      [result.rows[0].id]
    );

    // Récupérer les disponibilités
    const dispoResult = await query(
      `SELECT id, jour_semaine, heure_debut, heure_fin, recurrent
       FROM disponibilites
       WHERE mentor_id = $1
       ORDER BY 
         CASE jour_semaine
           WHEN 'lundi' THEN 1
           WHEN 'mardi' THEN 2
           WHEN 'mercredi' THEN 3
           WHEN 'jeudi' THEN 4
           WHEN 'vendredi' THEN 5
           WHEN 'samedi' THEN 6
           WHEN 'dimanche' THEN 7
         END,
         heure_debut`,
      [result.rows[0].id]
    );

    const profile = result.rows[0];
    profile.competences = competencesResult.rows;
    profile.disponibilites = dispoResult.rows;

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { bio, domaine, annees_experience, disponible, cv_url, portfolio_url } = req.body;

  try {
    const result = await query(
      `UPDATE profils_mentor 
       SET bio = COALESCE($1, bio),
           domaine = COALESCE($2, domaine),
           annees_experience = COALESCE($3, annees_experience),
           disponible = COALESCE($4, disponible),
           cv_url = COALESCE($5, cv_url),
           portfolio_url = COALESCE($6, portfolio_url),
           updated_at = NOW()
       WHERE utilisateur_id = $7
       RETURNING *`,
      [bio, domaine, annees_experience, disponible, cv_url, portfolio_url, req.user.id]
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
    next(error);
  }
};

const addCompetence = async (req, res, next) => {
  const { competence_id, niveau } = req.body;

  if (!competence_id) {
    return res.status(400).json({
      success: false,
      message: 'competence_id est requis'
    });
  }

  try {
    // Récupérer l'ID du mentor
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

    // Vérifier si la compétence existe
    const competenceResult = await query(
      'SELECT id FROM competences WHERE id = $1',
      [competence_id]
    );

    if (competenceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }

    // Ajouter la compétence (avec gestion du conflit)
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
    next(error);
  }
};

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
    next(error);
  }
};

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

    // Compter le nombre total
    let countText = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM utilisateurs u
      JOIN profils_mentor pm ON pm.utilisateur_id = u.id
      LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
      LEFT JOIN competences c ON c.id = mc.competence_id
      WHERE u.role = 'mentor' AND u.actif = true
    `;

    const countParams = [];
    let countIndex = 1;

    if (domaine) {
      countText += ` AND pm.domaine ILIKE $${countIndex}`;
      countParams.push(`%${domaine}%`);
      countIndex++;
    }

    if (competence) {
      countText += ` AND c.nom ILIKE $${countIndex}`;
      countParams.push(`%${competence}%`);
     countIndex++;
    }

    if (search) {
      countText += ` AND (u.nom ILIKE $${countIndex} OR u.prenom ILIKE $${countIndex} OR pm.bio ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }

    if (disponible === 'true') {
      countText += ` AND pm.disponible = true`;
    }

    const countResult = await query(countText, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMentorById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.photo_url,
              pm.id as profil_id, pm.bio, pm.domaine, pm.cv_url, pm.portfolio_url,
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

    // Récupérer les compétences
    const competencesResult = await query(
      `SELECT c.id, c.nom, c.categorie, mc.niveau
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = $1`,
      [result.rows[0].profil_id]
    );

    // Récupérer les disponibilités
    const dispoResult = await query(
      `SELECT id, jour_semaine, heure_debut, heure_fin, recurrent
       FROM disponibilites
       WHERE mentor_id = $1
       ORDER BY 
         CASE jour_semaine
           WHEN 'lundi' THEN 1
           WHEN 'mardi' THEN 2
           WHEN 'mercredi' THEN 3
           WHEN 'jeudi' THEN 4
           WHEN 'vendredi' THEN 5
           WHEN 'samedi' THEN 6
           WHEN 'dimanche' THEN 7
         END,
         heure_debut`,
      [result.rows[0].profil_id]
    );

    const mentor = result.rows[0];
    mentor.competences = competencesResult.rows;
    mentor.disponibilites = dispoResult.rows;

    res.json({
      success: true,
      mentor
    });
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
