# Google Sign-In Integration Documentation

## Overview

This document describes the Google Sign-In integration for the UpCoach platform, providing seamless authentication for both mobile and web applications.

## Features

- **OAuth 2.0 Authentication**: Secure authentication using Google's OAuth 2.0 protocol
- **Multi-Platform Support**: Separate client IDs for mobile and web platforms
- **Token Management**: JWT tokens with refresh capability
- **Session Management**: Redis-based session tracking
- **Account Linking**: Link existing accounts with Google
- **Supabase Synchronization**: Automatic user sync with Supabase
- **Audit Logging**: Comprehensive authentication event tracking
- **Security**: Token validation, CSRF protection, and rate limiting

## API Endpoints

### Base URL
```
https://api.upcoach.ai/api/v2/auth/google
```

### Endpoints

#### 1. Sign In with Google
```http
POST /api/v2/auth/google/signin
Content-Type: application/json

{
  "idToken": "google-id-token-from-client",
  "platform": "mobile" | "web",
  "deviceInfo": {
    "deviceId": "unique-device-id",
    "deviceName": "iPhone 13 Pro",
    "platform": "iOS",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "role": "user",
      "is_email_verified": true
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    },
    "isNewUser": false
  }
}
```

#### 2. Refresh Token
```http
POST /api/v2/auth/google/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "new-jwt-access-token",
      "refreshToken": "new-jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

#### 3. Validate Session
```http
GET /api/v2/auth/google/session
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "success": true,
  "message": "Session is valid",
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### 4. Link Google Account
```http
POST /api/v2/auth/google/link
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "idToken": "google-id-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google account linked successfully",
  "data": {
    "googleEmail": "user@gmail.com",
    "googleName": "John Doe"
  }
}
```

#### 5. Unlink Google Account
```http
DELETE /api/v2/auth/google/unlink
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "success": true,
  "message": "Google account unlinked successfully"
}
```

#### 6. Check Google Link Status
```http
GET /api/v2/auth/google/status
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isLinked": true,
    "googleEmail": "user@gmail.com",
    "authProvider": "google"
  }
}
```

#### 7. Revoke All Tokens
```http
POST /api/v2/auth/google/revoke
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "success": true,
  "message": "All tokens have been revoked successfully"
}
```

## Mobile Integration (Flutter)

### Setup

1. Add Google Sign-In dependency:
```yaml
dependencies:
  google_sign_in: ^6.1.5
```

2. Configure OAuth client IDs in your Flutter app

### Implementation Example

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<void> signInWithGoogle() async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) return;

      // Get authentication details
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      // Send ID token to backend
      final response = await http.post(
        Uri.parse('https://api.upcoach.ai/api/v2/auth/google/signin'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': googleAuth.idToken,
          'platform': 'mobile',
          'deviceInfo': {
            'deviceId': await getDeviceId(),
            'deviceName': await getDeviceName(),
            'platform': Platform.operatingSystem,
            'appVersion': await getAppVersion(),
          },
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Store tokens securely
        await secureStorage.write(
          key: 'access_token', 
          value: data['data']['tokens']['accessToken']
        );
        await secureStorage.write(
          key: 'refresh_token', 
          value: data['data']['tokens']['refreshToken']
        );
      }
    } catch (error) {
      print('Google sign-in failed: $error');
    }
  }
}
```

## Web Integration

### Setup

1. Include Google Sign-In JavaScript library:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

2. Initialize Google Sign-In:
```javascript
google.accounts.id.initialize({
  client_id: 'YOUR_WEB_CLIENT_ID',
  callback: handleCredentialResponse
});
```

### Implementation Example

```javascript
async function handleCredentialResponse(response) {
  try {
    const res = await fetch('https://api.upcoach.ai/api/v2/auth/google/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: response.credential,
        platform: 'web',
        deviceInfo: {
          deviceName: navigator.userAgent,
          platform: 'web',
        },
      }),
    });

    const data = await res.json();
    
    if (data.success) {
      // Store tokens
      localStorage.setItem('access_token', data.data.tokens.accessToken);
      localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-main-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_MOBILE_CLIENT_ID=your-mobile-client-id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# Optional: Require email verification
REQUIRE_EMAIL_VERIFICATION=false

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

#### For Mobile App:
- Choose "Android" or "iOS" application type
- Add your app's package name / bundle ID
- Add SHA-1 certificate fingerprint (Android)

#### For Web App:
- Choose "Web application" type
- Add authorized JavaScript origins:
  - `http://localhost:3000` (development)
  - `https://app.upcoach.ai` (production)
- Add authorized redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `https://app.upcoach.ai/auth/callback`

## Database Schema

The following columns are added to the `users` table:

```sql
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN google_email VARCHAR(255),
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
```

Authentication events are logged in the `auth_events` table:

```sql
CREATE TABLE auth_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_type VARCHAR(50),
  platform VARCHAR(20),
  device_info JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **Token Validation**: All Google ID tokens are validated server-side
2. **HTTPS Only**: Always use HTTPS in production
3. **Rate Limiting**: Authentication endpoints are rate-limited
4. **Token Expiration**: Access tokens expire after 1 hour
5. **Refresh Token Rotation**: Refresh tokens are rotated on use
6. **Session Management**: Sessions tracked in Redis with TTL
7. **Audit Logging**: All authentication events are logged

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid Google authentication token",
    "statusCode": 401
  }
}
```

### Error Codes

- `INVALID_TOKEN`: Google ID token is invalid or expired
- `USER_EXISTS`: User with email already exists
- `ACCOUNT_LINKED`: Google account already linked to another user
- `SESSION_EXPIRED`: User session has expired
- `RATE_LIMITED`: Too many authentication attempts

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run Google Auth tests specifically
npm test -- GoogleAuthService

# Run with coverage
npm run test:coverage
```

### Test Coverage

The Google authentication service has comprehensive test coverage including:
- Token verification
- User creation and linking
- Session management
- Error handling
- Edge cases

## Monitoring

### Key Metrics to Monitor

1. **Authentication Success Rate**: Track successful vs failed authentications
2. **Token Refresh Rate**: Monitor token refresh frequency
3. **New User Registration**: Track new users via Google Sign-In
4. **Session Duration**: Average session length
5. **Error Rates**: Monitor specific error types

### Logging

All authentication events are logged with the following information:
- User ID
- Event type (signin, refresh, link, unlink, revoke)
- Platform (mobile, web)
- Device information
- IP address
- Timestamp

## Support

For issues or questions regarding Google Sign-In integration:

1. Check the [Google Sign-In Documentation](https://developers.google.com/identity)
2. Review the error logs in the backend
3. Contact the UpCoach development team

## Changelog

### Version 2.0.0 (2025-01-08)
- Initial implementation of Google Sign-In
- Support for mobile and web platforms
- Account linking functionality
- Supabase synchronization
- Comprehensive audit logging