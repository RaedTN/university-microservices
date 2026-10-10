const jwt = require('jsonwebtoken');

// @desc    Générer un token JWT de test
// @route   POST /api/auth/generate-token
// @access  Public (pour le développement)
const generateToken = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET n\'est pas configuré dans le fichier .env',
      });
    }

    // Données à inclure dans le token (payload)
    const payload = {
      userId: req.body.userId || 'test-user',
      email: req.body.email || 'test@example.com',
      role: req.body.role || 'user',
      // Expiration : 24 heures par défaut
      iat: Math.floor(Date.now() / 1000),
    };

    // Options du token
    const options = {
      expiresIn: req.body.expiresIn || '24h', // Par défaut 24 heures
    };

    // Générer le token
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);

    res.status(200).json({
      success: true,
      message: 'Token JWT généré avec succès',
      data: {
        token,
        expiresIn: options.expiresIn,
        payload,
      },
      instructions: {
        usage: 'Utilisez ce token dans l\'en-tête Authorization: Bearer <token>',
        example: `Authorization: Bearer ${token.substring(0, 20)}...`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier un token JWT
// @route   POST /api/auth/verify-token
// @access  Public (pour le développement)
const verifyToken = (req, res, next) => {
  try {
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET n\'est pas configuré',
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      success: true,
      message: 'Token valide',
      data: {
        decoded,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Pas d\'expiration',
        isExpired: decoded.exp ? decoded.exp < Math.floor(Date.now() / 1000) : false,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        error: error.message,
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        expiredAt: error.expiredAt,
      });
    }

    next(error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

