const { query, pool } = require('../config/db');
const { sendNotificationToUser, getIo } = require('../socket/index');

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

// ═══ GESTION DES CATÉGORIES (référentiel : nom + icône + couleur) ═══
//
// competences.categorie reste un champ texte (pas de FK vers categories.id).
// Renommer une catégorie répercute donc le nouveau nom sur toutes les
// compétences qui l'utilisaient (UPDATE ciblé, dans une transaction).
// Supprimer une catégorie réassigne ses compétences vers "Autre" plutôt
// que de les laisser sans catégorie.

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT cat.id, cat.nom, cat.icone, cat.couleur,
              COUNT(c.id) as nb_competences
       FROM categories cat
       LEFT JOIN competences c ON c.categorie = cat.nom
       GROUP BY cat.id, cat.nom, cat.icone, cat.couleur
       ORDER BY cat.nom`
    );
    res.json({
      success: true,
      categories: result.rows.map((r) => ({ ...r, nb_competences: parseInt(r.nb_competences, 10) })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { nom, icone, couleur } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' });
    }
    const trimmedNom = nom.trim();

    const existing = await query('SELECT id, nom FROM categories WHERE nom ILIKE $1', [trimmedNom]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cette catégorie existe déjà ("${existing.rows[0].nom}")`,
        categorie: existing.rows[0],
      });
    }

    const result = await query(
      'INSERT INTO categories (nom, icone, couleur) VALUES ($1, $2, $3) RETURNING *',
      [trimmedNom, icone || 'Wrench', couleur || '#6B7280']
    );
    res.status(201).json({ success: true, categorie: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const editCategory = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { nom, icone, couleur } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' });
    }
    const trimmedNom = nom.trim();

    const current = await query('SELECT id, nom FROM categories WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    const oldNom = current.rows[0].nom;

    const duplicate = await query('SELECT id, nom FROM categories WHERE nom ILIKE $1 AND id != $2', [trimmedNom, id]);
    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Une autre catégorie porte déjà ce nom ("${duplicate.rows[0].nom}")`,
        categorie: duplicate.rows[0],
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE categories SET nom = $1, icone = $2, couleur = $3 WHERE id = $4 RETURNING *',
      [trimmedNom, icone || 'Wrench', couleur || '#6B7280', id]
    );

    // Si le nom a changé, on répercute sur tout ce qui référence l'ancien nom :
    // les compétences (categorie) ET les profils mentor/mentoré (domaine),
    // puisque ProfilePage.tsx utilise désormais ce même référentiel.
    let competencesMisesAJour = 0;
    let profilsMisAJour = 0;
    if (oldNom !== trimmedNom) {
      const updatedCompetences = await client.query(
        'UPDATE competences SET categorie = $1 WHERE categorie = $2 RETURNING id',
        [trimmedNom, oldNom]
      );
      competencesMisesAJour = updatedCompetences.rows.length;

      const updatedMentors = await client.query(
        'UPDATE profils_mentor SET domaine = $1 WHERE domaine = $2 RETURNING id',
        [trimmedNom, oldNom]
      );
      const updatedMentores = await client.query(
        'UPDATE profils_mentore SET domaine = $1 WHERE domaine = $2 RETURNING id',
        [trimmedNom, oldNom]
      );
      profilsMisAJour = updatedMentors.rows.length + updatedMentores.rows.length;
    }

    await client.query('COMMIT');
    res.json({ success: true, categorie: result.rows[0], competencesMisesAJour, profilsMisAJour });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* pas de transaction ouverte */ }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// Vérifie combien de compétences ET de profils (mentor/mentoré) utilisent
// une catégorie, SANS rien supprimer.
const getCategoryUsage = async (req, res) => {
  try {
    const result = await query(
      `SELECT cat.id, cat.nom,
              (SELECT COUNT(*) FROM competences c WHERE c.categorie = cat.nom) as nb_competences,
              (SELECT COUNT(*) FROM profils_mentor pm WHERE pm.domaine = cat.nom) as nb_mentors,
              (SELECT COUNT(*) FROM profils_mentore pme WHERE pme.domaine = cat.nom) as nb_mentores
       FROM categories cat
       WHERE cat.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    const row = result.rows[0];
    res.json({
      success: true,
      categorie: { id: row.id, nom: row.nom },
      nbCompetences: parseInt(row.nb_competences, 10),
      nbMentors: parseInt(row.nb_mentors, 10),
      nbMentores: parseInt(row.nb_mentores, 10),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const current = await query('SELECT id, nom FROM categories WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    const nom = current.rows[0].nom;

    if (nom === 'Autre') {
      return res.status(400).json({
        success: false,
        message: 'La catégorie "Autre" ne peut pas être supprimée (catégorie de repli)',
      });
    }

    await client.query('BEGIN');

    // Tout ce qui référence cette catégorie bascule vers "Autre" plutôt que
    // de se retrouver avec une valeur orpheline : compétences ET profils
    // mentor/mentoré (domaine).
    const reassigned = await client.query(
      "UPDATE competences SET categorie = 'Autre' WHERE categorie = $1 RETURNING id",
      [nom]
    );
    const reassignedMentors = await client.query(
      "UPDATE profils_mentor SET domaine = 'Autre' WHERE domaine = $1 RETURNING id",
      [nom]
    );
    const reassignedMentores = await client.query(
      "UPDATE profils_mentore SET domaine = 'Autre' WHERE domaine = $1 RETURNING id",
      [nom]
    );

    await client.query('DELETE FROM categories WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Catégorie supprimée',
      competencesReassignees: reassigned.rows.length,
      profilsReassignes: reassignedMentors.rows.length + reassignedMentores.rows.length,
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* pas de transaction ouverte */ }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// ═══ GESTION DES COMPÉTENCES (basique : ajout / suppression uniquement) ═══
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

// ═══ LISTE DE TOUTES LES SESSIONS (vue admin, sans filtre par utilisateur) ═══
const getAllSessionsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 200,
      statut = '',
      search = '',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (statut) {
      conditions.push(`s.statut = $${idx++}`);
      params.push(statut);
    }
    if (search) {
      conditions.push(`s.sujet ILIKE $${idx}`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM sessions s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT s.id, s.sujet, s.description, s.statut, s.date_debut, s.date_fin,
              s.motif_annulation, s.created_at,
              um.id  AS mentor_user_id,  um.nom  AS mentor_nom,  um.prenom  AS mentor_prenom,  um.email  AS mentor_email,
              ume.id AS mentore_user_id, ume.nom AS mentore_nom, ume.prenom AS mentore_prenom, ume.email AS mentore_email
       FROM sessions s
       JOIN profils_mentor  pm  ON pm.id  = s.mentor_id
       JOIN utilisateurs    um  ON um.id  = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs    ume ON ume.id = pme.utilisateur_id
       ${whereClause}
       ORDER BY s.date_debut DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      sessions: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Erreur getAllSessionsAdmin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const sessionResult = await query(
      `SELECT s.*,
              um.id  AS mentor_user_id,  um.nom  AS mentor_nom,  um.prenom  AS mentor_prenom,  um.email  AS mentor_email,  um.photo_url  AS mentor_photo_url,
              ume.id AS mentore_user_id, ume.nom AS mentore_nom, ume.prenom AS mentore_prenom, ume.email AS mentore_email, ume.photo_url AS mentore_photo_url
       FROM sessions s
       JOIN profils_mentor  pm  ON pm.id  = s.mentor_id
       JOIN utilisateurs    um  ON um.id  = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs    ume ON ume.id = pme.utilisateur_id
       WHERE s.id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée' });
    }

    const messagesResult = await query(
      `SELECT m.id, m.expediteur_id, m.contenu, m.type_message, m.fichier_url,
              m.created_at AS envoye_le, u.nom, u.prenom
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.session_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      session: sessionResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('Erreur getAdminSessionDetail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ ANNULATION D'UNE SESSION PAR UN ADMIN (avec motif) ═══
const adminCancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    const sessionResult = await query(
      `SELECT s.*, pm.utilisateur_id AS mentor_user_id, pme.utilisateur_id AS mentore_user_id
       FROM sessions s
       JOIN profils_mentor  pm  ON pm.id  = s.mentor_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE s.id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    if (['terminee', 'annulee'].includes(session.statut)) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'annuler une session déjà ${session.statut === 'terminee' ? 'terminée' : 'annulée'}`,
      });
    }

    const result = await query(
      `UPDATE sessions
       SET statut = 'annulee', motif_annulation = $1, annulee_par = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [motif || null, req.user.id, id]
    );

    // Notifier les deux participants
    const notifMessage = motif
      ? `Un administrateur a annulé cette session. Motif : ${motif}`
      : 'Un administrateur a annulé cette session.';

    const io = getIo();
    for (const userId of [session.mentor_user_id, session.mentore_user_id]) {
      if (io) {
        await sendNotificationToUser(io, userId, {
          type: 'session_annulee',
          titre: 'Session annulée par un administrateur',
          message: notifMessage,
          lien: '/sessions',
        });
      }
    }

    res.json({ success: true, message: 'Session annulée', session: result.rows[0] });
  } catch (error) {
    console.error('Erreur adminCancelSession:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetail,
  toggleUser,
  deleteUser,
  getAllCategoriesAdmin,
  addCategory,
  editCategory,
  getCategoryUsage,
  deleteCategory,
  getCompetenceUsage,
  addCompetence,
  editCompetence,
  deleteCompetence,
  getAllReports,
  getAllSessionsAdmin,
  getAdminSessionDetail,
  adminCancelSession,
};