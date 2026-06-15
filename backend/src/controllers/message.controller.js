const { query } = require('../config/db');

// ============================================
// RÉCUPÉRER L'HISTORIQUE DES MESSAGES
// ============================================
const getMessagesBySession = async (req, res, next) => {
  const { session_id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
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
              m.fichier_url, m.envoye_le, m.lu,
              u.nom, u.prenom
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.session_id = $1
       ORDER BY m.envoye_le ASC
       LIMIT $2 OFFSET $3`,
      [session_id, limit, offset]
    );
    
    res.json({
      success: true,
      messages: result.rows
    });
    
  } catch (error) {
    console.error('Erreur getMessagesBySession:', error);
    next(error);
  }
};

// ============================================
// MARQUER LES MESSAGES COMME LUS
// ============================================
const markSessionAsRead = async (req, res, next) => {
  const { session_id } = req.params;
  
  try {
    await query(
      `UPDATE messages 
       SET lu = true, lu_le = NOW()
       WHERE session_id = $1 AND expediteur_id != $2`,
      [session_id, req.user.id]
    );
    
    res.json({ success: true, message: 'Messages marqués comme lus' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// NOMBRE DE MESSAGES NON LUS
// ============================================
const getUnreadCount = async (req, res, next) => {
  try {
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
    
    res.json({ success: true, unread_count: parseInt(result.rows[0].count) });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SUPPRIMER UN MESSAGE
// ============================================
const deleteMessage = async (req, res, next) => {
  const { id } = req.params;
  
  console.log(`🗑️ DELETE /messages/${id} par utilisateur: ${req.user.id}`);
  
  try {
    // Validation de l'ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID du message requis' });
    }
    
    // Vérifier que le message existe et récupérer l'expéditeur
    const messageCheck = await query(
      'SELECT expediteur_id FROM messages WHERE id = $1',
      [id]
    );
    
    if (messageCheck.rows.length === 0) {
      console.log(`❌ Message ${id} non trouvé`);
      return res.status(404).json({ 
        success: false, 
        message: 'Message non trouvé' 
      });
    }
    
    // Vérifier que l'utilisateur est l'expéditeur
    if (messageCheck.rows[0].expediteur_id !== req.user.id) {
      console.log(`❌ Non autorisé: ${req.user.id} vs ${messageCheck.rows[0].expediteur_id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Vous ne pouvez supprimer que vos propres messages' 
      });
    }
    
    // Supprimer le message
    const deleteResult = await query('DELETE FROM messages WHERE id = $1', [id]);
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message non trouvé' 
      });
    }
    
    console.log(`✅ Message ${id} supprimé avec succès`);
    
    res.json({ 
      success: true, 
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression: ' + error.message
    });
  }
};

module.exports = {
  getMessagesBySession,
  markSessionAsRead,
  getUnreadCount,
  deleteMessage
};
