# SOAP Requests for Course Service - Thunder Client
# Copy-paste these requests into Thunder Client

## Request 1: Get All Courses
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:getAllCourses/></soap:Body></soap:Envelope>

---

## Request 2: Add Course
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:addCourse><code>THUNDER123</code><name>Thunder Test Course</name><description>Testing with Thunder Client</description><credits>3</credits><professor>Dr. Thunder</professor><semester>Spring 2025</semester><maxStudents>20</maxStudents><room>Z101</room><schedule>Sunday 18h-20h</schedule></ser:addCourse></soap:Body></soap:Envelope>

Note: Change the code value to something unique each time you run this

---

## Request 3: Get Course by Code
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:getCourseByCode><code>CS101</code></ser:getCourseByCode></soap:Body></soap:Envelope>

Note: Change CS101 to search for different courses

---

## Request 4: Get Course by ID
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:getCourseById><id>1</id></ser:getCourseById></soap:Body></soap:Envelope>

Note: Change id value to get different courses

---

## Request 5: Get Courses by Professor
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:getCoursesByProfessor><professor>Dr. Smith</professor></ser:getCoursesByProfessor></soap:Body></soap:Envelope>

Note: Change professor name to search for different professors

---

## Request 6: Get Courses by Semester
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:getCoursesBySemester><semester>Automne 2024</semester></ser:getCoursesBySemester></soap:Body></soap:Envelope>

Note: Change semester value to search for different semesters

---

## Request 7: Check Room Availability (Free Room)
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:isRoomAvailable><room>C303</room><schedule>Mercredi 10h-12h</schedule></ser:isRoomAvailable></soap:Body></soap:Envelope>

Note: Change room and schedule to check different times

---

## Request 8: Check Room Availability (Occupied Room)
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:isRoomAvailable><room>D404</room><schedule>Jeudi 09h-11h</schedule></ser:isRoomAvailable></soap:Body></soap:Envelope>

Note: This room should return false (occupied)

---

## Request 9: Update Course
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:updateCourse><id>1</id><code>CS101_UPDATED</code><name>Updated Computer Science</name><description>Updated description</description><credits>4</credits><professor>Dr. Updated</professor><semester>Spring 2025</semester><maxStudents>35</maxStudents><room>A102</room><schedule>Wednesday 14h-16h</schedule></ser:updateCourse></soap:Body></soap:Envelope>

Note: Change id to update different courses

---

## Request 10: Delete Course
URL: http://localhost:8082/course-service
Method: POST
Header: Content-Type: text/xml; charset=UTF-8

Body:
<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.course.university.com/"><soap:Body><ser:deleteCourse><id>999</id></ser:deleteCourse></soap:Body></soap:Envelope>

Note: Change id to delete different courses (999 should fail gracefully)

---

## Quick Setup in Thunder Client:

1. Create a new request
2. Set Method to: POST
3. Set URL to: http://localhost:8082/course-service
4. Go to Headers tab
5. Add header: Content-Type: text/xml; charset=UTF-8
6. Go to Body tab
7. Copy-paste the entire Body from one of the requests above
8. Click Send

The response should show the SOAP result!
