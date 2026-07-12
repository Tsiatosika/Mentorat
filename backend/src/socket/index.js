const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Stockage des utilisateurs connectés (userId -> socketId)
const connectedUsers = new Map();

// ============================================
// AUTHENTIFICATION SOCKET
// ============================================
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
    console.log(`🟢 Utilisateur connecté: ${socket.user.email} (${socket.user.id})`);
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Token invalide'));
  }
};

// ============================================
// ENVOYER UN MESSAGE
// ============================================
const sendMessage = async (io, socket, data) => {
  const { session_id, contenu, type_message = 'texte', fichier_url = null, fichier_nom = null } = data;
  
  if (!session_id || (!contenu && !fichier_url)) {
    socket.emit('error', { message: 'session_id et contenu/fichier sont requis' });
    return;
  }
  
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
    
    if (!otherUserId) {
      socket.emit('error', { message: 'Accès non autorisé à cette session' });
      return;
    }
    
    const result = await query(
      `INSERT INTO messages (session_id, expediteur_id, contenu, type_message, fichier_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, session_id, expediteur_id, contenu, type_message, fichier_url, created_at AS envoye_le, lu`,
      [session_id, socket.user.id, contenu || (fichier_nom || 'Fichier'), type_message, fichier_url]
    );
    
    const message = result.rows[0];
    message.expediteur_nom = `${socket.user.prenom} ${socket.user.nom}`;
    message.prenom = socket.user.prenom;
    message.nom = socket.user.nom;
    
    // Émettre à l'expéditeur
    socket.emit('message_sent', { success: true, message });
    
    // Émettre au destinataire s'il est connecté
    if (otherUserId && connectedUsers.has(otherUserId)) {
      const otherSocketId = connectedUsers.get(otherUserId);
      io.to(otherSocketId).emit('new_message', message);
    }
    
    // Créer une notification
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, lien)
       VALUES ($1, 'nouveau_message', 'Nouveau message', 
               '${socket.user.prenom} ${socket.user.nom} vous a envoyé un message', 
               '/chat/${session_id}')`,
      [otherUserId]
    );
    
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
  }
};

// ============================================
// RÉCUPÉRER L'HISTORIQUE
// ============================================
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
    
   // APRÈS
    const result = await query(
      `SELECT m.id, m.session_id, m.expediteur_id, m.contenu, m.type_message, 
              m.fichier_url, m.created_at AS envoye_le, m.lu, m.lu_le,
              u.nom, u.prenom
      FROM messages m
      JOIN utilisateurs u ON u.id = m.expediteur_id
      WHERE m.session_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3`,
      [session_id, limit, offset]
    );
    
    socket.emit('history', {
      success: true,
      messages: result.rows
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    socket.emit('error', { message: 'Erreur lors de la récupération des messages' });
  }
};

// ============================================
// INDICATEUR DE FRAPPE
// ============================================
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
        user_name: `${socket.user.prenom} ${socket.user.nom}`,
        is_typing
      });
    }
  } catch (error) {
    console.error('Typing error:', error);
  }
};

// ============================================
// GESTION DES APPELS VIDÉO
// ============================================

// Émettre un appel
const callUser = async (io, socket, data) => {
  const { to, roomName, callerName } = data;
  
  console.log(`📞 Appel de ${socket.user.email} vers ${to}`);
  
  if (connectedUsers.has(to)) {
    const targetSocketId = connectedUsers.get(to);
    io.to(targetSocketId).emit('incoming_call', {
      from: socket.user.id,
      fromName: callerName || `${socket.user.prenom} ${socket.user.nom}`,
      roomName: roomName
    });
    socket.emit('call_initiated', { status: 'calling' });
  } else {
    socket.emit('call_error', { message: "L'utilisateur n'est pas connecté" });
  }
};

// Accepter un appel
const acceptCall = async (io, socket, data) => {
  const { to, roomName } = data;
  
  console.log(`✅ Appel accepté par ${socket.user.email}`);
  
  if (connectedUsers.has(to)) {
    const targetSocketId = connectedUsers.get(to);
    io.to(targetSocketId).emit('call_accepted', { roomName });
    socket.emit('call_accepted_self', { roomName });
  }
};

// Refuser un appel
const rejectCallHandler = async (io, socket, data) => {
  const { to } = data;
  
  console.log(`❌ Appel refusé par ${socket.user.email}`);
  
  if (connectedUsers.has(to)) {
    const targetSocketId = connectedUsers.get(to);
    io.to(targetSocketId).emit('call_rejected', { 
      message: "L'utilisateur a refusé l'appel" 
    });
  }
  socket.emit('call_rejected_self');
};

// Fin d'appel
const endCall = async (io, socket, data) => {
  const { to } = data;
  
  console.log(`🔴 Fin d'appel de ${socket.user.email}`);
  
  if (connectedUsers.has(to)) {
    const targetSocketId = connectedUsers.get(to);
    io.to(targetSocketId).emit('call_ended');
  }
  socket.emit('call_ended_self');
};

// Suppression de message
const deleteMessage = async (io, socket, data) => {
  const { messageId, sessionId } = data;
  
  console.log(`🗑️ Suppression message ${messageId} par ${socket.user.email}`);
  
  // Trouver l'autre utilisateur pour notifier
  let otherUserId = null;
  
  if (socket.user.role === 'mentor') {
    const result = await query(
      `SELECT pme.utilisateur_id as other_id
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       WHERE s.id = $1 AND pm.utilisateur_id = $2`,
      [sessionId, socket.user.id]
    );
    if (result.rows.length > 0) otherUserId = result.rows[0].other_id;
  } else {
    const result = await query(
      `SELECT pm.utilisateur_id as other_id
       FROM sessions s
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       WHERE s.id = $1 AND pme.utilisateur_id = $2`,
      [sessionId, socket.user.id]
    );
    if (result.rows.length > 0) otherUserId = result.rows[0].other_id;
  }
  
  if (otherUserId && connectedUsers.has(otherUserId)) {
    const otherSocketId = connectedUsers.get(otherUserId);
    io.to(otherSocketId).emit('message_deleted', { messageId });
  }
};

// ============================================
// DÉCONNEXION
// ============================================
const disconnect = (socket) => {
  if (socket.user && socket.user.id) {
    connectedUsers.delete(socket.user.id);
    console.log(`🔴 Utilisateur déconnecté: ${socket.user.email} (${socket.user.id})`);
  }
};

// ============================================
// INITIALISATION DU SOCKET SERVER
// ============================================
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
    console.log(`🟢 Nouvelle connexion socket: ${socket.user?.email}`);
    
    // Événements de chat
    socket.on('send_message', (data) => sendMessage(io, socket, data));
    socket.on('get_history', (data) => getHistory(socket, data));
    socket.on('typing', (data) => typing(io, socket, data));
    
    // Événements de suppression
    socket.on('delete_message', (data) => deleteMessage(io, socket, data));
    
    // Événements d'appel vidéo
    socket.on('call_user', (data) => callUser(io, socket, data));
    socket.on('accept_call', (data) => acceptCall(io, socket, data));
    socket.on('reject_call', (data) => rejectCallHandler(io, socket, data));
    socket.on('end_call', (data) => endCall(io, socket, data));
    
    socket.on('disconnect', () => disconnect(socket));
  });
  
  return io;
};

module.exports = { initSocket, connectedUsers };
