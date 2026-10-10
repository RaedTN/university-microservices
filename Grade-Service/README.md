# Grade Service

FastAPI microservice to manage student grades and compute averages. Designed for SOA integration behind an API Gateway.

## Features
- Async FastAPI endpoints for CRUD grade operations.
- JWT middleware (HS256) validating `Authorization: Bearer <token>`.
- SQLite persistence via async SQLAlchemy.
- Docker-ready deployment.

## Project Structure
```
.
├── main.py
├── database/
├── models/
├── routes/
├── schemas/
├── security/
├── requirements.txt
└── Dockerfile
```

## Configuration
- `DATABASE_URL` (optional): SQLite URL. Default `sqlite+aiosqlite:///./grades.db`.
- `JWT_SECRET` (required): Secret key for verifying tokens. The service exits if this variable is not set.
- `JWT_ALGORITHM` (optional): JWT algorithm, default `HS256`.

## Setup (local)
```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

## Run
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Docs available at `http://localhost:8000/docs` (public, bypasses JWT for convenience).

## JWT
Generate a token for testing (example with Python REPL):
```python
import jwt, datetime
token = jwt.encode(
    {"sub": "test-user", "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
    "<your-jwt-secret>",
    algorithm="HS256",
)
print(token)
```

Send requests with:
```
Authorization: Bearer <token>
```

## API
- `POST /grades` – create grade `{student_id, course_id, grade}`
- `PUT /grades/{grade_id}` – update grade value
- `DELETE /grades/{grade_id}` – delete grade
- `GET /grades/student/{student_id}` – list grades + average

### Sample response
```json
{
  "student_id": 12,
  "notes": [
    {"id": 1, "student_id": 12, "course_id": 1, "grade": 14},
    {"id": 2, "student_id": 12, "course_id": 2, "grade": 16}
  ],
  "moyenne": 15
}
```

## Docker
```bash
docker build -t grade-service .
docker run -p 8000:8000 -e JWT_SECRET=change-me grade-service
```

## Notes
- Tables are auto-created at startup for simplicity.
- Grades constrained to 0–20 scale; adjust as needed.

