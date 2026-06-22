const { query, transaction } = require('../config/db');

const createAvis = async (req, res, next) => {
  const { session_id, note_ponctualite, note_pedagogie, note_disponibilite, commentaire } = req.body;
  const utilisateurId = req.user.id;

  try {
    // Récupérer la session avec les utilisateur_id réels (via jointure sur les profils)
    const sessionResult = await query(
      `SELECT 
         s.id, 
         s.statut,
         pm.id AS mentor_profil_id,
         pm.utilisateur_id AS mentor_utilisateur_id,
         pme.id AS mentore_profil_id,
         pme.utilisateur_id AS mentore_utilisateur_id
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE s.id = $1`,
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée.' });
    }

    const session = sessionResult.rows[0];

    if (session.mentore_utilisateur_id !== utilisateurId) {
      return res.status(403).json({ success: false, message: 'Cette session ne vous appartient pas.' });
    }

    if (session.statut !== 'terminee') {
      return res.status(400).json({ success: false, message: 'Seules les sessions terminées peuvent être notées.' });
    }

    const existing = await query('SELECT id FROM avis WHERE session_id = $1', [session_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà noté cette session.' });
    }

    const noteGlobale = (
      (Number(note_ponctualite) + Number(note_pedagogie) + Number(note_disponibilite)) / 3
    ).toFixed(1);

    const result = await transaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO avis (session_id, mentor_id, mentore_id, note_globale, note_ponctualite, note_pedagogie, note_disponibilite, commentaire)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          session_id,
          session.mentor_utilisateur_id,   // utilisateurs.id du mentor
          session.mentore_utilisateur_id,  // utilisateurs.id du mentoré
          noteGlobale,
          note_ponctualite,
          note_pedagogie,
          note_disponibilite,
          commentaire,
        ]
      );

      const avgResult = await client.query(
        `SELECT AVG(note_globale) as moyenne, COUNT(*) as total FROM avis WHERE mentor_id = $1`,
        [session.mentor_utilisateur_id]
      );

      await client.query(
        `UPDATE profils_mentor SET note_moyenne = $1 WHERE utilisateur_id = $2`,
        [avgResult.rows[0].moyenne, session.mentor_utilisateur_id]
      );

      return insert.rows[0];
    });

    res.status(201).json({ success: true, avis: result });
  } catch (error) {
    next(error);
  }
};

const getAvisByMentor = async (req, res, next) => {
  const { mentorId } = req.params;
  try {
    const result = await query(
      `SELECT a.*, u.nom, u.prenom
       FROM avis a
       JOIN utilisateurs u ON u.id = a.mentore_id
       WHERE a.mentor_id = $1
       ORDER BY a.created_at DESC`,
      [mentorId]
    );
    res.json({ success: true, avis: result.rows });
  } catch (error) {
    next(error);
  }
};

const getAvisBySession = async (req, res, next) => {
  const { sessionId } = req.params;
  try {
    const result = await query('SELECT * FROM avis WHERE session_id = $1', [sessionId]);
    res.json({ success: true, avis: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
};

const getSessionsNoteesByMentore = async (req, res, next) => {
  const utilisateurId = req.user.id;

  try {
    const result = await query(
      `SELECT a.session_id
       FROM avis a
       WHERE a.mentore_id = $1`,
      [utilisateurId]
    );

    const sessionIds = result.rows.map((r) => r.session_id);
    res.json({ success: true, sessionIds });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAvis, getAvisByMentor, getAvisBySession, getSessionsNoteesByMentore };