package com.soa.apigateway.controller;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;
import static org.springframework.web.reactive.function.server.ServerResponse.ok;

/**
 * Gateway Router - Provides information endpoints for the API Gateway
 */
@Configuration
public class GatewayController {

    @Bean
    public RouterFunction<ServerResponse> gatewayRoutes() {
        return route(GET("/"), request -> {
            String json = """
                {
                  "name": "SOA Project API Gateway",
                  "version": "1.0.0",
                  "status": "running",
                  "port": 8088,
                  "routes": {
                    "auth": {
                      "path": "/auth/**",
                      "target": "http://localhost:8081",
                      "authentication": "Public for /auth/login and /auth/register only",
                      "type": "REST"
                    },
                    "students": {
                      "path": "/students/**",
                      "target": "http://localhost:3000",
                      "authentication": "JWT Required",
                      "type": "REST"
                    },
                    "grades": {
                      "path": "/grades/**",
                      "target": "http://localhost:8000",
                      "authentication": "JWT Required",
                      "type": "REST"
                    },
                    "courses": {
                      "path": "/courses/**",
                      "target": "http://localhost:8082",
                      "authentication": "JWT Required",
                      "type": "SOAP",
                      "wsdl": "http://localhost:8088/courses?wsdl",
                      "rest": "/rest/courses and /rest/timetable"
                    },
                    "billing": {
                      "path": "/billing/**",
                      "target": "http://localhost:5064",
                      "authentication": "JWT Required",
                      "type": "SOAP",
                      "wsdl": "http://localhost:8088/billing?wsdl",
                      "rest": "/rest/billing"
                    },
                    "overview": {
                      "path": "/students/{id}/overview",
                      "authentication": "JWT Required",
                      "type": "REST"
                    }
                  },
                  "documentation": {
                    "description": "API Gateway for SOA Project - Single entry point for all microservices",
                    "usage": "Access services through /auth, /students, /grades, /courses, or /billing"
                  }
                }
                """;
            return ok().contentType(MediaType.APPLICATION_JSON).bodyValue(json);
        })
        .andRoute(GET("/health"), request -> {
            String json = """
                {
                  "status": "UP",
                  "service": "API Gateway"
                }
                """;
            return ok().contentType(MediaType.APPLICATION_JSON).bodyValue(json);
        });
    }
}

