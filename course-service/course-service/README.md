# Course Service - SOAP Web Service

A Java-based SOAP web service for managing university courses. This project demonstrates a complete implementation of a SOAP web service with CRUD operations, room availability management, and course search functionality.

## Project Overview

**Course Service** is a SOAP (Simple Object Access Protocol) web service built with JAX-WS that provides a complete course management system for universities. The service allows you to manage courses, check room availability, and query courses by various criteria.

### Key Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete courses
- ✅ **Course Search**: Find courses by code, ID, professor, or semester
- ✅ **Room Management**: Check room availability for specific time slots
- ✅ **SOAP Web Service**: Standard SOAP interface for integration
- ✅ **MySQL Database**: Persistent data storage with JDBC
- ✅ **Automated Testing**: PowerShell test script for all methods

## Technology Stack

### Backend
- **Java 11**: Core language for the application
- **JAX-WS 2.3.5**: Java API for XML Web Services - used for creating SOAP web services
- **Maven 3.x**: Build automation tool - manages dependencies and builds the project

### Database
- **MySQL**: Relational database for persistent data storage
- **JDBC**: Java Database Connectivity for database operations
- **MySQL Connector 8.0.33**: JDBC driver for MySQL

### Additional Libraries
- **JUnit 4.13.2**: Testing framework (included for potential unit tests)
- **Hibernate**: ORM framework (included as optional dependency)

### Build & Deployment
- **Maven Shade Plugin**: Creates fat JAR with all dependencies bundled
- **Maven Compiler Plugin**: Compiles Java source code with proper manifest

## Project Structure

```
course-service/
├── pom.xml                          # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/university/
│   │   │       ├── App.java         # Main application entry
│   │   │       └── course/
│   │   │           ├── Main.java    # Service startup and HTTP server setup
│   │   │           ├── model/
│   │   │           │   └── Course.java          # Course entity model
│   │   │           ├── service/
│   │   │           │   ├── CourseService.java   # SOAP service interface
│   │   │           │   └── CourseServiceImpl.java # Service implementation
│   │   │           └── repository/
│   │   │               └── CourseRepository.java # Database access layer
│   │   └── resources/
│   └── test/
│       └── java/AppTest.java
├── test-service.ps1                 # Automated test script
└── target/
    ├── classes/                     # Compiled classes
    └── course-service-1.0-SNAPSHOT.jar  # Executable JAR
```

## Getting Started

### Prerequisites

- **Java 11 or higher** - Download from [oracle.com](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) or use OpenJDK
- **Maven 3.6+** - Download from [maven.apache.org](https://maven.apache.org/download.cgi)
- **MySQL 5.7+** - Download from [mysql.com](https://www.mysql.com/downloads/)
- **PowerShell** (for running test script on Windows)

### Database Setup

Before running the service, create the MySQL database:

```sql
-- Create the database
CREATE DATABASE university_db;

-- Use the database
USE university_db;

-- Create the courses table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT,
    professor VARCHAR(100),
    semester VARCHAR(50),
    max_students INT,
    enrolled_students INT,
    room VARCHAR(50),
    schedule VARCHAR(100)
);

-- Optional: Insert sample data
INSERT INTO courses (code, name, description, credits, professor, semester, max_students, enrolled_students, room, schedule) VALUES
('CS101', 'Introduction to Computer Science', 'Basic CS concepts', 3, 'Dr. Johnson', 'Fall 2024', 30, 25, 'A101', 'Monday 10h-12h'),
('MATH201', 'Calculus I', 'Differential calculus', 4, 'Dr. Smith', 'Fall 2024', 35, 30, 'B202', 'Tuesday 14h-16h');
```

### Installation & Build

1. **Clone or download the project**
   ```powershell
   cd course-service
   ```

2. **Build the project with Maven**
   ```powershell
   mvn clean package
   ```
   
   **Why Maven?**
   - Automatically manages dependencies (JAX-WS, MySQL, etc.)
   - Standardized build process
   - Creates executable JAR with all dependencies included (via shade plugin)
   - Easy to maintain and update libraries

   **What this command does:**
   - `clean`: Removes previous build artifacts
   - `package`: Compiles code, runs tests, creates JAR file
   - Result: `target/course-service-1.0-SNAPSHOT.jar` (executable JAR)

3. **Verify MySQL connection settings** in `src/main/java/com/university/course/repository/CourseRepository.java`
   ```java
   private Connection getConnection() throws SQLException {
       String url = "jdbc:mysql://localhost:3306/university_db";
       String user = "root";
       String password = "<your-mysql-password>";  // Change to your MySQL password
       return DriverManager.getConnection(url, user, password);
   }
   ```

## Running the Service

### Start the SOAP Web Service

```powershell
java -jar target/course-service-1.0-SNAPSHOT.jar
```

**Why this command?**
- `-jar`: Runs the Java Archive file
- `target/course-service-1.0-SNAPSHOT.jar`: The compiled application
- The JAR includes all dependencies (thanks to Maven Shade Plugin)
- Service starts embedded HTTP server on `localhost:8082`

**Expected output:**
```
=====================================
  Course Service SOAP - Demarrage...
=====================================

[INFO] Initialisation du service...
[INFO] Tentative de publication sur http://0.0.0.0:8082/course-service
[SUCCESS] Service SOAP demarré avec succès!
[INFO] URL du service : http://localhost:8082/course-service
[INFO] WSDL disponible à : http://localhost:8082/course-service?wsdl
```

### Access the Service

- **WSDL Endpoint**: `http://localhost:8082/course-service?wsdl`
- **Service Base URL**: `http://localhost:8082/course-service`

Use SOAP clients like:
- Postman
- SoapUI
- Custom HTTP clients

## Testing the Service

### Using the Automated Test Script

The `test-service.ps1` PowerShell script automates testing of all 11 SOAP methods:

```powershell
.\test-service.ps1
```

**What does test-service.ps1 do?**

This script automatically tests all available SOAP methods in sequence:

1. **Test 1: Add Course** - Creates a new course with unique code and reserved room
2. **Test 2: Add Second Course** - Tests adding another course with different room/time
3. **Test 3: Get All Courses** - Lists all courses in the database
4. **Test 4: Get Course by Code** - Searches for a specific course by its code
5. **Test 5: Get Courses by Professor** - Finds all courses taught by "Dr. Smith"
6. **Test 6: Get Courses by Semester** - Filters courses by semester (e.g., "Automne 2024")
7. **Test 7: Check Room Availability (Free)** - Verifies a room is available for a time slot
8. **Test 8: Check Room Availability (Occupied)** - Checks a room that's already booked
9. **Test 9: Get Course by ID** - Retrieves a course using its database ID
10. **Test 10: Update Course** - Modifies course details (uses unique code to avoid conflicts)
11. **Test 11: Delete Course** - Attempts to delete a course with invalid ID (tests error handling)

**Why automate testing?**

- **Verification**: Ensures all 11 methods work correctly
- **Integration Testing**: Tests complete SOAP request/response cycle
- **Time-Saving**: Tests all methods in seconds vs manual testing
- **Error Detection**: Shows which tests pass/fail with clear error messages
- **Reproducibility**: Same tests every time, same results

**How the script works:**

```powershell
# 1. Checks if service is accessible
Invoke-WebRequest -Uri "http://localhost:8082/course-service?wsdl"

# 2. Generates unique course codes (prevents duplicates)
$timestamp = Get-Date -Format "HHmmss"  # e.g., "152156"
$courseCode1 = "JAVA" + $timestamp     # e.g., "JAVA152156"

# 3. Sends SOAP requests to the service
$soapRequest = @"
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:ser="http://service.course.university.com/">
    <soap:Body>
        <ser:addCourse>
            <code>$courseCode1</code>
            <name>Programmation Java</name>
            ...
        </ser:addCourse>
    </soap:Body>
</soap:Envelope>
"@

Invoke-WebRequest -Uri $serviceUrl -Method Post -ContentType "text/xml" -Body $soapRequest

# 4. Reports results with color-coded output
# [SUCCESS] = Green, [ERROR] = Red
```

### Manual Testing with SOAP Tools

**Using Postman:**

1. Create a new request with:
   - Method: `POST`
   - URL: `http://localhost:8082/course-service`
   - Headers: `Content-Type: text/xml; charset=UTF-8`

2. Body (raw XML):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:ser="http://service.course.university.com/">
       <soap:Body>
           <ser:getAllCourses/>
       </soap:Body>
   </soap:Envelope>
   ```

3. Send and view response

## Available SOAP Methods

### 1. addCourse
```xml
<ser:addCourse>
    <code>CS101</code>
    <name>Introduction to Computer Science</name>
    <description>Basic CS concepts</description>
    <credits>3</credits>
    <professor>Dr. Johnson</professor>
    <semester>Fall 2024</semester>
    <maxStudents>30</maxStudents>
    <room>A101</room>
    <schedule>Monday 10h-12h</schedule>
</ser:addCourse>
```

### 2. updateCourse
```xml
<ser:updateCourse>
    <id>1</id>
    <code>CS101_UPDATED</code>
    <name>Advanced Computer Science</name>
    <!-- ... other fields ... -->
</ser:updateCourse>
```

### 3. deleteCourse
```xml
<ser:deleteCourse>
    <id>1</id>
</ser:deleteCourse>
```

### 4. getCourseById
```xml
<ser:getCourseById>
    <id>1</id>
</ser:getCourseById>
```

### 5. getCourseByCode
```xml
<ser:getCourseByCode>
    <code>CS101</code>
</ser:getCourseByCode>
```

### 6. getAllCourses
```xml
<ser:getAllCourses/>
```

### 7. getCoursesBySemester
```xml
<ser:getCoursesBySemester>
    <semester>Fall 2024</semester>
</ser:getCoursesBySemester>
```

### 8. getCoursesByProfessor
```xml
<ser:getCoursesByProfessor>
    <professor>Dr. Smith</professor>
</ser:getCoursesByProfessor>
```

### 9. isRoomAvailable
```xml
<ser:isRoomAvailable>
    <room>A101</room>
    <schedule>Monday 10h-12h</schedule>
</ser:isRoomAvailable>
```

## Architecture & Design Decisions

### Why SOAP over REST?

- **Contract-first**: WSDL provides complete service contract
- **Complex types**: Easy to work with complex objects
- **Interoperability**: Works with any SOAP client
- **Enterprise**: Standard for large organizations

### Why JAX-WS?

- **Standard API**: Official Java standard for SOAP services
- **Easy to use**: Simple annotations like `@WebService`
- **Built-in HTTP server**: Includes embedded HTTP server
- **No external container needed**: Unlike Java EE servers

### Why MySQL for Database?

- **Persistence**: Data survives service restarts
- **ACID compliant**: Data integrity and consistency
- **Wide support**: Easy to deploy and backup
- **Scalable**: Can handle large datasets
- **JDBC standard**: Direct database access without ORM overhead

### Repository Pattern

The `CourseRepository` class abstracts database operations:
- Encapsulates JDBC logic
- Makes switching databases easy
- Provides clean service layer separation
- All database errors are caught and logged

### Error Handling

All exceptions are caught and wrapped with meaningful messages:
```java
try {
    // Database operations
} catch (SQLException e) {
    e.printStackTrace();
    throw new RuntimeException("Erreur lors de la création du cours: " + e.getMessage());
}
```

This ensures SOAP faults contain useful error messages.

## Troubleshooting

### Service won't start

**Error**: `Address already in use`
```powershell
# Kill existing Java process on port 8082
Stop-Process -Name java -Force
```

**Error**: `Connection refused to database`
- Verify MySQL is running
- Check credentials in `CourseRepository.java`
- Verify database `university_db` exists

### Test script fails

**Error**: `Service not accessible`
- Ensure service is running in another terminal
- Wait 2-3 seconds after service startup
- Check firewall isn't blocking port 8082

**Error**: `Room not available`
- Service prevents double-booking rooms
- Use different times or rooms in tests
- Script generates unique codes to prevent code conflicts

### WSDL not accessible

- Verify service started correctly
- Check URL: `http://localhost:8082/course-service?wsdl`
- Ensure port 8082 is not blocked

## Project Build Artifacts

After `mvn clean package`, you'll find:

- **`target/course-service-1.0-SNAPSHOT.jar`** - Executable JAR (executable, ~50MB with dependencies)
- **`target/classes/`** - Compiled Java classes
- **`target/generated-sources/`** - Generated sources (if any)

The JAR includes:
- All Java classes
- All dependencies (JAX-WS, MySQL JDBC, etc.)
- Manifest with main class

## Extending the Service

### Add a new SOAP method:

1. **Add to interface** (`CourseService.java`):
   ```java
   @WebMethod
   public Course[] getCoursesByCredits(int credits);
   ```

2. **Implement** (`CourseServiceImpl.java`):
   ```java
   @Override
   public Course[] getCoursesByCredits(int credits) {
       List<Course> courses = repository.findByCredits(credits);
       return courses.toArray(new Course[0]);
   }
   ```

3. **Add to repository** (`CourseRepository.java`):
   ```java
   public List<Course> findByCredits(int credits) {
       // SQL query implementation
   }
   ```

4. **Test with test-service.ps1**

## Performance Considerations

- **Connection pooling**: Currently creates new connection per request (can be optimized)
- **Caching**: No caching implemented (add for frequently accessed data)
- **Indexes**: Add database indexes on `code`, `professor`, `semester` for faster queries
- **Batch operations**: Current implementation handles one operation at a time

## Security Notes

⚠️ **For Production:**

- Change MySQL password from `<your-mysql-password>`
- Use environment variables for credentials
- Add authentication/authorization to SOAP service
- Use HTTPS instead of HTTP
- Add input validation for all parameters
- Implement rate limiting
- Use connection pooling (HikariCP, etc.)

## Commands Reference

| Command | Purpose |
|---------|---------|
| `mvn clean package` | Build the entire project |
| `mvn clean compile` | Just compile without packaging |
| `mvn test` | Run unit tests |
| `java -jar target/course-service-1.0-SNAPSHOT.jar` | Start the service |
| `.\test-service.ps1` | Run automated tests |
| `mvn clean` | Remove build artifacts |
| `mvn dependency:tree` | Show all dependencies |

## Contributing

To improve this project:

1. Add more complex queries in `CourseRepository`
2. Implement caching for frequently accessed data
3. Add authentication/authorization
4. Create REST API wrapper (optional)
5. Add comprehensive error handling
6. Implement logging framework (SLF4J)

## License

This project is provided as-is for educational purposes.

## Contact & Support

For issues or questions about this project, please refer to the code comments or create an issue in the repository.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Java Version**: 11+
**Maven Version**: 3.6+
**MySQL Version**: 5.7+
