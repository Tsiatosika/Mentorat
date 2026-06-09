const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { createNotification } = require('../controllers/notification.controller');

// Stockage des utilisateurs connectés (userId -> socketId)
const connectedUsers = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token manquant'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      'SELECT id, email, role, actif, prenom, nom FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].actif) {
      return next(new Error('Authentication error: Utilisateur invalide'));
    }
    
    socket.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      prenom: result.rows[0].prenom,
      nom: result.rows[0].nom
    };
    
    connectedUsers.set(socket.user.id, socket.id);
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Token invalide'));
  }
};

const sendMessage = async (io, socket, data) => {
  const { session_id, contenu, type_message = 'texte', fichier_url = null } = data;
  
  if (!session_id || !contenu) {
    socket.emit('error', { message: 'session_id et contenu sont requis' });
    return;
  }
  
  try {
    let hasAccess = false;
    let otherUserId = null;
    let otherUserPrenom = '';
    let otherUserNom = '';
    
    if (socket.user.role === 'mentor') {
      const result = await query(
        `SELECT pme.utilisateur_id as other_id, u.prenom, u.nom
         FROM sessions s
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         JOIN utilisateurs u ON u.id = pme.utilisateur_id
         WHERE s.id = $1 AND pm.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
      if (hasAccess) {
        otherUserId = result.rows[0].other_id;
        otherUserPrenom = result.rows[0].prenom;
        otherUserNom = result.rows[0].nom;
      }
    } else {
      const result = await query(
        `SELECT pm.utilisateur_id as other_id, u.prenom, u.nom
         FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         JOIN utilisateurs u ON u.id = pm.utilisateur_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
      if (hasAccess) {
        otherUserId = result.rows[0].other_id;
        otherUserPrenom = result.rows[0].prenom;
        otherUserNom = result.rows[0].nom;
      }
    }
    
    if (!hasAccess) {
      socket.emit('error', { message: 'Accès non autorisé à cette session' });
      return;
    }
    
    // Sauvegarder le message
    const result = await query(
      `INSERT INTO messages (session_id, expediteur_id, contenu, type_message, fichier_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, session_id, expediteur_id, contenu, type_message, fichier_url, envoye_le, lu`,
      [session_id, socket.user.id, contenu, type_message, fichier_url]
    );
    
    const message = result.rows[0];
    message.expediteur_nom = `${socket.user.prenom} ${socket.user.nom}`;
    
    socket.emit('message_sent', { success: true, message });
    
    if (otherUserId && connectedUsers.has(otherUserId)) {
      const otherSocketId = connectedUsers.get(otherUserId);
      io.to(otherSocketId).emit('new_message', message);
    }
    
    // CRÉER UNE NOTIFICATION POUR LE DESTINATAIRE
    if (otherUserId) {
      await createNotification(
        otherUserId,
        'nouveau_message',
        'Nouveau message',
        `${socket.user.prenom} ${socket.user.nom} vous a envoyé un message`,
        `/chat/${session_id}`
      );
      console.log(`📧 Notification envoyée à ${otherUserPrenom} ${otherUserNom}`);
    }
    
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
  }
};

const getHistory = async (socket, data) => {
  const { session_id, page = 1, limit = 50 } = data;
  const offset = (page - 1) * limit;
  
  try {
    let hasAccess = false;
    
    if (socket.user.role === 'mentor') {
      const result = await query(
        `SELECT s.id FROM sessions s
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         WHERE s.id = $1 AND pm.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
    } else {
      const result = await query(
        `SELECT s.id FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
    }
    
    if (!hasAccess) {
      socket.emit('error', { message: 'Accès non autorisé' });
      return;
    }
    
    const result = await query(
      `SELECT m.id, m.session_id, m.expediteur_id, m.contenu, m.type_message, 
              m.fichier_url, m.envoye_le, m.lu, m.lu_le,
              u.nom, u.prenom
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.session_id = $1
       ORDER BY m.envoye_le ASC
       LIMIT $2 OFFSET $3`,
      [session_id, limit, offset]
    );
    
    socket.emit('history', {
      success: true,
      messages: result.rows,
      pagination: { page, limit, total: result.rows.length }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    socket.emit('error', { message: 'Erreur lors de la récupération des messages' });
  }
};

const typing = async (io, socket, data) => {
  const { session_id, is_typing } = data;
  
  try {
    let otherUserId = null;
    
    if (socket.user.role === 'mentor') {
      const result = await query(
        `SELECT pme.utilisateur_id as other_id
         FROM sessions s
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         WHERE s.id = $1 AND pm.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      if (result.rows.length > 0) otherUserId = result.rows[0].other_id;
    } else {
      const result = await query(
        `SELECT pm.utilisateur_id as other_id
         FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      if (result.rows.length > 0) otherUserId = result.rows[0].other_id;
    }
    
    if (otherUserId && connectedUsers.has(otherUserId)) {
      const otherSocketId = connectedUsers.get(otherUserId);
      io.to(otherSocketId).emit('user_typing', {
        session_id,
        user_id: socket.user.id,
        user_name: `${socket.user.prenom} ${socket.user.nom}`,
        is_typing
      });
    }
    
  } catch (error) {
    console.error('Typing indicator error:', error);
  }
};

const disconnect = (socket) => {
  if (socket.user && socket.user.id) {
    connectedUsers.delete(socket.user.id);
    console.log(`🔴 Utilisateur déconnecté: ${socket.user.email}`);
  }
};

const initSocket = (server) => {
  const { Server } = require('socket.io');
  
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5000"],
      credentials: true
    }
  });
  
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    console.log(`🟢 Connecté: ${socket.user?.email}`);
    
    socket.on('send_message', (data) => sendMessage(io, socket, data));
    socket.on('get_history', (data) => getHistory(socket, data));
    socket.on('typing', (data) => typing(io, socket, data));
    socket.on('disconnect', () => disconnect(socket));
  });
  
  return io;
};

module.exports = { initSocket, connectedUsers };
