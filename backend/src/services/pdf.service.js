// src/services/pdf.service.js
const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// Créer le dossier des rapports s'il n'existe pas
const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDateOnly = (date) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// CORRECTION 1 : fonction utilitaire pour dessiner le pied de page
// (évite la répétition et centralise le texte de l'université)
const drawFooters = (doc) => {
  const total = doc.bufferedPageRange().count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Plateforme de Mentorat Académique — Université Adventiste Zurcher — Page ${i + 1}/${total}`,
         50, doc.page.height - 40, { align: 'center', width: 500 }
       );
  }
};

// ── RAPPORT DE SESSION ────────────────────────────────────────────────────────
const generateSessionReport = async (session, mentor, mentore, messages = []) => {
  return new Promise((resolve, reject) => {
    const fileName = `rapport_session_${session.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── En-tête ──
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5276')
       .text('RAPPORT DE SESSION DE MENTORAT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.strokeColor('#cccccc').lineWidth(1)
       .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Informations générales ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('INFORMATIONS GÉNÉRALES', { underline: true });
    doc.moveDown(0.5);

    const info = [
      ['ID Session',   session.id],
      ['Statut',       session.statut === 'terminee' ? 'Terminée ✓' : session.statut],
      ['Date de début',formatDate(session.date_debut)],
      ['Date de fin',  formatDate(session.date_fin)],
      ['Durée réelle', session.duree_reelle ? `${session.duree_reelle} minutes` : 'Non renseignée'],
      ['Sujet',        session.sujet || 'Non défini'],
    ];

    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    info.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label} :`, 50, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica').text(` ${value}`, { width: 350 });
    });

    doc.moveDown();
    doc.strokeColor('#eeeeee').lineWidth(0.5)
       .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Participants ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('PARTICIPANTS', { underline: true });
    doc.moveDown(0.5);

    // Mentor
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a5276').text('Mentor');
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    [
      ['Nom',         `${mentor.prenom} ${mentor.nom}`],
      ['Email',       mentor.email || 'Non renseigné'],
      ['Domaine',     mentor.domaine || 'Non défini'],
      ['Expérience',  `${mentor.annees_experience || 0} ans`],
      ['Note moyenne',`${mentor.note_moyenne || 0}/5 (${mentor.nb_sessions || 0} sessions)`],
    ].forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`  ${label} :`, 50, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica').text(` ${value}`);
    });

    doc.moveDown(0.5);

    // Mentoré
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a5276').text('Mentoré');
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    [
      ['Nom',         `${mentore.prenom} ${mentore.nom}`],
      ['Email',       mentore.email || 'Non renseigné'],
      ['Niveau',      mentore.niveau_etude || 'Non défini'],
      ['Objectifs',   mentore.objectifs || 'Non renseignés'],
      ['Progression', `${mentore.progression || 0}%`],
    ].forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`  ${label} :`, 50, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica').text(` ${value}`, { width: 350 });
    });

    doc.moveDown();
    doc.strokeColor('#eeeeee').lineWidth(0.5)
       .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Évaluations ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('ÉVALUATIONS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');

    // CORRECTION 2 : afficher "En attente" si la note n'est pas encore soumise
    const noteMentor  = session.note_du_mentore
      ? `${session.note_du_mentore}/5` : 'En attente de l\'évaluation du mentor';
    const NoteMentore = session.note_du_mentor
      ? `${session.note_du_mentor}/5` : 'En attente de l\'évaluation du mentoré';

    doc.font('Helvetica-Bold').text('Note donnée par le mentor :', { continued: true });
    doc.font('Helvetica').text(` ${noteMentor}`);
    doc.font('Helvetica-Bold').text('Commentaire du mentor :');
    doc.font('Helvetica').text(session.notes_mentor || 'Aucun commentaire', { width: 500, indent: 10 });

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Note donnée par le mentoré :', { continued: true });
    doc.font('Helvetica').text(` ${NoteMentore}`);
    doc.font('Helvetica-Bold').text('Commentaire du mentoré :');
    doc.font('Helvetica').text(session.notes_mentore || 'Aucun commentaire', { width: 500, indent: 10 });

    doc.moveDown();

    // ── Description ──
    if (session.description) {
      doc.strokeColor('#eeeeee').lineWidth(0.5)
         .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
         .text('DESCRIPTION DE LA SESSION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
         .text(session.description, { width: 500 });
      doc.moveDown();
    }

    // ── Messages (nouvelle page) ──
    if (messages && messages.length > 0) {
      doc.addPage();
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
         .text(`HISTORIQUE DES MESSAGES (${Math.min(messages.length, 30)} affichés)`, { underline: true });
      doc.moveDown(0.5);

      // CORRECTION 3 : limite à 30 messages (au lieu de 20) + gestion overflow
      const displayed = messages.slice(0, 30);
      displayed.forEach((msg) => {
        if (doc.y > 730) doc.addPage();

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5276')
           .text(`${msg.prenom} ${msg.nom}`, 50, doc.y, { continued: true, width: 130 });
        doc.font('Helvetica').fillColor('#999999')
           .text(`  ${formatDate(msg.envoye_le)}`, { width: 150 });
        doc.fontSize(9).font('Helvetica').fillColor('#333333')
           .text(msg.contenu, 50, doc.y, { width: 500, indent: 10 });
        doc.moveDown(0.3);
      });
    }

    // Pieds de page sur toutes les pages
    drawFooters(doc);

    doc.end();
    stream.on('finish', () => resolve({ fileName, filePath, url: `/uploads/reports/${fileName}` }));
    stream.on('error', reject);
  });
};

// ── RAPPORT DE PROGRESSION ────────────────────────────────────────────────────
const generateProgressReport = async (mentore, sessions, stats) => {
  return new Promise((resolve, reject) => {
    const fileName = `rapport_progression_${mentore.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── En-tête ──
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5276')
       .text('RAPPORT DE PROGRESSION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.strokeColor('#cccccc').lineWidth(1)
       .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Infos mentoré ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('INFORMATIONS DU MENTORÉ', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    [
      ['Nom',           `${mentore.prenom} ${mentore.nom}`],
      ['Email',         mentore.email],
      ['Niveau d\'étude', mentore.niveau_etude || 'Non défini'],
      ['Domaine',       mentore.domaine || 'Non défini'],
      ['Objectifs',     mentore.objectifs || 'Non renseignés'],
    ].forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label} :`, 50, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica').text(` ${value}`, { width: 350 });
    });

    doc.moveDown();

    // ── Progression ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('PROGRESSION GLOBALE', { underline: true });
    doc.moveDown(0.5);

    const progressWidth  = 400;
    const progressPct    = Math.min(mentore.progression || 0, 100);
    const fillWidth      = (progressPct / 100) * progressWidth;
    const barY           = doc.y;

    // Fond gris
    doc.rect(50, barY, progressWidth, 20).fillColor('#eeeeee').fill();
    // Remplissage vert
    if (fillWidth > 0) {
      doc.rect(50, barY, fillWidth, 20).fillColor('#27ae60').fill();
    }
    // Texte centré
    doc.fontSize(10).font('Helvetica-Bold').fillColor(progressPct > 10 ? '#ffffff' : '#333333')
       .text(`${progressPct}%`, 50, barY + 5, { width: progressWidth, align: 'center' });

    doc.moveDown(2);

    // ── Statistiques ──
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
       .text('STATISTIQUES', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');

    // CORRECTION 4 : taux_completion calculé ici si non fourni
    const tauxCompletion = stats.taux_completion
      ?? (stats.total_sessions > 0
        ? Math.round((stats.sessions_terminees / stats.total_sessions) * 100)
        : 0);

    [
      ['Total des sessions',    stats.total_sessions    || 0],
      ['Sessions terminées',    stats.sessions_terminees || 0],
      ['Sessions en cours',     stats.sessions_en_cours  || 0],
      ['Sessions en attente',   stats.sessions_attente   || 0],
      ['Taux de complétion',    `${tauxCompletion}%`],
    ].forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label} :`, 50, doc.y, { continued: true, width: 200 });
      doc.font('Helvetica').text(` ${value}`);
    });

    doc.moveDown();

    // ── Historique des sessions ──
    if (sessions && sessions.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c3e50')
         .text('HISTORIQUE DES SESSIONS', { underline: true });
      doc.moveDown(0.5);

      sessions.forEach((session, index) => {
        if (doc.y > 700) doc.addPage();

        const statut = session.statut === 'terminee' ? 'Terminée ✓' : session.statut;
        const note   = session.note_du_mentor ? `${session.note_du_mentor}/5` : 'Non évaluée';

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5276')
           .text(`${index + 1}. ${session.sujet || 'Sans sujet'}`);
        doc.fontSize(9).font('Helvetica').fillColor('#555555');
        doc.text(`   Date : ${formatDateOnly(session.date_debut)}   |   Statut : ${statut}   |   Note : ${note}`);

        if (session.notes_mentor) {
          const commentaire = session.notes_mentor.length > 120
            ? session.notes_mentor.substring(0, 120) + '…'
            : session.notes_mentor;
          doc.text(`   Commentaire : ${commentaire}`, { width: 480 });
        }

        doc.moveDown(0.8);
      });
    }

    drawFooters(doc);

    doc.end();
    stream.on('finish', () => resolve({ fileName, filePath, url: `/uploads/reports/${fileName}` }));
    stream.on('error', reject);
  });
};

module.exports = { generateSessionReport, generateProgressReport, reportsDir };