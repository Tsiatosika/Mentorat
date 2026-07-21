const { query, pool } = require('../config/db');

// ═══ STATISTIQUES DU TABLEAU DE BORD ═══
const getDashboardStats = async (req, res) => {
  try {
    const totalMentors = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'mentor' AND actif = true");
    const totalMentores = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'mentore' AND actif = true");
    const totalUsers = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE actif = true");
    const totalSessions = await query("SELECT COUNT(*) as total FROM sessions");
    const sessionsByStatus = await query("SELECT statut, COUNT(*) as total FROM sessions GROUP BY statut ORDER BY total DESC");
    const totalAvis = await query("SELECT COUNT(*) as total FROM avis");
    const avgNote = await query("SELECT ROUND(AVG(note_globale)::numeric, 1) as moyenne FROM avis");
    const totalMessages = await query("SELECT COUNT(*) as total FROM messages");
    const sessionsByMonth = await query("SELECT TO_CHAR(date_debut, 'YYYY-MM') as mois, COUNT(*) as total FROM sessions WHERE date_debut >= NOW() - INTERVAL '6 months' GROUP BY mois ORDER BY mois");
    const usersByMonth = await query("SELECT TO_CHAR(created_at, 'YYYY-MM') as mois, COUNT(*) as total FROM utilisateurs WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY mois ORDER BY mois");
    const topMentors = await query("SELECT u.id, u.nom, u.prenom, u.photo_url, pm.domaine, COALESCE(pm.note_moyenne,0) as note_moyenne, COUNT(s.id) as nb_sessions FROM utilisateurs u JOIN profils_mentor pm ON pm.utilisateur_id = u.id LEFT JOIN sessions s ON s.mentor_id = pm.id WHERE u.role = 'mentor' AND u.actif = true GROUP BY u.id, u.nom, u.prenom, u.photo_url, pm.domaine, pm.note_moyenne ORDER BY nb_sessions DESC LIMIT 5");
    const topMentores = await query("SELECT u.id, u.nom, u.prenom, u.photo_url, pme.niveau_etude, COUNT(s.id) as nb_sessions FROM utilisateurs u JOIN profils_mentore pme ON pme.utilisateur_id = u.id LEFT JOIN sessions s ON s.mentore_id = pme.id WHERE u.role = 'mentore' AND u.actif = true GROUP BY u.id, u.nom, u.prenom, u.photo_url, pme.niveau_etude ORDER BY nb_sessions DESC LIMIT 5");
    const domainDistribution = await query("SELECT COALESCE(pm.domaine, 'Non défini') as domaine, COUNT(*) as total FROM profils_mentor pm JOIN utilisateurs u ON u.id = pm.utilisateur_id WHERE u.actif = true GROUP BY pm.domaine ORDER BY total DESC");
    const recentUsers = await query("SELECT id, nom, prenom, email, role, photo_url, created_at FROM utilisateurs WHERE actif = true ORDER BY created_at DESC LIMIT 10");
    const recentSessions = await query("SELECT s.id, s.sujet, s.statut, s.date_debut, um.nom as mentor_nom, um.prenom as mentor_prenom, ume.nom as mentore_nom, ume.prenom as mentore_prenom FROM sessions s JOIN profils_mentor pm ON pm.id = s.mentor_id JOIN utilisateurs um ON um.id = pm.utilisateur_id JOIN profils_mentore pme ON pme.id = s.mentore_id JOIN utilisateurs ume ON ume.id = pme.utilisateur_id ORDER BY s.created_at DESC LIMIT 10");

    res.json({
      success: true,
      stats: {
        totalMentors: parseInt(totalMentors.rows[0].total),
        totalMentores: parseInt(totalMentores.rows[0].total),
        totalUsers: parseInt(totalUsers.rows[0].total),
        totalSessions: parseInt(totalSessions.rows[0].total),
        totalAvis: parseInt(totalAvis.rows[0].total),
        totalMessages: parseInt(totalMessages.rows[0].total),
        avgNote: parseFloat(avgNote.rows[0]?.moyenne || 0),
        sessionsByStatus: sessionsByStatus.rows,
        sessionsByMonth: sessionsByMonth.rows,
        usersByMonth: usersByMonth.rows,
        topMentors: topMentors.rows,
        topMentores: topMentores.rows,
        domainDistribution: domainDistribution.rows,
        recentUsers: recentUsers.rows,
        recentSessions: recentSessions.rows,
      },
    });
  } catch (error) {
    console.error('❌ Erreur admin stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ LISTE UTILISATEURS AVEC PAGINATION + FILTRES COMBINÉS ═══
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role = '',
      actif = '',
      search = '',
      dateFrom = '',
      dateTo = '',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (role)   { conditions.push(`role = $${idx++}`); params.push(role); }
    if (actif !== '') { conditions.push(`actif = $${idx++}`); params.push(actif === 'true'); }
    if (search) {
      conditions.push(`(nom ILIKE $${idx} OR prenom ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (dateFrom) { conditions.push(`created_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo)   { conditions.push(`created_at <= $${idx++}`); params.push(dateTo); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM utilisateurs ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const usersResult = await query(
      `SELECT id, nom, prenom, email, role, actif, photo_url, created_at, derniere_connexion
       FROM utilisateurs ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      users: usersResult.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ═══ DÉTAIL D'UN UTILISATEUR ═══
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `SELECT id, nom, prenom, email, role, actif, photo_url, created_at, derniere_connexion
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const targetUser = userResult.rows[0];

    const sessionsResult = await query(
      `SELECT s.id, s.sujet, s.statut, s.date_debut,
              um.prenom  AS mentor_prenom,  um.nom  AS mentor_nom,
              ume.prenom AS mentore_prenom, ume.nom AS mentore_nom
       FROM sessions s
       JOIN profils_mentor  pm  ON pm.id  = s.mentor_id
       JOIN utilisateurs    um  ON um.id  = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs    ume ON ume.id = pme.utilisateur_id
       WHERE pm.utilisateur_id = $1 OR pme.utilisateur_id = $1
       ORDER BY s.date_debut DESC
       LIMIT 50`,
      [id]
    );

    let avisRecus = [];
    if (targetUser.role === 'mentor') {
      const avisResult = await query(
        `SELECT a.id, a.note_globale AS note, a.commentaire, a.created_at, s.sujet
         FROM avis a
         JOIN profils_mentor pm ON pm.id = a.mentor_id
         JOIN sessions        s  ON s.id  = a.session_id
         WHERE pm.utilisateur_id = $1
         ORDER BY a.created_at DESC
         LIMIT 20`,
        [id]
      );
      avisRecus = avisResult.rows;
    }

    let avisDonnes = [];
    if (targetUser.role === 'mentore') {
      const avisResult = await query(
        `SELECT a.id, a.note_globale AS note, a.commentaire, a.created_at, s.sujet
         FROM avis a
         JOIN profils_mentore pme ON pme.id = a.mentore_id
         JOIN sessions         s   ON s.id  = a.session_id
         WHERE pme.utilisateur_id = $1
         ORDER BY a.created_at DESC
         LIMIT 20`,
        [id]
      );
      avisDonnes = avisResult.rows;
    }

    res.json({
      success: true,
      user: targetUser,
      sessions: sessionsResult.rows,
      avisRecus,
      avisDonnes,
    });
  } catch (error) {
    console.error('Erreur getUserDetail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ ACTIVER / DÉSACTIVER UN COMPTE ═══
const toggleUser = async (req, res) => {
  try {
    const result = await query(
      'UPDATE utilisateurs SET actif = $1 WHERE id = $2 RETURNING id, nom, actif',
      [req.body.actif, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ SUPPRESSION DÉFINITIVE D'UN COMPTE ═══
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM messages WHERE session_id IN (
         SELECT s.id FROM sessions s
         JOIN profils_mentor  pm  ON pm.id  = s.mentor_id
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         WHERE pm.utilisateur_id = $1 OR pme.utilisateur_id = $1
       )`,
      [id]
    );
    await client.query(
      `DELETE FROM sessions
       WHERE mentor_id  IN (SELECT id FROM profils_mentor  WHERE utilisateur_id = $1)
          OR mentore_id IN (SELECT id FROM profils_mentore WHERE utilisateur_id = $1)`,
      [id]
    );
    await client.query(`DELETE FROM notifications  WHERE utilisateur_id = $1`, [id]);
    await client.query(`DELETE FROM profils_mentor  WHERE utilisateur_id = $1`, [id]);
    await client.query(`DELETE FROM profils_mentore WHERE utilisateur_id = $1`, [id]);
    await client.query(`DELETE FROM utilisateurs    WHERE id = $1`, [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Utilisateur supprimé définitivement' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  } finally {
    client.release();
  }
};

// ═══ GESTION DES COMPÉTENCES (basique : ajout / suppression uniquement) ═══
//
// Volontairement pas d'édition/renommage : une compétence mal catégorisée
// devrait être supprimée puis recréée, ce qui casserait le lien avec les
// profils mentors qui l'utilisent déjà (mentor_competences.competence_id).
//
// Volontairement pas de fusion de doublons ("React" / "ReactJS") : on se
// contente ici de bloquer la création d'un doublon exact (insensible à la
// casse) plutôt que de le fusionner silencieusement.

// Vérifie combien de mentors utilisent une compétence, SANS rien supprimer.
// Sert à afficher un avertissement précis avant confirmation côté frontend.
const getCompetenceUsage = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.nom, c.categorie, COUNT(mc.mentor_id) as nb_mentors
       FROM competences c
       LEFT JOIN mentor_competences mc ON mc.competence_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, c.nom, c.categorie`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      competence: { id: row.id, nom: row.nom, categorie: row.categorie },
      nbMentors: parseInt(row.nb_mentors, 10),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ ÉDITION D'UNE COMPÉTENCE (renommage / recatégorisation) ═══
// L'id ne change pas lors d'un UPDATE : le lien mentor_competences.competence_id
// reste donc intact automatiquement, contrairement à un supprimer+recréer.
const editCompetence = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, categorie } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' });
    }
    const trimmedNom = nom.trim();

    const current = await query('SELECT id, nom, categorie FROM competences WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    }

    // Bloque le renommage vers un nom déjà utilisé par une AUTRE compétence
    // (pas de fusion silencieuse de doublons, même via l'édition)
    const duplicate = await query(
      'SELECT id, nom, categorie FROM competences WHERE nom ILIKE $1 AND id != $2',
      [trimmedNom, id]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Une autre compétence porte déjà ce nom ("${duplicate.rows[0].nom}", catégorie : ${duplicate.rows[0].categorie})`,
        competence: duplicate.rows[0],
      });
    }

    const result = await query(
      'UPDATE competences SET nom = $1, categorie = $2 WHERE id = $3 RETURNING *',
      [trimmedNom, categorie || 'Autre', id]
    );
    res.json({ success: true, competence: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCompetence = async (req, res) => {
  try {
    const { nom, categorie } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' });
    }
    const trimmedNom = nom.trim();

    // Vérifie les doublons (insensible à la casse) — pas de merge, pas d'update silencieux
    const existing = await query(
      'SELECT id, nom, categorie FROM competences WHERE nom ILIKE $1',
      [trimmedNom]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cette compétence existe déjà ("${existing.rows[0].nom}", catégorie : ${existing.rows[0].categorie})`,
        competence: existing.rows[0],
      });
    }

    const result = await query(
      'INSERT INTO competences (nom, categorie) VALUES ($1, $2) RETURNING *',
      [trimmedNom, categorie || 'Autre']
    );
    res.status(201).json({ success: true, competence: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompetence = async (req, res) => {
  try {
    const removed = await query(
      'DELETE FROM mentor_competences WHERE competence_id = $1 RETURNING mentor_id',
      [req.params.id]
    );
    const result = await query('DELETE FROM competences WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    }
    res.json({
      success: true,
      message: 'Compétence supprimée',
      mentorsAffectes: removed.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ RAPPORTS ═══
const getAllReports = async (req, res) => {
  try {
    const result = await query(
      'SELECT r.*, s.sujet as session_sujet FROM rapports r LEFT JOIN sessions s ON s.id = r.session_id ORDER BY r.genere_le DESC'
    );
    res.json({ success: true, rapports: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetail,
  toggleUser,
  deleteUser,
  getCompetenceUsage,
  addCompetence,
  editCompetence,
  deleteCompetence,
  getAllReports,
};