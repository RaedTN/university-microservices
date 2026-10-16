package com.soa.apigateway.soap;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SoapXml {

    private static final Pattern RETURN_BLOCK = Pattern.compile("<(?:\\w+:)?return\\b[^>]*>(.*?)</(?:\\w+:)?return>", Pattern.DOTALL);
    private static final Pattern ITEM_BLOCK = Pattern.compile("<(?:\\w+:)?item\\b[^>]*>(.*?)</(?:\\w+:)?item>", Pattern.DOTALL);
    private static final Pattern TAG = Pattern.compile("<(?:\\w+:)?([A-Za-z0-9_]+)\\b[^>]*>([^<]*)</(?:\\w+:)?\\1>");

    private SoapXml() {
    }

    public static List<Map<String, String>> returns(String xml) {
        List<Map<String, String>> rows = new ArrayList<>();
        Matcher blocks = RETURN_BLOCK.matcher(xml);
        boolean sawReturn = false;
        while (blocks.find()) {
            sawReturn = true;
            rows.addAll(rowsOf(blocks.group(1).trim()));
        }
        if (!sawReturn) {
            Map<String, String> single = fields(xml);
            if (!single.isEmpty()) {
                rows.add(single);
            }
        }
        return rows;
    }

    /**
     * JAX-WS wraps an array in one return element whose children are item elements.
     * Reading the leaves of that block as one map keeps only the last item.
     */
    private static List<Map<String, String>> rowsOf(String inner) {
        List<Map<String, String>> rows = new ArrayList<>();
        Matcher items = ITEM_BLOCK.matcher(inner);
        while (items.find()) {
            Map<String, String> parsed = fields(items.group(1));
            if (!parsed.isEmpty()) {
                rows.add(parsed);
            }
        }
        if (!rows.isEmpty()) {
            return rows;
        }
        Map<String, String> parsed = fields(inner);
        if (parsed.isEmpty() && !inner.isEmpty() && !inner.contains("<")) {
            parsed.put("return", inner);
        }
        if (!parsed.isEmpty()) {
            rows.add(parsed);
        }
        return rows;
    }

    public static Map<String, String> fields(String xml) {
        Map<String, String> values = new LinkedHashMap<>();
        Matcher matcher = TAG.matcher(xml);
        while (matcher.find()) {
            values.put(matcher.group(1), matcher.group(2).trim());
        }
        return values;
    }

    public static String text(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
