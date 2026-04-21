const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier des rapports s'il n'existe pas
const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const formatDate = (date) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateOnly = (date) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const generateSessionReport = async (session, mentor, mentore, messages = []) => {
  return new Promise((resolve, reject) => {
    const fileName = `rapport_session_${session.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1a5276')
       .text('RAPPORT DE SESSION DE MENTORAT', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Ligne de séparation
    doc.strokeColor('#cccccc')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown();
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS GÉNÉRALES', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Tableau des infos
    const startY = doc.y;
    const col1X = 50;
    const col2X = 200;
    const col3X = 350;
    
    doc.text('ID Session:', col1X, startY);
    doc.text(session.id, col2X, startY);
    
    doc.text('Statut:', col3X, startY);
    doc.text(session.statut === 'terminee' ? 'Terminée' : session.statut, col3X + 100, startY);
    
    doc.text('Date de début:', col1X, startY + 25);
    doc.text(formatDate(session.date_debut), col2X, startY + 25);
    
    doc.text('Date de fin:', col3X, startY + 25);
    doc.text(formatDate(session.date_fin), col3X + 100, startY + 25);
    
    doc.text('Durée réelle:', col1X, startY + 50);
    doc.text(session.duree_reelle ? `${session.duree_reelle} minutes` : 'Non renseignée', col2X, startY + 50);
    
    doc.text('Sujet:', col1X, startY + 75);
    doc.text(session.sujet || 'Non défini', col2X, startY + 75);
    
    doc.moveDown(5);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('PARTICIPANTS', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Mentor
    doc.font('Helvetica-Bold')
       .text('MENTOR:', col1X, doc.y);
    doc.font('Helvetica')
       .text(`${mentor.prenom} ${mentor.nom}`, col1X + 80, doc.y - 12);
    doc.text('Email:', col1X + 250, doc.y - 12);
    doc.text(mentor.email, col1X + 300, doc.y - 12);
    
    doc.text('Domaine:', col1X, doc.y + 15);
    doc.text(mentor.domaine || 'Non défini', col1X + 80, doc.y + 15);
    doc.text('Expérience:', col1X + 250, doc.y + 15);
    doc.text(`${mentor.annees_experience || 0} ans`, col1X + 330, doc.y + 15);
    
    doc.text('Note moyenne:', col1X, doc.y + 30);
    doc.text(`${mentor.note_moyenne || 0}/5`, col1X + 80, doc.y + 30);
    doc.text('Sessions:', col1X + 250, doc.y + 30);
    doc.text(`${mentor.nb_sessions || 0} sessions`, col1X + 310, doc.y + 30);
    
    doc.moveDown();
    
    // Mentoré
    doc.font('Helvetica-Bold')
       .text('MENTORÉ:', col1X, doc.y);
    doc.font('Helvetica')
       .text(`${mentore.prenom} ${mentore.nom}`, col1X + 80, doc.y - 12);
    doc.text('Email:', col1X + 250, doc.y - 12);
    doc.text(mentore.email, col1X + 300, doc.y - 12);
    
    doc.text('Niveau:', col1X, doc.y + 15);
    doc.text(mentore.niveau_etude || 'Non défini', col1X + 80, doc.y + 15);
    doc.text('Progression:', col1X + 250, doc.y + 15);
    doc.text(`${mentore.progression || 0}%`, col1X + 330, doc.y + 15);
    
    doc.moveDown(3);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('ÉVALUATIONS', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Note du mentor
    doc.font('Helvetica-Bold')
       .text('Note du mentor:', col1X, doc.y);
    doc.font('Helvetica')
       .text(session.note_du_mentore ? `${session.note_du_mentore}/5` : 'Non évalué', col1X + 130, doc.y);
    
    doc.font('Helvetica-Bold')
       .text('Commentaire du mentor:', col1X, doc.y + 20);
    doc.font('Helvetica')
       .text(session.notes_mentor || 'Aucun commentaire', col1X, doc.y + 35, { width: 500 });
    
    doc.moveDown(4);
    
    // Note du mentoré
    doc.font('Helvetica-Bold')
       .text('Note du mentoré:', col1X, doc.y);
    doc.font('Helvetica')
       .text(session.note_du_mentor ? `${session.note_du_mentor}/5` : 'Non évalué', col1X + 130, doc.y);
    
    doc.font('Helvetica-Bold')
       .text('Commentaire du mentoré:', col1X, doc.y + 20);
    doc.font('Helvetica')
       .text(session.notes_mentore || 'Aucun commentaire', col1X, doc.y + 35, { width: 500 });
    
    doc.moveDown(4);
    
    if (session.description) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('DESCRIPTION DE LA SESSION', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(session.description, { width: 500 });
      
      doc.moveDown(2);
    }
    
    if (messages && messages.length > 0) {
      doc.addPage();
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('HISTORIQUE DES MESSAGES', { underline: true });
      
      doc.moveDown(0.5);
      
      let yPos = doc.y;
      for (let i = 0; i < Math.min(messages.length, 20); i++) {
        const msg = messages[i];
        
        if (yPos > 750) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#1a5276')
           .text(`${msg.prenom} ${msg.nom}:`, col1X, yPos);
        
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#333333')
           .text(msg.contenu, col1X + 120, yPos, { width: 380 });
        
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor('#999999')
           .text(formatDate(msg.envoye_le), col1X + 500, yPos, { width: 100 });
        
        yPos += 20;
      }
    }
    
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Plateforme de Mentorat Académique - Université Adventiste Zurcher - Page ${i + 1}/${totalPages}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
    
    doc.end();
    
    stream.on('finish', () => {
      resolve({
        fileName,
        filePath,
        url: `/uploads/reports/${fileName}`
      });
    });
    
    stream.on('error', reject);
  });
};

const generateProgressReport = async (mentore, sessions, stats) => {
  return new Promise((resolve, reject) => {
    const fileName = `rapport_progression_${mentore.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    // En-tête
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1a5276')
       .text('RAPPORT DE PROGRESSION', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Informations mentoré
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS DU MENTORÉ', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text(`Nom: ${mentore.prenom} ${mentore.nom}`);
    doc.text(`Email: ${mentore.email}`);
    doc.text(`Niveau d'étude: ${mentore.niveau_etude || 'Non défini'}`);
    doc.text(`Domaine: ${mentore.domaine || 'Non défini'}`);
    
    doc.moveDown();
    
    // Progression
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('PROGRESSION GLOBALE', { underline: true });
    
    doc.moveDown(0.5);
    
    // Barre de progression
    const progressWidth = 400;
    const progressPercent = mentore.progression || 0;
    const fillWidth = (progressPercent / 100) * progressWidth;
    
    doc.rect(50, doc.y, progressWidth, 20)
       .stroke('#cccccc');
    
    doc.rect(50, doc.y, fillWidth, 20)
       .fill('#27ae60');
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(`${progressPercent}%`, 50 + fillWidth - 30, doc.y + 4);
    
    doc.moveDown(2.5);
    
    // Statistiques
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text(`Total des sessions: ${stats.total_sessions || 0}`);
    doc.text(`Sessions terminées: ${stats.sessions_terminees || 0}`);
    doc.text(`Sessions en cours: ${stats.sessions_en_cours || 0}`);
    doc.text(`Taux de complétion: ${stats.taux_completion || 0}%`);
    
    doc.moveDown();
    
    // Liste des sessions
    if (sessions && sessions.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('HISTORIQUE DES SESSIONS', { underline: true });
      
      doc.moveDown(0.5);
      
      sessions.forEach((session, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1a5276')
           .text(`${index + 1}. ${session.sujet || 'Sans sujet'}`, 50, doc.y);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#333333');
        
        doc.text(`Date: ${formatDateOnly(session.date_debut)}`, 70, doc.y);
        doc.text(`Statut: ${session.statut === 'terminee' ? 'Terminée' : session.statut}`, 250, doc.y - 12);
        doc.text(`Note: ${session.note_du_mentor || 'Non évaluée'}/5`, 400, doc.y - 12);
        
        if (session.notes_mentor) {
          doc.text(`Commentaire: ${session.notes_mentor.substring(0, 100)}...`, 70, doc.y + 8);
        }
        
        doc.moveDown(1.5);
      });
    }
    
    // Pied de page
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Plateforme de Mentorat Académique - Université Adventiste Zurcher - Page ${i + 1}/${totalPages}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
    
    doc.end();
    
    stream.on('finish', () => {
      resolve({
        fileName,
        filePath,
        url: `/uploads/reports/${fileName}`
      });
    });
    
    stream.on('error', reject);
  });
};

module.exports = {
  generateSessionReport,
  generateProgressReport,
  reportsDir
};