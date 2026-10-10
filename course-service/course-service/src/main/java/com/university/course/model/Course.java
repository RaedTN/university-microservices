package com.university.course.model;

import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import java.io.Serializable;

/**
 * Modèle représentant un cours
 */
@XmlRootElement(name = "course")
@XmlAccessorType(XmlAccessType.FIELD)
public class Course implements Serializable {
    
    private Long id;
    private String code;           // Ex: "INF101"
    private String name;            // Ex: "Programmation Java"
    private String description;
    private int credits;            // Nombre de crédits
    private String professor;       // Nom du professeur
    private String semester;        // Ex: "Automne 2024"
    private int maxStudents;        // Capacité maximale
    private int enrolledStudents;   // Nombre d'étudiants inscrits
    private String room;            // Salle de cours
    private String schedule;        // Horaire (ex: "Lundi 10h-12h")

    // Constructeur par défaut (obligatoire pour JAX-WS)
    public Course() {
    }

    // Constructeur complet
    public Course(Long id, String code, String name, String description, 
                  int credits, String professor, String semester, 
                  int maxStudents, int enrolledStudents, String room, String schedule) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.credits = credits;
        this.professor = professor;
        this.semester = semester;
        this.maxStudents = maxStudents;
        this.enrolledStudents = enrolledStudents;
        this.room = room;
        this.schedule = schedule;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public String getProfessor() {
        return professor;
    }

    public void setProfessor(String professor) {
        this.professor = professor;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public int getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(int maxStudents) {
        this.maxStudents = maxStudents;
    }

    public int getEnrolledStudents() {
        return enrolledStudents;
    }

    public void setEnrolledStudents(int enrolledStudents) {
        this.enrolledStudents = enrolledStudents;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", credits=" + credits +
                ", professor='" + professor + '\'' +
                ", semester='" + semester + '\'' +
                ", room='" + room + '\'' +
                ", schedule='" + schedule + '\'' +
                '}';
    }
}
