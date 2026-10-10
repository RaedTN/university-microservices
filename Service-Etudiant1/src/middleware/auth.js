const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET n\'est pas configuré. Veuillez définir JWT_SECRET dans le fichier .env',
      });
    }

    // Extraire le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token JWT manquant. Veuillez fournir un token dans l\'en-tête Authorization.',
      });
    }

    // Format attendu: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token JWT manquant.',
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter les informations décodées à la requête
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token JWT invalide.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token JWT expiré.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token.',
      error: error.message,
    });
  }
};

module.exports = auth;

