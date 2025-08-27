# Two-Factor Authentication Implementation Guide

## Overview

The UpCoach platform now includes comprehensive two-factor authentication (2FA) support with both TOTP (Time-based One-Time Password) and WebAuthn/Passkeys for enhanced security.

## Features

### TOTP (Authenticator Apps)
- Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.
- QR code generation for easy setup
- Backup codes for account recovery
- Time-window tolerance for clock drift

### WebAuthn/Passkeys
- Passwordless authentication
- Platform authenticators (Touch ID, Face ID, Windows Hello)
- Security key support (YubiKey, etc.)
- Multiple credential management
- Device fingerprinting and trust

### Security Features
- Rate limiting on verification attempts
- Trusted device management
- Backup codes with secure storage
- Session-based challenge verification
- Automatic secret scrubbing in logs

## API Endpoints

### 2FA Status
```http
GET /api/2fa/status
Authorization: Bearer <token>

Response:
{
  "enabled": true,
  "method": "totp",
  "hasBackupCodes": true,
  "backupCodesRemaining": 8,
  "trustedDevices": [...],
  "webAuthn": {
    "credentials": [...],
    "stats": {...}
  }
}
```

### TOTP Setup

#### 1. Generate Secret
```http
POST /api/2fa/totp/setup
Authorization: Bearer <token>

Response:
{
  "secret": "BASE32ENCODEDSECRET",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    ...
  ]
}
```

#### 2. Enable TOTP
```http
POST /api/2fa/totp/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}

Response:
{
  "success": true,
  "backupCodes": [...],
  "message": "2FA has been enabled successfully"
}
```

#### 3. Verify TOTP (During Login)
```http
POST /api/2fa/totp/verify
Content-Type: application/json

{
  "userId": "uuid",
  "token": "123456",
  "trustDevice": true,
  "deviceName": "Chrome on MacBook"
}

Response:
{
  "success": true,
  "message": "2FA verification successful"
}
```

### WebAuthn/Passkeys

#### 1. Register Credential
```http
POST /api/2fa/webauthn/register/start
Authorization: Bearer <token>

Response: PublicKeyCredentialCreationOptions (JSON)
```

```http
POST /api/2fa/webauthn/register/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": RegistrationResponseJSON,
  "name": "MacBook Touch ID"
}

Response:
{
  "verified": true,
  "credentialId": "...",
  "message": "Passkey registered successfully"
}
```

#### 2. Authenticate with Passkey
```http
POST /api/2fa/webauthn/authenticate/start
Content-Type: application/json

{
  "userId": "uuid" // Optional for username-less auth
}

Response: PublicKeyCredentialRequestOptions (JSON)
```

```http
POST /api/2fa/webauthn/authenticate/verify
Content-Type: application/json

{
  "response": AuthenticationResponseJSON,
  "userId": "uuid" // Optional
}

Response:
{
  "verified": true,
  "userId": "uuid",
  "message": "Authentication successful"
}
```

### Backup Codes

#### Regenerate Codes
```http
POST /api/2fa/backup-codes/regenerate
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456" // Current TOTP code
}

Response:
{
  "backupCodes": [...],
  "message": "New backup codes generated"
}
```

### Trusted Devices

#### List Devices
```http
GET /api/2fa/trusted-devices
Authorization: Bearer <token>

Response:
{
  "devices": [
    {
      "id": "...",
      "name": "Chrome on MacBook",
      "addedAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

#### Remove Device
```http
DELETE /api/2fa/trusted-devices/:deviceId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Device removed successfully"
}
```

### Disable 2FA
```http
POST /api/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "userpassword",
  "token": "123456"
}

Response:
{
  "success": true,
  "message": "2FA has been disabled"
}
```

## Frontend Integration

### React Component Example

```typescript
import { useState } from 'react';
import QRCode from 'qrcode';

function Setup2FA() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');

  const setupTOTP = async () => {
    const response = await fetch('/api/2fa/totp/setup', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    setQrCode(data.qrCode);
    setSecret(data.secret);
    setBackupCodes(data.backupCodes);
  };

  const enableTOTP = async () => {
    const response = await fetch('/api/2fa/totp/enable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: verificationCode })
    });
    
    const data = await response.json();
    if (data.success) {
      // Save backup codes securely
      alert('2FA enabled! Save your backup codes.');
    }
  };

  return (
    <div>
      <button onClick={setupTOTP}>Setup 2FA</button>
      {qrCode && (
        <>
          <img src={qrCode} alt="2FA QR Code" />
          <p>Secret: {secret}</p>
          <input 
            type="text" 
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter code from app"
          />
          <button onClick={enableTOTP}>Verify & Enable</button>
        </>
      )}
    </div>
  );
}
```

### WebAuthn Integration

```typescript
import { 
  startRegistration, 
  startAuthentication 
} from '@simplewebauthn/browser';

async function registerPasskey() {
  // Get options from server
  const optionsResponse = await fetch('/api/2fa/webauthn/register/start', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const options = await optionsResponse.json();

  // Start WebAuthn registration
  const attResp = await startRegistration(options);

  // Verify with server
  const verifyResponse = await fetch('/api/2fa/webauthn/register/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      response: attResp,
      name: 'My Device'
    })
  });

  const result = await verifyResponse.json();
  if (result.verified) {
    alert('Passkey registered successfully!');
  }
}

async function authenticateWithPasskey() {
  // Get options from server
  const optionsResponse = await fetch('/api/2fa/webauthn/authenticate/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'optional-user-id' })
  });
  const options = await optionsResponse.json();

  // Start WebAuthn authentication
  const asseResp = await startAuthentication(options);

  // Verify with server
  const verifyResponse = await fetch('/api/2fa/webauthn/authenticate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: asseResp })
  });

  const result = await verifyResponse.json();
  if (result.verified) {
    // User authenticated successfully
    window.location.href = '/dashboard';
  }
}
```

## Security Considerations

### Rate Limiting
- Maximum 5 verification attempts per 5-minute window
- Automatic lockout after exceeded attempts
- Clear rate limit on successful verification

### Backup Codes
- Generated using cryptographically secure random bytes
- 10 codes by default, 8 characters each
- One-time use only
- Warning when only 2 codes remain

### Device Trust
- SHA-256 fingerprinting based on:
  - User Agent
  - IP Address
  - Accept-Language header
- Trust expires after 30 days of inactivity
- Manual revocation available

### Secret Storage
- TOTP secrets encrypted in Redis
- WebAuthn credentials stored with public keys only
- Challenge verification with 5-minute expiry
- No sensitive data in logs

## Best Practices

### For Developers
1. Always verify 2FA status before sensitive operations
2. Implement proper error handling for all 2FA flows
3. Use secure channels (HTTPS) for all 2FA operations
4. Clear sensitive data from memory after use
5. Log security events for audit trails

### For Users
1. Use authenticator apps over SMS (not implemented)
2. Save backup codes in a secure location
3. Register multiple devices for redundancy
4. Review trusted devices regularly
5. Use passkeys when available for better UX

## Testing

### Manual Testing
1. Setup TOTP with authenticator app
2. Verify successful login with TOTP
3. Test backup code usage
4. Register WebAuthn credential
5. Test passwordless login
6. Verify rate limiting works
7. Test trusted device flows

### Automated Testing
```bash
# Run 2FA tests
npm test src/tests/services/TwoFactorAuthService.test.ts
npm test src/tests/controllers/TwoFactorAuthController.test.ts
```

## Troubleshooting

### Common Issues

#### "Invalid verification code"
- Check system time synchronization
- Ensure correct secret was scanned
- Try with 2 time-window tolerance
- Use backup code if available

#### "WebAuthn not supported"
- Check browser compatibility
- Ensure HTTPS is enabled
- Verify authenticator availability
- Check security key connection

#### "Rate limit exceeded"
- Wait 5 minutes before retry
- Use backup codes if urgent
- Contact support for unlock

## Migration Guide

### Enabling 2FA for Existing Users
1. Prompt users on next login
2. Optional grace period before mandatory
3. Provide setup tutorials
4. Support email for issues

### Disabling Legacy Authentication
1. Phase 1: Optional 2FA (3 months)
2. Phase 2: Mandatory for admins
3. Phase 3: Mandatory for all users
4. Phase 4: Remove password-only option

## Compliance

### GDPR
- Right to export 2FA settings
- Right to deletion includes 2FA data
- Audit logs for 2FA changes
- Data minimization principles

### HIPAA
- 2FA mandatory for PHI access
- Audit trails for all authentications
- Session timeout with re-authentication
- Device trust limitations

### SOC2
- Documented 2FA policies
- Regular security audits
- Incident response procedures
- User training materials

## Support

For 2FA issues:
1. Check user's 2FA status via admin panel
2. Verify backup codes availability
3. Reset 2FA with proper authorization
4. Provide setup assistance
5. Document security incidents