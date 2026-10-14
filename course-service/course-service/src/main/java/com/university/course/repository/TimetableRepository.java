package com.university.course.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.university.course.model.TimetableSlot;

public class TimetableRepository {

    public TimetableRepository() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS timetable_slots ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, "
                    + "course_id INT NOT NULL, "
                    + "day VARCHAR(20) NOT NULL, "
                    + "start_time VARCHAR(10) NOT NULL, "
                    + "end_time VARCHAR(10) NOT NULL, "
                    + "room VARCHAR(50) NOT NULL)");
        } catch (SQLException e) {
            throw new RuntimeException("Impossible de préparer la table timetable_slots: " + e.getMessage(), e);
        }
    }

    private Connection getConnection() throws SQLException {
        String host = env("MYSQL_HOST", "localhost");
        String port = env("MYSQL_PORT", "3306");
        String database = env("MYSQL_DATABASE", "university_db");
        String user = env("MYSQL_USER", "root");
        String password = System.getenv("MYSQL_PASSWORD");
        if (password == null || password.isEmpty()) {
            throw new SQLException("MYSQL_PASSWORD environment variable is required");
        }
        String url = "jdbc:mysql://" + host + ":" + port + "/" + database
                + "?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        return DriverManager.getConnection(url, user, password);
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        if (value == null || value.isEmpty()) {
            return fallback;
        }
        return value;
    }

    public TimetableSlot create(TimetableSlot slot) {
        assertNoOverlap(slot, null);
        String sql = "INSERT INTO timetable_slots (course_id, day, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, slot.getCourseId());
            stmt.setString(2, slot.getDay());
            stmt.setString(3, slot.getStartTime());
            stmt.setString(4, slot.getEndTime());
            stmt.setString(5, slot.getRoom());
            stmt.executeUpdate();
            ResultSet keys = stmt.getGeneratedKeys();
            if (keys.next()) {
                slot.setId(keys.getLong(1));
            }
            return slot;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la création du créneau: " + e.getMessage(), e);
        }
    }

    public TimetableSlot update(TimetableSlot slot) {
        assertNoOverlap(slot, slot.getId());
        String sql = "UPDATE timetable_slots SET course_id=?, day=?, start_time=?, end_time=?, room=? WHERE id=?";
        try (Connection conn = getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, slot.getCourseId());
            stmt.setString(2, slot.getDay());
            stmt.setString(3, slot.getStartTime());
            stmt.setString(4, slot.getEndTime());
            stmt.setString(5, slot.getRoom());
            stmt.setLong(6, slot.getId());
            if (stmt.executeUpdate() == 0) {
                throw new RuntimeException("Créneau non trouvé avec l'ID: " + slot.getId());
            }
            return slot;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la mise à jour du créneau: " + e.getMessage(), e);
        }
    }

    public boolean delete(Long id) {
        String sql = "DELETE FROM timetable_slots WHERE id=?";
        try (Connection conn = getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la suppression du créneau: " + e.getMessage(), e);
        }
    }

    public TimetableSlot findById(Long id) {
        String sql = "SELECT * FROM timetable_slots WHERE id=?";
        try (Connection conn = getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return map(rs);
            }
            return null;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche du créneau: " + e.getMessage(), e);
        }
    }

    public List<TimetableSlot> findAll() {
        String sql = "SELECT * FROM timetable_slots ORDER BY day, start_time";
        List<TimetableSlot> slots = new ArrayList<TimetableSlot>();
        try (Connection conn = getConnection();
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                slots.add(map(rs));
            }
            return slots;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la liste des créneaux: " + e.getMessage(), e);
        }
    }

    public List<TimetableSlot> findByCourse(Long courseId) {
        String sql = "SELECT * FROM timetable_slots WHERE course_id=? ORDER BY day, start_time";
        List<TimetableSlot> slots = new ArrayList<TimetableSlot>();
        try (Connection conn = getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                slots.add(map(rs));
            }
            return slots;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la recherche des créneaux: " + e.getMessage(), e);
        }
    }

    private void assertNoOverlap(TimetableSlot slot, Long ignoreId) {
        String sql = "SELECT id, start_time, end_time FROM timetable_slots WHERE room=? AND day=?";
        try (Connection conn = getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, slot.getRoom());
            stmt.setString(2, slot.getDay());
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                long id = rs.getLong("id");
                if (ignoreId != null && ignoreId.longValue() == id) {
                    continue;
                }
                if (overlaps(slot.getStartTime(), slot.getEndTime(), rs.getString("start_time"), rs.getString("end_time"))) {
                    throw new RuntimeException("La salle " + slot.getRoom() + " est déjà occupée sur ce créneau");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la vérification du créneau: " + e.getMessage(), e);
        }
    }

    private static boolean overlaps(String startA, String endA, String startB, String endB) {
        return startA.compareTo(endB) < 0 && startB.compareTo(endA) < 0;
    }

    private TimetableSlot map(ResultSet rs) throws SQLException {
        TimetableSlot slot = new TimetableSlot();
        slot.setId(rs.getLong("id"));
        slot.setCourseId(rs.getLong("course_id"));
        slot.setDay(rs.getString("day"));
        slot.setStartTime(rs.getString("start_time"));
        slot.setEndTime(rs.getString("end_time"));
        slot.setRoom(rs.getString("room"));
        return slot;
    }
}
