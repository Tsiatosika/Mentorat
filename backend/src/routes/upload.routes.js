const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/auth');
const { query } = require('../config/db');

// Créer les dossiers nécessaires
const uploadDir = 'uploads/chat/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Upload de fichier pour le chat
router.post('/chat', authenticate, upload.single('file'), async (req, res) => {
  try {
    console.log('📎 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    console.log(`✅ Fichier uploadé: ${fileUrl}`);
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload de photo de profil
router.post('/photo', authenticate, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
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

// Upload de CV
router.post('/cv', authenticate, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
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
