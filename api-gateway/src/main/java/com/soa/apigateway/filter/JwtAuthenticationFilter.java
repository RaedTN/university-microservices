package com.soa.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * JWT Authentication Global Filter for API Gateway
 * Validates JWT tokens before forwarding requests to protected services
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, WebFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // Public routes that don't require authentication
    private static final String[] PUBLIC_ROUTES = {
        "/",
        "/health",
        "/auth/login",
        "/auth/register"
    };

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return filterRequest(exchange, chain::filter);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return filterRequest(exchange, chain::filter);
    }

    private Mono<Void> filterRequest(ServerWebExchange exchange, java.util.function.Function<ServerWebExchange, Mono<Void>> chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Skip authentication for OPTIONS requests (CORS preflight)
        if (request.getMethod() != null && request.getMethod().name().equals("OPTIONS")) {
            return chain.apply(exchange);
        }

        // Skip authentication for public routes
        if (isPublicRoute(path)) {
            return chain.apply(exchange);
        }

        // Check for Authorization header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Invalid Authorization header format. Expected: Bearer <token>", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7).trim(); // Remove "Bearer " prefix

        try {
            // Validate JWT token
            Claims claims = validateToken(token);
            
            // Add user info to request headers for downstream services
            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                    .header("X-User-Email", claims.getSubject() != null ? claims.getSubject() : "")
                    .header("X-User-Role", claims.get("role") != null ? claims.get("role").toString() : "")
                    .build();

            return chain.apply(exchange.mutate().request(modifiedRequest).build());
        } catch (RuntimeException e) {
            return onError(exchange, e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return onError(exchange, "Token validation failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicRoute(String path) {
        // Check if path starts with any public route (with or without trailing slash)
        for (String publicRoute : PUBLIC_ROUTES) {
            if (path.equals(publicRoute) || path.startsWith(publicRoute + "/") || path.startsWith(publicRoute + "?")) {
                return true;
            }
        }
        return false;
    }

    private Claims validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new RuntimeException("Token expired");
        } catch (io.jsonwebtoken.JwtException e) {
            throw new RuntimeException("Invalid token: " + e.getMessage());
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        
        String errorBody = String.format("{\"error\": \"%s\", \"status\": %d}", 
                message.replace("\"", "\\\""), status.value());
        return response.writeWith(
                Mono.just(response.bufferFactory().wrap(errorBody.getBytes(StandardCharsets.UTF_8)))
        );
    }

    @Override
    public int getOrder() {
        return -100; // High priority - execute early in the filter chain
    }
}

