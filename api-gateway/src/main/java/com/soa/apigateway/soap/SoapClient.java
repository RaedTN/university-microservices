package com.soa.apigateway.soap;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class SoapClient {

    private final WebClient webClient = WebClient.builder().build();

    public Mono<SoapResult> call(String url, String namespace, String body, String authorization) {
        String envelope = """
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="%s">
                  <soap:Body>%s</soap:Body>
                </soap:Envelope>
                """.formatted(namespace, body);
        return webClient.post()
                .uri(url)
                .header(HttpHeaders.CONTENT_TYPE, "text/xml; charset=UTF-8")
                .headers(headers -> {
                    if (authorization != null && !authorization.isBlank()) {
                        headers.set(HttpHeaders.AUTHORIZATION, authorization);
                    }
                })
                .bodyValue(envelope)
                .exchangeToMono(response -> response.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .map(payload -> new SoapResult(response.statusCode().value(), payload)));
    }

    public record SoapResult(int status, String body) {
        public boolean fault() {
            return status >= 400 || body.contains(":Fault") || body.contains("Unauthorized") || body.contains("Forbidden");
        }
    }
}
