const { query } = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // Statistiques générales
    const totalMentors = await query(
      "SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'mentor' AND actif = true"
    );
    
    const totalMentores = await query(
      "SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'mentore' AND actif = true"
    );
    
    const totalSessions = await query(
      "SELECT COUNT(*) as total FROM sessions"
    );
    
    const sessionsByStatus = await query(
      `SELECT statut, COUNT(*) as total 
       FROM sessions 
       GROUP BY statut 
       ORDER BY total DESC`
    );
    
    const totalAvis = await query(
      "SELECT COUNT(*) as total FROM avis"
    );
    
    const avgNote = await query(
      "SELECT ROUND(AVG(note_globale)::numeric, 1) as moyenne FROM avis"
    );
    
    // Sessions par mois (6 derniers mois)
    const sessionsByMonth = await query(
      `SELECT 
         TO_CHAR(date_debut, 'YYYY-MM') as mois,
         COUNT(*) as total
       FROM sessions 
       WHERE date_debut >= NOW() - INTERVAL '6 months'
       GROUP BY mois 
       ORDER BY mois`
    );
    
    // Top 5 mentors par nombre de sessions
    const topMentors = await query(
      `SELECT u.nom, u.prenom, u.photo_url, pm.domaine, COUNT(s.id) as nb_sessions
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       LEFT JOIN sessions s ON s.mentor_id = pm.id
       WHERE u.role = 'mentor'
       GROUP BY u.id, u.nom, u.prenom, u.photo_url, pm.domaine
       ORDER BY nb_sessions DESC
       LIMIT 5`
    );
    
    // Top 5 mentorés par nombre de sessions
    const topMentores = await query(
      `SELECT u.nom, u.prenom, u.photo_url, pme.niveau_etude, COUNT(s.id) as nb_sessions
       FROM utilisateurs u
       JOIN profils_mentore pme ON pme.utilisateur_id = u.id
       LEFT JOIN sessions s ON s.mentore_id = pme.id
       WHERE u.role = 'mentore'
       GROUP BY u.id, u.nom, u.prenom, u.photo_url, pme.niveau_etude
       ORDER BY nb_sessions DESC
       LIMIT 5`
    );
    
    // Répartition par domaine
    const domainDistribution = await query(
      `SELECT 
         COALESCE(pm.domaine, 'Non défini') as domaine,
         COUNT(*) as total
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.actif = true
       GROUP BY pm.domaine
       ORDER BY total DESC`
    );
    
    // Derniers inscrits
    const recentUsers = await query(
      `SELECT id, nom, prenom, email, role, photo_url, created_at
       FROM utilisateurs 
       WHERE actif = true
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    // Sessions récentes
    const recentSessions = await query(
      `SELECT s.id, s.sujet, s.statut, s.date_debut,
              um.nom as mentor_nom, um.prenom as mentor_prenom,
              ume.nom as mentore_nom, ume.prenom as mentore_prenom
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs um ON um.id = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs ume ON ume.id = pme.utilisateur_id
       ORDER BY s.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      stats: {
        totalMentors: parseInt(totalMentors.rows[0].total),
        totalMentores: parseInt(totalMentores.rows[0].total),
        totalSessions: parseInt(totalSessions.rows[0].total),
        totalAvis: parseInt(totalAvis.rows[0].total),
        avgNote: parseFloat(avgNote.rows[0]?.moyenne || 0),
        sessionsByStatus: sessionsByStatus.rows,
        sessionsByMonth: sessionsByMonth.rows,
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

// Gérer les utilisateurs
const getUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let queryText = `
      SELECT id, nom, prenom, email, role, actif, photo_url, created_at, derniere_connexion
      FROM utilisateurs WHERE 1=1
    `;
    const params = [];
    
    if (role) {
      params.push(role);
      queryText += ` AND role = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (nom ILIKE $${params.length} OR prenom ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    
    params.push(limit);
    params.push(offset);
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await query(queryText, params);
    
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getUsers };