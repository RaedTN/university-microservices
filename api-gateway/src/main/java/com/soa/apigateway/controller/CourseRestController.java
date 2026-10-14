package com.soa.apigateway.controller;

import com.soa.apigateway.soap.SoapClient;
import com.soa.apigateway.soap.SoapXml;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
public class CourseRestController {

    private static final String NS = "http://service.course.university.com/";

    private final SoapClient soapClient;
    private final String url;

    public CourseRestController(SoapClient soapClient, @Value("${services.courses.url}") String coursesUrl) {
        this.soapClient = soapClient;
        this.url = coursesUrl + "/course-service";
    }

    @GetMapping("/rest/courses")
    public Mono<ResponseEntity<Object>> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:getAllCourses/>", true);
    }

    @GetMapping("/rest/courses/{id}")
    public Mono<ResponseEntity<Object>> getOne(@PathVariable long id,
                                          @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:getCourseById><id>" + id + "</id></t:getCourseById>", false);
    }

    @PostMapping("/rest/courses")
    public Mono<ResponseEntity<Object>> add(@RequestBody Map<String, Object> body,
                                       @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:addCourse>"
                + tag("code", body) + tag("name", body) + tag("description", body) + tag("credits", body)
                + tag("professor", body) + tag("semester", body) + tag("maxStudents", body)
                + tag("room", body) + tag("schedule", body)
                + "</t:addCourse>";
        return call(authorization, xml, false);
    }

    @PutMapping("/rest/courses/{id}")
    public Mono<ResponseEntity<Object>> update(@PathVariable long id, @RequestBody Map<String, Object> body,
                                          @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:updateCourse><id>" + id + "</id>"
                + tag("code", body) + tag("name", body) + tag("description", body) + tag("credits", body)
                + tag("professor", body) + tag("semester", body) + tag("maxStudents", body)
                + tag("room", body) + tag("schedule", body)
                + "</t:updateCourse>";
        return call(authorization, xml, false);
    }

    @DeleteMapping("/rest/courses/{id}")
    public Mono<ResponseEntity<Object>> delete(@PathVariable long id,
                                          @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:deleteCourse><id>" + id + "</id></t:deleteCourse>", false);
    }

    @GetMapping("/rest/timetable")
    public Mono<ResponseEntity<Object>> timetable(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:getAllTimetableSlots/>", true);
    }

    @GetMapping("/rest/timetable/course/{courseId}")
    public Mono<ResponseEntity<Object>> timetableByCourse(@PathVariable long courseId,
                                                     @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:getTimetableByCourse><courseId>" + courseId + "</courseId></t:getTimetableByCourse>", true);
    }

    @PostMapping("/rest/timetable")
    public Mono<ResponseEntity<Object>> addSlot(@RequestBody Map<String, Object> body,
                                           @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:addTimetableSlot>"
                + tag("courseId", body) + tag("day", body) + tag("startTime", body) + tag("endTime", body) + tag("room", body)
                + "</t:addTimetableSlot>";
        return call(authorization, xml, false);
    }

    @PutMapping("/rest/timetable/{id}")
    public Mono<ResponseEntity<Object>> updateSlot(@PathVariable long id, @RequestBody Map<String, Object> body,
                                              @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String xml = "<t:updateTimetableSlot><id>" + id + "</id>"
                + tag("courseId", body) + tag("day", body) + tag("startTime", body) + tag("endTime", body) + tag("room", body)
                + "</t:updateTimetableSlot>";
        return call(authorization, xml, false);
    }

    @DeleteMapping("/rest/timetable/{id}")
    public Mono<ResponseEntity<Object>> deleteSlot(@PathVariable long id,
                                              @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return call(authorization, "<t:deleteTimetableSlot><id>" + id + "</id></t:deleteTimetableSlot>", false);
    }

    private Mono<ResponseEntity<Object>> call(String authorization, String body, boolean list) {
        return soapClient.call(url, NS, body, authorization)
                .map(result -> toResponse(result.status(), result.body(), list))
                .onErrorResume(error -> Mono.just(entity(HttpStatus.BAD_GATEWAY, Map.of("error", "Course service unavailable"))));
    }

    private ResponseEntity<Object> toResponse(int status, String xml, boolean list) {
        if (xml.contains("Unauthorized")) {
            return entity(HttpStatus.UNAUTHORIZED, Map.of("error", "Unauthorized"));
        }
        if (xml.contains("Forbidden")) {
            return entity(HttpStatus.FORBIDDEN, Map.of("error", "Forbidden"));
        }
        String fault = xml.toLowerCase();
        if (fault.contains("existe deja") || fault.contains("occup")) {
            return entity(HttpStatus.BAD_REQUEST, Map.of("error", "Already exists"));
        }
        if (status >= 400 || xml.contains(":Fault")) {
            return entity(HttpStatus.BAD_GATEWAY, Map.of("error", "SOAP fault", "detail", xml));
        }
        List<Map<String, String>> rows = SoapXml.returns(xml);
        if (list) {
            return entity(HttpStatus.OK, rows);
        }
        return entity(HttpStatus.OK, rows.isEmpty() ? Map.of() : rows.get(0));
    }

    private static ResponseEntity<Object> entity(HttpStatus status, Object body) {
        return ResponseEntity.status(status).body(body);
    }

    private static String tag(String name, Map<String, Object> body) {
        Object value = body.get(name);
        return "<" + name + ">" + SoapXml.text(value == null ? "" : String.valueOf(value)) + "</" + name + ">";
    }
}
