const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// Upload de photo de profil
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Mettre à jour l'utilisateur
    await query(
      'UPDATE utilisateurs SET photo_url = $1 WHERE id = $2',
      [fileUrl, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Photo uploadée avec succès',
      url: fileUrl
    });
  } catch (error) {
    next(error);
  }
};

// Upload de CV
const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Mettre à jour le profil mentor
    await query(
      'UPDATE profils_mentor SET cv_url = $1 WHERE utilisateur_id = $2',
      [fileUrl, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'CV uploadé avec succès',
      url: fileUrl
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadPhoto,
  uploadCV
};
