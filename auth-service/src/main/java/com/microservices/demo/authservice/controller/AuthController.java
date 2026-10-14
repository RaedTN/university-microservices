package com.microservices.demo.authservice.controller;

import com.microservices.demo.authservice.model.User;
import com.microservices.demo.authservice.repository.UserRepository;
import com.microservices.demo.authservice.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Set<String> ROLES = Set.of("ADMIN", "ENSEIGNANT", "ETUDIANT");

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String role = request.get("role");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }
        if (role == null || role.isBlank()) {
            role = "ETUDIANT";
        }
        if (!"ETUDIANT".equals(role)) {
            return ResponseEntity.badRequest().body("Public registration only creates ETUDIANT accounts");
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            return ResponseEntity.badRequest().body("User already exists");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();

        userRepository.save(user);

        String token = jwtService.generate(email, role);
        return ResponseEntity.ok(Map.of("token", token, "role", role));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @RequestBody Map<String, String> request) {
        Claims claims = jwtService.parseAuthorization(authorization);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        if (!"ADMIN".equals(String.valueOf(claims.get("role")))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }

        String email = request.get("email");
        String password = request.get("password");
        String role = request.get("role");
        if (email == null || password == null || role == null) {
            return ResponseEntity.badRequest().body("Email, password, and role are required");
        }
        if (!ROLES.contains(role)) {
            return ResponseEntity.badRequest().body("Role must be ADMIN, ENSEIGNANT, or ETUDIANT");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("User already exists");
        }

        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build());
        return ResponseEntity.ok(Map.of("email", email, "role", role));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty() || !passwordEncoder.matches(password, user.get().getPassword())) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }

        String token = jwtService.generate(email, user.get().getRole());
        return ResponseEntity.ok(Map.of("token", token, "role", user.get().getRole()));
    }
}
