FROM maven:3.9.9-eclipse-temurin-11-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:11-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/target/course-service-1.0-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
