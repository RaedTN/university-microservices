package com.microservices.demo.authservice.security;

import com.microservices.demo.authservice.model.User;
import com.microservices.demo.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements ApplicationRunner {

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            return;
        }
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }
        userRepository.save(User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role("ADMIN")
                .build());
    }
}
