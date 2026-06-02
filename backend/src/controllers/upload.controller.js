// src/controllers/upload.controller.js
// CORRECTION 6 : ajout de l'import manquant { query }

const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { query } = require('../config/db');  // ← était manquant

// ── Configuration stockage ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Formats acceptés : JPG, PNG, PDF'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});

// ── Upload photo de profil ────────────────────────────────────────────────────
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    await query(
      'UPDATE utilisateurs SET photo_url = $1 WHERE id = $2',
      [fileUrl, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Photo uploadée avec succès',
      url: fileUrl
    });
  } catch (error) {
    next(error);
  }
};

// ── Upload CV (mentor uniquement) ─────────────────────────────────────────────
const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    await query(
      'UPDATE profils_mentor SET cv_url = $1 WHERE utilisateur_id = $2',
      [fileUrl, req.user.id]
    );

    return res.json({
      success: true,
      message: 'CV uploadé avec succès',
      url: fileUrl
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadPhoto, uploadCV };