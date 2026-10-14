package com.university.course.security;

import java.util.Arrays;

public final class RequestUser {

    private static final ThreadLocal<Principal> CURRENT = new ThreadLocal<Principal>();

    private RequestUser() {
    }

    public static void set(String email, String role) {
        CURRENT.set(new Principal(email, role));
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static Principal require(String... roles) {
        Principal user = CURRENT.get();
        if (user == null || user.role == null) {
            throw new RuntimeException("Unauthorized");
        }
        if (roles != null && roles.length > 0 && !Arrays.asList(roles).contains(user.role)) {
            throw new RuntimeException("Forbidden");
        }
        return user;
    }

    public static final class Principal {
        public final String email;
        public final String role;

        public Principal(String email, String role) {
            this.email = email;
            this.role = role;
        }
    }
}
