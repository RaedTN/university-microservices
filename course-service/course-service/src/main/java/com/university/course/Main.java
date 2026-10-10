package com.university.course;

import com.university.course.service.CourseServiceImpl;
import javax.xml.ws.Endpoint;

/**
 * Classe principale pour demarrer le serveur SOAP
 */
public class Main {

    private static final String URL = "http://0.0.0.0:8082/course-service";

    public static void main(String[] args) {
        System.out.println("=====================================");
        System.out.println("  Course Service SOAP - Demarrage...");
        System.out.println("=====================================");
        System.out.println();

        try {
            // Publier le service SOAP
            System.out.println("[INFO] Initialisation du service...");
            CourseServiceImpl implementor = new CourseServiceImpl();
            
            System.out.println("[INFO] Tentative de publication sur " + URL);
            Endpoint endpoint = Endpoint.publish(URL, implementor);
            
            if (endpoint != null) {
                System.out.println("[SUCCESS] Service SOAP demarré avec succès!");
                System.out.println("[INFO] URL du service : http://localhost:8082/course-service");
                System.out.println("[INFO] WSDL disponible à : http://localhost:8082/course-service?wsdl");
                System.out.println();
                System.out.println("Méthodes disponibles :");
                System.out.println("   - addCourse          : Ajouter un cours");
                System.out.println("   - updateCourse       : Modifier un cours");
                System.out.println("   - deleteCourse       : Supprimer un cours");
                System.out.println("   - getCourseById      : Obtenir un cours par ID");
                System.out.println("   - getCourseByCode    : Obtenir un cours par code");
                System.out.println("   - getAllCourses      : Lister tous les cours");
                System.out.println("   - getCoursesBySemester : Cours par semestre");
                System.out.println("   - getCoursesByProfessor : Cours par professeur");
                System.out.println("   - isRoomAvailable    : Verifier disponibilité salle");
                System.out.println();
                System.out.println("[INFO] Appuyez sur CTRL+C pour arrêter le serveur");
                System.out.println("=====================================");
                
                // Garder le serveur actif
                System.out.println("[INFO] Service actif et en attente de requêtes...");
                Thread.currentThread().join();
            } else {
                System.err.println("[ERROR] Erreur: Endpoint.publish() a retourné null");
            }

        } catch (InterruptedException e) {
            System.out.println("[INFO] Service arrêté par l'utilisateur");
        } catch (Exception e) {
            System.err.println("[ERROR] Erreur lors du démarrage du service:");
            System.err.println("Type: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
