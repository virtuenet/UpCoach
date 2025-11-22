#!/usr/bin/env ts-node
/**
 * UpCoach Security Validation & Testing Framework
 * Comprehensive security testing for production deployment
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface SecurityTest {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  test: () => Promise<{ passed: boolean; message: string; evidence?: any }>;
}

interface SecurityReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  results: Array<{
    test: string;
    severity: string;
    status: 'PASS' | 'FAIL';
    message: string;
    evidence?: any;
  }>;
  recommendations: string[];
}

class SecurityValidator {
  private tests: SecurityTest[] = [];
  private projectRoot: string;
  
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.initializeTests();
  }

  private initializeTests(): void {
    this.tests = [
      {
        name: 'Credential Configuration Validation',
        description: 'Verify no placeholder credentials in production files',
        severity: 'critical',
        test: this.testCredentialConfiguration.bind(this),
      },
      {
        name: 'JWT Secret Strength',
        description: 'Validate JWT secrets meet security requirements',
        severity: 'critical',
        test: this.testJWTSecretStrength.bind(this),
      },
      {
        name: 'Google OAuth Configuration',
        description: 'Verify Google OAuth client IDs and secrets are properly configured',
        severity: 'high',
        test: this.testGoogleOAuthConfig.bind(this),
      },
      {
        name: 'Supabase Configuration Security',
        description: 'Validate Supabase credentials and RLS policies',
        severity: 'high',
        test: this.testSupabaseConfig.bind(this),
      },
      {
        name: 'Database Security Configuration',
        description: 'Check database connection security and RLS policies',
        severity: 'high',
        test: this.testDatabaseSecurity.bind(this),
      },
      {
        name: 'API Endpoint Security',
        description: 'Validate API endpoint authentication and authorization',
        severity: 'high',
        test: this.testAPIEndpointSecurity.bind(this),
      },
      {
        name: 'Security Headers Configuration',
        description: 'Verify comprehensive security headers are configured',
        severity: 'medium',
        test: this.testSecurityHeaders.bind(this),
      },
      {
        name: 'CORS Configuration',
        description: 'Validate CORS settings for production security',
        severity: 'medium',
        test: this.testCORSConfig.bind(this),
      },
      {
        name: 'Rate Limiting Configuration',
        description: 'Verify rate limiting is properly configured',
        severity: 'medium',
        test: this.testRateLimiting.bind(this),
      },
      {
        name: 'File Upload Security',
        description: 'Check file upload restrictions and validation',
        severity: 'medium',
        test: this.testFileUploadSecurity.bind(this),
      },
      {
        name: 'Environment Variable Security',
        description: 'Validate environment variable configuration',
        severity: 'low',
        test: this.testEnvironmentVariables.bind(this),
      },
      {
        name: 'Dependencies Security Audit',
        description: 'Check for vulnerable dependencies',
        severity: 'medium',
        test: this.testDependenciesSecurity.bind(this),
      },
    ];
  }

  async runSecurityValidation(): Promise<SecurityReport> {
    console.log('🔒 Starting UpCoach Security Validation...\n');
    
    const report: SecurityReport = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      totalTests: this.tests.length,
      passed: 0,
      failed: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      results: [],
      recommendations: [],
    };

    for (const test of this.tests) {
      console.log(`🔍 Running: ${test.name}...`);
      
      try {
        const result = await test.test();
        
        const testResult = {
          test: test.name,
          severity: test.severity,
          status: result.passed ? 'PASS' as const : 'FAIL' as const,
          message: result.message,
          evidence: result.evidence,
        };

        report.results.push(testResult);

        if (result.passed) {
          report.passed++;
          console.log(`  ✅ PASS: ${result.message}`);
        } else {
          report.failed++;
          report[test.severity]++;
          console.log(`  ❌ FAIL: ${result.message}`);
          
          if (test.severity === 'critical') {
            console.log(`  🚨 CRITICAL: This issue must be fixed before production deployment!`);
          }
        }
      } catch (error) {
        report.failed++;
        report[test.severity]++;
        
        const testResult = {
          test: test.name,
          severity: test.severity,
          status: 'FAIL' as const,
          message: `Test execution failed: ${error}`,
        };

        report.results.push(testResult);
        console.log(`  ❌ ERROR: ${error}`);
      }

      console.log('');
    }

    this.generateRecommendations(report);
    return report;
  }

  private async testCredentialConfiguration(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const configFiles = [
      'mobile-app/lib/core/constants/app_constants.dart',
      '.env.example',
      '.env.production.example',
    ];

    const placeholderPatterns = [
      /YOUR_.*_HERE/g,
      /PLACEHOLDER_/g,
      /CHANGE_ME/g,
      /EXAMPLE_/g,
      /your-.*-id/g,
      /sk_test_/g, // Stripe test keys
      /pk_test_/g,
    ];

    const issues: string[] = [];

    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of placeholderPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          issues.push(`${configFile}: Found placeholder values: ${matches.join(', ')}`);
        }
      }

      // Check for hardcoded localhost URLs in production config
      if (configFile.includes('production') && content.includes('localhost')) {
        issues.push(`${configFile}: Contains localhost URLs in production config`);
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'No placeholder credentials found'
        : `Found ${issues.length} credential configuration issues`,
      evidence: issues,
    };
  }

  private async testJWTSecretStrength(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const envFiles = ['.env', '.env.production', '.env.staging'];
    const issues: string[] = [];

    for (const envFile of envFiles) {
      const filePath = path.join(this.projectRoot, envFile);
      
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (line.startsWith('JWT_SECRET=') || line.startsWith('JWT_REFRESH_SECRET=')) {
          const [key, value] = line.split('=', 2);
          
          if (!value || value.length < 64) {
            issues.push(`${envFile}: ${key} is less than 64 characters`);
          }

          if (value && this.isWeakSecret(value)) {
            issues.push(`${envFile}: ${key} contains weak patterns`);
          }
        }
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'JWT secrets meet security requirements'
        : `Found ${issues.length} JWT secret issues`,
      evidence: issues,
    };
  }

  private isWeakSecret(secret: string): boolean {
    const weakPatterns = [
      'secret',
      'password',
      'key',
      'test',
      'dev',
      'example',
      'change',
      'placeholder',
    ];

    return weakPatterns.some(pattern => 
      secret.toLowerCase().includes(pattern)
    );
  }

  private async testGoogleOAuthConfig(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check mobile app configuration
    const mobileConfigPath = path.join(
      this.projectRoot, 
      'mobile-app/lib/core/constants/app_constants.dart'
    );

    if (fs.existsSync(mobileConfigPath)) {
      const content = fs.readFileSync(mobileConfigPath, 'utf8');
      
      if (content.includes('YOUR_GOOGLE_')) {
        issues.push('Mobile app contains placeholder Google OAuth credentials');
      }
    }

    // Check backend configuration
    const backendConfigPath = path.join(
      this.projectRoot,
      'services/api/src/config/environment.ts'
    );

    if (fs.existsSync(backendConfigPath)) {
      const content = fs.readFileSync(backendConfigPath, 'utf8');
      
      // Check for proper environment-based client ID configuration
      if (!content.includes('GOOGLE_WEB_CLIENT_ID_PROD') && 
          !content.includes('GOOGLE_CLIENT_ID')) {
        issues.push('Backend missing Google OAuth client ID configuration');
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Google OAuth configuration appears valid'
        : `Found ${issues.length} OAuth configuration issues`,
      evidence: issues,
    };
  }

  private async testSupabaseConfig(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check for RLS policies
    const rlsPoliciesPath = path.join(
      this.projectRoot,
      'services/api/src/database/security/rls_policies.sql'
    );

    if (!fs.existsSync(rlsPoliciesPath)) {
      issues.push('RLS policies file not found - database security not configured');
    } else {
      const content = fs.readFileSync(rlsPoliciesPath, 'utf8');
      
      const requiredPolicies = [
        'users_select_own',
        'users_admin_select_all',
        'sessions_own',
        'oauth_providers_own',
      ];

      for (const policy of requiredPolicies) {
        if (!content.includes(policy)) {
          issues.push(`Missing RLS policy: ${policy}`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Supabase configuration and RLS policies are present'
        : `Found ${issues.length} Supabase configuration issues`,
      evidence: issues,
    };
  }

  private async testDatabaseSecurity(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check database schema for security features
    const schemaPath = path.join(
      this.projectRoot,
      'services/api/src/database/migrations/consolidated/001_base_schema.sql'
    );

    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for proper constraints
      if (!content.includes('CHECK (role IN')) {
        issues.push('Missing role constraints in users table');
      }

      if (!content.includes('CHECK (status IN')) {
        issues.push('Missing status constraints in users table');
      }

      // Check for audit logging
      if (!content.includes('audit_logs')) {
        issues.push('Missing audit logs table for security tracking');
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Database security features are configured'
        : `Found ${issues.length} database security issues`,
      evidence: issues,
    };
  }

  private async testAPIEndpointSecurity(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check authentication middleware
    const authMiddlewarePath = path.join(
      this.projectRoot,
      'services/api/src/middleware/auth.ts'
    );

    if (fs.existsSync(authMiddlewarePath)) {
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      if (!content.includes('Bearer')) {
        issues.push('Authentication middleware may not handle Bearer tokens');
      }

      if (!content.includes('jwt')) {
        issues.push('JWT validation not found in auth middleware');
      }
    } else {
      issues.push('Authentication middleware not found');
    }

    // Check security middleware
    const securityMiddlewarePath = path.join(
      this.projectRoot,
      'services/api/src/middleware/security.ts'
    );

    if (fs.existsSync(securityMiddlewarePath)) {
      const content = fs.readFileSync(securityMiddlewarePath, 'utf8');
      
      if (!content.includes('helmet')) {
        issues.push('Security headers middleware not using Helmet');
      }

      if (!content.includes('CSP') && !content.includes('contentSecurityPolicy')) {
        issues.push('Content Security Policy not configured');
      }
    } else {
      issues.push('Security middleware not found');
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'API endpoint security appears configured'
        : `Found ${issues.length} API security issues`,
      evidence: issues,
    };
  }

  private async testSecurityHeaders(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    const securityMiddlewarePath = path.join(
      this.projectRoot,
      'services/api/src/middleware/security.ts'
    );

    if (fs.existsSync(securityMiddlewarePath)) {
      const content = fs.readFileSync(securityMiddlewarePath, 'utf8');
      
      const requiredHeaders = [
        'hsts',
        'frameguard',
        'noSniff',
        'xssFilter',
        'referrerPolicy',
      ];

      for (const header of requiredHeaders) {
        if (!content.includes(header)) {
          issues.push(`Missing security header configuration: ${header}`);
        }
      }
    } else {
      issues.push('Security middleware file not found');
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Security headers are configured'
        : `Found ${issues.length} security header issues`,
      evidence: issues,
    };
  }

  private async testCORSConfig(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    const securityMiddlewarePath = path.join(
      this.projectRoot,
      'services/api/src/middleware/security.ts'
    );

    if (fs.existsSync(securityMiddlewarePath)) {
      const content = fs.readFileSync(securityMiddlewarePath, 'utf8');
      
      if (!content.includes('CORS') && !content.includes('cors')) {
        issues.push('CORS configuration not found');
      }

      if (content.includes('*') && content.includes('origin')) {
        issues.push('CORS may be configured with wildcard origin (security risk)');
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'CORS configuration appears secure'
        : `Found ${issues.length} CORS configuration issues`,
      evidence: issues,
    };
  }

  private async testRateLimiting(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check for rate limiting middleware
    const rateLimiterPath = path.join(
      this.projectRoot,
      'services/api/src/middleware/rateLimiter.ts'
    );

    if (!fs.existsSync(rateLimiterPath)) {
      // Check if it's inline in other middleware
      const securityPath = path.join(
        this.projectRoot,
        'services/api/src/middleware/security.ts'
      );
      
      if (fs.existsSync(securityPath)) {
        const content = fs.readFileSync(securityPath, 'utf8');
        if (!content.includes('rate') && !content.includes('limit')) {
          issues.push('Rate limiting middleware not found');
        }
      } else {
        issues.push('Rate limiting not configured');
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Rate limiting appears to be configured'
        : `Found ${issues.length} rate limiting issues`,
      evidence: issues,
    };
  }

  private async testFileUploadSecurity(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    // Check for upload middleware
    const uploadMiddlewarePath = path.join(
      this.projectRoot,
      'services/api/src/middleware/upload.ts'
    );

    if (fs.existsSync(uploadMiddlewarePath)) {
      const content = fs.readFileSync(uploadMiddlewarePath, 'utf8');
      
      if (!content.includes('fileSize') && !content.includes('limits')) {
        issues.push('File size limits not configured');
      }

      if (!content.includes('filter') && !content.includes('mimetype')) {
        issues.push('File type restrictions not found');
      }
    } else {
      issues.push('File upload middleware not found');
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'File upload security appears configured'
        : `Found ${issues.length} file upload security issues`,
      evidence: issues,
    };
  }

  private async testEnvironmentVariables(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    const issues: string[] = [];

    const envConfigPath = path.join(
      this.projectRoot,
      'services/api/src/config/environment.ts'
    );

    if (fs.existsSync(envConfigPath)) {
      const content = fs.readFileSync(envConfigPath, 'utf8');
      
      if (!content.includes('zod') && !content.includes('validation')) {
        issues.push('Environment variable validation not found');
      }

      if (!content.includes('secureString') && !content.includes('secret')) {
        issues.push('Secret strength validation not implemented');
      }
    } else {
      issues.push('Environment configuration file not found');
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'Environment variable configuration is present'
        : `Found ${issues.length} environment configuration issues`,
      evidence: issues,
    };
  }

  private async testDependenciesSecurity(): Promise<{ passed: boolean; message: string; evidence?: any }> {
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      });

      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.vulnerabilities || {};
      const criticalCount = Object.values(vulnerabilities).filter(
        (v: any) => v.severity === 'critical'
      ).length;
      const highCount = Object.values(vulnerabilities).filter(
        (v: any) => v.severity === 'high'
      ).length;

      return {
        passed: criticalCount === 0 && highCount === 0,
        message: criticalCount === 0 && highCount === 0 
          ? 'No critical or high severity vulnerabilities found'
          : `Found ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
        evidence: { critical: criticalCount, high: highCount, audit },
      };
    } catch (error) {
      return {
        passed: false,
        message: `Failed to run dependency security audit: ${error}`,
      };
    }
  }

  private generateRecommendations(report: SecurityReport): void {
    report.recommendations = [];

    if (report.critical > 0) {
      report.recommendations.push(
        '🚨 CRITICAL: Fix all critical security issues before production deployment'
      );
    }

    if (report.high > 0) {
      report.recommendations.push(
        '⚠️ HIGH: Address high severity security issues as soon as possible'
      );
    }

    report.recommendations.push(
      '🔒 Implement comprehensive security testing in CI/CD pipeline',
      '📋 Regular security audits and penetration testing',
      '🔑 Implement proper secret management (AWS Secrets Manager, etc.)',
      '🛡️ Enable comprehensive monitoring and alerting for security events',
      '📚 Security training for development team'
    );
  }

  async generateReport(report: SecurityReport): Promise<void> {
    const reportPath = path.join(this.projectRoot, 'security-reports');
    
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportPath, `security-validation-${timestamp}.json`);
    const markdownFile = path.join(reportPath, `security-validation-${timestamp}.md`);

    // JSON report
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(markdownFile, markdown);

    console.log(`\n📄 Security report saved to:`);
    console.log(`   JSON: ${reportFile}`);
    console.log(`   Markdown: ${markdownFile}`);
  }

  private generateMarkdownReport(report: SecurityReport): string {
    return `# UpCoach Security Validation Report

**Generated:** ${report.timestamp}
**Environment:** ${report.environment}

## Summary

- **Total Tests:** ${report.totalTests}
- **Passed:** ${report.passed} ✅
- **Failed:** ${report.failed} ❌

### Severity Breakdown
- **Critical:** ${report.critical} 🚨
- **High:** ${report.high} ⚠️
- **Medium:** ${report.medium} 📋
- **Low:** ${report.low} 📝

## Test Results

${report.results.map(result => `
### ${result.test}
**Severity:** ${result.severity.toUpperCase()}
**Status:** ${result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
**Message:** ${result.message}
${result.evidence ? `**Evidence:** \`${JSON.stringify(result.evidence, null, 2)}\`` : ''}
`).join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by UpCoach Security Validation Framework*`;
  }
}

// Main execution
async function main() {
  const validator = new SecurityValidator();
  const report = await validator.runSecurityValidation();
  
  console.log('\n🔒 Security Validation Complete!');
  console.log(`   Passed: ${report.passed}/${report.totalTests}`);
  console.log(`   Critical Issues: ${report.critical}`);
  console.log(`   High Issues: ${report.high}`);
  
  if (report.critical > 0) {
    console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION');
    process.exit(1);
  }
  
  if (report.high > 0) {
    console.log('\n⚠️ HIGH PRIORITY SECURITY ISSUES FOUND - REVIEW BEFORE DEPLOYMENT');
  }

  await validator.generateReport(report);
  
  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Security validation failed:', error);
    process.exit(1);
  });
}

export { SecurityValidator };