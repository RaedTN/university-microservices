process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-32';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/Student');
const Student = require('../src/models/Student');
const app = require('../src/app');

const token = jwt.sign(
  { sub: 'admin@university.local', role: 'ADMIN' },
  process.env.JWT_SECRET,
);

const student = {
  studentNumber: 'STU9001',
  firstName: 'Demo',
  lastName: 'Student',
  email: 'student@university.local',
  dateOfBirth: '2002-04-12',
};

function listQuery() {
  return {
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    sort() {
      return Promise.resolve([student]);
    },
  };
}

describe('students', () => {
  test('lists students', async () => {
    Student.find.mockReturnValue(listQuery());
    Student.countDocuments.mockResolvedValue(1);

    const response = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(1);
    expect(response.body.data).toEqual([student]);
  });

  test('creates a student', async () => {
    Student.create.mockResolvedValue({ _id: '1', ...student });

    const response = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send(student);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(student.email);
    expect(Student.create).toHaveBeenCalledWith(student);
  });
});
