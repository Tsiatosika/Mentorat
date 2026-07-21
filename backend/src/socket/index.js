const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const connectedUsers = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token manquant'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, email, role, actif, prenom, nom FROM utilisateurs WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0 || !result.rows[0].actif) return next(new Error('Authentication error: Utilisateur invalide'));
    socket.user = { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role, prenom: result.rows[0].prenom, nom: result.rows[0].nom };
    connectedUsers.set(socket.user.id, socket.id);
    console.log(`🟢 ${socket.user.email}`);
    next();
  } catch (error) {
    next(new Error('Authentication error: Token invalide'));
  }
};

const sendNotificationToUser = async (io, userId, notification) => {
  try {
    await query(`INSERT INTO notifications (utilisateur_id, type, titre, message, lien) VALUES ($1, $2, $3, $4, $5)`, [userId, notification.type, notification.titre, notification.message, notification.lien]);
    if (connectedUsers.has(userId)) io.to(connectedUsers.get(userId)).emit('new_notification', notification);
  } catch (error) { console.error('Erreur notification:', error); }
};

const sendMessage = async (io, socket, data) => {
  const { session_id, contenu, type_message = 'texte', fichier_url = null, fichier_nom = null } = data;
  if (!session_id || (!contenu && !fichier_url)) { socket.emit('error', { message: 'session_id et contenu/fichier requis' }); return; }
  try {
    let otherUserId = null;
    if (socket.user.role === 'mentor') {
      const r = await query(`SELECT pme.utilisateur_id as other_id FROM sessions s JOIN profils_mentor pm ON pm.id = s.mentor_id JOIN profils_mentore pme ON pme.id = s.mentore_id WHERE s.id = $1 AND pm.utilisateur_id = $2`, [session_id, socket.user.id]);
      if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
    } else {
      const r = await query(`SELECT pm.utilisateur_id as other_id FROM sessions s JOIN profils_mentore pme ON pme.id = s.mentore_id JOIN profils_mentor pm ON pm.id = s.mentor_id WHERE s.id = $1 AND pme.utilisateur_id = $2`, [session_id, socket.user.id]);
      if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
    }
    if (!otherUserId) { socket.emit('error', { message: 'Accès non autorisé' }); return; }

    const result = await query(`INSERT INTO messages (session_id, expediteur_id, contenu, type_message, fichier_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, session_id, expediteur_id, contenu, type_message, fichier_url, created_at AS envoye_le, lu`, [session_id, socket.user.id, contenu || (fichier_nom || 'Fichier'), type_message, fichier_url]);
    const message = result.rows[0];
    message.expediteur_nom = `${socket.user.prenom} ${socket.user.nom}`;
    message.prenom = socket.user.prenom;
    message.nom = socket.user.nom;
    socket.emit('message_sent', { success: true, message });
    if (otherUserId && connectedUsers.has(otherUserId)) io.to(connectedUsers.get(otherUserId)).emit('new_message', message);

    await sendNotificationToUser(io, otherUserId, {
      type: 'nouveau_message',
      titre: 'Nouveau message',
      message: `${socket.user.prenom} ${socket.user.nom} vous a envoyé un message`,
      lien: `/chat?sessionId=${session_id}`
    });
  } catch (error) { console.error('Send message error:', error); socket.emit('error', { message: 'Erreur envoi message' }); }
};

const getHistory = async (socket, data) => {
  const { session_id, page = 1, limit = 50 } = data;
  const offset = (page - 1) * limit;
  try {
    let hasAccess = false;
    if (socket.user.role === 'mentor') {
      const r = await query(`SELECT s.id FROM sessions s JOIN profils_mentor pm ON pm.id = s.mentor_id WHERE s.id = $1 AND pm.utilisateur_id = $2`, [session_id, socket.user.id]);
      hasAccess = r.rows.length > 0;
    } else {
      const r = await query(`SELECT s.id FROM sessions s JOIN profils_mentore pme ON pme.id = s.mentore_id WHERE s.id = $1 AND pme.utilisateur_id = $2`, [session_id, socket.user.id]);
      hasAccess = r.rows.length > 0;
    }
    if (!hasAccess) { socket.emit('error', { message: 'Accès non autorisé' }); return; }
    const result = await query(`SELECT m.id, m.session_id, m.expediteur_id, m.contenu, m.type_message, m.fichier_url, m.created_at AS envoye_le, m.lu, m.lu_le, u.nom, u.prenom FROM messages m JOIN utilisateurs u ON u.id = m.expediteur_id WHERE m.session_id = $1 ORDER BY m.created_at ASC LIMIT $2 OFFSET $3`, [session_id, limit, offset]);
    socket.emit('history', { success: true, messages: result.rows });
  } catch (error) { console.error('Get history error:', error); socket.emit('error', { message: 'Erreur récupération messages' }); }
};

const typing = async (io, socket, data) => {
  const { session_id, is_typing } = data;
  try {
    let otherUserId = null;
    if (socket.user.role === 'mentor') {
      const r = await query(`SELECT pme.utilisateur_id as other_id FROM sessions s JOIN profils_mentor pm ON pm.id = s.mentor_id JOIN profils_mentore pme ON pme.id = s.mentore_id WHERE s.id = $1 AND pm.utilisateur_id = $2`, [session_id, socket.user.id]);
      if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
    } else {
      const r = await query(`SELECT pm.utilisateur_id as other_id FROM sessions s JOIN profils_mentore pme ON pme.id = s.mentore_id JOIN profils_mentor pm ON pm.id = s.mentor_id WHERE s.id = $1 AND pme.utilisateur_id = $2`, [session_id, socket.user.id]);
      if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
    }
    if (otherUserId && connectedUsers.has(otherUserId)) io.to(connectedUsers.get(otherUserId)).emit('user_typing', { session_id, user_name: `${socket.user.prenom} ${socket.user.nom}`, is_typing });
  } catch (error) { console.error('Typing error:', error); }
};

const callUser = async (io, socket, data) => {
  const { to, roomName, callerName } = data;
  if (connectedUsers.has(to)) {
    io.to(connectedUsers.get(to)).emit('incoming_call', { from: socket.user.id, fromName: callerName || `${socket.user.prenom} ${socket.user.nom}`, roomName });
    socket.emit('call_initiated', { status: 'calling' });
  } else socket.emit('call_error', { message: "L'utilisateur n'est pas connecté" });
};

const acceptCall = async (io, socket, data) => {
  const { to, roomName } = data;
  if (connectedUsers.has(to)) { io.to(connectedUsers.get(to)).emit('call_accepted', { roomName }); socket.emit('call_accepted_self', { roomName }); }
};

const rejectCallHandler = async (io, socket, data) => {
  const { to } = data;
  if (connectedUsers.has(to)) io.to(connectedUsers.get(to)).emit('call_rejected', { message: "L'utilisateur a refusé l'appel" });
  socket.emit('call_rejected_self');
};

const endCall = async (io, socket, data) => {
  const { to } = data;
  if (connectedUsers.has(to)) { io.to(connectedUsers.get(to)).emit('call_ended'); socket.emit('call_ended_self'); }
};

const deleteMessage = async (io, socket, data) => {
  const { messageId, sessionId } = data;
  let otherUserId = null;
  if (socket.user.role === 'mentor') {
    const r = await query(`SELECT pme.utilisateur_id as other_id FROM sessions s JOIN profils_mentor pm ON pm.id = s.mentor_id JOIN profils_mentore pme ON pme.id = s.mentore_id WHERE s.id = $1 AND pm.utilisateur_id = $2`, [sessionId, socket.user.id]);
    if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
  } else {
    const r = await query(`SELECT pm.utilisateur_id as other_id FROM sessions s JOIN profils_mentore pme ON pme.id = s.mentore_id JOIN profils_mentor pm ON pm.id = s.mentor_id WHERE s.id = $1 AND pme.utilisateur_id = $2`, [sessionId, socket.user.id]);
    if (r.rows.length > 0) otherUserId = r.rows[0].other_id;
  }
  if (otherUserId && connectedUsers.has(otherUserId)) io.to(connectedUsers.get(otherUserId)).emit('message_deleted', { messageId });
};

const disconnect = (socket) => {
  if (socket.user?.id) { connectedUsers.delete(socket.user.id); console.log(`🔴 ${socket.user.email}`); }
};

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: ["http://localhost:3000", "http://localhost:5000"], credentials: true } });
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    console.log(`🟢 ${socket.user?.email}`);
    socket.on('send_message', (data) => sendMessage(io, socket, data));
    socket.on('get_history', (data) => getHistory(socket, data));
    socket.on('typing', (data) => typing(io, socket, data));
    socket.on('delete_message', (data) => deleteMessage(io, socket, data));
    socket.on('call_user', (data) => callUser(io, socket, data));
    socket.on('accept_call', (data) => acceptCall(io, socket, data));
    socket.on('reject_call', (data) => rejectCallHandler(io, socket, data));
    socket.on('end_call', (data) => endCall(io, socket, data));
    socket.on('disconnect', () => disconnect(socket));
  });
  return io;
};

module.exports = { initSocket, connectedUsers };