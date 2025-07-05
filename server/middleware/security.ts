import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

// File upload security configuration
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/octet-stream' // Fallback for Excel files
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// File filter for multer
export const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension
  const allowedExtensions = ['.xlsx', '.xls'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Type de fichier non autorisé. Seuls les fichiers Excel (.xlsx, .xls) sont acceptés.'));
  }

  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les fichiers Excel sont acceptés.'));
  }
};

// Multer configuration with security
export const uploadConfig = multer({
  dest: 'uploads/',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only allow single file upload
  },
  fileFilter
});

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Trop de requêtes depuis cette adresse IP. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit file uploads to 5 per 10 minutes
  message: {
    error: 'Limite d\'upload atteinte. Veuillez attendre 10 minutes avant de télécharger un autre fichier.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit API calls to 100 per minute
  message: {
    error: 'Limite d\'API atteinte. Veuillez attendre une minute avant de continuer.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Error handler for multer
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: `La taille du fichier ne doit pas dépasser ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Trop de fichiers',
        message: 'Un seul fichier peut être téléchargé à la fois.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Fichier inattendu',
        message: 'Le champ de fichier n\'est pas valide.'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      error: 'Erreur de validation',
      message: error.message
    });
  }
  
  next(error);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// Input validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Basic input sanitization
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};