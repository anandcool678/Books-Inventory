# Books Catalogue System

A basic Java Spring Boot application for a books catalogue system with user signup and login.

## Tech stack
- Java 17
- Maven
- Spring Boot 3.x
- Spring Data MongoDB
- MongoDB
- Spring Security with JWT

## Setup
1. The app is configured to use MongoDB Atlas with the provided connection string.
2. Database name is set to `books_catalogue`.
3. Run:

```bash
mvn clean install
mvn spring-boot:run
```

## API endpoints
- POST `/api/auth/signup`
- POST `/api/auth/login`

Example request for signup:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Example request for login:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

The login endpoint returns a JWT token that should be sent in the `Authorization` header as a Bearer token for protected routes.
