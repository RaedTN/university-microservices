// Configuration
const API_BASE_URL = 'http://localhost:3000/api/students';
let currentPage = 1;
let currentStudentId = null;

// Gestion du token JWT
function getToken() {
    return localStorage.getItem('jwtToken');
}

async function generateToken() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/generate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 'test-user-' + Date.now(),
                email: 'test@example.com',
                role: 'user',
                expiresIn: '24h'
            })
        });

        const result = await response.json();

        if (result.success && result.data.token) {
            const token = result.data.token;
            localStorage.setItem('jwtToken', token);
            document.getElementById('jwtToken').value = token;
            updateTokenStatus(`✅ Token généré avec succès! Expire dans ${result.data.expiresIn}`, 'success');
            loadStudents();
        } else {
            updateTokenStatus('❌ Erreur lors de la génération du token: ' + (result.message || 'Erreur inconnue'), 'error');
        }
    } catch (error) {
        updateTokenStatus('❌ Erreur: ' + error.message, 'error');
        console.error('Erreur génération token:', error);
    }
}

function saveToken() {
    const token = document.getElementById('jwtToken').value.trim();
    if (token) {
        // Supprimer "Bearer " si présent
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        localStorage.setItem('jwtToken', cleanToken);
        updateTokenStatus('Token enregistré avec succès!', 'success');
        loadStudents();
    } else {
        updateTokenStatus('Veuillez entrer un token', 'error');
    }
}

function clearToken() {
    localStorage.removeItem('jwtToken');
    document.getElementById('jwtToken').value = '';
    updateTokenStatus('Token effacé', 'success');
    document.getElementById('studentsList').innerHTML = '';
}

function updateTokenStatus(message, type) {
    const statusDiv = document.getElementById('tokenStatus');
    statusDiv.textContent = message;
    statusDiv.className = `token-status ${type}`;
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'token-status';
    }, 3000);
}

// Charger le token au démarrage
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = getToken();
    if (savedToken) {
        document.getElementById('jwtToken').value = savedToken;
        updateTokenStatus('Token chargé depuis le stockage local', 'success');
        loadStudents();
    }
});

// Fonctions API
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = getToken();
    
    if (!token) {
        showError('Veuillez d\'abord enregistrer un token JWT');
        throw new Error('Token manquant');
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erreur API');
        }

        return result;
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

// Gestion du formulaire
function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        studentNumber: document.getElementById('studentNumber').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        phone: document.getElementById('phone').value || undefined,
        address: document.getElementById('address').value || undefined
    };

    if (currentStudentId) {
        updateStudent(currentStudentId, formData);
    } else {
        createStudent(formData);
    }
}

function resetForm() {
    document.getElementById('studentForm').reset();
    currentStudentId = null;
    document.getElementById('formTitle').textContent = '➕ Ajouter un Étudiant';
    document.getElementById('submitBtn').textContent = 'Ajouter';
    document.getElementById('cancelBtn').style.display = 'none';
}

// CRUD Operations
async function createStudent(data) {
    try {
        await apiCall('', 'POST', data);
        showSuccess('Étudiant créé avec succès!');
        resetForm();
        loadStudents();
    } catch (error) {
        console.error('Erreur création:', error);
    }
}

async function updateStudent(id, data) {
    try {
        await apiCall(`/${id}`, 'PUT', data);
        showSuccess('Étudiant modifié avec succès!');
        resetForm();
        loadStudents();
    } catch (error) {
        console.error('Erreur modification:', error);
    }
}

async function deleteStudent(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet étudiant?')) {
        return;
    }

    try {
        await apiCall(`/${id}`, 'DELETE');
        showSuccess('Étudiant supprimé avec succès!');
        loadStudents();
    } catch (error) {
        console.error('Erreur suppression:', error);
    }
}

async function loadStudents(page = 1) {
    const loadingDiv = document.getElementById('loading');
    const listDiv = document.getElementById('studentsList');
    const errorDiv = document.getElementById('errorMessage');

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    listDiv.innerHTML = '';

    try {
        const result = await apiCall(`?page=${page}&limit=10`);
        currentPage = page;

        if (result.data && result.data.length > 0) {
            displayStudents(result.data);
            displayPagination(result.page, result.pages, result.total);
        } else {
            listDiv.innerHTML = `
                <div class="empty-state">
                    <h3>📭 Aucun étudiant</h3>
                    <p>Commencez par ajouter un étudiant</p>
                </div>
            `;
        }
    } catch (error) {
        listDiv.innerHTML = '';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function displayStudents(students) {
    const listDiv = document.getElementById('studentsList');
    
    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        
        const dateOfBirth = new Date(student.dateOfBirth).toLocaleDateString('fr-FR');
        
        card.innerHTML = `
            <div class="student-header">
                <div class="student-info">
                    <h3>${student.firstName} ${student.lastName}</h3>
                    <div class="student-number">#${student.studentNumber}</div>
                </div>
                <div class="student-actions">
                    <button onclick="editStudent('${student._id}')" class="btn btn-warning btn-sm">✏️ Modifier</button>
                    <button onclick="deleteStudent('${student._id}')" class="btn btn-danger btn-sm">🗑️ Supprimer</button>
                </div>
            </div>
            <div class="student-details">
                <div class="student-detail">
                    <strong>Email:</strong>
                    <span>${student.email}</span>
                </div>
                <div class="student-detail">
                    <strong>Date de naissance:</strong>
                    <span>${dateOfBirth}</span>
                </div>
                ${student.phone ? `
                <div class="student-detail">
                    <strong>Téléphone:</strong>
                    <span>${student.phone}</span>
                </div>
                ` : ''}
                ${student.address ? `
                <div class="student-detail">
                    <strong>Adresse:</strong>
                    <span>${student.address}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        listDiv.appendChild(card);
    });
}

function displayPagination(currentPage, totalPages, total) {
    const paginationDiv = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    paginationDiv.innerHTML = `
        <button onclick="loadStudents(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Précédent
        </button>
        <span class="pagination-info">Page ${currentPage} sur ${totalPages} (${total} étudiants)</span>
        <button onclick="loadStudents(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Suivant →
        </button>
    `;
}

async function editStudent(id) {
    try {
        const result = await apiCall(`/${id}`);
        const student = result.data;

        // Remplir le formulaire
        document.getElementById('studentNumber').value = student.studentNumber;
        document.getElementById('firstName').value = student.firstName;
        document.getElementById('lastName').value = student.lastName;
        document.getElementById('email').value = student.email;
        document.getElementById('dateOfBirth').value = new Date(student.dateOfBirth).toISOString().split('T')[0];
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('address').value = student.address || '';

        // Changer le mode du formulaire
        currentStudentId = id;
        document.getElementById('formTitle').textContent = '✏️ Modifier un Étudiant';
        document.getElementById('submitBtn').textContent = 'Modifier';
        document.getElementById('cancelBtn').style.display = 'inline-block';

        // Scroll vers le formulaire
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Erreur chargement étudiant:', error);
    }
}

// Messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.className = 'success-message';
    errorDiv.textContent = `✅ ${message}`;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.className = 'error-message';
    }, 3000);
}

