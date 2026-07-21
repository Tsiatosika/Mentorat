const { query } = require('../config/db');

const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, type, titre, message, lien, lu, created_at
       FROM notifications
       WHERE utilisateur_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    await query(
      `UPDATE notifications 
       SET lu = true, lu_le = NOW()
       WHERE id = $1 AND utilisateur_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications 
       SET lu = true, lu_le = NOW()
       WHERE utilisateur_id = $1 AND lu = false`,
      [req.user.id]
    );

    res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══ CRÉER UNE NOTIFICATION (utilisé par Socket.IO) ═══
const createNotification = async (userId, type, titre, message, lien) => {
  try {
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, lien)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, titre, message, lien || null]
    );
    return true;
  } catch (error) {
    console.error('Erreur createNotification:', error);
    return false;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};