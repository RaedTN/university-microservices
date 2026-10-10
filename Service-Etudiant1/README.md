# Service Étudiants (Student-Service)

Service REST pour la gestion complète des étudiants avec authentification JWT.

## Technologies

- **Node.js** + **Express** : Framework web
- **MongoDB** + **Mongoose** : Base de données
- **JWT** : Authentification
- **dotenv** : Gestion des variables d'environnement

## Installation

1. Cloner le projet
2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
```

4. Modifier le fichier `.env` avec vos configurations :
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/student_db
JWT_SECRET=your_super_secret_jwt_key
```

## Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## API Endpoints

### Authentification (Publiques - pour le développement)

#### POST /api/auth/generate-token
Générer un token JWT de test

**Body (optionnel) :**
```json
{
  "userId": "user123",
  "email": "user@example.com",
  "role": "user",
  "expiresIn": "24h"
}
```

#### POST /api/auth/verify-token
Vérifier la validité d'un token JWT

**Body :**
```json
{
  "token": "votre_token_jwt"
}
```

### Étudiants (Protégées par JWT)

Toutes les routes suivantes nécessitent un token JWT dans l'en-tête `Authorization` :
```
Authorization: Bearer <votre_token_jwt>
```

#### GET /api/students
Obtenir la liste des étudiants (paginée)

**Query Parameters :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)

**Exemple :**
```bash
GET /api/students?page=1&limit=10
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

#### GET /api/students/:id
Obtenir un étudiant par son ID

**Exemple :**
```bash
GET /api/students/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

#### POST /api/students
Créer un nouvel étudiant

**Body :**
```json
{
  "studentNumber": "STU001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "dateOfBirth": "2000-01-15",
  "phone": "+33123456789",
  "address": "123 Rue Example, Paris"
}
```

#### PUT /api/students/:id
Modifier un étudiant

**Body :** (champs à modifier)
```json
{
  "firstName": "Jean-Pierre",
  "phone": "+33987654321"
}
```

#### DELETE /api/students/:id
Supprimer un étudiant

## Modèle de données

### Student

- `studentNumber` (String, unique, requis) : Numéro étudiant
- `firstName` (String, requis) : Prénom
- `lastName` (String, requis) : Nom
- `email` (String, unique, requis) : Email (validation)
- `dateOfBirth` (Date, requis) : Date de naissance
- `phone` (String, optionnel) : Téléphone
- `address` (String, optionnel) : Adresse
- `createdAt` (Date, auto) : Date de création
- `updatedAt` (Date, auto) : Date de modification

## Authentification JWT

Toutes les routes sont protégées par un middleware JWT. Le token doit être fourni dans l'en-tête `Authorization` au format :
```
Authorization: Bearer <token>
```

### Comment générer un token JWT

#### Option 1 : Via le Frontend (Recommandé)
1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Cliquez sur le bouton **"🎫 Générer un Token"**
3. Le token sera automatiquement enregistré et vous pourrez utiliser toutes les fonctionnalités

#### Option 2 : Via l'API REST
```bash
POST /api/auth/generate-token
Content-Type: application/json

{
  "userId": "user123",
  "email": "user@example.com",
  "role": "user",
  "expiresIn": "24h"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Token JWT généré avec succès",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "payload": {
      "userId": "user123",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### Option 3 : Vérifier un token
```bash
POST /api/auth/verify-token
Content-Type: application/json

{
  "token": "votre_token_ici"
}
```

### Comment ça fonctionne

1. **Génération du token** : Le serveur crée un token JWT signé avec `JWT_SECRET`
2. **Envoi de la requête** : Le client envoie le token dans l'en-tête `Authorization: Bearer <token>`
3. **Vérification** : Le middleware `auth.js` vérifie :
   - Présence du token
   - Validité de la signature
   - Expiration du token
4. **Accès autorisé** : Si valide, la requête continue vers le contrôleur

### En cas d'erreur d'authentification :
- Token manquant : 401 - "Token JWT manquant"
- Token invalide : 401 - "Token JWT invalide"
- Token expiré : 401 - "Token JWT expiré"
- JWT_SECRET non configuré : 500 - "JWT_SECRET n'est pas configuré"

## Gestion des erreurs

Le service retourne des réponses JSON standardisées :

**Succès :**
```json
{
  "success": true,
  "data": {...}
}
```

**Erreur :**
```json
{
  "success": false,
  "message": "Message d'erreur"
}
```

## Structure du projet

```
student-service/
├── src/
│   ├── config/
│   │   └── database.js          # Configuration MongoDB
│   ├── models/
│   │   └── Student.js           # Modèle Mongoose
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT
│   ├── controllers/
│   │   └── studentController.js # Logique CRUD
│   ├── routes/
│   │   └── studentRoutes.js     # Routes Express
│   ├── utils/
│   │   └── errorHandler.js      # Gestion des erreurs
│   └── app.js                   # Application principale
├── .env                         # Variables d'environnement
├── .env.example                 # Template .env
├── .gitignore
├── package.json
└── README.md
```

