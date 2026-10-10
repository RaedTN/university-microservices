# Guide JWT - Comment ça fonctionne

## Qu'est-ce que JWT ?

JWT (JSON Web Token) est un standard ouvert (RFC 7519) qui définit un moyen compact et autonome de transmettre des informations de manière sécurisée entre parties sous forme d'objet JSON.

## Structure d'un JWT

Un token JWT est composé de 3 parties séparées par des points (.) :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MDAwMDAwMDB9.signature
```

1. **Header (En-tête)** : Type de token et algorithme de signature
2. **Payload (Charge utile)** : Les données (claims) - informations sur l'utilisateur
3. **Signature** : Vérification de l'intégrité du token

## Comment ça fonctionne dans ce service

### 1. Génération du Token

Quand vous appelez `POST /api/auth/generate-token`, le serveur :

```javascript
// Crée un payload avec les informations utilisateur
const payload = {
  userId: 'test-user',
  email: 'test@example.com',
  role: 'user',
  iat: Math.floor(Date.now() / 1000) // Date de création
};

// Signe le token avec le secret JWT_SECRET
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '24h' // Expire dans 24 heures
});
```

### 2. Envoi de la Requête

Le client envoie le token dans l'en-tête HTTP :

```http
GET /api/students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Vérification du Token (Middleware)

Le middleware `auth.js` intercepte chaque requête :

```javascript
// 1. Extrait le token de l'en-tête
const authHeader = req.headers.authorization;
const token = authHeader.replace('Bearer ', '');

// 2. Vérifie la signature avec JWT_SECRET
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 3. Si valide, ajoute les données au req.user
req.user = decoded;
next(); // Continue vers le contrôleur
```

### 4. Accès aux Routes Protégées

Si le token est valide, la requête continue vers le contrôleur. Sinon, une erreur 401 est retournée.

## Flux Complet

```
┌─────────┐                    ┌──────────┐                    ┌─────────┐
│ Client  │                    │  Serveur │                    │   DB    │
└────┬────┘                    └────┬─────┘                    └────┬────┘
     │                              │                               │
     │ 1. POST /api/auth/generate   │                               │
     │    -token                    │                               │
     ├─────────────────────────────>│                               │
     │                              │                               │
     │ 2. Génère token JWT          │                               │
     │    avec JWT_SECRET           │                               │
     │                              │                               │
     │ 3. Retourne token            │                               │
     │<─────────────────────────────┤                               │
     │                              │                               │
     │ 4. GET /api/students         │                               │
     │    Authorization: Bearer     │                               │
     │    <token>                   │                               │
     ├─────────────────────────────>│                               │
     │                              │                               │
     │ 5. Middleware auth.js        │                               │
     │    - Vérifie token           │                               │
     │    - Décode payload          │                               │
     │                              │                               │
     │ 6. Si valide, continue       │                               │
     │                              │ 7. Query MongoDB              │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │ 8. Retourne données           │
     │                              │<──────────────────────────────┤
     │                              │                               │
     │ 9. Retourne JSON             │                               │
     │<─────────────────────────────┤                               │
```

## Sécurité

### Pourquoi JWT_SECRET est important ?

Le `JWT_SECRET` est utilisé pour signer et vérifier les tokens. Si quelqu'un modifie le token, la signature ne correspondra plus et le token sera rejeté.

**⚠️ Important :**
- Ne jamais exposer `JWT_SECRET` publiquement
- Utiliser un secret fort et aléatoire en production
- Ne jamais commiter le fichier `.env` dans Git

### Expiration

Les tokens ont une durée de vie limitée (par défaut 24h). Après expiration :
- Le token ne peut plus être utilisé
- Il faut générer un nouveau token

## Exemples d'Utilisation

### Avec cURL

```bash
# 1. Générer un token
curl -X POST http://localhost:3000/api/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "expiresIn": "24h"}'

# 2. Utiliser le token
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Avec le Frontend

1. Ouvrez `http://localhost:3000`
2. Cliquez sur "🎫 Générer un Token"
3. Le token est automatiquement enregistré
4. Toutes les requêtes utilisent automatiquement ce token

## Dépannage

### Erreur : "Token JWT manquant"
- Vérifiez que vous envoyez l'en-tête `Authorization: Bearer <token>`
- Vérifiez que le token n'est pas vide

### Erreur : "Token JWT invalide"
- Le token a été modifié ou corrompu
- Le `JWT_SECRET` ne correspond pas
- Générer un nouveau token

### Erreur : "Token JWT expiré"
- Le token a dépassé sa date d'expiration
- Générer un nouveau token

### Erreur : "JWT_SECRET n'est pas configuré"
- Vérifiez que le fichier `.env` existe
- Vérifiez que `JWT_SECRET` est défini dans `.env`
- Redémarrez le serveur après modification de `.env`

