# Auth Service Microservice

A Spring Boot microservice for user authentication and authorization using JWT tokens. This service provides secure user registration and login endpoints with role-based access control.

## Features

- User registration and login with JWT authentication
- Password hashing using BCrypt
- Role-based access control (ADMIN, ENSEIGNANT, ETUDIANT)
- MySQL database integration with JPA/Hibernate
- RESTful API endpoints
- CORS support
- Security configuration with Spring Security

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Git (for version control)
- VS Code with Thunder Client extension (for API testing)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd demo
```

### 2. Database Setup

1. **Install MySQL**: Ensure MySQL is installed and running on your system.

2. **Create Database**: The application will automatically create the database and tables on first run using the following configuration in `application.properties`:

   - `spring.jpa.hibernate.ddl-auto=create-drop`: Hibernate will create all tables based on your entity classes when the application starts, and drop them when it shuts down (useful for development).
   - `?createDatabaseIfNotExist=true` in the JDBC URL: MySQL will create the database "authdb" if it doesn't already exist.

   **How it works**:
   - When you run `mvn spring-boot:run`, Spring Boot connects to MySQL using the configured URL.
   - If "authdb" doesn't exist, MySQL creates it automatically due to `createDatabaseIfNotExist=true`.
   - Hibernate then creates the tables (like the `user` table) based on the `User` entity class in your code.
   - The `User` entity is mapped to a database table with columns for `id`, `email`, `password`, and `role`.

   You can manually create the database if preferred:

   ```sql
   CREATE DATABASE authdb;
   ```

3. **Update Database Configuration**: Edit `src/main/resources/application.properties` if your MySQL credentials differ:

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/authdb?createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```

### 3. Build the Project

```bash
mvn clean install
```

## Running the Application

### Development Mode

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8081`.

### Using Maven Wrapper

```bash
./mvnw spring-boot:run  # Linux/Mac
mvnw.cmd spring-boot:run  # Windows
```

### Production Build

```bash
mvn clean package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

## API Documentation

### Base URL
```
http://localhost:8081/api/auth
```

### Endpoints

#### 1. Register User

**Method**: POST  
**URL**: `/register`  
**Content-Type**: application/json

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "ETUDIANT"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Thunder Client JSON Configuration**:
```json
{
  "client": "Thunder Client",
  "collectionName": "Auth Service",
  "requests": [
    {
      "name": "Register User",
      "method": "POST",
      "url": "http://localhost:8081/api/auth/register",
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"ETUDIANT\"\n}"
      }
    }
  ]
}
```

#### 2. Login User

**Method**: POST  
**URL**: `/login`  
**Content-Type**: application/json

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Thunder Client JSON Configuration**:
```json
{
  "client": "Thunder Client",
  "collectionName": "Auth Service",
  "requests": [
    {
      "name": "Login User",
      "method": "POST",
      "url": "http://localhost:8081/api/auth/login",
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "type": "json",
        "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
      }
    }
  ]
}
```

### Error Responses

- **400 Bad Request**: Missing required fields, invalid data, or user already exists (register)
- **400 Bad Request**: Invalid credentials (login)

## Database Configuration

The application uses MySQL with the following configuration:

- **Database**: authdb
- **JPA/Hibernate**: DDL auto-create-drop (creates tables on startup)
- **Dialect**: MySQL8Dialect
- **SQL Logging**: Enabled for development

### Database Schema

The `User` entity includes:
- `id` (Long, Primary Key)
- `email` (String, Unique)
- `password` (String, BCrypt hashed)
- `role` (String: ADMIN, ENSEIGNANT, ETUDIANT)

## Security Configuration

- **JWT Secret**: Configured in `application.properties`
- **Token Expiration**: 24 hours (86400000 ms)
- **Password Encoder**: BCrypt
- **CORS**: Enabled for all origins
- **Session Management**: Stateless

## Dependencies

Key dependencies from `pom.xml`:

- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Boot Starter Security
- Spring Boot Starter Validation
- MySQL Connector/J
- JJWT (JSON Web Tokens)
- Lombok
- Spring Boot DevTools (runtime)

## Testing with Thunder Client

1. **Install Thunder Client**: VS Code extension for API testing.

2. **Import Collection**: Use the JSON configurations above to create requests in Thunder Client.

3. **Test Endpoints**:
   - Create a new request
   - Set method and URL
   - Add headers
   - Set body type to JSON
   - Paste request body
   - Click Send



   ```

## Project Structure

```
src/
├── main/
│   ├── java/com/microservices/demo/
│   │   ├── DemoApplication.java
│   │   └── authservice/
│   │       ├── controller/AuthController.java
│   │       ├── model/User.java
│   │       ├── repository/UserRepository.java
│   │       └── security/
│   │           ├── JwtService.java
│   │           └── SecurityConfig.java
│   └── resources/
│       └── application.properties
└── test/
    └── java/com/microservices/demo/
        └── DemoApplicationTests.java
```


