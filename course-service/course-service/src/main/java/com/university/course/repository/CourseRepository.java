package com.university.course.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.university.course.model.Course;

/**
 * Repository pour gérer les opérations CRUD sur les cours
 */
public class CourseRepository {

    private Connection getConnection() throws SQLException {
        // Use environment variables if available, fallback to localhost for local
        // development
        String host = System.getenv("MYSQL_HOST");
        if (host == null || host.isEmpty()) {
            host = "localhost";
        }
        String port = System.getenv("MYSQL_PORT");
        if (port == null || port.isEmpty()) {
            port = "3306";
        }
        String database = System.getenv("MYSQL_DATABASE");
        if (database == null || database.isEmpty()) {
            database = "university_db";
        }
        String user = System.getenv("MYSQL_USER");
        if (user == null || user.isEmpty()) {
            user = "root";
        }
        String password = System.getenv("MYSQL_PASSWORD");
        if (password == null || password.isEmpty()) {
            throw new SQLException("MYSQL_PASSWORD environment variable is required");
        }

        String url = "jdbc:mysql://" + host + ":" + port + "/" + database
                + "?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        return DriverManager.getConnection(url, user, password);
    }

    /**
     * Créer un nouveau cours
     */
    public Course create(Course course) {
        String sql = "INSERT INTO courses (code, name, description, credits, professor, " +
                "semester, max_students, enrolled_students, room, schedule) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, course.getCode());
            stmt.setString(2, course.getName());
            stmt.setString(3, course.getDescription());
            stmt.setInt(4, course.getCredits());
            stmt.setString(5, course.getProfessor());
            stmt.setString(6, course.getSemester());
            stmt.setInt(7, course.getMaxStudents());
            stmt.setInt(8, course.getEnrolledStudents());
            stmt.setString(9, course.getRoom());
            stmt.setString(10, course.getSchedule());

            stmt.executeUpdate();

            ResultSet rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                course.setId(rs.getLong(1));
            }

            return course;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la création du cours: " + e.getMessage());
        }
    }

    /**
     * Mettre à jour un cours
     */
    public Course update(Course course) {
        String sql = "UPDATE courses SET code=?, name=?, description=?, credits=?, " +
                "professor=?, semester=?, max_students=?, enrolled_students=?, " +
                "room=?, schedule=? WHERE id=?";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, course.getCode());
            stmt.setString(2, course.getName());
            stmt.setString(3, course.getDescription());
            stmt.setInt(4, course.getCredits());
            stmt.setString(5, course.getProfessor());
            stmt.setString(6, course.getSemester());
            stmt.setInt(7, course.getMaxStudents());
            stmt.setInt(8, course.getEnrolledStudents());
            stmt.setString(9, course.getRoom());
            stmt.setString(10, course.getSchedule());
            stmt.setLong(11, course.getId());

            int rows = stmt.executeUpdate();
            if (rows == 0) {
                throw new RuntimeException("Cours non trouvé avec l'ID: " + course.getId());
            }

            return course;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la mise à jour: " + e.getMessage());
        }
    }

    /**
     * Supprimer un cours par ID
     */
    public boolean delete(Long id) {
        String sql = "DELETE FROM courses WHERE id=?";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            int rows = stmt.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la suppression: " + e.getMessage());
        }
    }

    /**
     * Trouver un cours par ID
     */
    public Course findById(Long id) {
        String sql = "SELECT * FROM courses WHERE id=?";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapResultSetToCourse(rs);
            }
            return null;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la recherche: " + e.getMessage());
        }
    }

    /**
     * Trouver un cours par code
     */
    public Course findByCode(String code) {
        String sql = "SELECT * FROM courses WHERE code=?";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, code);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapResultSetToCourse(rs);
            }
            return null;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la recherche: " + e.getMessage());
        }
    }

    /**
     * Trouver tous les cours
     */
    public List<Course> findAll() {
        String sql = "SELECT * FROM courses";
        List<Course> courses = new ArrayList<>();

        try (Connection conn = getConnection();
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                courses.add(mapResultSetToCourse(rs));
            }
            return courses;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la récupération: " + e.getMessage());
        }
    }

    /**
     * Trouver les cours par semestre
     */
    public List<Course> findBySemester(String semester) {
        String sql = "SELECT * FROM courses WHERE semester=?";
        List<Course> courses = new ArrayList<>();

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, semester);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                courses.add(mapResultSetToCourse(rs));
            }
            return courses;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la recherche: " + e.getMessage());
        }
    }

    /**
     * Trouver les cours par professeur
     */
    public List<Course> findByProfessor(String professor) {
        String sql = "SELECT * FROM courses WHERE professor=?";
        List<Course> courses = new ArrayList<>();

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, professor);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                courses.add(mapResultSetToCourse(rs));
            }
            return courses;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la recherche: " + e.getMessage());
        }
    }

    /**
     * Vérifier si une salle est disponible
     */
    public boolean isRoomAvailable(String room, String schedule) {
        String sql = "SELECT COUNT(*) FROM courses WHERE room=? AND schedule=?";

        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, room);
            stmt.setString(2, schedule);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return rs.getInt(1) == 0;
            }
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la vérification: " + e.getMessage());
        }
    }

    /**
     * Mapper un ResultSet vers un objet Course
     */
    private Course mapResultSetToCourse(ResultSet rs) throws SQLException {
        Course course = new Course();
        course.setId(rs.getLong("id"));
        course.setCode(rs.getString("code"));
        course.setName(rs.getString("name"));
        course.setDescription(rs.getString("description"));
        course.setCredits(rs.getInt("credits"));
        course.setProfessor(rs.getString("professor"));
        course.setSemester(rs.getString("semester"));
        course.setMaxStudents(rs.getInt("max_students"));
        course.setEnrolledStudents(rs.getInt("enrolled_students"));
        course.setRoom(rs.getString("room"));
        course.setSchedule(rs.getString("schedule"));
        return course;
    }
}
