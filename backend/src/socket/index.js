const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Stockage des utilisateurs connectés (userId -> socketId)
const connectedUsers = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token manquant'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe
    const result = await query(
      'SELECT id, email, role, actif FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].actif) {
      return next(new Error('Authentication error: Utilisateur invalide'));
    }
    
    socket.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    };
    
    // Stocker la connexion
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
    // Vérifier que l'utilisateur a accès à cette session
    let hasAccess = false;
    let otherUserId = null;
    
    if (socket.user.role === 'mentor') {
      const result = await query(
        `SELECT s.*, pme.utilisateur_id as mentore_user_id
         FROM sessions s
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         WHERE s.id = $1 AND pm.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
      if (hasAccess) {
        otherUserId = result.rows[0].mentore_user_id;
      }
    } else {
      const result = await query(
        `SELECT s.*, pm.utilisateur_id as mentor_user_id
         FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      hasAccess = result.rows.length > 0;
      if (hasAccess) {
        otherUserId = result.rows[0].mentor_user_id;
      }
    }
    
    if (!hasAccess) {
      socket.emit('error', { message: 'Accès non autorisé à cette session' });
      return;
    }
    
    // Sauvegarder le message en base de données
    const result = await query(
      `INSERT INTO messages (session_id, expediteur_id, contenu, type_message, fichier_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, session_id, expediteur_id, contenu, type_message, fichier_url, envoye_le, lu`,
      [session_id, socket.user.id, contenu, type_message, fichier_url]
    );
    
    const message = result.rows[0];
    message.expediteur_nom = `${socket.user.prenom} ${socket.user.nom}`;
    
    // Émettre le message à l'expéditeur
    socket.emit('message_sent', { success: true, message });
    
    // Émettre le message au destinataire s'il est connecté
    if (otherUserId && connectedUsers.has(otherUserId)) {
      const otherSocketId = connectedUsers.get(otherUserId);
      io.to(otherSocketId).emit('new_message', message);
    }
    
    // Créer une notification pour le destinataire
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, lien)
       VALUES ($1, 'nouveau_message', 'Nouveau message', 
               '${socket.user.prenom} ${socket.user.nom} vous a envoyé un message', 
               '/sessions/${session_id}')`,
      [otherUserId]
    );
    
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
  }
};

const markAsRead = async (socket, data) => {
  const { message_id, session_id } = data;
  
  try {
    await query(
      `UPDATE messages 
       SET lu = true, lu_le = NOW()
       WHERE id = $1 AND session_id = $2 AND expediteur_id != $3`,
      [message_id, session_id, socket.user.id]
    );
    
    // Notifier l'expéditeur que son message a été lu
    const result = await query(
      `SELECT expediteur_id FROM messages WHERE id = $1`,
      [message_id]
    );
    
    if (result.rows.length > 0) {
      const expediteurId = result.rows[0].expediteur_id;
      if (connectedUsers.has(expediteurId)) {
        const expediteurSocketId = connectedUsers.get(expediteurId);
        socket.to(expediteurSocketId).emit('message_read', { message_id, session_id });
      }
    }
    
  } catch (error) {
    console.error('Mark as read error:', error);
  }
};

const getHistory = async (socket, data) => {
  const { session_id, page = 1, limit = 50 } = data;
  const offset = (page - 1) * limit;
  
  try {
    // Vérifier l'accès
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
       ORDER BY m.envoye_le DESC
       LIMIT $2 OFFSET $3`,
      [session_id, limit, offset]
    );
    
    const totalResult = await query(
      'SELECT COUNT(*) FROM messages WHERE session_id = $1',
      [session_id]
    );
    
    socket.emit('history', {
      success: true,
      messages: result.rows.reverse(),
      pagination: {
        page,
        limit,
        total: parseInt(totalResult.rows[0].count)
      }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    socket.emit('error', { message: 'Erreur lors de la récupération des messages' });
  }
};

const typing = async (io, socket, data) => {
  const { session_id, is_typing } = data;
  
  try {
    // Trouver l'autre participant de la session
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
      if (result.rows.length > 0) {
        otherUserId = result.rows[0].other_id;
      }
    } else {
      const result = await query(
        `SELECT pm.utilisateur_id as other_id
         FROM sessions s
         JOIN profils_mentore pme ON pme.id = s.mentore_id
         JOIN profils_mentor pm ON pm.id = s.mentor_id
         WHERE s.id = $1 AND pme.utilisateur_id = $2`,
        [session_id, socket.user.id]
      );
      if (result.rows.length > 0) {
        otherUserId = result.rows[0].other_id;
      }
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
    console.log(`🔴 Utilisateur déconnecté: ${socket.user.email} (${socket.user.id})`);
  }
};

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const adminUI = require('@socket.io/admin-ui');
  
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://admin.socket.io'],
      credentials: true
    }
  });
  
  // Admin UI pour monitoring
  adminUI.instrument(io, { auth: false });
  
  // Middleware d'authentification
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    console.log(`🟢 Nouvelle connexion: ${socket.user.email} (${socket.user.id})`);
    
    // Rejoindre une room spécifique à l'utilisateur
    socket.join(`user_${socket.user.id}`);
    
    // Écouter les événements
    socket.on('send_message', (data) => sendMessage(io, socket, data));
    socket.on('mark_read', (data) => markAsRead(socket, data));
    socket.on('get_history', (data) => getHistory(socket, data));
    socket.on('typing', (data) => typing(io, socket, data));
    socket.on('disconnect', () => disconnect(socket));
  });
  
  return io;
};

module.exports = { initSocket, connectedUsers };