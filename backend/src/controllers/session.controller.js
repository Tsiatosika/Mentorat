const { query, transaction } = require('../config/db');

// ============================================
// CONFIRMER UNE SESSION (par le mentor)
// ============================================
const confirmSession = async (req, res, next) => {
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

    // Vérifier que la session existe et appartient au mentor
    const sessionResult = await query(
      `SELECT s.*, u.email as mentore_email, u.nom as mentore_nom, u.prenom as mentore_prenom
       FROM sessions s
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs u ON u.id = pme.utilisateur_id
       WHERE s.id = $1 AND s.mentor_id = $2 AND s.statut = 'en_attente'`,
      [id, mentorId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée, déjà confirmée ou annulée'
      });
    }

    // Confirmer la session
    const result = await query(
      `UPDATE sessions 
       SET statut = 'confirmee', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Session confirmée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur confirmSession:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation',
      error: error.message
    });
  }
};

// ============================================
// LISTER LES SESSIONS
// ============================================
const getSessions = async (req, res, next) => {
  const { statut, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryText, params = [];
    let paramIndex = 1;

    if (req.user.role === 'mentor') {
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

      queryText = `
        SELECT s.*, 
               u.nom as mentore_nom, u.prenom as mentore_prenom, u.email as mentore_email
        FROM sessions s
        JOIN profils_mentore pme ON pme.id = s.mentore_id
        JOIN utilisateurs u ON u.id = pme.utilisateur_id
        WHERE s.mentor_id = $${paramIndex}
      `;
      params.push(mentorResult.rows[0].id);
      paramIndex++;
    } else {
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

      queryText = `
        SELECT s.*, 
               u.nom as mentor_nom, u.prenom as mentor_prenom, u.email as mentor_email
        FROM sessions s
        JOIN profils_mentor pm ON pm.id = s.mentor_id
        JOIN utilisateurs u ON u.id = pm.utilisateur_id
        WHERE s.mentore_id = $${paramIndex}
      `;
      params.push(mentoreResult.rows[0].id);
      paramIndex++;
    }

    if (statut) {
      queryText += ` AND s.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    queryText += ` ORDER BY s.date_debut DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      sessions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Erreur getSessions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des sessions',
      error: error.message
    });
  }
};

// ============================================
// CRÉER UNE SESSION
// ============================================
const createSession = async (req, res, next) => {
  const { mentor_id, date_debut, date_fin, sujet, description } = req.body;

  if (!mentor_id || !date_debut || !date_fin || !sujet) {
    return res.status(400).json({
      success: false,
      message: 'mentor_id, date_debut, date_fin et sujet sont requis'
    });
  }

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

    const mentorResult = await query(
      `SELECT pm.id, u.nom, u.prenom 
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.id = $1 AND pm.disponible = true`,
      [mentor_id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé ou indisponible'
      });
    }

    const mentorProfilId = mentorResult.rows[0].id;

    const result = await query(
      `INSERT INTO sessions (mentor_id, mentore_id, date_debut, date_fin, sujet, description, statut)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
       RETURNING *`,
      [mentorProfilId, mentoreId, date_debut, date_fin, sujet, description]
    );

    res.status(201).json({
      success: true,
      message: 'Session créée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur createSession:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création',
      error: error.message
    });
  }
};

// ============================================
// ANNULER UNE SESSION
// ============================================
const cancelSession = async (req, res, next) => {
  const { id } = req.params;
  const { raison } = req.body;

  try {
    const result = await query(
      `UPDATE sessions 
       SET statut = 'annulee', notes_mentor = COALESCE($1, notes_mentor), updated_at = NOW()
       WHERE id = $2 AND (statut = 'en_attente' OR statut = 'confirmee')
       RETURNING *`,
      [raison, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée ou déjà terminée'
      });
    }

    res.json({
      success: true,
      message: 'Session annulée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur cancelSession:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation',
      error: error.message
    });
  }
};

// ============================================
// DÉMARRER UNE SESSION
// ============================================
const startSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE sessions 
       SET statut = 'en_cours', updated_at = NOW()
       WHERE id = $1 AND statut = 'confirmee'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée ou non confirmée'
      });
    }

    res.json({
      success: true,
      message: 'Session démarrée',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur startSession:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage',
      error: error.message
    });
  }
};

// ============================================
// TERMINER UNE SESSION
// ============================================
const completeSession = async (req, res, next) => {
  const { id } = req.params;
  const { notes, note, duree_reelle } = req.body;

  try {
    let updateQuery;
    let params;
    
    if (req.user.role === 'mentor') {
      updateQuery = `UPDATE sessions 
                     SET statut = 'terminee', notes_mentor = $1, 
                         note_du_mentore = $2, duree_reelle = $3, updated_at = NOW()
                     WHERE id = $4 AND statut = 'en_cours'
                     RETURNING *`;
      params = [notes, note, duree_reelle, id];
    } else {
      updateQuery = `UPDATE sessions 
                     SET statut = 'terminee', notes_mentore = $1, 
                         note_du_mentor = $2, duree_reelle = $3, updated_at = NOW()
                     WHERE id = $4 AND statut = 'en_cours'
                     RETURNING *`;
      params = [notes, note, duree_reelle, id];
    }

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée ou non commencée'
      });
    }

    res.json({
      success: true,
      message: 'Session terminée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur completeSession:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la terminaison',
      error: error.message
    });
  }
};

// ============================================
// DÉTAIL D'UNE SESSION
// ============================================
const getSessionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT s.*,
              um.id as mentor_user_id, um.nom as mentor_nom, um.prenom as mentor_prenom,
              ume.id as mentore_user_id, ume.nom as mentore_nom, ume.prenom as mentore_prenom
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs um ON um.id = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs ume ON ume.id = pme.utilisateur_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    res.json({
      success: true,
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur getSessionById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement',
      error: error.message
    });
  }
};

// ============================================
// AJOUTER LIEN VISIO
// ============================================
const addVisioLink = async (req, res, next) => {
  const { id } = req.params;
  const { lien_visio } = req.body;

  if (!lien_visio) {
    return res.status(400).json({
      success: false,
      message: 'lien_visio est requis'
    });
  }

  try {
    const result = await query(
      `UPDATE sessions 
       SET lien_visio = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [lien_visio, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Lien de visio ajouté avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur addVisioLink:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout',
      error: error.message
    });
  }
};

module.exports = {
  createSession,
  confirmSession,
  cancelSession,
  startSession,
  completeSession,
  getSessions,
  getSessionById,
  addVisioLink
};