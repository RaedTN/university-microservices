package com.microservices.demo.authservice;

import com.microservices.demo.authservice.model.User;
import com.microservices.demo.authservice.repository.UserRepository;
import com.microservices.demo.authservice.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=test-secret-test-secret-test-secret-32",
        "jwt.expiration=86400000",
        "spring.datasource.password="
})
@AutoConfigureMockMvc
class AuthLoginTests {

    private static final String EMAIL = "student@university.local";
    private static final String PASSWORD = "change-me";

    static {
        System.setProperty("JWT_SECRET", "test-secret-test-secret-test-secret-32");
        System.setProperty("MYSQL_PASSWORD", "unused");
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void student() {
        users.deleteAll();
        users.save(User.builder()
                .email(EMAIL)
                .password(passwordEncoder.encode(PASSWORD))
                .role("ETUDIANT")
                .build());
    }

    @Test
    void loginSucceedsWithValidCredentials() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ETUDIANT"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void loginFailsWithWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("wrong-password")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generatedJwtCarriesEmailAndRole() throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        String token = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        Claims claims = jwtService.parseAuthorization("Bearer " + token);

        assertEquals(EMAIL, claims.getSubject());
        assertEquals("ETUDIANT", claims.get("role"));
    }

    private static String body(String password) {
        return "{\"email\":\"" + EMAIL + "\",\"password\":\"" + password + "\"}";
    }
}
