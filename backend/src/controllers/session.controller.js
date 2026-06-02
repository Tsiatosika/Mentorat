// src/controllers/session.controller.js
const { query } = require('../config/db');

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
      return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
    }

    const mentoreId = mentoreResult.rows[0].id;

    const mentorResult = await query(
      `SELECT pm.id FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.id = $1 AND pm.disponible = true`,
      [mentor_id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor non trouvé ou indisponible' });
    }

    const result = await query(
      `INSERT INTO sessions (mentor_id, mentore_id, date_debut, date_fin, sujet, description, statut)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
       RETURNING *`,
      [mentorResult.rows[0].id, mentoreId, date_debut, date_fin, sujet, description]
    );

    // Notifier le mentor
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, lien)
       VALUES ($1, 'session_confirmee', 'Nouvelle demande de session',
               'Un mentoré a demandé une session avec vous', '/sessions/${result.rows[0].id}')`,
      [mentor_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Session créée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CONFIRMER UNE SESSION (par le mentor)
// ============================================
const confirmSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const mentorResult = await query(
      'SELECT id FROM profils_mentor WHERE utilisateur_id = $1',
      [req.user.id]
    );

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
    }

    const sessionResult = await query(
      `SELECT s.*, pme.utilisateur_id as mentore_user_id
       FROM sessions s
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE s.id = $1 AND s.mentor_id = $2 AND s.statut = 'en_attente'`,
      [id, mentorResult.rows[0].id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée, déjà confirmée ou annulée'
      });
    }

    const result = await query(
      `UPDATE sessions SET statut = 'confirmee', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    // Notifier le mentoré
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, lien)
       VALUES ($1, 'session_confirmee', 'Session confirmée',
               'Votre session a été confirmée par le mentor', '/sessions/${id}')`,
      [sessionResult.rows[0].mentore_user_id]
    );

    return res.json({
      success: true,
      message: 'Session confirmée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ANNULER UNE SESSION
// CORRECTION 2 : vérification que l'utilisateur
// est bien mentor OU mentoré de cette session
// ============================================
const cancelSession = async (req, res, next) => {
  const { id } = req.params;
  const { raison } = req.body;

  try {
    const result = await query(
      `UPDATE sessions
       SET statut = 'annulee',
           notes_mentor = CASE WHEN $1::text IS NOT NULL THEN $1 ELSE notes_mentor END,
           updated_at = NOW()
       WHERE id = $2
         AND (statut = 'en_attente' OR statut = 'confirmee')
         AND (
           mentor_id  = (SELECT id FROM profils_mentor  WHERE utilisateur_id = $3)
           OR
           mentore_id = (SELECT id FROM profils_mentore WHERE utilisateur_id = $3)
         )
       RETURNING *`,
      [raison || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée, déjà terminée ou accès non autorisé'
      });
    }

    return res.json({
      success: true,
      message: 'Session annulée avec succès',
      session: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DÉMARRER UNE SESSION
// ============================================
const startSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE sessions SET statut = 'en_cours', updated_at = NOW()
       WHERE id = $1 AND statut = 'confirmee' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée ou non confirmée' });
    }

    return res.json({ success: true, message: 'Session démarrée', session: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// TERMINER UNE SESSION
// CORRECTION 3 : chaque partie soumet sa note
// indépendamment. La session passe à 'terminee'
// automatiquement quand les DEUX ont noté.
// ============================================
const completeSession = async (req, res, next) => {
  const { id } = req.params;
  const { notes, note, duree_reelle } = req.body;

  try {
    let updateQuery, params;

    if (req.user.role === 'mentor') {
      // Le mentor soumet ses notes SANS changer le statut
      updateQuery = `
        UPDATE sessions
        SET notes_mentor    = COALESCE($1, notes_mentor),
            note_du_mentore = COALESCE($2, note_du_mentore),
            duree_reelle    = COALESCE($3, duree_reelle),
            updated_at      = NOW()
        WHERE id = $4 AND statut = 'en_cours'
        RETURNING *`;
      params = [notes, note, duree_reelle, id];
    } else {
      // Le mentoré soumet ses notes SANS changer le statut
      updateQuery = `
        UPDATE sessions
        SET notes_mentore  = COALESCE($1, notes_mentore),
            note_du_mentor = COALESCE($2, note_du_mentor),
            duree_reelle   = COALESCE($3, duree_reelle),
            updated_at     = NOW()
        WHERE id = $4 AND statut = 'en_cours'
        RETURNING *`;
      params = [notes, note, duree_reelle, id];
    }

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée ou non commencée' });
    }

    // Passer à 'terminee' uniquement si les DEUX ont soumis leur note
    const checkResult = await query(
      `UPDATE sessions SET statut = 'terminee', updated_at = NOW()
       WHERE id = $1
         AND note_du_mentor   IS NOT NULL
         AND note_du_mentore  IS NOT NULL
         AND statut = 'en_cours'
       RETURNING *`,
      [id]
    );

    const sessionFinale = checkResult.rows.length > 0
      ? checkResult.rows[0]
      : result.rows[0];

    const estTerminee = checkResult.rows.length > 0;

    return res.json({
      success: true,
      message: estTerminee
        ? 'Session terminée — rapport disponible dans quelques instants'
        : 'Notes enregistrées — en attente de la note de l\'autre participant',
      session: sessionFinale,
      terminee: estTerminee
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LISTER LES SESSIONS
// ============================================
const getSessions = async (req, res, next) => {
  const { statut, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let baseQuery, params = [], paramIndex = 1;

    if (req.user.role === 'mentor') {
      const mentorResult = await query(
        'SELECT id FROM profils_mentor WHERE utilisateur_id = $1', [req.user.id]
      );
      if (mentorResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Profil mentor non trouvé' });
      }
      baseQuery = `
        SELECT s.*,
               u.nom as mentore_nom, u.prenom as mentore_prenom, u.email as mentore_email
        FROM sessions s
        JOIN profils_mentore pme ON pme.id = s.mentore_id
        JOIN utilisateurs u ON u.id = pme.utilisateur_id
        WHERE s.mentor_id = $${paramIndex}`;
      params.push(mentorResult.rows[0].id);
      paramIndex++;
    } else {
      const mentoreResult = await query(
        'SELECT id FROM profils_mentore WHERE utilisateur_id = $1', [req.user.id]
      );
      if (mentoreResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
      }
      baseQuery = `
        SELECT s.*,
               u.nom as mentor_nom, u.prenom as mentor_prenom, u.email as mentor_email
        FROM sessions s
        JOIN profils_mentor pm ON pm.id = s.mentor_id
        JOIN utilisateurs u ON u.id = pm.utilisateur_id
        WHERE s.mentore_id = $${paramIndex}`;
      params.push(mentoreResult.rows[0].id);
      paramIndex++;
    }

    if (statut) {
      baseQuery += ` AND s.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    baseQuery += ` ORDER BY s.date_debut DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(baseQuery, params);

    return res.json({
      success: true,
      sessions: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: result.rows.length }
    });
  } catch (error) {
    next(error);
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
              um.id  as mentor_user_id,  um.nom  as mentor_nom,  um.prenom  as mentor_prenom,
              ume.id as mentore_user_id, ume.nom as mentore_nom, ume.prenom as mentore_prenom
       FROM sessions s
       JOIN profils_mentor pm    ON pm.id  = s.mentor_id
       JOIN utilisateurs um      ON um.id  = pm.utilisateur_id
       JOIN profils_mentore pme  ON pme.id = s.mentore_id
       JOIN utilisateurs ume     ON ume.id = pme.utilisateur_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée' });
    }

    return res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AJOUTER LIEN VISIO
// ============================================
const addVisioLink = async (req, res, next) => {
  const { id } = req.params;
  const { lien_visio } = req.body;

  if (!lien_visio) {
    return res.status(400).json({ success: false, message: 'lien_visio est requis' });
  }

  try {
    const result = await query(
      `UPDATE sessions SET lien_visio = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [lien_visio, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée' });
    }

    return res.json({ success: true, message: 'Lien visio ajouté', session: result.rows[0] });
  } catch (error) {
    next(error);
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