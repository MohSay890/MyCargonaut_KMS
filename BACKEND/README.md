# MyCargonaut Backend

Spring Boot backend service for the MyCargonaut Knowledge Management System.

## Technology Stack

- **Java**: 21 (LTS)
- **Spring Boot**: 3.2.0
- **Database**: PostgreSQL 15
- **Build Tool**: Maven

## Dependencies

- Spring Boot Web
- Spring Boot Data JPA
- Spring Boot Security
- Spring Boot Validation
- PostgreSQL Driver
- Lombok
- Spring Boot DevTools

## Prerequisites

- JDK 21 or higher
- Maven 3.9+
- PostgreSQL 15
- Docker (optional, for running PostgreSQL)

## Getting Started

### 1. Start PostgreSQL Database

Using Docker Compose (from project root):
```bash
docker-compose up -d
```

Or install PostgreSQL locally and create a database named `mycargonaut`.

### 2. Build the Application

```bash
mvn clean install
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`.

## Configuration

### Profiles

- **dev**: Development environment (default)
- **prod**: Production environment

To run with a specific profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

### Database Configuration

Configure database connection in `application.properties` or use environment variables in production:
- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`

## API Endpoints

### Health Check
```
GET /api/health
```

Returns the service status and basic information.

## Testing

Run tests with:
```bash
mvn test
```

## Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/mycargonaut/backend/
│   │       ├── BackendApplication.java
│   │       ├── config/
│   │       │   └── SecurityConfig.java
│   │       └── controller/
│   │           └── HealthController.java
│   └── resources/
│       ├── application.properties
│       ├── application-dev.properties
│       └── application-prod.properties
└── test/
    └── java/
        └── com/mycargonaut/backend/
            └── BackendApplicationTests.java
```

## Security

The application uses Spring Security with CORS enabled for the Angular frontend running on `http://localhost:4200`.

## License

MIT
