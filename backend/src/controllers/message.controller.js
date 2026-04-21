const { query } = require('../config/db');

const getMessagesBySession = async (req, res, next) => {
  const { session_id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Vérifier l'accès à la session
    let hasAccess = false;
    
    if (req.user.role === 'mentor') {
      const result = await query(
        `SELECT s.id FROM sessions s
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         WHERE s.id = $1 AND pm.utilisateur_id = $2`,
        [session_id, req.user.id]
      );
      hasAccess = result.rows.length > 0;
    } else {
      const result = await query(
        `SELECT s.id FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, req.user.id]
      );
      hasAccess = result.rows.length > 0;
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette session'
      });
    }
    
    const result = await query(
      `SELECT m.id, m.session_id, m.expediteur_id, m.contenu, m.type_message, 
              m.fichier_url, m.envoye_le, m.lu, m.lu_le,
              u.nom, u.prenom
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.session_id = $1
       ORDER BY m.envoye_le DESC
       LIMIT $2 OFFSET $3`,
      [session_id, limit, offset]
    );
    
    const totalResult = await query(
      'SELECT COUNT(*) FROM messages WHERE session_id = $1',
      [session_id]
    );
    
    res.json({
      success: true,
      messages: result.rows.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.rows[0].count)
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const markSessionAsRead = async (req, res, next) => {
  const { session_id } = req.params;
  
  try {
    await query(
      `UPDATE messages 
       SET lu = true, lu_le = NOW()
       WHERE session_id = $1 AND expediteur_id != $2`,
      [session_id, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Messages marqués comme lus'
    });
    
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    // Récupérer toutes les sessions de l'utilisateur
    let sessionsQuery;
    
    if (req.user.role === 'mentor') {
      sessionsQuery = `
        SELECT s.id 
        FROM sessions s
        JOIN profils_mentor pm ON pm.id = s.mentor_id
        WHERE pm.utilisateur_id = $1
      `;
    } else {
      sessionsQuery = `
        SELECT s.id 
        FROM sessions s
        JOIN profils_mentore pme ON pme.id = s.mentore_id
        WHERE pme.utilisateur_id = $1
      `;
    }
    
    const sessionsResult = await query(sessionsQuery, [req.user.id]);
    const sessionIds = sessionsResult.rows.map(r => r.id);
    
    if (sessionIds.length === 0) {
      return res.json({ success: true, unread_count: 0 });
    }
    
    const result = await query(
      `SELECT COUNT(*) as count
       FROM messages
       WHERE session_id = ANY($1::uuid[]) 
         AND expediteur_id != $2 
         AND lu = false`,
      [sessionIds, req.user.id]
    );
    
    res.json({
      success: true,
      unread_count: parseInt(result.rows[0].count)
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessagesBySession,
  markSessionAsRead,
  getUnreadCount
};