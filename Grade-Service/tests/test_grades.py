import jwt
import pytest
from fastapi.testclient import TestClient

from main import app
from routes.grades import _average

SECRET = "test-secret-test-secret-test-secret-32"


class Note:
    def __init__(self, grade):
        self.grade = grade


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def staff_headers():
    token = jwt.encode(
        {"sub": "teacher@university.local", "role": "ENSEIGNANT"},
        SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def test_create_grade(client):
    response = client.post(
        "/grades",
        headers=staff_headers(),
        json={
            "student_id": 42,
            "course_id": 7,
            "grade": 14.5,
            "student_email": "student@university.local",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["student_id"] == 42
    assert body["course_id"] == 7
    assert body["grade"] == 14.5
    assert body["student_email"] == "student@university.local"


def test_average(client):
    assert _average([]) is None
    assert _average([Note(10), Note(11), Note(12)]) == 11

    headers = staff_headers()
    for grade in (10, 15):
        created = client.post(
            "/grades",
            headers=headers,
            json={
                "student_id": 7,
                "course_id": 1,
                "grade": grade,
                "student_email": "student@university.local",
            },
        )
        assert created.status_code == 201

    response = client.get("/grades/student/7", headers=headers)

    assert response.status_code == 200
    assert response.json()["moyenne"] == 12.5
