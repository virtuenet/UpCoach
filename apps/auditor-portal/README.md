# UpCoach Auditor Portal

Read-only compliance dashboard for external SOC2 auditors.

## Features

- **Control Attestations**: View all 91 SOC2 controls with real-time status
- **Evidence Packages**: Browse and download evidence collections by control
- **Policy Documents**: Access version-controlled policy repository
- **Audit Trail**: Track all portal access and downloads with full audit logging
- **System Architecture**: Review system diagrams and technical documentation

## Security

- **Read-Only Access**: No mutation operations allowed
- **Audit Logging**: All views and downloads are logged with IP address and timestamp
- **Time-Limited Tokens**: Access tokens expire after configured period
- **IP Whitelisting**: Optional IP restriction for enhanced security
- **TLS Encryption**: All communications encrypted in transit

## Getting Started

### Prerequisites

- Node.js 18+
- Access credentials provided by UpCoach compliance team

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Portal will be available at `http://localhost:3003`

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

```env
API_BASE_URL=https://api.upcoach.com
NEXT_PUBLIC_AUDIT_LOG_ENABLED=true
```

## Usage

1. **Login**: Use credentials provided by UpCoach compliance team
2. **Browse Controls**: Navigate to Controls tab to view all 91 SOC2 controls
3. **Download Evidence**: Click download icon next to evidence packages
4. **View Policies**: Access and download policy documents from Policies tab
5. **Review Audit Trail**: Monitor all portal activity in Audit Trail tab

## Compliance

This portal is designed to facilitate SOC2 Type I and Type II audits. All access is logged and monitored for security purposes.

## Support

For technical issues or access requests, contact: compliance@upcoach.com

## License

Proprietary - UpCoach Inc. All rights reserved.
