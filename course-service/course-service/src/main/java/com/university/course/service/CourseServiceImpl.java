package com.university.course.service;

import java.util.List;

import javax.jws.WebService;

import com.university.course.model.Course;
import com.university.course.model.TimetableSlot;
import com.university.course.repository.CourseRepository;
import com.university.course.repository.TimetableRepository;
import com.university.course.security.RequestUser;

/**
 * Implementation du service SOAP pour la gestion des cours
 */
@WebService(endpointInterface = "com.university.course.service.CourseService")
public class CourseServiceImpl implements CourseService {

    private final CourseRepository repository;
    private TimetableRepository timetableRepository;

    public CourseServiceImpl() {
        this.repository = new CourseRepository();
    }

    private TimetableRepository timetable() {
        if (timetableRepository == null) {
            timetableRepository = new TimetableRepository();
        }
        return timetableRepository;
    }

    @Override
    public Course addCourse(String code, String name, String description, 
                           int credits, String professor, String semester, 
                           int maxStudents, String room, String schedule) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        System.out.println("[ADD] Ajout d'un nouveau cours: " + code);
        
        try {
            // Verifier si le code existe deja
            Course existing = repository.findByCode(code);
            if (existing != null) {
                throw new RuntimeException("Un cours avec le code " + code + " existe deja");
            }
            
            // Verifier si la salle est disponible
            if (!repository.isRoomAvailable(room, schedule)) {
                throw new RuntimeException("La salle " + room + " n'est pas disponible pour cet horaire");
            }
            
            // Creer le nouveau cours
            Course course = new Course();
            course.setCode(code);
            course.setName(name);
            course.setDescription(description);
            course.setCredits(credits);
            course.setProfessor(professor);
            course.setSemester(semester);
            course.setMaxStudents(maxStudents);
            course.setEnrolledStudents(0);
            course.setRoom(room);
            course.setSchedule(schedule);
            
            Course created = repository.create(course);
            System.out.println("[SUCCESS] Cours cree avec succes - ID: " + created.getId());
            
            return created;
        } catch (Exception e) {
            System.err.println("[ERROR] Erreur dans addCourse: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'ajout du cours: " + e.getMessage(), e);
        }
    }

    @Override
    public Course updateCourse(Long id, String code, String name, String description, 
                              int credits, String professor, String semester, 
                              int maxStudents, String room, String schedule) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        System.out.println("[UPDATE] Mise a jour du cours ID: " + id);
        
        // Verifier que le cours existe
        Course existing = repository.findById(id);
        if (existing == null) {
            throw new RuntimeException("Cours non trouve avec l'ID: " + id);
        }
        
        // Mettre a jour les informations
        existing.setCode(code);
        existing.setName(name);
        existing.setDescription(description);
        existing.setCredits(credits);
        existing.setProfessor(professor);
        existing.setSemester(semester);
        existing.setMaxStudents(maxStudents);
        existing.setRoom(room);
        existing.setSchedule(schedule);
        
        Course updated = repository.update(existing);
        System.out.println("[SUCCESS] Cours mis a jour avec succes");
        
        return updated;
    }

    @Override
    public boolean deleteCourse(Long id) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        System.out.println("[DELETE] Suppression du cours ID: " + id);
        
        boolean deleted = repository.delete(id);
        if (deleted) {
            System.out.println("[SUCCESS] Cours supprime avec succes");
        } else {
            System.out.println("[ERROR] Cours non trouve");
        }
        
        return deleted;
    }

    @Override
    public Course getCourseById(Long id) {
        RequestUser.require();
        System.out.println("[SEARCH] Recherche du cours ID: " + id);
        
        Course course = repository.findById(id);
        if (course == null) {
            throw new RuntimeException("Cours non trouve avec l'ID: " + id);
        }
        
        return course;
    }

    @Override
    public Course getCourseByCode(String code) {
        RequestUser.require();
        System.out.println("[SEARCH] Recherche du cours avec le code: " + code);
        
        Course course = repository.findByCode(code);
        if (course == null) {
            throw new RuntimeException("Cours non trouve avec le code: " + code);
        }
        
        return course;
    }

    @Override
    public Course[] getAllCourses() {
        RequestUser.require();
        System.out.println("[LIST] Recuperation de tous les cours");
        
        List<Course> courses = repository.findAll();
        System.out.println("[SUCCESS] " + courses.size() + " cours trouves");
        
        return courses.toArray(new Course[0]);
    }

    @Override
    public Course[] getCoursesBySemester(String semester) {
        RequestUser.require();
        System.out.println("[LIST] Recuperation des cours du semestre: " + semester);
        
        List<Course> courses = repository.findBySemester(semester);
        System.out.println("[SUCCESS] " + courses.size() + " cours trouves");
        
        return courses.toArray(new Course[0]);
    }

    @Override
    public Course[] getCoursesByProfessor(String professor) {
        RequestUser.require();
        System.out.println("[LIST] Recuperation des cours du professeur: " + professor);
        
        List<Course> courses = repository.findByProfessor(professor);
        System.out.println("[SUCCESS] " + courses.size() + " cours trouves");
        
        return courses.toArray(new Course[0]);
    }

    @Override
    public boolean isRoomAvailable(String room, String schedule) {
        RequestUser.require();
        System.out.println("[CHECK] Verification de disponibilite - Salle: " + room + ", Horaire: " + schedule);
        
        boolean available = repository.isRoomAvailable(room, schedule);
        
        if (available) {
            System.out.println("[SUCCESS] Salle disponible");
        } else {
            System.out.println("[ERROR] Salle occupee");
        }
        
        return available;
    }

    @Override
    public TimetableSlot addTimetableSlot(Long courseId, String day, String startTime, String endTime, String room) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        if (repository.findById(courseId) == null) {
            throw new RuntimeException("Cours non trouve avec l'ID: " + courseId);
        }
        TimetableSlot slot = new TimetableSlot();
        slot.setCourseId(courseId);
        slot.setDay(day);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setRoom(room);
        return timetable().create(slot);
    }

    @Override
    public TimetableSlot updateTimetableSlot(Long id, Long courseId, String day, String startTime, String endTime, String room) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        if (timetable().findById(id) == null) {
            throw new RuntimeException("Créneau non trouvé avec l'ID: " + id);
        }
        if (repository.findById(courseId) == null) {
            throw new RuntimeException("Cours non trouve avec l'ID: " + courseId);
        }
        TimetableSlot slot = new TimetableSlot();
        slot.setId(id);
        slot.setCourseId(courseId);
        slot.setDay(day);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setRoom(room);
        return timetable().update(slot);
    }

    @Override
    public boolean deleteTimetableSlot(Long id) {
        RequestUser.require("ADMIN", "ENSEIGNANT");
        return timetable().delete(id);
    }

    @Override
    public TimetableSlot[] getAllTimetableSlots() {
        RequestUser.require();
        List<TimetableSlot> slots = timetable().findAll();
        return slots.toArray(new TimetableSlot[0]);
    }

    @Override
    public TimetableSlot[] getTimetableByCourse(Long courseId) {
        RequestUser.require();
        List<TimetableSlot> slots = timetable().findByCourse(courseId);
        return slots.toArray(new TimetableSlot[0]);
    }
}
