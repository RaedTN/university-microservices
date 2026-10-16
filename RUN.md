# Run the SOA project locally (Windows)

Each service runs in its own PowerShell window. Spring Boot, the course JAR, and uvicorn do not read `.env` files. Set the variables in those windows. The student service does read `Service-Etudiant1\.env`.

Use one shared `JWT_SECRET` everywhere. Copy the placeholders from the root `.env.example`, put the same `JWT_SECRET` and `MONGODB_URI` in `Service-Etudiant1\.env`, and export `JWT_SECRET` and `MYSQL_PASSWORD` in every other window.

```powershell
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
$env:MYSQL_PASSWORD = "change-me"
$env:MYSQL_USER = "root"
```

`MYSQL_USER` is optional. Auth uses MySQL user `root`. The course service uses `MYSQL_USER` when it is set, and `root` otherwise.

## 1. Databases

MySQL must already be running on `localhost:3306`.

`authdb` is created by auth-service on startup (`createDatabaseIfNotExist=true`).

`university_db` and the `courses` table come from `init-db.sql`. From the repo root:

```powershell
cd <repository-root>
mysql -u root -p --execute="source init-db.sql"
```

Enter the same password as `MYSQL_PASSWORD` when prompted.

MongoDB, in an Administrator PowerShell:

```powershell
Start-Service -Name "MongoDB"
Get-Service -Name "MongoDB"
```

The student service expects `mongodb://localhost:27017/students`.

## 2. Auth service (port 8081)

```powershell
cd auth-service
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
$env:MYSQL_PASSWORD = "change-me"
$env:ADMIN_EMAIL = "admin@university.local"
$env:ADMIN_PASSWORD = "change-me"
.\mvnw.cmd spring-boot:run
```

Wait until the log says the app is listening on 8081. On startup, if `ADMIN_EMAIL` is not already in `authdb`, the service creates that account with role `ADMIN`. Check: `http://localhost:8081/api/auth/login` (a POST without a body returns 400, which means the process is up).

## 3. Student service (port 3000)

`Service-Etudiant1\.env` must contain the same `JWT_SECRET` and:

```text
PORT=3000
MONGODB_URI=mongodb://localhost:27017/students
```

```powershell
cd Service-Etudiant1
npm install
npm start
```

Wait for `Serveur démarré sur le port 3000` and `MongoDB connecté`.

## 4. Grade service (port 8000)

Dependencies are already listed in `requirements.txt` (`PyJWT`, `aiosqlite`). The virtualenv is `.venv`.

```powershell
cd Grade-Service
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000
```

Swagger (no JWT): `http://localhost:8000/docs`.

## 5. Course service (port 8082)

```powershell
cd course-service\course-service
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
$env:MYSQL_PASSWORD = "change-me"
.\mvnw.cmd clean package
java -jar target\course-service-1.0-SNAPSHOT.jar
```

WSDL: `http://localhost:8082/course-service?wsdl`.

The process starts without MySQL. The first SOAP call fails if `university_db` was not created in step 1, or if `MYSQL_PASSWORD` is missing.

## 6. Billing service (port 5064)

`dotnet run` uses `Properties\launchSettings.json`, profile `http`, which binds `http://localhost:5064`.

```powershell
cd billing-service
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
dotnet run
```

WSDL: `http://localhost:5064/BillingService.svc?wsdl`.

## 7. API gateway (port 8088)

Start this last.

```powershell
cd api-gateway
$env:JWT_SECRET = "change-me-to-a-long-shared-secret"
.\mvnw.cmd spring-boot:run
```

`GET http://localhost:8088/health` is public and should return `{"status":"UP","service":"API Gateway"}`.

## 8. Postman

1. Import `SOA-Project-Postman-Collection.json`.
2. Import `SOA-Project-Postman-Environment.json`.
3. Select the environment **SOA Project Environment** (the register and login scripts save `jwt_token` there).
4. Run the requests in this order:
   - **1. Health Check** — `GET http://localhost:8088/health` — expect 200.
   - **2. API Gateway Info** — `GET http://localhost:8088/` — expect 200 and `"port": 8088`.
   - **Auth Service / Register User** — `POST http://localhost:8088/auth/register` with the body in the collection. Expect 200 and a `token`. The test script stores it in `jwt_token`. Run this once. A second register of the same email returns 400 `User already exists` because auth now uses `ddl-auto=update`.
   - **Auth Service / Login** — same user. Use this after a restart. It also saves `jwt_token`.
   - **Student Service / Create Student** — `POST http://localhost:8088/students` with the bearer token. Expect 201.
   - **Student Service / Get All Students** — `GET http://localhost:8088/students`. Expect 200.
   - **Student Service / Get Student by ID** — replace `:id` with the `id` from the create response.
   - **Grade Service / Create Grade** — `POST http://localhost:8088/grades`. Expect 201.
   - **Grade Service / Get Grades for Student** — `GET http://localhost:8088/grades/student/1`. Expect 200.
   - **Course Service (SOAP) / Get WSDL** — `GET http://localhost:8088/courses?wsdl`. Expect XML.
   - **Billing Service (SOAP) / Get WSDL** — `GET http://localhost:8088/billing?wsdl`. Expect XML.

Protected student and grade calls without the environment selected return 401, because `{{jwt_token}}` is empty.

## Run with Docker

Copy the root `.env.example` to `.env` and set `JWT_SECRET`, `MYSQL_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Compose reads that file. `.env` stays out of git. The admin password must match the Postman login (`change-me` in the collection, unless you change both).

Stop anything already listening on ports 8088 and 5173, including a local `npm run dev`, then from the repo root:

```powershell
cd <repository-root>
docker compose up --build
```

Open http://localhost:5173 and sign in. nginx serves the built app and is the only origin the browser talks to. It forwards `/auth`, `/students`, `/grades`, `/rest`, `/health`, `/courses`, and `/billing` to the gateway container. When the browser is loading one of those addresses as a page, nginx returns `index.html` so React Router can take over.

`GET http://localhost:8088/health` still reaches the gateway directly and should return `{"status":"UP","service":"API Gateway"}`. Run the Postman collection against that URL the same way as the local setup.

For frontend work with hot reload, stop the frontend container and, from `frontend`, run `npm install` once and then `npm run dev`. Leave `VITE_API_URL` empty. Vite serves http://localhost:5173 and proxies those same paths to http://localhost:8088. The container and the dev server both use host port 5173, so only one of them can be running.

Only the gateway is published on 8088 and the frontend on 5173. Inside the Compose network the services call each other by name: `auth`, `students`, `grades`, `courses`, `billing`, `gateway`, `mysql`, and `mongo`. MySQL is also on `localhost:3307` and MongoDB on `localhost:27018` so you can inspect them without touching a local MySQL on 3306 or MongoDB on 27017.

Auth waits for MySQL. The student service waits for MongoDB. The course service waits for MySQL. The gateway waits until auth, students, grades, courses, and billing are healthy.
