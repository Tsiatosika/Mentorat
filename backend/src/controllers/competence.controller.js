const { query } = require('../config/db');

const getAllCompetences = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nom, categorie 
       FROM competences 
       ORDER BY categorie, nom`
    );

    res.json({
      success: true,
      competences: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

const getCompetenceById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      'SELECT id, nom, categorie FROM competences WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée',
      });
    }

    res.json({
      success: true,
      competence: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const searchCompetences = async (req, res, next) => {
  const { q, categorie } = req.query;

  if (!q && !categorie) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre de recherche "q" ou "categorie" est requis',
    });
  }

  let queryText = `
    SELECT id, nom, categorie 
    FROM competences 
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (q) {
    queryText += ` AND nom ILIKE $${paramIndex}`;
    params.push(`%${q}%`);
    paramIndex++;
  }

  if (categorie) {
    queryText += ` AND categorie ILIKE $${paramIndex}`;
    params.push(`%${categorie}%`);
    paramIndex++;
  }

  queryText += ` ORDER BY nom LIMIT 50`;

  try {
    const result = await query(queryText, params);

    res.json({
      success: true,
      competences: result.rows,
      count: result.rows.length,
      recherche: q || null,
    });
  } catch (error) {
    next(error);
  }
};

const getCompetencesByCategorie = async (req, res, next) => {
  const { categorie } = req.params;

  try {
    const result = await query(
      'SELECT id, nom, categorie FROM competences WHERE categorie ILIKE $1 ORDER BY nom',
      [`%${categorie}%`]
    );

    res.json({
      success: true,
      categorie,
      competences: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

const getMentorCompetences = async (req, res, next) => {
  const { mentorId } = req.params;

  try {
    // Vérifier que le mentor existe
    const mentorCheck = await query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.photo_url,
              pm.domaine, pm.note_moyenne, pm.nb_sessions
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [mentorId]
    );

    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé',
      });
    }

    // Récupérer les compétences du mentor
    const result = await query(
      `SELECT c.id, c.nom, c.categorie, mc.niveau
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = (SELECT id FROM profils_mentor WHERE utilisateur_id = $1)
       ORDER BY c.nom`,
      [mentorId]
    );

    res.json({
      success: true,
      mentor: mentorCheck.rows[0],
      competences: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompetences,
  getCompetenceById,
  searchCompetences,
  getCompetencesByCategorie,
  getMentorCompetences,
};