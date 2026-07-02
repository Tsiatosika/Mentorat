const { query } = require('../config/db');

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
      return res.status(404).json({
        success: false,
        message: 'Profil mentor non trouve'
      });
    }

    const profile = result.rows[0];

    // Récupérer les compétences (chaînes simples)
    const competencesResult = await query(
      `SELECT c.nom
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = $1
       ORDER BY c.nom`,
      [profile.id]
    );
    profile.competences = competencesResult.rows.map(r => r.nom);

    res.json({
      success: true,
      profile: profile
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
        message: 'Profil mentor non trouve'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis a jour avec succes',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise a jour',
      error: error.message
    });
  }
};

// ============================================
// AJOUTER UNE COMPÉTENCE
// ============================================
const addCompetence = async (req, res, next) => {
  const { competence_id, competence_nom, niveau } = req.body;

  if (!competence_id && !competence_nom) {
    return res.status(400).json({
      success: false,
      message: 'competence_id ou competence_nom est requis'
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
        message: 'Profil mentor non trouve'
      });
    }

    const mentorId = mentorResult.rows[0].id;
    let finalCompetenceId = competence_id || null;
    let finalCompetenceNom = competence_nom || null;

    // Si c'est une nouvelle compétence (nom fourni mais pas d'ID)
    if (!finalCompetenceId && finalCompetenceNom) {
      const nomNettoye = finalCompetenceNom.trim();
      
      // Vérifier si la compétence existe déjà
      const existingComp = await query(
        'SELECT id, nom FROM competences WHERE LOWER(nom) = LOWER($1)',
        [nomNettoye]
      );

      if (existingComp.rows.length > 0) {
        finalCompetenceId = existingComp.rows[0].id;
        finalCompetenceNom = existingComp.rows[0].nom;
      } else {
        // Créer une nouvelle compétence
        const newComp = await query(
          'INSERT INTO competences (nom) VALUES ($1) RETURNING id, nom',
          [nomNettoye]
        );
        finalCompetenceId = newComp.rows[0].id;
        finalCompetenceNom = newComp.rows[0].nom;
      }
    }

    // Si on a un ID mais pas de nom, récupérer le nom
    if (finalCompetenceId && !finalCompetenceNom) {
      const compResult = await query(
        'SELECT nom FROM competences WHERE id = $1',
        [finalCompetenceId]
      );
      finalCompetenceNom = compResult.rows[0]?.nom || 'Inconnu';
    }

    if (!finalCompetenceId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de trouver ou creer la competence'
      });
    }

    // Ajouter ou mettre à jour la liaison
    await query(
      `INSERT INTO mentor_competences (mentor_id, competence_id, niveau)
       VALUES ($1, $2, $3)
       ON CONFLICT (mentor_id, competence_id) 
       DO UPDATE SET niveau = $3, updated_at = NOW()`,
      [mentorId, finalCompetenceId, niveau || 'intermediaire']
    );

    res.status(201).json({
      success: true,
      message: 'Competence ajoutee avec succes',
      competence: {
        id: finalCompetenceId,
        nom: finalCompetenceNom,
        niveau: niveau || 'intermediaire'
      }
    });
  } catch (error) {
    console.error('❌ Erreur addCompetence:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la competence",
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
        message: 'Profil mentor non trouve'
      });
    }

    const mentorId = mentorResult.rows[0].id;

    await query(
      'DELETE FROM mentor_competences WHERE mentor_id = $1 AND competence_id = $2',
      [mentorId, competence_id]
    );

    res.json({
      success: true,
      message: 'Competence supprimee avec succes'
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
  const { domaine, competence, search, disponible, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryText = `
      SELECT DISTINCT
        u.id, u.nom, u.prenom, u.email, u.photo_url,
        pm.id as profil_id, pm.bio, pm.domaine, 
        pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible,
        COALESCE(ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL), ARRAY[]::VARCHAR[]) as competences,
        COUNT(DISTINCT a.id) as nb_avis
      FROM utilisateurs u
      JOIN profils_mentor pm ON pm.utilisateur_id = u.id
      LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
      LEFT JOIN competences c ON c.id = mc.competence_id
      LEFT JOIN avis a ON a.mentor_id = u.id
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

    // Compter le total
    const countQuery = queryText.replace(
      /SELECT DISTINCT.*?FROM/s,
      'SELECT COUNT(DISTINCT u.id) as total FROM'
    );
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total, 10) || 0;

    queryText += ` GROUP BY u.id, pm.id ORDER BY pm.note_moyenne DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const data = result.rows.map((row) => ({
      ...row,
      nb_avis: parseInt(row.nb_avis, 10) || 0,
      competences: row.competences || [],
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total
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
      `SELECT 
         u.id, u.nom, u.prenom, u.email, u.photo_url,
         pm.id as profil_id, pm.bio, pm.domaine, 
         pm.annees_experience, pm.note_moyenne, pm.nb_sessions, pm.disponible,
         pm.cv_url, pm.portfolio_url,
         (SELECT COUNT(*) FROM avis a WHERE a.mentor_id = u.id) as nb_avis
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouve'
      });
    }

    const mentor = result.rows[0];
    mentor.nb_avis = parseInt(mentor.nb_avis, 10) || 0;

    // Récupérer les compétences (chaînes simples)
    const competencesResult = await query(
      `SELECT c.nom
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = $1
       ORDER BY c.nom`,
      [mentor.profil_id]
    );
    mentor.competences = competencesResult.rows.map(r => r.nom);

    // Récupérer les disponibilités
    const dispoResult = await query(
      `SELECT id, jour_semaine, heure_debut, heure_fin, recurrent
       FROM disponibilites
       WHERE mentor_id = $1
       ORDER BY jour_semaine, heure_debut`,
      [mentor.profil_id]
    );
    mentor.disponibilites = dispoResult.rows;

    res.json({
      success: true,
      mentor: mentor
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

// ============================================
// STATISTIQUES PAR DOMAINE (PUBLIC)
// ============================================
const getDomainesStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pm.domaine, COUNT(*) as total
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.role = 'mentor' AND u.actif = true AND pm.domaine IS NOT NULL AND pm.domaine != ''
       GROUP BY pm.domaine
       ORDER BY total DESC`
    );

    const domaines = result.rows.map((r) => ({
      domaine: r.domaine,
      total: parseInt(r.total, 10),
    }));

    res.json({ success: true, domaines });
  } catch (error) {
    console.error('❌ Erreur getDomainesStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques',
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
  getMentorById,
  getDomainesStats
};