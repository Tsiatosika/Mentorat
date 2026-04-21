const { query } = require('../config/db');
const pdfService = require('../services/pdf.service');
const fs = require('fs');

const generateSessionRapport = async (req, res, next) => {
  const { session_id } = req.params;
  
  try {
    // Vérifier l'accès à la session
    let hasAccess = false;
    let sessionData;
    
    const sessionResult = await query(
      `SELECT s.*,
              um.id as mentor_user_id, um.nom as mentor_nom, um.prenom as mentor_prenom, um.email as mentor_email,
              ume.id as mentore_user_id, ume.nom as mentore_nom, ume.prenom as mentore_prenom, ume.email as mentore_email,
              pm.bio as mentor_bio, pm.domaine as mentor_domaine, pm.annees_experience, pm.note_moyenne, pm.nb_sessions,
              pme.niveau_etude, pme.objectifs, pme.progression
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs um ON um.id = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs ume ON ume.id = pme.utilisateur_id
       WHERE s.id = $1`,
      [session_id]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }
    
    sessionData = sessionResult.rows[0];
    
    // Vérifier l'accès
    if (req.user.role === 'mentor' && sessionData.mentor_user_id === req.user.id) {
      hasAccess = true;
    } else if (req.user.role === 'mentore' && sessionData.mentore_user_id === req.user.id) {
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette session'
      });
    }
    
    // Récupérer les messages de la session (optionnel)
    const messagesResult = await query(
      `SELECT m.*, u.nom, u.prenom
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.session_id = $1
       ORDER BY m.envoye_le
       LIMIT 50`,
      [session_id]
    );
    
    // Préparer les objets mentor et mentoré
    const mentor = {
      id: sessionData.mentor_user_id,
      nom: sessionData.mentor_nom,
      prenom: sessionData.mentor_prenom,
      email: sessionData.mentor_email,
      bio: sessionData.mentor_bio,
      domaine: sessionData.mentor_domaine,
      annees_experience: sessionData.annees_experience,
      note_moyenne: sessionData.note_moyenne,
      nb_sessions: sessionData.nb_sessions
    };
    
    const mentore = {
      id: sessionData.mentore_user_id,
      nom: sessionData.mentore_nom,
      prenom: sessionData.mentore_prenom,
      email: sessionData.mentore_email,
      niveau_etude: sessionData.niveau_etude,
      objectifs: sessionData.objectifs,
      progression: sessionData.progression
    };
    
    // Générer le PDF
    const pdf = await pdfService.generateSessionReport(
      sessionData,
      mentor,
      mentore,
      messagesResult.rows
    );
    
    // Sauvegarder le lien dans la base
    await query(
      `INSERT INTO rapports (session_id, contenu, fichier_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) 
       DO UPDATE SET fichier_url = EXCLUDED.fichier_url, genere_le = NOW()`,
      [session_id, JSON.stringify({ generated: new Date() }), pdf.url]
    );
    
    res.json({
      success: true,
      message: 'Rapport généré avec succès',
      rapport: {
        url: pdf.url,
        fileName: pdf.fileName
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const downloadRapport = async (req, res, next) => {
  const { session_id } = req.params;
  
  try {
    const result = await query(
      'SELECT fichier_url FROM rapports WHERE session_id = $1',
      [session_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }
    
    const filePath = result.rows[0].fichier_url;
    const fullPath = require('path').join(__dirname, '../../uploads', filePath.replace('/uploads/', ''));
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier rapport non trouvé'
      });
    }
    
    res.download(fullPath);
    
  } catch (error) {
    next(error);
  }
};

const generateProgressRapport = async (req, res, next) => {
  try {
    // Récupérer le profil mentoré
    const mentoreResult = await query(
      `SELECT pme.*, u.nom, u.prenom, u.email
       FROM profils_mentore pme
       JOIN utilisateurs u ON u.id = pme.utilisateur_id
       WHERE pme.utilisateur_id = $1`,
      [req.user.id]
    );
    
    if (mentoreResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }
    
    const mentore = mentoreResult.rows[0];
    
    // Récupérer les sessions du mentoré
    const sessionsResult = await query(
      `SELECT s.*, 
              u.nom as mentor_nom, u.prenom as mentor_prenom
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE s.mentore_id = $1
       ORDER BY s.date_debut DESC`,
      [mentore.id]
    );
    
    // Calculer les statistiques
    const sessions = sessionsResult.rows;
    const stats = {
      total_sessions: sessions.length,
      sessions_terminees: sessions.filter(s => s.statut === 'terminee').length,
      sessions_en_cours: sessions.filter(s => s.statut === 'en_cours').length,
      taux_completion: sessions.length > 0 
        ? Math.round((sessions.filter(s => s.statut === 'terminee').length / sessions.length) * 100)
        : 0
    };
    
    // Générer le PDF
    const pdf = await pdfService.generateProgressReport(mentore, sessions, stats);
    
    res.json({
      success: true,
      message: 'Rapport de progression généré avec succès',
      rapport: {
        url: pdf.url,
        fileName: pdf.fileName
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getSessionRapports = async (req, res, next) => {
  const { session_id } = req.params;
  
  try {
    const result = await query(
      'SELECT id, session_id, fichier_url, genere_le FROM rapports WHERE session_id = $1',
      [session_id]
    );
    
    res.json({
      success: true,
      rapports: result.rows
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSessionRapport,
  downloadRapport,
  generateProgressRapport,
  getSessionRapports
};