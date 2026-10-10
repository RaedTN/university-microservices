package com.university.course.service;

import com.university.course.model.Course;
import javax.jws.WebMethod;
import javax.jws.WebParam;
import javax.jws.WebService;
import javax.jws.soap.SOAPBinding;
import javax.jws.soap.SOAPBinding.Style;

/**
 * Interface du service SOAP pour la gestion des cours
 */
@WebService
@SOAPBinding(style = Style.RPC)
public interface CourseService {

    /**
     * Ajouter un nouveau cours
     */
    @WebMethod
    Course addCourse(
        @WebParam(name = "code") String code,
        @WebParam(name = "name") String name,
        @WebParam(name = "description") String description,
        @WebParam(name = "credits") int credits,
        @WebParam(name = "professor") String professor,
        @WebParam(name = "semester") String semester,
        @WebParam(name = "maxStudents") int maxStudents,
        @WebParam(name = "room") String room,
        @WebParam(name = "schedule") String schedule
    );

    /**
     * Modifier un cours existant
     */
    @WebMethod
    Course updateCourse(
        @WebParam(name = "id") Long id,
        @WebParam(name = "code") String code,
        @WebParam(name = "name") String name,
        @WebParam(name = "description") String description,
        @WebParam(name = "credits") int credits,
        @WebParam(name = "professor") String professor,
        @WebParam(name = "semester") String semester,
        @WebParam(name = "maxStudents") int maxStudents,
        @WebParam(name = "room") String room,
        @WebParam(name = "schedule") String schedule
    );

    /**
     * Supprimer un cours par ID
     */
    @WebMethod
    boolean deleteCourse(@WebParam(name = "id") Long id);

    /**
     * Obtenir un cours par ID
     */
    @WebMethod
    Course getCourseById(@WebParam(name = "id") Long id);

    /**
     * Obtenir un cours par code
     */
    @WebMethod
    Course getCourseByCode(@WebParam(name = "code") String code);

    /**
     * Lister tous les cours
     */
    @WebMethod
    Course[] getAllCourses();

    /**
     * Lister les cours par semestre
     */
    @WebMethod
    Course[] getCoursesBySemester(@WebParam(name = "semester") String semester);

    /**
     * Lister les cours d'un professeur
     */
    @WebMethod
    Course[] getCoursesByProfessor(@WebParam(name = "professor") String professor);

    /**
     * Verifier la disponibilite d'une salle
     */
    @WebMethod
    boolean isRoomAvailable(
        @WebParam(name = "room") String room,
        @WebParam(name = "schedule") String schedule
    );
}

