const { query } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const formatDate = (date) => {
  if (!date) return 'Non défini';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateOnly = (date) => {
  if (!date) return 'Non défini';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ============================================
// GÉNÉRER UN RAPPORT DE SESSION
// ============================================
const generateSessionRapport = async (req, res, next) => {
  const { session_id } = req.params;

  try {
    const sessionResult = await query(
      `SELECT s.*,
              um.nom as mentor_nom, um.prenom as mentor_prenom, um.email as mentor_email,
              ume.nom as mentore_nom, ume.prenom as mentore_prenom, ume.email as mentore_email,
              pm.domaine as mentor_domaine,
              pme.niveau_etude
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs um ON um.id = pm.utilisateur_id
       JOIN profils_mentore pme ON pme.id = s.mentore_id
       JOIN utilisateurs ume ON ume.id = pme.utilisateur_id
       WHERE s.id = $1`,
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    const fileName = `rapport_session_${session_id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5276')
       .text('RAPPORT DE SESSION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    // Informations générales
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('INFORMATIONS GÉNÉRALES', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    
    doc.text(`Session ID: ${session.id}`, 50, doc.y);
    doc.text(`Sujet: ${session.sujet}`, 50, doc.y + 20);
    doc.text(`Date: ${formatDate(session.date_debut)}`, 50, doc.y + 40);
    doc.text(`Durée réelle: ${session.duree_reelle || 'Non renseignée'} minutes`, 50, doc.y + 60);
    
    doc.moveDown(4);

    // Participants
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('PARTICIPANTS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    
    doc.text(`Mentor: ${session.mentor_prenom} ${session.mentor_nom}`, 50, doc.y);
    doc.text(`Email: ${session.mentor_email}`, 50, doc.y + 20);
    doc.text(`Domaine: ${session.mentor_domaine || 'Non spécifié'}`, 50, doc.y + 40);
    
    doc.moveDown(2);
    
    doc.text(`Mentoré: ${session.mentore_prenom} ${session.mentore_nom}`, 50, doc.y);
    doc.text(`Email: ${session.mentore_email}`, 50, doc.y + 20);
    doc.text(`Niveau: ${session.niveau_etude || 'Non spécifié'}`, 50, doc.y + 40);
    
    doc.moveDown(4);

    // Évaluations
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('ÉVALUATIONS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    
    doc.text(`Note du mentor: ${session.note_du_mentore || 'Non évalué'}/5`, 50, doc.y);
    doc.text(`Commentaire du mentor: ${session.notes_mentor || 'Aucun commentaire'}`, 50, doc.y + 20);
    doc.moveDown(2);
    
    doc.text(`Note du mentoré: ${session.note_du_mentor || 'Non évalué'}/5`, 50, doc.y);
    doc.text(`Commentaire du mentoré: ${session.notes_mentore || 'Aucun commentaire'}`, 50, doc.y + 20);
    
    // Pied de page (version corrigée - sans switchToPage)
    doc.fontSize(8).fillColor('#999999')
       .text(
         `Plateforme de Mentorat Académique - Université Adventiste Zurcher`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    doc.end();

    stream.on('finish', async () => {
      const fileUrl = `/uploads/reports/${fileName}`;
      
      await query(
        `INSERT INTO rapports (session_id, contenu, fichier_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id) 
         DO UPDATE SET fichier_url = EXCLUDED.fichier_url, genere_le = NOW()`,
        [session_id, JSON.stringify({ generated: new Date() }), fileUrl]
      );
      
      res.json({ success: true, message: 'Rapport généré', rapport: { url: fileUrl, fileName } });
    });
    
    stream.on('error', (error) => {
      console.error('Erreur écriture PDF:', error);
      res.status(500).json({ success: false, message: error.message });
    });
    
  } catch (error) {
    console.error('Erreur generateSessionRapport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// TÉLÉCHARGER UN RAPPORT
// ============================================
const downloadRapport = async (req, res, next) => {
  const { session_id } = req.params;

  try {
    const result = await query(
      'SELECT fichier_url FROM rapports WHERE session_id = $1',
      [session_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
    }

    const fileUrl = result.rows[0].fichier_url;
    const filePath = path.join(__dirname, '../../uploads', fileUrl.replace('/uploads/', ''));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Erreur downloadRapport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GÉNÉRER UN RAPPORT DE PROGRESSION
// ============================================
const generateProgressRapport = async (req, res, next) => {
  try {
    const mentoreResult = await query(
      `SELECT pme.*, u.nom, u.prenom, u.email
       FROM profils_mentore pme
       JOIN utilisateurs u ON u.id = pme.utilisateur_id
       WHERE pme.utilisateur_id = $1`,
      [req.user.id]
    );

    if (mentoreResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil mentoré non trouvé' });
    }

    const mentore = mentoreResult.rows[0];
    
    const sessionsResult = await query(
      `SELECT s.*, u.nom as mentor_nom, u.prenom as mentor_prenom
       FROM sessions s
       JOIN profils_mentor pm ON pm.id = s.mentor_id
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE s.mentore_id = $1
       ORDER BY s.date_debut DESC`,
      [mentore.id]
    );

    const sessions = sessionsResult.rows;
    const stats = {
      total_sessions: sessions.length,
      sessions_terminees: sessions.filter(s => s.statut === 'terminee').length,
      taux_completion: sessions.length > 0 
        ? Math.round((sessions.filter(s => s.statut === 'terminee').length / sessions.length) * 100)
        : 0
    };

    const fileName = `rapport_progression_${mentore.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5276')
       .text('RAPPORT DE PROGRESSION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    // Informations mentoré
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('INFORMATIONS DU MENTORÉ', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    
    doc.text(`Nom: ${mentore.prenom} ${mentore.nom}`, 50, doc.y);
    doc.text(`Email: ${mentore.email}`, 50, doc.y + 20);
    doc.text(`Niveau: ${mentore.niveau_etude || 'Non défini'}`, 50, doc.y + 40);
    doc.text(`Domaine: ${mentore.domaine || 'Non défini'}`, 50, doc.y + 60);
    
    doc.moveDown(3);

    // Progression
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('PROGRESSION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#27ae60')
       .text(`${stats.taux_completion}%`, 50, doc.y);
    
    doc.moveDown(2);

    // Statistiques
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('STATISTIQUES', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    
    doc.text(`Total des sessions: ${stats.total_sessions}`, 50, doc.y);
    doc.text(`Sessions terminées: ${stats.sessions_terminees}`, 50, doc.y + 20);
    doc.text(`Taux de complétion: ${stats.taux_completion}%`, 50, doc.y + 40);
    
    doc.moveDown(4);

    // Pied de page
    doc.fontSize(8).fillColor('#999999')
       .text(
         `Plateforme de Mentorat Académique - Université Adventiste Zurcher`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    doc.end();

    stream.on('finish', () => {
      const fileUrl = `/uploads/reports/${fileName}`;
      res.json({ success: true, rapport: { url: fileUrl, fileName } });
    });
    
    stream.on('error', (error) => {
      console.error('Erreur écriture PDF:', error);
      res.status(500).json({ success: false, message: error.message });
    });
    
  } catch (error) {
    console.error('Erreur generateProgressRapport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// LISTER LES RAPPORTS
// ============================================
const getSessionRapports = async (req, res, next) => {
  const { session_id } = req.params;
  try {
    const result = await query(
      'SELECT id, session_id, fichier_url, genere_le FROM rapports WHERE session_id = $1',
      [session_id]
    );
    res.json({ success: true, rapports: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSessionRapport,
  downloadRapport,
  generateProgressRapport,
  getSessionRapports
};