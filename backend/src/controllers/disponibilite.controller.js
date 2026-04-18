const { query } = require('../config/db');

const getDisponibilites = async (req, res, next) => {
  try {
    // Récupérer l'ID du profil mentor à partir de l'utilisateur connecté
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
      `SELECT id, jour_semaine, heure_debut, heure_fin, recurrent, created_at
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
      [mentorId]
    );

    res.json({
      success: true,
      disponibilites: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const addDisponibilite = async (req, res, next) => {
  const { jour_semaine, heure_debut, heure_fin, recurrent } = req.body;

  // Validation
  if (!jour_semaine || !heure_debut || !heure_fin) {
    return res.status(400).json({
      success: false,
      message: 'jour_semaine, heure_debut et heure_fin sont requis'
    });
  }

  // Valider le jour de semaine
  const joursValides = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  if (!joursValides.includes(jour_semaine.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'jour_semaine doit être: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche'
    });
  }

  try {
    // Récupérer l'ID du profil mentor
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

    // Vérifier si une disponibilité similaire existe déjà
    const existingResult = await query(
      `SELECT id FROM disponibilites 
       WHERE mentor_id = $1 AND jour_semaine = $2 
       AND heure_debut = $3 AND heure_fin = $4`,
      [mentorId, jour_semaine.toLowerCase(), heure_debut, heure_fin]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cette disponibilité existe déjà'
      });
    }

    const result = await query(
      `INSERT INTO disponibilites (mentor_id, jour_semaine, heure_debut, heure_fin, recurrent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [mentorId, jour_semaine.toLowerCase(), heure_debut, heure_fin, recurrent !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Disponibilité ajoutée avec succès',
      disponibilite: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateDisponibilite = async (req, res, next) => {
  const { id } = req.params;
  const { jour_semaine, heure_debut, heure_fin, recurrent } = req.body;

  try {
    // Récupérer l'ID du profil mentor
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

    // Vérifier que la disponibilité appartient bien au mentor
    const checkResult = await query(
      'SELECT id FROM disponibilites WHERE id = $1 AND mentor_id = $2',
      [id, mentorId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Disponibilité non trouvée'
      });
    }

    const result = await query(
      `UPDATE disponibilites 
       SET jour_semaine = COALESCE($1, jour_semaine),
           heure_debut = COALESCE($2, heure_debut),
           heure_fin = COALESCE($3, heure_fin),
           recurrent = COALESCE($4, recurrent)
       WHERE id = $5 AND mentor_id = $6
       RETURNING *`,
      [jour_semaine, heure_debut, heure_fin, recurrent, id, mentorId]
    );

    res.json({
      success: true,
      message: 'Disponibilité mise à jour avec succès',
      disponibilite: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteDisponibilite = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Récupérer l'ID du profil mentor
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
      'DELETE FROM disponibilites WHERE id = $1 AND mentor_id = $2',
      [id, mentorId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Disponibilité non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Disponibilité supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

const getDisponibilitesByMentorId = async (req, res, next) => {
  const { mentorId } = req.params;

  try {
    // Vérifier que le mentor existe
    const mentorResult = await query(
      `SELECT u.id, u.nom, u.prenom 
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [mentorId]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé'
      });
    }

    const result = await query(
      `SELECT id, jour_semaine, heure_debut, heure_fin, recurrent
       FROM disponibilites
       WHERE mentor_id = (SELECT id FROM profils_mentor WHERE utilisateur_id = $1)
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
      [mentorId]
    );

    res.json({
      success: true,
      mentor: mentorResult.rows[0],
      disponibilites: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDisponibilites,
  addDisponibilite,
  updateDisponibilite,
  deleteDisponibilite,
  getDisponibilitesByMentorId
};