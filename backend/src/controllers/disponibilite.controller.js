const { query } = require('../config/db');

const getDisponibilites = async (req, res, next) => {
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

  if (!jour_semaine || !heure_debut || !heure_fin) {
    return res.status(400).json({
      success: false,
      message: 'jour_semaine, heure_debut et heure_fin sont requis'
    });
  }

  const joursValides = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  if (!joursValides.includes(jour_semaine.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'jour_semaine doit être: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche'
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

// ============================================
// OBTENIR LES DISPONIBILITÉS D'UN MENTOR (PUBLIC)
// ============================================
const getDisponibilitesByMentorId = async (req, res, next) => {
  const { mentorId } = req.params;

  try {
    let mentorProfilId = null;
    let mentorInfo = null;

    // 1. Essayer avec l'ID comme utilisateur_id
    let result = await query(
      `SELECT pm.id as profil_id, u.id, u.nom, u.prenom 
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [mentorId]
    );

    if (result.rows.length > 0) {
      mentorProfilId = result.rows[0].profil_id;
      mentorInfo = result.rows[0];
    } else {
      // 2. Essayer avec l'ID comme profil_id
      result = await query(
        `SELECT pm.id as profil_id, u.id, u.nom, u.prenom 
         FROM profils_mentor pm
         JOIN utilisateurs u ON u.id = pm.utilisateur_id
         WHERE pm.id = $1 AND u.role = 'mentor' AND u.actif = true`,
        [mentorId]
      );
      
      if (result.rows.length > 0) {
        mentorProfilId = result.rows[0].profil_id;
        mentorInfo = result.rows[0];
      }
    }

    if (!mentorProfilId || !mentorInfo) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé'
      });
    }

    // Récupérer les disponibilités
    const disponibilitesResult = await query(
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
      [mentorProfilId]
    );

    res.json({
      success: true,
      mentor: {
        id: mentorInfo.id,
        nom: mentorInfo.nom,
        prenom: mentorInfo.prenom
      },
      disponibilites: disponibilitesResult.rows
    });
  } catch (error) {
    console.error('Erreur getDisponibilitesByMentorId:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDisponibilites,
  addDisponibilite,
  updateDisponibilite,
  deleteDisponibilite,
  getDisponibilitesByMentorId
};
