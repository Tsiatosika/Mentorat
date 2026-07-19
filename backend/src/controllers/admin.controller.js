const { query } = require('../config/db');

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
        recentSessions: recentSessions.rows
      }
    });
  } catch (error) {
    console.error('❌ Erreur admin stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let countText = 'SELECT COUNT(*) as total FROM utilisateurs WHERE 1=1';
    let queryText = 'SELECT id, nom, prenom, email, role, actif, photo_url, created_at, derniere_connexion FROM utilisateurs WHERE 1=1';
    const params = [];
    if (role) { params.push(role); countText += ` AND role = $${params.length}`; queryText += ` AND role = $${params.length}`; }
    if (search) { params.push(`%${search}%`); countText += ` AND (nom ILIKE $${params.length} OR prenom ILIKE $${params.length} OR email ILIKE $${params.length})`; queryText += ` AND (nom ILIKE $${params.length} OR prenom ILIKE $${params.length} OR email ILIKE $${params.length})`; }
    const countResult = await query(countText, params);
    const total = parseInt(countResult.rows[0].total);
    params.push(limit); params.push(offset);
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await query(queryText, params);
    res.json({ success: true, users: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUser = async (req, res) => {
  try {
    const result = await query('UPDATE utilisateurs SET actif = $1 WHERE id = $2 RETURNING id, nom, actif', [req.body.actif, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, user: result.rows[0] });
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
    
    const result = await query(
      'INSERT INTO competences (nom, categorie) VALUES ($1, $2) ON CONFLICT (nom) DO UPDATE SET categorie = EXCLUDED.categorie RETURNING *',
      [nom.trim(), categorie || 'Autre']
    );
    res.status(201).json({ success: true, competence: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteCompetence = async (req, res) => {
  try {
    await query('DELETE FROM mentor_competences WHERE competence_id = $1', [req.params.id]);
    const result = await query('DELETE FROM competences WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    res.json({ success: true, message: 'Compétence supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const result = await query("SELECT r.*, s.sujet as session_sujet FROM rapports r LEFT JOIN sessions s ON s.id = r.session_id ORDER BY r.genere_le DESC");
    res.json({ success: true, rapports: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getUsers, toggleUser, addCompetence, deleteCompetence, getAllReports };