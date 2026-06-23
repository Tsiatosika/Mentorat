const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/auth');
const { query } = require('../config/db');

['uploads/chat/', 'uploads/photos/', 'uploads/cv/'].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const makeStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, destination),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté'), false);
  }
};

const uploadChat = multer({
  storage: makeStorage('uploads/chat/'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

const uploadPhoto = multer({
  storage: makeStorage('uploads/photos/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadCV = multer({
  storage: makeStorage('uploads/cv/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

router.post('/chat', authenticate, uploadChat.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('❌ Erreur upload chat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/photo', authenticate, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }

    const fileUrl = `/uploads/photos/${req.file.filename}`;

    await query(
      'UPDATE utilisateurs SET photo_url = $1 WHERE id = $2',
      [fileUrl, req.user.id]
    );

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cv', authenticate, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }

    const fileUrl = `/uploads/cv/${req.file.filename}`;

    await query(
      'UPDATE profils_mentor SET cv_url = $1 WHERE utilisateur_id = $2',
      [fileUrl, req.user.id]
    );

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('❌ Erreur upload CV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;