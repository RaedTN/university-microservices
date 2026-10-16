require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./utils/errorHandler');

// Initialiser Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (frontend)
app.use(express.static('public'));

// Routes API
app.use('/api/auth', authRoutes); // Routes d'authentification (génération de tokens)
app.use('/api/students', studentRoutes); // Routes étudiants (protégées par JWT)

// Route de test API
app.get('/api', (req, res) => {
  res.json({
    message: 'Service Étudiants API',
    version: '1.0.0',
  });
});

// Gestionnaire d'erreurs (doit être le dernier middleware)
app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}

