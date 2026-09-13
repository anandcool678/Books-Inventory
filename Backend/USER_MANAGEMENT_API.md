# User Profile & Password Management API

## New Endpoints

### 1. Update User Profile
**Endpoint:** `PUT /api/auth/profile`
**Authentication:** Required (JWT Token)
**Description:** Update user name and phone number

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "+1-234-567-8900"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "phoneNumber": "+1-234-567-8900",
  "name": "John Doe"
}
```

---

### 2. Forgot Password
**Endpoint:** `POST /api/auth/forgot-password`
**Authentication:** Not Required
**Description:** Send password reset token to user's email (simulated - check console logs)

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
"Password reset link has been sent to your email"
```

**Note:** Currently, the reset token is printed to console. In production, integrate email service (SendGrid, Gmail, etc.)

---

### 3. Reset Password
**Endpoint:** `POST /api/auth/reset-password`
**Authentication:** Not Required
**Description:** Reset password using reset token (valid for 15 minutes)

**Request Body:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "newPassword": "NewPassword123"
}
```

**Response (200 OK):**
```json
"Password has been reset successfully"
```

**Errors:**
- `400 Bad Request`: Invalid or expired token
- `400 Bad Request`: Token has expired

---

### 4. Change Password (Authenticated)
**Endpoint:** `POST /api/auth/change-password`
**Authentication:** Required (JWT Token)
**Description:** Change password for logged-in user

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Response (200 OK):**
```json
"Password has been changed successfully"
```

**Errors:**
- `400 Bad Request`: Current password is incorrect
- `401 Unauthorized`: Invalid or missing token

---

## Implementation Details

### Database Schema Updates
The `User` model now includes:
- `resetToken`: String - Stores reset token UUID
- `resetTokenExpiry`: LocalDateTime - Token expiry timestamp (15 minutes)

### Security Features
✅ Passwords are hashed with BCrypt
✅ Reset tokens expire after 15 minutes
✅ Email uniqueness enforced at DB and application level
✅ JWT authentication for protected endpoints
✅ Input validation with Spring validators

### Current Limitations
- Email sending is not yet implemented (prints to console)
- Reset tokens don't persist across server restarts
- Consider adding email service for production

### Next Steps to Enable Email
1. Add dependency:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-mail</artifactId>
   </dependency>
   ```

2. Update `.env` with email config:
   ```
   SPRING_MAIL_HOST=smtp.gmail.com
   SPRING_MAIL_PORT=587
   SPRING_MAIL_USERNAME=your-email@gmail.com
   SPRING_MAIL_PASSWORD=your-app-password
   APP_MAIL_ENABLED=true
   ```

3. Create `EmailService` to send actual emails with reset links

---

## Testing Examples

### Using cURL

**1. Forgot Password:**
```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**2. Reset Password:**
```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_RESET_TOKEN", "newPassword": "newpass123"}'
```

**3. Update Profile:**
```bash
curl -X PUT http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name", "phoneNumber": "+1-234-567-8900"}'
```

**4. Change Password:**
```bash
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "oldpass123", "newPassword": "newpass456"}'
```
