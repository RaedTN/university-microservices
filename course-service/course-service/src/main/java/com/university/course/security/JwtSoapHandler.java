package com.university.course.security;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.crypto.SecretKey;
import javax.xml.namespace.QName;
import javax.xml.ws.handler.MessageContext;
import javax.xml.ws.handler.soap.SOAPHandler;
import javax.xml.ws.handler.soap.SOAPMessageContext;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class JwtSoapHandler implements SOAPHandler<SOAPMessageContext> {

    @Override
    public boolean handleMessage(SOAPMessageContext context) {
        Boolean outbound = (Boolean) context.get(MessageContext.MESSAGE_OUTBOUND_PROPERTY);
        if (Boolean.TRUE.equals(outbound)) {
            RequestUser.clear();
            return true;
        }
        String token = bearerToken(context);
        if (token == null) {
            throw new RuntimeException("Unauthorized");
        }
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isEmpty()) {
            throw new RuntimeException("JWT_SECRET environment variable is required");
        }
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            String role = claims.get("role") == null ? "" : claims.get("role").toString();
            RequestUser.set(claims.getSubject(), role);
            return true;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Unauthorized");
        }
    }

    @Override
    public boolean handleFault(SOAPMessageContext context) {
        RequestUser.clear();
        return true;
    }

    @Override
    public void close(MessageContext context) {
        RequestUser.clear();
    }

    @Override
    public Set<QName> getHeaders() {
        return Collections.emptySet();
    }

    @SuppressWarnings("unchecked")
    private String bearerToken(SOAPMessageContext context) {
        Object raw = context.get(MessageContext.HTTP_REQUEST_HEADERS);
        if (!(raw instanceof Map)) {
            return null;
        }
        Map<String, Object> headers = (Map<String, Object>) raw;
        Object value = headers.get("Authorization");
        if (value == null) {
            value = headers.get("authorization");
        }
        String header = first(value);
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7).trim();
    }

    private String first(Object value) {
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            if (list.isEmpty() || list.get(0) == null) {
                return null;
            }
            return list.get(0).toString();
        }
        return value == null ? null : value.toString();
    }
}
