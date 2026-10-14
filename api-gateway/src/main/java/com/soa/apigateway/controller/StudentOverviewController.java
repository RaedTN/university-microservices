package com.soa.apigateway.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class StudentOverviewController {

    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final com.soa.apigateway.soap.SoapClient soapClient;
    private final String studentsUrl;
    private final String gradesUrl;
    private final String billingUrl;

    public StudentOverviewController(com.soa.apigateway.soap.SoapClient soapClient,
                                     @Value("${services.students.url}") String studentsUrl,
                                     @Value("${services.grades.url}") String gradesUrl,
                                     @Value("${services.billing.url}") String billingUrl) {
        this.soapClient = soapClient;
        this.studentsUrl = studentsUrl;
        this.gradesUrl = gradesUrl;
        this.billingUrl = billingUrl;
    }

    @GetMapping("/students/{id}/overview")
    public Mono<ResponseEntity<?>> overview(@PathVariable String id,
                                            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @RequestHeader(value = "X-User-Role", required = false) String role) {
        return getJson(studentsUrl + "/api/students/" + id, authorization)
                .flatMap(studentResponse -> {
                    if (studentResponse.status() == 403) {
                        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Forbidden")));
                    }
                    if (studentResponse.status() == 404) {
                        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found")));
                    }
                    if (studentResponse.status() >= 400) {
                        return Mono.just(ResponseEntity.status(studentResponse.status()).body(studentResponse.body()));
                    }
                    JsonNode data = studentResponse.body().path("data");
                    String email = data.path("email").asText("");
                    String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
                    Mono<JsonNode> grades = getJson(gradesUrl + "/grades/by-email?email=" + encodedEmail, authorization)
                            .map(result -> result.status() >= 400 ? objectMapper.createObjectNode().put("error", "grades unavailable") : result.body());
                    Mono<Object> billing = billingFor(role, email, authorization);
                    return Mono.zip(grades, billing).map(tuple -> {
                        Map<String, Object> payload = new LinkedHashMap<>();
                        payload.put("student", objectMapper.convertValue(data, Map.class));
                        payload.put("grades", objectMapper.convertValue(tuple.getT1(), Map.class));
                        payload.put("billing", tuple.getT2());
                        return ResponseEntity.ok(payload);
                    });
                });
    }

    private Mono<Object> billingFor(String role, String email, String authorization) {
        if (!"ADMIN".equals(role) && !"ETUDIANT".equals(role)) {
            return Mono.just(Map.of());
        }
        String body = "<t:GetBillingStatus><studentId>" + com.soa.apigateway.soap.SoapXml.text(email) + "</studentId></t:GetBillingStatus>";
        return soapClient.call(billingUrl + "/BillingService.svc", "http://billing.university.soa/", body, authorization)
                .map(result -> {
                    if (result.body().contains("Forbidden")) {
                        return Map.of("error", "Forbidden");
                    }
                    var rows = com.soa.apigateway.soap.SoapXml.returns(result.body());
                    return (Object) (rows.isEmpty() ? com.soa.apigateway.soap.SoapXml.fields(result.body()) : rows.get(0));
                })
                .onErrorReturn(Map.of("error", "Billing service unavailable"));
    }

    private Mono<HttpJson> getJson(String url, String authorization) {
        return webClient.get()
                .uri(url)
                .headers(headers -> {
                    if (authorization != null) {
                        headers.set(HttpHeaders.AUTHORIZATION, authorization);
                    }
                })
                .exchangeToMono(response -> response.bodyToMono(String.class)
                        .defaultIfEmpty("{}")
                        .map(body -> {
                            try {
                                return new HttpJson(response.statusCode().value(), objectMapper.readTree(body));
                            } catch (Exception e) {
                                return new HttpJson(response.statusCode().value(), objectMapper.createObjectNode().put("raw", body));
                            }
                        }))
                .onErrorReturn(new HttpJson(502, objectMapper.createObjectNode().put("error", "downstream unavailable")));
    }

    private record HttpJson(int status, JsonNode body) {
    }
}
