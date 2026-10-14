const Student = require('../models/Student');

const roleOf = (req) => (req.user && req.user.role) || '';
const emailOf = (req) => String((req.user && (req.user.sub || req.user.email)) || '').toLowerCase();

const forbid = (res) => res.status(403).json({ success: false, message: 'Forbidden' });

// @desc    Obtenir tous les étudiants
// @route   GET /api/students
// @access  Private (JWT requis)
const getAllStudents = async (req, res, next) => {
  try {
    const role = roleOf(req);
    if (!['ADMIN', 'ENSEIGNANT', 'ETUDIANT'].includes(role)) {
      return forbid(res);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = role === 'ETUDIANT' ? { email: emailOf(req) } : {};
    const students = await Student.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un étudiant par ID
// @route   GET /api/students/:id
// @access  Private (JWT requis)
const getStudentById = async (req, res, next) => {
  try {
    const role = roleOf(req);
    if (!['ADMIN', 'ENSEIGNANT', 'ETUDIANT'].includes(role)) {
      return forbid(res);
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Étudiant non trouvé avec l'ID ${req.params.id}`,
      });
    }

    if (role === 'ETUDIANT' && student.email !== emailOf(req)) {
      return forbid(res);
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouvel étudiant
// @route   POST /api/students
// @access  Private (JWT requis)
const createStudent = async (req, res, next) => {
  try {
    if (roleOf(req) !== 'ADMIN') {
      return forbid(res);
    }
    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier un étudiant
// @route   PUT /api/students/:id
// @access  Private (JWT requis)
const updateStudent = async (req, res, next) => {
  try {
    if (roleOf(req) !== 'ADMIN') {
      return forbid(res);
    }
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Étudiant non trouvé avec l'ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Étudiant modifié avec succès',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un étudiant
// @route   DELETE /api/students/:id
// @access  Private (JWT requis)
const deleteStudent = async (req, res, next) => {
  try {
    if (roleOf(req) !== 'ADMIN') {
      return forbid(res);
    }
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Étudiant non trouvé avec l'ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Étudiant supprimé avec succès',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};

