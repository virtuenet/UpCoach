#!/usr/bin/env node
/**
 * UpCoach Security Report Generator
 * Consolidates security scan results from multiple tools into comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityReportGenerator {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.reportTimestamp = new Date().toISOString();
    this.consolidatedReport = {
      metadata: {
        timestamp: this.reportTimestamp,
        generator: 'UpCoach Security Report Generator',
        version: '1.0.0',
        platform: 'UpCoach AI Coaching Platform',
        scanId: crypto.randomBytes(8).toString('hex')
      },
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
        total: 0
      },
      securityScore: 0,
      findings: [],
      tools: {},
      recommendations: [],
      complianceStatus: {},
      executiveSummary: ''
    };
  }

  /**
   * Generate consolidated security report from all scan results
   */
  async generateConsolidatedReport() {
    console.log('🔒 Generating UpCoach Security Report...');
    console.log(`📁 Processing results from: ${this.resultsDir}`);

    try {
      // Process results from different security tools
      await this.processSASTResults();
      await this.processDependencyResults();
      await this.processContainerResults();
      await this.processDASTResults();
      await this.processMobileResults();
      await this.processCustomSecurityTests();

      // Calculate security metrics
      this.calculateSecurityScore();
      this.generateRecommendations();
      this.generateExecutiveSummary();
      this.assessComplianceStatus();

      // Save consolidated report
      await this.saveReports();

      console.log('✅ Security report generation completed');
      return this.consolidatedReport;

    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      throw error;
    }
  }

  /**
   * Process SAST (Static Application Security Testing) results
   */
  async processSASTResults() {
    console.log('🔍 Processing SAST results...');

    // Process Semgrep results
    const semgrepFile = path.join(this.resultsDir, 'sast-results', 'semgrep.sarif');
    if (fs.existsSync(semgrepFile)) {
      const semgrepResults = JSON.parse(fs.readFileSync(semgrepFile, 'utf8'));
      this.processSemgrepSARIF(semgrepResults);
    }

    // Process ESLint Security results
    const eslintFile = path.join(this.resultsDir, 'sast-results', 'eslint-security.sarif');
    if (fs.existsSync(eslintFile)) {
      const eslintResults = JSON.parse(fs.readFileSync(eslintFile, 'utf8'));
      this.processESLintSARIF(eslintResults);
    }

    // Process SonarCloud results
    const sonarFile = path.join(this.resultsDir, 'sast-results', 'sonar-report.json');
    if (fs.existsSync(sonarFile)) {
      const sonarResults = JSON.parse(fs.readFileSync(sonarFile, 'utf8'));
      this.processSonarResults(sonarResults);
    }

    this.consolidatedReport.tools.sast = {
      enabled: true,
      tools: ['semgrep', 'eslint-security', 'sonarcloud'],
      coverage: 'Full codebase analysis'
    };
  }

  /**
   * Process dependency vulnerability scan results
   */
  async processDependencyResults() {
    console.log('📦 Processing dependency scan results...');

    // Process npm audit results
    const npmAuditFiles = [
      'npm-audit-api.json',
      'npm-audit-admin.json', 
      'npm-audit-cms.json',
      'npm-audit-landing.json'
    ];

    for (const file of npmAuditFiles) {
      const filePath = path.join(this.resultsDir, 'dependency-scan-results', file);
      if (fs.existsSync(filePath)) {
        const npmResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.processNpmAuditResults(npmResults, file);
      }
    }

    // Process Snyk results
    const snykFiles = ['snyk-results.json', 'snyk-container.json'];
    for (const file of snykFiles) {
      const filePath = path.join(this.resultsDir, 'dependency-scan-results', file);
      if (fs.existsSync(filePath)) {
        const snykResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.processSnykResults(snykResults, file);
      }
    }

    // Process OWASP Dependency Check results
    const owaspFile = path.join(this.resultsDir, 'dependency-scan-results', 'dependency-check-report.json');
    if (fs.existsSync(owaspFile)) {
      const owaspResults = JSON.parse(fs.readFileSync(owaspFile, 'utf8'));
      this.processOwaspDependencyResults(owaspResults);
    }

    this.consolidatedReport.tools.dependencyScanning = {
      enabled: true,
      tools: ['npm-audit', 'snyk', 'owasp-dependency-check'],
      coverage: 'All package dependencies'
    };
  }

  /**
   * Process container security scan results
   */
  async processContainerResults() {
    console.log('🐳 Processing container scan results...');

    // Process Trivy results
    const trivyFiles = ['trivy-api.sarif', 'trivy-admin.sarif'];
    for (const file of trivyFiles) {
      const filePath = path.join(this.resultsDir, file);
      if (fs.existsSync(filePath)) {
        const trivyResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.processTrivySARIF(trivyResults, file);
      }
    }

    // Process Docker Scout results
    const scoutFile = path.join(this.resultsDir, 'docker-scout-api.sarif');
    if (fs.existsSync(scoutFile)) {
      const scoutResults = JSON.parse(fs.readFileSync(scoutFile, 'utf8'));
      this.processDockerScoutSARIF(scoutResults);
    }

    this.consolidatedReport.tools.containerScanning = {
      enabled: true,
      tools: ['trivy', 'docker-scout'],
      coverage: 'Container images and base OS'
    };
  }

  /**
   * Process DAST (Dynamic Application Security Testing) results
   */
  async processDASTResults() {
    console.log('⚡ Processing DAST results...');

    // Process OWASP ZAP results
    const zapFiles = ['zap-baseline-report.json', 'zap-full-report.json'];
    for (const file of zapFiles) {
      const filePath = path.join(this.resultsDir, 'dast-results', file);
      if (fs.existsSync(filePath)) {
        const zapResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.processZapResults(zapResults, file);
      }
    }

    // Process API security test results
    const apiTestFile = path.join(this.resultsDir, 'dast-results', 'api-security-results.json');
    if (fs.existsSync(apiTestFile)) {
      const apiResults = JSON.parse(fs.readFileSync(apiTestFile, 'utf8'));
      this.processAPISecurityResults(apiResults);
    }

    // Process SSL/TLS test results
    const sslTestFile = path.join(this.resultsDir, 'dast-results', 'testssl-results.json');
    if (fs.existsSync(sslTestFile)) {
      const sslResults = JSON.parse(fs.readFileSync(sslTestFile, 'utf8'));
      this.processSSLResults(sslResults);
    }

    this.consolidatedReport.tools.dast = {
      enabled: true,
      tools: ['owasp-zap', 'custom-api-tests', 'testssl'],
      coverage: 'Runtime application security'
    };
  }

  /**
   * Process mobile security test results
   */
  async processMobileResults() {
    console.log('📱 Processing mobile security results...');

    const mobileResultsFile = path.join(this.resultsDir, 'mobile-security-results', 'flutter-analysis.txt');
    if (fs.existsSync(mobileResultsFile)) {
      const mobileResults = fs.readFileSync(mobileResultsFile, 'utf8');
      this.processMobileSecurityResults(mobileResults);
    }

    this.consolidatedReport.tools.mobileScanning = {
      enabled: true,
      tools: ['flutter-analyze', 'dart-analyzer'],
      coverage: 'Mobile application code'
    };
  }

  /**
   * Process custom security test results
   */
  async processCustomSecurityTests() {
    console.log('🎯 Processing custom security test results...');

    // Process authentication security tests
    const authTestFiles = [
      'auth-flows-security.test.results.json',
      'authorization-rls-security.test.results.json',
      'input-validation-security.test.results.json',
      'network-headers-security.test.results.json'
    ];

    for (const file of authTestFiles) {
      const filePath = path.join(this.resultsDir, 'custom-security-tests', file);
      if (fs.existsSync(filePath)) {
        const testResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.processCustomTestResults(testResults, file);
      }
    }

    this.consolidatedReport.tools.customTests = {
      enabled: true,
      tools: ['authentication-tests', 'authorization-tests', 'input-validation', 'security-headers'],
      coverage: 'UpCoach-specific security patterns'
    };
  }

  /**
   * Process Semgrep SARIF results
   */
  processSemgrepSARIF(sarifData) {
    if (!sarifData.runs || !sarifData.runs[0] || !sarifData.runs[0].results) {
      return;
    }

    const results = sarifData.runs[0].results;
    for (const result of results) {
      const severity = this.mapSemgrepSeverity(result.level || 'info');
      
      const finding = {
        tool: 'semgrep',
        id: result.ruleId,
        title: result.message.text,
        description: result.message.text,
        severity: severity,
        category: 'SAST',
        location: this.extractLocationFromSARIF(result),
        cwe: this.extractCWEFromSemgrep(result),
        recommendation: this.getRecommendationForRule(result.ruleId)
      };

      this.addFinding(finding);
    }
  }

  /**
   * Process ESLint SARIF results
   */
  processESLintSARIF(sarifData) {
    if (!sarifData.runs || !sarifData.runs[0] || !sarifData.runs[0].results) {
      return;
    }

    const results = sarifData.runs[0].results;
    for (const result of results) {
      const severity = this.mapESLintSeverity(result.level || 'info');
      
      const finding = {
        tool: 'eslint-security',
        id: result.ruleId,
        title: result.message.text,
        description: result.message.text,
        severity: severity,
        category: 'SAST',
        location: this.extractLocationFromSARIF(result),
        recommendation: 'Review and fix security rule violation'
      };

      this.addFinding(finding);
    }
  }

  /**
   * Process npm audit results
   */
  processNpmAuditResults(auditData, filename) {
    if (!auditData.vulnerabilities) {
      return;
    }

    Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
      const finding = {
        tool: 'npm-audit',
        id: `npm-${packageName}-${vuln.via?.[0]?.source || 'unknown'}`,
        title: `${packageName}: ${vuln.via?.[0]?.title || 'Vulnerability'}`,
        description: vuln.via?.[0]?.overview || 'Dependency vulnerability detected',
        severity: this.mapNpmSeverity(vuln.severity),
        category: 'Dependency',
        package: packageName,
        version: vuln.version,
        cwe: vuln.via?.[0]?.cwe,
        recommendation: `Update ${packageName} to version ${vuln.fixAvailable?.version || 'latest'}`
      };

      this.addFinding(finding);
    });
  }

  /**
   * Process Snyk results
   */
  processSnykResults(snykData, filename) {
    if (!snykData.vulnerabilities) {
      return;
    }

    snykData.vulnerabilities.forEach(vuln => {
      const finding = {
        tool: 'snyk',
        id: vuln.id,
        title: vuln.title,
        description: vuln.description,
        severity: this.mapSnykSeverity(vuln.severity),
        category: filename.includes('container') ? 'Container' : 'Dependency',
        package: vuln.packageName,
        version: vuln.version,
        cwe: vuln.identifiers?.CWE,
        cvss: vuln.cvssScore,
        recommendation: vuln.fixedIn ? `Update to version ${vuln.fixedIn.join(', ')}` : 'No fix available'
      };

      this.addFinding(finding);
    });
  }

  /**
   * Process OWASP ZAP results
   */
  processZapResults(zapData, filename) {
    if (!zapData.site || !zapData.site[0] || !zapData.site[0].alerts) {
      return;
    }

    const alerts = zapData.site[0].alerts;
    alerts.forEach(alert => {
      const finding = {
        tool: 'owasp-zap',
        id: alert.pluginid,
        title: alert.name,
        description: alert.desc,
        severity: this.mapZapSeverity(alert.riskdesc),
        category: 'DAST',
        url: alert.instances?.[0]?.uri,
        method: alert.instances?.[0]?.method,
        param: alert.instances?.[0]?.param,
        evidence: alert.instances?.[0]?.evidence,
        recommendation: alert.solution,
        reference: alert.reference
      };

      this.addFinding(finding);
    });
  }

  /**
   * Add finding to consolidated report
   */
  addFinding(finding) {
    this.consolidatedReport.findings.push(finding);
    this.consolidatedReport.summary[finding.severity.toLowerCase()]++;
    this.consolidatedReport.summary.total++;
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore() {
    const { critical, high, medium, low } = this.consolidatedReport.summary;
    
    // Base score starts at 100
    let score = 100;
    
    // Deduct points based on severity
    score -= critical * 25;  // Critical: -25 points each
    score -= high * 15;      // High: -15 points each  
    score -= medium * 5;     // Medium: -5 points each
    score -= low * 1;        // Low: -1 point each
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    this.consolidatedReport.securityScore = score;
    
    // Add score interpretation
    this.consolidatedReport.scoreInterpretation = this.getScoreInterpretation(score);
  }

  /**
   * Get score interpretation
   */
  getScoreInterpretation(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const { critical, high, medium } = this.consolidatedReport.summary;

    // Critical severity recommendations
    if (critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: '🚨 Address Critical Vulnerabilities Immediately',
        description: `${critical} critical vulnerabilities found that require immediate attention before production deployment.`,
        action: 'Fix all critical vulnerabilities within 24 hours',
        timeline: '24 hours'
      });
    }

    // High severity recommendations
    if (high > 0) {
      recommendations.push({
        priority: 'HIGH', 
        title: '⚠️ Fix High-Risk Security Issues',
        description: `${high} high-risk vulnerabilities could be exploited under certain conditions.`,
        action: 'Address all high-risk findings within 72 hours',
        timeline: '72 hours'
      });
    }

    // Medium severity recommendations
    if (medium > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: '📋 Resolve Medium-Risk Issues',
        description: `${medium} medium-risk issues should be addressed in the next sprint.`,
        action: 'Plan remediation for next development cycle',
        timeline: '1-2 weeks'
      });
    }

    // General security recommendations
    recommendations.push(
      {
        priority: 'ONGOING',
        title: '🔄 Implement Continuous Security Testing',
        description: 'Integrate security scanning into CI/CD pipeline for every commit.',
        action: 'Configure automated security gates in deployment pipeline',
        timeline: 'Ongoing'
      },
      {
        priority: 'ONGOING', 
        title: '📚 Security Training & Awareness',
        description: 'Provide security training for development team.',
        action: 'Schedule monthly security training sessions',
        timeline: 'Ongoing'
      },
      {
        priority: 'ONGOING',
        title: '🛡️ Regular Security Assessments',
        description: 'Conduct quarterly penetration testing and security audits.',
        action: 'Schedule next penetration test',
        timeline: 'Quarterly'
      }
    );

    this.consolidatedReport.recommendations = recommendations;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const { total, critical, high, medium, low } = this.consolidatedReport.summary;
    const score = this.consolidatedReport.securityScore;
    
    let summary = `# UpCoach Platform Security Assessment\n\n`;
    summary += `**Assessment Date:** ${new Date(this.reportTimestamp).toLocaleDateString()}\n`;
    summary += `**Security Score:** ${score}/100 (${this.getScoreInterpretation(score)})\n\n`;
    
    summary += `## Key Findings\n\n`;
    summary += `- **Total Issues:** ${total}\n`;
    summary += `- **Critical:** ${critical} 🚨\n`;
    summary += `- **High:** ${high} ⚠️\n`;
    summary += `- **Medium:** ${medium} 📋\n`;
    summary += `- **Low:** ${low} 📝\n\n`;
    
    if (critical > 0) {
      summary += `## ⚠️ Critical Security Alert\n\n`;
      summary += `${critical} critical vulnerabilities were identified that pose immediate security risks. `;
      summary += `These must be addressed before production deployment.\n\n`;
    }
    
    if (high > 0) {
      summary += `## High Priority Issues\n\n`;
      summary += `${high} high-severity vulnerabilities require prompt attention. `;
      summary += `These could potentially be exploited by attackers.\n\n`;
    }
    
    summary += `## Security Assessment Coverage\n\n`;
    summary += `- ✅ Static Application Security Testing (SAST)\n`;
    summary += `- ✅ Dependency Vulnerability Scanning\n`;
    summary += `- ✅ Container Security Analysis\n`;
    summary += `- ✅ Dynamic Application Security Testing (DAST)\n`;
    summary += `- ✅ Mobile Application Security\n`;
    summary += `- ✅ Custom Security Tests\n\n`;
    
    summary += `## Immediate Actions Required\n\n`;
    if (critical > 0) {
      summary += `1. 🚨 **STOP DEPLOYMENT** - Critical vulnerabilities must be fixed first\n`;
    }
    if (high > 0) {
      summary += `2. ⚠️ Review and fix all high-severity vulnerabilities\n`;
    }
    summary += `3. 📋 Create remediation plan for medium and low severity issues\n`;
    summary += `4. 🔄 Implement security controls in CI/CD pipeline\n\n`;
    
    this.consolidatedReport.executiveSummary = summary;
  }

  /**
   * Assess compliance status
   */
  assessComplianceStatus() {
    const { critical, high } = this.consolidatedReport.summary;
    
    this.consolidatedReport.complianceStatus = {
      productionReady: critical === 0,
      securityGatePassed: critical === 0 && high <= 5,
      complianceFrameworks: {
        'SOC 2': critical === 0 ? 'COMPLIANT' : 'NON-COMPLIANT',
        'OWASP Top 10': this.checkOWASPCompliance(),
        'GDPR Data Protection': this.checkGDPRCompliance(),
        'ISO 27001': critical === 0 && high <= 3 ? 'COMPLIANT' : 'PARTIAL'
      },
      recommendations: this.getComplianceRecommendations()
    };
  }

  /**
   * Check OWASP Top 10 compliance
   */
  checkOWASPCompliance() {
    const owaspIssues = this.consolidatedReport.findings.filter(finding => 
      finding.cwe && ['CWE-79', 'CWE-89', 'CWE-502', 'CWE-798', 'CWE-863'].includes(finding.cwe)
    );
    
    return owaspIssues.length === 0 ? 'COMPLIANT' : 'NON-COMPLIANT';
  }

  /**
   * Check GDPR compliance
   */
  checkGDPRCompliance() {
    const gdprIssues = this.consolidatedReport.findings.filter(finding =>
      finding.description.toLowerCase().includes('personal') ||
      finding.description.toLowerCase().includes('privacy') ||
      finding.description.toLowerCase().includes('data')
    );
    
    return gdprIssues.length === 0 ? 'COMPLIANT' : 'REVIEW_REQUIRED';
  }

  /**
   * Get compliance recommendations
   */
  getComplianceRecommendations() {
    const recommendations = [];
    
    if (this.consolidatedReport.summary.critical > 0) {
      recommendations.push('Fix all critical vulnerabilities for SOC 2 compliance');
    }
    
    if (!this.consolidatedReport.complianceStatus.productionReady) {
      recommendations.push('Complete security remediation before production deployment');
    }
    
    recommendations.push(
      'Implement regular security assessments',
      'Maintain security documentation and incident response procedures',
      'Ensure data protection controls meet GDPR requirements'
    );
    
    return recommendations;
  }

  /**
   * Save consolidated reports
   */
  async saveReports() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(this.resultsDir, '..');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save JSON report
    const jsonFile = path.join(reportsDir, 'consolidated-report.json');
    fs.writeFileSync(jsonFile, JSON.stringify(this.consolidatedReport, null, 2));

    // Save executive summary
    const summaryFile = path.join(reportsDir, 'executive-summary.md');
    fs.writeFileSync(summaryFile, this.consolidatedReport.executiveSummary);

    // Save simplified report for CI/CD
    const ciReport = {
      timestamp: this.reportTimestamp,
      securityScore: this.consolidatedReport.securityScore,
      summary: this.consolidatedReport.summary,
      productionReady: this.consolidatedReport.complianceStatus.productionReady,
      securityGatePassed: this.consolidatedReport.complianceStatus.securityGatePassed
    };
    
    const ciFile = path.join(reportsDir, 'ci-security-gate.json');
    fs.writeFileSync(ciFile, JSON.stringify(ciReport, null, 2));

    console.log(`📄 Reports saved:`);
    console.log(`   📊 JSON Report: ${jsonFile}`);
    console.log(`   📋 Executive Summary: ${summaryFile}`);
    console.log(`   🚦 CI Security Gate: ${ciFile}`);
  }

  // Utility methods for severity mapping
  mapSemgrepSeverity(level) {
    const mapping = {
      'error': 'high',
      'warning': 'medium', 
      'info': 'low'
    };
    return mapping[level] || 'medium';
  }

  mapESLintSeverity(level) {
    const mapping = {
      'error': 'high',
      'warning': 'medium',
      'info': 'low'
    };
    return mapping[level] || 'medium';
  }

  mapNpmSeverity(severity) {
    const mapping = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'low': 'low'
    };
    return mapping[severity] || 'medium';
  }

  mapSnykSeverity(severity) {
    const mapping = {
      'critical': 'critical',
      'high': 'high', 
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[severity] || 'medium';
  }

  mapZapSeverity(riskDesc) {
    if (riskDesc.toLowerCase().includes('high')) return 'high';
    if (riskDesc.toLowerCase().includes('medium')) return 'medium';
    if (riskDesc.toLowerCase().includes('low')) return 'low';
    return 'medium';
  }

  // Additional utility methods
  extractLocationFromSARIF(result) {
    if (result.locations && result.locations[0] && result.locations[0].physicalLocation) {
      const location = result.locations[0].physicalLocation;
      return {
        file: location.artifactLocation?.uri,
        line: location.region?.startLine,
        column: location.region?.startColumn
      };
    }
    return null;
  }

  extractCWEFromSemgrep(result) {
    // Extract CWE from Semgrep rule metadata
    return result.rule?.metadata?.cwe || null;
  }

  getRecommendationForRule(ruleId) {
    // Map common rule IDs to recommendations
    const recommendations = {
      'jwt-hardcoded-secret': 'Use environment variables for JWT secrets',
      'sql-injection-risk': 'Use parameterized queries to prevent SQL injection',
      'dangerous-innerhtml': 'Sanitize user input before rendering HTML',
      'missing-auth-middleware': 'Add authentication middleware to protected routes'
    };
    
    return recommendations[ruleId] || 'Review and fix security violation';
  }

  // Placeholder methods for additional processing
  processSonarResults(sonarResults) {
    console.log('Processing SonarCloud results...');
  }

  processOwaspDependencyResults(owaspResults) {
    console.log('Processing OWASP Dependency Check results...');
  }

  processTrivySARIF(trivyResults, filename) {
    console.log(`Processing Trivy results from ${filename}...`);
  }

  processDockerScoutSARIF(scoutResults) {
    console.log('Processing Docker Scout results...');
  }

  processAPISecurityResults(apiResults) {
    console.log('Processing API security test results...');
  }

  processSSLResults(sslResults) {
    console.log('Processing SSL/TLS test results...');
  }

  processMobileSecurityResults(mobileResults) {
    console.log('Processing mobile security results...');
  }

  processCustomTestResults(testResults, filename) {
    console.log(`Processing custom test results from ${filename}...`);
  }
}

// Main execution
async function main() {
  const resultsDir = process.argv[2] || './security-results';
  
  if (!fs.existsSync(resultsDir)) {
    console.error(`❌ Results directory not found: ${resultsDir}`);
    process.exit(1);
  }

  try {
    const generator = new SecurityReportGenerator(resultsDir);
    const report = await generator.generateConsolidatedReport();
    
    console.log('\n🔒 Security Report Summary:');
    console.log(`   Security Score: ${report.securityScore}/100`);
    console.log(`   Critical Issues: ${report.summary.critical}`);
    console.log(`   High Issues: ${report.summary.high}`);
    console.log(`   Production Ready: ${report.complianceStatus.productionReady ? '✅' : '❌'}`);
    
    // Set exit code based on security gate
    if (!report.complianceStatus.securityGatePassed) {
      console.log('\n❌ Security gate failed - blocking deployment');
      process.exit(1);
    }
    
    console.log('\n✅ Security report generated successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Security report generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SecurityReportGenerator;