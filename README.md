# SOA Project - Manual d'Utilisation

## Guide Complet pour Exécuter Tous les Services (Local, Sans Docker)

Ce document décrit comment démarrer tous les microservices et l'API Gateway de manière locale, avec leurs ports respectifs.

---

## 📋 1. Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Java 17+** (pour Auth Service, Course Service, API Gateway)
- **Node.js 18+ et npm** (pour Student Service)
- **Python 3.11+** (pour Grade Service)
- **.NET 8 SDK** (pour Billing Service)
- **MySQL** en cours d'exécution sur votre machine :
  - Host: `localhost`
  - Port: `3306`
  - User: `root`
  - Password: the `MYSQL_PASSWORD` environment variable (same value in every terminal that starts a MySQL service)
- **MongoDB** installé comme service Windows

### Démarrer le Service MongoDB

Ouvrez **PowerShell en tant qu'Administrateur** :

```powershell
Start-Service -Name "MongoDB"
```

---

## 🔐 2. Auth Service (Spring Boot)

- **Dossier** : `auth-service`
- **Port** : `8081`
- **Rôle** : Enregistrement et authentification des utilisateurs (JWT)

### Commandes (PowerShell) :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\auth-service
.\mvnw.cmd spring-boot:run
```

Le service sera disponible à `http://localhost:8081`.

---

## 👥 3. Student Service (Node.js + Express)

- **Dossier** : `Service-Etudiant1`
- **Port** : `3000`
- **Base de données** : MongoDB (`mongodb://localhost:27017/student_db`)
- **Chemin API de base** : `/api/students`

### Première fois uniquement (pour installer les dépendances) :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\Service-Etudiant1
npm install
```

### Exécuter le service :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\Service-Etudiant1
npm start
```

Vous devriez voir quelque chose comme :

```text
Serveur démarré sur le port 3000
MongoDB connecté: localhost
```

Les endpoints du service sont accessibles sous `http://localhost:3000/api/...`.

---

## 📊 4. Grade Service (FastAPI + Python)

- **Dossier** : `Grade-Service`
- **Port** : `8000`
- **Base de données** : SQLite (fichier `grades.db`)
- **JWT Secret** : la variable d'environnement `JWT_SECRET`, la même valeur que l'API Gateway, Auth Service et Student Service

### Créer/activer l'environnement virtuel et installer les dépendances (première fois) :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\Grade-Service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Exécuter avec le bon secret JWT :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\Grade-Service
.\.venv\Scripts\Activate.ps1
$env:JWT_SECRET = "<la même valeur que dans les autres services>"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Documentation Swagger disponible à `http://localhost:8000/docs`.

---

## 📚 5. Course Service (Java SOAP)

- **Dossier** : `course-service\course-service`
- **Port** : `8082`
- **Base de données** : MySQL `university_db` sur `localhost:3306`

### Compiler et exécuter :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\course-service\course-service
.\mvnw.cmd clean package
java -jar target/course-service-1.0-SNAPSHOT.jar
```

Service SOAP disponible à `http://localhost:8082/course-service`  
WSDL disponible à `http://localhost:8082/course-service?wsdl`.

---

## 💰 6. Billing Service (.NET SOAP)

- **Dossier** : `billing-service`
- **Port** : `5064`

### Exécuter :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\billing-service
dotnet run
```

Service disponible à `http://localhost:5064/BillingService.svc`  
WSDL disponible à `http://localhost:5064/BillingService.svc?wsdl`.

---

## 🌐 7. API Gateway (Spring Cloud Gateway)

- **Dossier** : `api-gateway`
- **Port** : `8088`
- **JWT Secret** : la variable d'environnement `JWT_SECRET`, la même valeur que Auth, Grade et Student Service

### Exécuter :

```powershell
cd C:\Users\Raed\Desktop\projet-soa\api-gateway
.\mvnw.cmd spring-boot:run
```

Vérification de santé disponible à `http://localhost:8088/health`  
Informations sur la passerelle disponibles à `http://localhost:8088/`.

---

## 🔌 8. Résumé des Ports

| Service | Port |
|---------|------|
| **API Gateway** | `8088` |
| **Auth Service** | `8081` |
| **Student Service** | `3000` |
| **Grade Service** | `8000` |
| **Course Service** | `8082` |
| **Billing Service** | `5064` |
| **MySQL** | `3306` |
| **MongoDB** | `27017` |

---

## 🚀 9. Accéder aux Services via l'API Gateway

Une fois tous les services démarrés, vous pouvez accéder aux services via l'API Gateway :

### Auth (Public)
- `POST http://localhost:8088/auth/register`
- `POST http://localhost:8088/auth/login`

### Students (JWT requis)
- `GET  http://localhost:8088/students`
- `GET  http://localhost:8088/students/{id}`
- `POST http://localhost:8088/students`

### Grades (JWT requis)
- `GET  http://localhost:8088/grades/student/{studentId}`
- `POST http://localhost:8088/grades`

### Courses (SOAP)
- `GET  http://localhost:8088/courses?wsdl`

### Billing (SOAP)
- `GET  http://localhost:8088/billing?wsdl`

---

## 📝 Notes Importantes

1. **Ordre de démarrage recommandé** :
   1. MySQL (déjà en cours d'exécution)
   2. MongoDB (démarrer le service)
   3. Auth Service
   4. Student Service
   5. Grade Service
   6. Course Service
   7. Billing Service
   8. API Gateway (en dernier)

2. **JWT Secret** : la même variable `JWT_SECRET` pour Auth Service, API Gateway, Grade Service et Student Service. Le mot de passe MySQL est `MYSQL_PASSWORD`. Voir `.env.example` à la racine et `RUN.md`.

3. **Base de données** :
   - MySQL doit être démarré avant Course Service et Auth Service
   - MongoDB doit être démarré avant Student Service

4. **Environnement virtuel Python** : N'oubliez pas d'activer l'environnement virtuel avant d'exécuter le Grade Service.

---

## 🐛 Dépannage

### Erreur : "MongoDB connection refused"
- Vérifiez que le service MongoDB est démarré : `Get-Service -Name "MongoDB"`

### Erreur : "MySQL connection refused"
- Vérifiez que MySQL est en cours d'exécution sur `localhost:3306`

### Erreur : "401 Unauthorized" ou "Invalid token"
- Vérifiez que le `JWT_SECRET` est identique dans tous les services
- Assurez-vous d'utiliser un token JWT valide obtenu via `/auth/login`

### Erreur : "404 Not Found" depuis l'API Gateway
- Vérifiez que le service backend correspondant est démarré
- Vérifiez les routes dans `api-gateway/src/main/resources/application.yaml`

---

## 📧 Support

Pour toute question ou problème, consultez les logs de chaque service pour plus de détails.

