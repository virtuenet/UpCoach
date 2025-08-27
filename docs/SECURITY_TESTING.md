# Security Testing Implementation Guide

## Overview

Comprehensive security testing has been integrated into the CI/CD pipeline with both Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) to ensure continuous security validation.

## Testing Architecture

### SAST (Static Analysis)
Analyzes source code without execution to identify vulnerabilities early in development.

### DAST (Dynamic Analysis) 
Tests running applications to find runtime vulnerabilities and configuration issues.

## SAST Implementation

### 1. CodeQL Analysis
**Purpose**: Deep semantic code analysis by GitHub  
**Languages**: JavaScript, TypeScript, Python  
**Coverage**: 
- Security vulnerabilities
- Code quality issues
- CWE compliance
- Custom queries

**Configuration**: `.github/codeql/codeql-config.yml`
```yaml
queries:
  - uses: security-extended
  - uses: security-and-quality
```

### 2. Semgrep Scanning
**Purpose**: Pattern-based security analysis  
**Coverage**:
- OWASP Top 10
- Security audit rules
- Secret detection
- Framework-specific issues

**Key Features**:
- Auto-fix suggestions
- Custom rule support
- CI/CD integration

### 3. SonarCloud Analysis
**Purpose**: Continuous code quality and security  
**Metrics**:
- Security hotspots
- Code coverage
- Technical debt
- Maintainability rating

### 4. Dependency Scanning

#### OWASP Dependency Check
- CVE database scanning
- License compliance
- Outdated component detection
- SBOM generation

#### NPM Audit
- Node.js vulnerability scanning
- Automatic fix suggestions
- Severity threshold enforcement

#### Snyk Integration
- Real-time vulnerability database
- Fix PRs
- License scanning
- Container scanning

### 5. Container Security

#### Trivy Scanner
**Coverage**:
- OS package vulnerabilities
- Application dependencies
- Misconfigurations
- Secret scanning

**Severity Levels**: CRITICAL, HIGH, MEDIUM, LOW

### 6. Secret Detection

#### Gitleaks
- Regex-based secret detection
- Git history scanning
- Pre-commit hook support

#### TruffleHog
- Entropy-based detection
- Verified secret validation
- Cloud provider key detection

## DAST Implementation

### 1. OWASP ZAP Testing
**Scan Types**:
- **Baseline**: Quick security assessment
- **Full**: Comprehensive vulnerability scan
- **API**: OpenAPI/Swagger testing

**Coverage**:
- SQL Injection
- XSS
- CSRF
- Authentication issues
- Session management
- Security headers

### 2. Nuclei Security Templates
**Features**:
- CVE detection
- Misconfiguration scanning
- Technology-specific tests
- Custom template support

**Categories**:
- cve
- owasp-top-10
- misconfig
- exposed-panels
- technologies

### 3. SSL/TLS Assessment
**Tools**: testssl.sh  
**Checks**:
- Protocol support
- Cipher strength
- Certificate validation
- HSTS configuration
- Perfect Forward Secrecy

### 4. API Security Testing
**Custom Python Script**: `.github/scripts/api_security_test.py`  
**Tests**:
- Authentication bypass
- IDOR vulnerabilities
- Rate limiting
- JWT vulnerabilities
- Input validation
- Error handling

### 5. Performance Security Testing
**Tool**: k6  
**Scenarios**:
- DoS resilience
- Rate limit effectiveness
- Resource exhaustion
- Concurrent connection handling
- Large payload processing

## CI/CD Integration

### Workflow Files

#### Security Pipeline (`.github/workflows/security.yml`)
- Runs on: Push, PR, Daily schedule
- Parallel execution
- SARIF reporting
- GitHub Security tab integration

#### DAST Pipeline (`.github/workflows/dast.yml`)
- Runs on: Weekly schedule, Manual trigger
- Staging environment testing
- Comprehensive reporting

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily SAST
    - cron: '0 3 * * 0'  # Weekly DAST
```

## Security Thresholds

### Build Breaking Criteria
- Critical vulnerabilities: 0
- High vulnerabilities: 0 (configurable)
- Secret detection: Any finding
- SQL Injection: Any finding
- XSS: Any finding

### Warning Criteria
- Medium vulnerabilities
- Outdated dependencies
- Missing security headers
- Weak SSL/TLS configuration

## Reports and Artifacts

### SAST Reports
- CodeQL SARIF files
- Semgrep findings
- SonarCloud dashboard
- Dependency check reports
- License compliance CSV

### DAST Reports
- ZAP scan results
- Nuclei findings JSON
- SSL/TLS assessment HTML
- API security JSON
- Load test metrics

### Consolidated Reports
- Security summary markdown
- PR comments with findings
- GitHub Security alerts
- Email notifications (critical)

## Running Security Tests

### Local SAST Testing
```bash
# Install tools
npm install -g @microsoft/eslint-formatter-sarif
pip install semgrep

# Run Semgrep
semgrep --config=auto --sarif -o results.sarif .

# Run npm audit
npm audit --audit-level=moderate

# Run dependency check
dependency-check --project UpCoach --scan . --format ALL
```

### Local DAST Testing
```bash
# Run ZAP with Docker
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://localhost:3000 -r zap-report.html

# Run Nuclei
nuclei -u https://localhost:3000 -severity critical,high,medium

# Run API security tests
python .github/scripts/api_security_test.py \
  --url http://localhost:8080/api \
  --auth-endpoint /auth/login
```

### Manual Security Scan
```bash
# Trigger SAST workflow
gh workflow run security.yml

# Trigger DAST workflow with custom target
gh workflow run dast.yml -f target_url=https://staging.example.com -f scan_type=full
```

## Security Tool Configuration

### Custom Rules

#### Semgrep Rules (`.semgrep.yml`)
```yaml
rules:
  - id: hardcoded-api-key
    pattern: const API_KEY = "$STRING"
    message: "Hardcoded API key detected"
    severity: ERROR
```

#### ZAP Rules (`.zap/rules.tsv`)
```
# Format: Rule_ID  Threshold  URL_Pattern
40018  MEDIUM  *  # SQL Injection
40003  MEDIUM  *  # XSS
10020  LOW     *  # Missing X-Frame-Options
```

### Exclusions

#### Path Exclusions
- `**/test/**`
- `**/node_modules/**`
- `**/dist/**`
- `**/.next/**`

#### False Positive Suppression
```javascript
// nosemgrep: javascript.lang.security.audit.path-traversal
const filePath = path.join(userDir, fileName);

// CodeQL: disable-next-line js/path-injection
fs.readFile(filePath, callback);
```

## Best Practices

### Development Phase
1. Run security linters pre-commit
2. Use IDE security plugins
3. Regular dependency updates
4. Security code reviews

### CI/CD Phase
1. Fail fast on critical issues
2. Progressive security gates
3. Automated fix suggestions
4. Security trend tracking

### Production Phase
1. Runtime protection (WAF)
2. Security monitoring
3. Incident response plan
4. Regular penetration testing

## Remediation Guidelines

### Critical Vulnerabilities
**SLA**: Fix within 24 hours
- Immediate notification
- Rollback if necessary
- Emergency patch process

### High Vulnerabilities
**SLA**: Fix within 72 hours
- Team notification
- Prioritized sprint item
- Risk assessment required

### Medium Vulnerabilities
**SLA**: Fix within 2 weeks
- Backlog prioritization
- Batch fixes acceptable
- Documentation required

### Low Vulnerabilities
**SLA**: Fix within 1 month
- Technical debt tracking
- Bulk remediation
- Best effort basis

## Security Metrics

### KPIs to Track
- Mean Time to Detect (MTTD)
- Mean Time to Remediate (MTTR)
- Vulnerability density per KLOC
- Security debt ratio
- False positive rate

### Dashboard Metrics
```
Total Scans: 1,234
Vulnerabilities Found: 45
  - Critical: 0
  - High: 2
  - Medium: 15
  - Low: 28
Average Fix Time: 3.2 days
Security Score: B+ (85/100)
```

## Troubleshooting

### Common Issues

#### "CodeQL analysis timeout"
- Reduce query complexity
- Increase timeout in workflow
- Use query filters

#### "Semgrep rule conflicts"
- Check rule precedence
- Use explicit rule IDs
- Review rule patterns

#### "DAST scan failures"
- Verify target accessibility
- Check authentication
- Review scan configuration

#### "High false positive rate"
- Tune scanning rules
- Add suppressions
- Update tool versions

## Compliance Mapping

### OWASP Top 10 Coverage
- A01: Broken Access Control ✓
- A02: Cryptographic Failures ✓
- A03: Injection ✓
- A04: Insecure Design ✓
- A05: Security Misconfiguration ✓
- A06: Vulnerable Components ✓
- A07: Authentication Failures ✓
- A08: Data Integrity Failures ✓
- A09: Logging Failures ✓
- A10: SSRF ✓

### CWE Coverage
- CWE-20: Input Validation
- CWE-79: XSS
- CWE-89: SQL Injection
- CWE-200: Information Exposure
- CWE-287: Authentication
- CWE-502: Deserialization
- CWE-611: XXE
- CWE-918: SSRF

## Tool Comparison

| Tool | Type | Speed | Accuracy | Coverage |
|------|------|-------|----------|----------|
| CodeQL | SAST | Medium | High | Comprehensive |
| Semgrep | SAST | Fast | High | Pattern-based |
| SonarCloud | SAST | Slow | High | Quality + Security |
| ZAP | DAST | Slow | Medium | Web vulnerabilities |
| Nuclei | DAST | Fast | High | CVE/Misconfig |
| Trivy | Container | Fast | High | Dependencies |

## Next Steps

### Short Term
1. Implement pre-commit hooks
2. Add security training
3. Create security champions program

### Long Term
1. Implement RASP (Runtime Application Self-Protection)
2. Add threat modeling
3. Establish bug bounty program
4. Achieve security certifications

## Support

For security testing issues:
1. Check workflow logs in GitHub Actions
2. Review tool documentation
3. Contact security team
4. File issue with security label