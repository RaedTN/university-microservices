package com.soa.apigateway;

import com.sun.net.httpserver.HttpServer;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class GatewayAccessTests {

    private static final String SECRET = "test-secret-test-secret-test-secret-32";

    static {
        System.setProperty("JWT_SECRET", SECRET);
        startStudents();
    }

    private static void startStudents() {
        try {
            bindStudents();
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private static void bindStudents() throws Exception {
        HttpServer students = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        students.createContext("/", exchange -> {
            byte[] body = "{\"error\":\"Forbidden\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(403, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        students.start();
        System.setProperty("STUDENT_SERVICE_URL", "http://127.0.0.1:" + students.getAddress().getPort());
    }

    @Autowired
    private WebTestClient client;

    @Test
    void protectedRouteRejectsAMissingToken() {
        client.get().uri("/students")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void studentRequestForAnotherStudentIsForbidden() {
        String token = Jwts.builder()
                .setSubject("student@university.local")
                .claim("role", "ETUDIANT")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        client.get().uri("/students/other-student/overview")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isForbidden();
    }
}
