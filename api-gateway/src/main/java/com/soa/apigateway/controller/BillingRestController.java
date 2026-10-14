package com.soa.apigateway.controller;

import com.soa.apigateway.soap.SoapClient;
import com.soa.apigateway.soap.SoapXml;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class BillingRestController {

    private static final String URL = "http://localhost:5064/BillingService.svc";
    private static final String NS = "http://billing.university.soa/";

    private final SoapClient soapClient;

    public BillingRestController(SoapClient soapClient) {
        this.soapClient = soapClient;
    }

    @PostMapping("/rest/billing/fees")
    public Mono<ResponseEntity<Object>> fees(@RequestBody Map<String, Object> body,
                                        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:CalculateFees>" + tag("studentId", body) + tag("specialty", body) + tag("level", body) + "</t:CalculateFees>";
        return call(authorization, xml);
    }

    @PostMapping("/rest/billing/payments")
    public Mono<ResponseEntity<Object>> payment(@RequestBody Map<String, Object> body,
                                           @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:AddPayment>" + tag("studentId", body) + tag("amount", body) + "</t:AddPayment>";
        return call(authorization, xml);
    }

    @GetMapping("/rest/billing/status")
    public Mono<ResponseEntity<Object>> status(@RequestParam String studentId,
                                          @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:GetBillingStatus><studentId>" + SoapXml.text(studentId) + "</studentId></t:GetBillingStatus>");
    }

    @GetMapping("/rest/billing/history")
    public Mono<ResponseEntity<Object>> history(@RequestParam String studentId,
                                           @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:GetPaymentHistory><studentId>" + SoapXml.text(studentId) + "</studentId></t:GetPaymentHistory>");
    }

    @GetMapping("/rest/billing/statement")
    public Mono<ResponseEntity<Object>> statement(@RequestParam String studentId,
                                             @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:GenerateStatement><studentId>" + SoapXml.text(studentId) + "</studentId></t:GenerateStatement>");
    }

    @GetMapping("/rest/billing/up-to-date")
    public Mono<ResponseEntity<Object>> upToDate(@RequestParam String studentId,
                                            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:IsUpToDate><studentId>" + SoapXml.text(studentId) + "</studentId></t:IsUpToDate>");
    }

    private Mono<ResponseEntity<Object>> call(String authorization, String body) {
        return soapClient.call(URL, NS, body, authorization)
                .map(result -> toResponse(result.status(), result.body()))
                .onErrorResume(error -> Mono.just(entity(HttpStatus.BAD_GATEWAY, Map.of("error", "Billing service unavailable"))));
    }

    private ResponseEntity<Object> toResponse(int status, String xml) {
        if (xml.contains("Unauthorized") && !xml.contains("Forbidden")) {
            return entity(HttpStatus.UNAUTHORIZED, Map.of("error", "Unauthorized"));
        }
        if (xml.contains("Forbidden")) {
            return entity(HttpStatus.FORBIDDEN, Map.of("error", "Forbidden"));
        }
        if (status >= 400 || xml.contains(":Fault")) {
            return entity(HttpStatus.BAD_GATEWAY, Map.of("error", "SOAP fault", "detail", xml));
        }
        var rows = SoapXml.returns(xml);
        if (!rows.isEmpty()) {
            return entity(HttpStatus.OK, rows.get(0));
        }
        return entity(HttpStatus.OK, SoapXml.fields(xml));
    }

    private static ResponseEntity<Object> entity(HttpStatus status, Object body) {
        return ResponseEntity.status(status).body(body);
    }

    private static String tag(String name, Map<String, Object> body) {
        Object value = body.get(name);
        return "<" + name + ">" + SoapXml.text(value == null ? "" : String.valueOf(value)) + "</" + name + ">";
    }
}
