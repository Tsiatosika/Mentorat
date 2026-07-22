const { query } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ═══════════════════════════════════════
// CHARTE VISUELLE DU PDF
// ═══════════════════════════════════════
const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  accent: '#8B5CF6',
  text: '#1F2937',
  muted: '#6B7280',
  light: '#F5F5FA',
  border: '#E5E7EB',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  white: '#FFFFFF',
};

const PAGE_MARGIN = 50;

const formatDate = (date) => {
  if (!date) return 'Non défini';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateOnly = (date) => {
  if (!date) return 'Non défini';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getInitials = (prenom, nom) => `${(prenom || '?')[0] || ''}${(nom || '?')[0] || ''}`.toUpperCase();

// ═══ EN-TÊTE DE PAGE (bandeau coloré + logo texte + titre) ═══
function drawHeader(doc, title) {
  const pageWidth = doc.page.width;

  doc.rect(0, 0, pageWidth, 118).fill(COLORS.primary);
  doc.rect(0, 112, pageWidth, 6).fill(COLORS.primaryDark);

  // Logo (cercle + initiale, à défaut d'une image de logo)
  doc.circle(PAGE_MARGIN + 20, 46, 20).fill(COLORS.white);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('M', PAGE_MARGIN + 8, 34, { width: 24, align: 'center' });

  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.white)
     .text('MentorIPath', PAGE_MARGIN + 52, 32);
  doc.fontSize(8.5).font('Helvetica').fillColor('#E0E7FF')
     .text('Plateforme de mentorat académique', PAGE_MARGIN + 52, 49);

  doc.fontSize(19).font('Helvetica-Bold').fillColor(COLORS.white)
     .text(title, PAGE_MARGIN, 78, { width: pageWidth - PAGE_MARGIN * 2 });

  doc.fontSize(8.5).font('Helvetica').fillColor('#E0E7FF')
     .text(`Généré le ${formatDate(new Date())}`, PAGE_MARGIN, pageWidth > 0 ? 100 : 100);

  return 150; // position Y de départ du contenu
}

// ═══ PIED DE PAGE ═══
function drawFooter(doc, pageNumber) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const y = pageHeight - 45;

  doc.moveTo(PAGE_MARGIN, y).lineTo(pageWidth - PAGE_MARGIN, y).lineWidth(0.5).strokeColor(COLORS.border).stroke();

  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
     .text('MentorIPath — Plateforme de mentorat académique', PAGE_MARGIN, y + 10, { width: pageWidth - PAGE_MARGIN * 2 - 60, align: 'left' });
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
     .text(`Page ${pageNumber}`, pageWidth - PAGE_MARGIN - 60, y + 10, { width: 60, align: 'right' });
}

// ═══ TITRE DE SECTION (barre colorée + libellé) ═══
function sectionTitle(doc, y, label, color = COLORS.primary) {
  doc.rect(PAGE_MARGIN, y, 4, 16).fill(color);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.text)
     .text(label, PAGE_MARGIN + 12, y - 1);
  return y + 28;
}

// ═══ CARTE D'INFO (fond léger, une ligne libellé + valeur) ═══
function infoCard(doc, x, y, width, label, value) {
  const height = 42;
  doc.roundedRect(x, y, width, height, 6).fill(COLORS.light);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.muted)
     .text(label.toUpperCase(), x + 12, y + 8, { width: width - 24, characterSpacing: 0.5 });
  doc.fontSize(10.5).font('Helvetica').fillColor(COLORS.text)
     .text(value || '—', x + 12, y + 22, { width: width - 24 });
  return y + height + 10;
}

// ═══ CARTE PARTICIPANT (avatar initiales + infos) ═══
function participantCard(doc, x, y, width, roleLabel, prenom, nom, email, meta, accentColor) {
  const height = 100;
  doc.roundedRect(x, y, width, height, 8).fill(COLORS.white).strokeColor(COLORS.border).lineWidth(1).stroke();

  doc.circle(x + 32, y + 32, 20).fill(accentColor);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.white)
     .text(getInitials(prenom, nom), x + 12, y + 25, { width: 40, align: 'center' });

  doc.fontSize(8).font('Helvetica-Bold').fillColor(accentColor)
     .text(roleLabel.toUpperCase(), x + 62, y + 14, { characterSpacing: 0.5 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
     .text(`${prenom || ''} ${nom || ''}`.trim() || 'Non renseigné', x + 62, y + 27, { width: width - 74 });
  doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.muted)
     .text(email || 'Email non renseigné', x + 62, y + 43, { width: width - 74 });
  doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.muted)
     .text(meta || '—', x + 62, y + 58, { width: width - 74 });

  return y + height + 10;
}

// ═══ BADGE DE NOTE (étoiles pleines/vides + fond coloré) ═══
function ratingCard(doc, x, y, width, label, note, commentaire) {
  const height = commentaire ? 90 : 56;
  const hasNote = note !== null && note !== undefined && !isNaN(note);
  const bgColor = hasNote ? COLORS.successSoft : COLORS.light;

  doc.roundedRect(x, y, width, height, 8).fill(bgColor);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
     .text(label, x + 14, y + 12);

  if (hasNote) {
    const fullStars = Math.round(Number(note));
    let starsStr = '';
    for (let i = 0; i < 5; i++) starsStr += i < fullStars ? '★' : '☆';
    doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.warning)
       .text(`${starsStr}  ${Number(note).toFixed(1)}/5`, x + 14, y + 28);
  } else {
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted)
       .text('Non évalué', x + 14, y + 28);
  }

  if (commentaire) {
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(COLORS.text)
       .text(`« ${commentaire} »`, x + 14, y + 50, { width: width - 28 });
  }

  return y + height + 10;
}

// ═══════════════════════════════════════
// GÉNÉRER UN RAPPORT DE SESSION
// ═══════════════════════════════════════
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

    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let y = drawHeader(doc, 'Rapport de session');

    // ── Informations générales ──
    y = sectionTitle(doc, y, 'Informations générales');
    const colWidth = (doc.page.width - PAGE_MARGIN * 2 - 12) / 2;
    let leftY = y, rightY = y;
    leftY = infoCard(doc, PAGE_MARGIN, leftY, colWidth, 'Sujet', session.sujet);
    rightY = infoCard(doc, PAGE_MARGIN + colWidth + 12, rightY, colWidth, 'Date de la session', formatDateOnly(session.date_debut));
    leftY = infoCard(doc, PAGE_MARGIN, leftY, colWidth, 'Durée réelle', session.duree_reelle ? `${session.duree_reelle} minutes` : 'Non renseignée');
    rightY = infoCard(doc, PAGE_MARGIN + colWidth + 12, rightY, colWidth, 'Statut', session.statut ? session.statut.replace('_', ' ') : 'Non défini');
    y = Math.max(leftY, rightY) + 10;

    // ── Participants ──
    y = sectionTitle(doc, y, 'Participants');
    y = participantCard(doc, PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 'Mentor', session.mentor_prenom, session.mentor_nom, session.mentor_email, `Domaine : ${session.mentor_domaine || 'Non spécifié'}`, COLORS.primary);
    y = participantCard(doc, PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 'Mentoré', session.mentore_prenom, session.mentore_nom, session.mentore_email, `Niveau : ${session.niveau_etude || 'Non spécifié'}`, COLORS.accent);
    y += 6;

    // ── Évaluations ──
    y = sectionTitle(doc, y, 'Évaluations');
    y = ratingCard(doc, PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 'Note attribuée par le mentor', session.note_du_mentor, session.notes_mentor);
    y = ratingCard(doc, PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 'Note attribuée par le mentoré', session.note_du_mentore, session.notes_mentore);

    // Pied de page sur toutes les pages générées
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, i + 1);
    }

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

// ═══════════════════════════════════════
// TÉLÉCHARGER UN RAPPORT
// ═══════════════════════════════════════
const downloadRapport = async (req, res, next) => {
  const { session_id } = req.params;

  try {
    const result = await query('SELECT fichier_url FROM rapports WHERE session_id = $1', [session_id]);

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

// ═══════════════════════════════════════
// GÉNÉRER UN RAPPORT DE PROGRESSION
// ═══════════════════════════════════════
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
        : 0,
    };

    const fileName = `rapport_progression_${mentore.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let y = drawHeader(doc, 'Rapport de progression');

    // ── Informations du mentoré ──
    y = sectionTitle(doc, y, 'Informations du mentoré');
    const colWidth = (doc.page.width - PAGE_MARGIN * 2 - 12) / 2;
    let leftY = y, rightY = y;
    leftY = infoCard(doc, PAGE_MARGIN, leftY, colWidth, 'Nom', `${mentore.prenom} ${mentore.nom}`);
    rightY = infoCard(doc, PAGE_MARGIN + colWidth + 12, rightY, colWidth, 'Email', mentore.email);
    leftY = infoCard(doc, PAGE_MARGIN, leftY, colWidth, 'Niveau', mentore.niveau_etude || 'Non défini');
    rightY = infoCard(doc, PAGE_MARGIN + colWidth + 12, rightY, colWidth, 'Domaine', mentore.domaine || 'Non défini');
    y = Math.max(leftY, rightY) + 10;

    // ── Progression : jauge circulaire simplifiée + statistiques ──
    y = sectionTitle(doc, y, 'Progression');
    const gaugeSize = 90;
    const cardHeight = 110;
    doc.roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, cardHeight, 8).fill(COLORS.light);

    const cx = PAGE_MARGIN + 65, cy = y + cardHeight / 2, r = 38;
    doc.circle(cx, cy, r).lineWidth(10).strokeColor(COLORS.border).stroke();
    // Arc de progression (approximation via un cercle plein coloré overlay si 100%, sinon simple anneau partiel non trivial en pdfkit — on affiche le chiffre en grand à la place)
    doc.circle(cx, cy, r).lineWidth(10).strokeColor(stats.taux_completion >= 70 ? COLORS.success : stats.taux_completion >= 40 ? COLORS.warning : COLORS.muted)
       .stroke();
    doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.text)
       .text(`${stats.taux_completion}%`, cx - 40, cy - 12, { width: 80, align: 'center' });

    const statsX = PAGE_MARGIN + 150;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.muted).text('TOTAL DES SESSIONS', statsX, y + 20);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.text).text(String(stats.total_sessions), statsX, y + 33);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.muted).text('SESSIONS TERMINÉES', statsX, y + 62);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.success).text(String(stats.sessions_terminees), statsX, y + 75);

    y += cardHeight + 16;

    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, i + 1);
    }

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

// ═══════════════════════════════════════
// LISTER LES RAPPORTS
// ═══════════════════════════════════════
const getSessionRapports = async (req, res, next) => {
  const { session_id } = req.params;
  try {
    const result = await query('SELECT id, session_id, fichier_url, genere_le FROM rapports WHERE session_id = $1', [session_id]);
    res.json({ success: true, rapports: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSessionRapport,
  downloadRapport,
  generateProgressRapport,
  getSessionRapports,
};