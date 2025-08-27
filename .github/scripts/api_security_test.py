#!/usr/bin/env python3
"""
API Security Testing Script
Tests for common API vulnerabilities and security misconfigurations
"""

import argparse
import json
import sys
import time
from typing import Dict, List, Any
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

class APISecurityTester:
    def __init__(self, base_url: str, auth_endpoint: str = None):
        self.base_url = base_url.rstrip('/')
        self.auth_endpoint = auth_endpoint
        self.session = self._create_session()
        self.token = None
        self.results = {
            'vulnerabilities': [],
            'warnings': [],
            'info': [],
            'passed': []
        }
    
    def _create_session(self) -> requests.Session:
        """Create a session with retry logic"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
    def authenticate(self, username: str, password: str) -> bool:
        """Authenticate and get JWT token"""
        if not self.auth_endpoint:
            return True
        
        try:
            response = self.session.post(
                f"{self.base_url}{self.auth_endpoint}",
                json={'email': username, 'password': password}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token') or data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                return True
        except Exception as e:
            self.add_result('warning', f'Authentication failed: {str(e)}')
        return False
    
    def add_result(self, severity: str, message: str, details: Dict = None):
        """Add a test result"""
        result = {
            'timestamp': time.time(),
            'message': message,
            'details': details or {}
        }
        
        if severity == 'vulnerability':
            self.results['vulnerabilities'].append(result)
        elif severity == 'warning':
            self.results['warnings'].append(result)
        elif severity == 'info':
            self.results['info'].append(result)
        else:
            self.results['passed'].append(result)
    
    def test_security_headers(self):
        """Test for security headers"""
        print("Testing security headers...")
        
        response = self.session.get(f"{self.base_url}/health")
        headers = response.headers
        
        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=',
            'Content-Security-Policy': ['default-src', 'script-src']
        }
        
        for header, expected in required_headers.items():
            if header not in headers:
                self.add_result('vulnerability', f'Missing security header: {header}')
            elif isinstance(expected, list):
                if not any(exp in headers[header] for exp in expected):
                    self.add_result('warning', f'Weak {header}: {headers[header]}')
                else:
                    self.add_result('passed', f'Security header present: {header}')
            elif expected not in headers[header]:
                self.add_result('warning', f'Unexpected value for {header}: {headers[header]}')
            else:
                self.add_result('passed', f'Security header correctly set: {header}')
    
    def test_rate_limiting(self):
        """Test for rate limiting"""
        print("Testing rate limiting...")
        
        endpoint = f"{self.base_url}/health"
        requests_count = 100
        start_time = time.time()
        status_codes = []
        
        for i in range(requests_count):
            response = self.session.get(endpoint)
            status_codes.append(response.status_code)
            
            if response.status_code == 429:
                self.add_result('passed', f'Rate limiting active: 429 returned after {i+1} requests')
                return
        
        elapsed_time = time.time() - start_time
        
        if 429 not in status_codes:
            self.add_result('vulnerability', f'No rate limiting detected after {requests_count} requests in {elapsed_time:.2f}s')
        
    def test_authentication_bypass(self):
        """Test for authentication bypass vulnerabilities"""
        print("Testing authentication bypass...")
        
        protected_endpoints = [
            '/users/me',
            '/admin/users',
            '/api/internal',
            '/debug',
            '/config'
        ]
        
        # Remove auth header temporarily
        auth_header = self.session.headers.pop('Authorization', None)
        
        for endpoint in protected_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                
                if response.status_code == 200:
                    self.add_result('vulnerability', f'Authentication bypass: {endpoint} accessible without auth')
                elif response.status_code in [401, 403]:
                    self.add_result('passed', f'Endpoint properly protected: {endpoint}')
                else:
                    self.add_result('info', f'Endpoint returned {response.status_code}: {endpoint}')
            except:
                pass
        
        # Restore auth header
        if auth_header:
            self.session.headers['Authorization'] = auth_header
    
    def test_sql_injection(self):
        """Test for SQL injection vulnerabilities"""
        print("Testing SQL injection...")
        
        sql_payloads = [
            "' OR '1'='1",
            "1' AND '1' = '1",
            "' OR 1=1--",
            "admin'--",
            "1' UNION SELECT NULL--",
            "' OR 'x'='x",
            "1 AND 1=1",
            "1' AND SLEEP(5)--",
            "'; DROP TABLE users--"
        ]
        
        test_endpoints = [
            '/search?q=',
            '/users?id=',
            '/filter?category='
        ]
        
        for endpoint in test_endpoints:
            for payload in sql_payloads:
                try:
                    response = self.session.get(f"{self.base_url}{endpoint}{payload}")
                    
                    # Check for SQL error messages
                    error_indicators = [
                        'SQL syntax',
                        'mysql_fetch',
                        'ORA-01756',
                        'PostgreSQL',
                        'sqlite_',
                        'database error',
                        'syntax error'
                    ]
                    
                    response_text = response.text.lower()
                    for indicator in error_indicators:
                        if indicator.lower() in response_text:
                            self.add_result('vulnerability', f'Possible SQL injection at {endpoint}', 
                                          {'payload': payload, 'indicator': indicator})
                            break
                    
                    # Check for time-based SQL injection
                    if 'SLEEP' in payload or 'WAITFOR' in payload:
                        if response.elapsed.total_seconds() > 4:
                            self.add_result('vulnerability', f'Time-based SQL injection at {endpoint}',
                                          {'payload': payload, 'response_time': response.elapsed.total_seconds()})
                except:
                    pass
    
    def test_xss(self):
        """Test for XSS vulnerabilities"""
        print("Testing XSS vulnerabilities...")
        
        xss_payloads = [
            '<script>alert(1)</script>',
            '"><script>alert(1)</script>',
            "';alert(1);//",
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            'javascript:alert(1)',
            '<iframe src=javascript:alert(1)>'
        ]
        
        test_endpoints = [
            '/search?q=',
            '/comment',
            '/profile/name'
        ]
        
        for endpoint in test_endpoints:
            for payload in xss_payloads:
                try:
                    # GET request test
                    response = self.session.get(f"{self.base_url}{endpoint}{payload}")
                    if payload in response.text:
                        self.add_result('vulnerability', f'Reflected XSS at {endpoint}',
                                      {'payload': payload})
                    
                    # POST request test (if applicable)
                    if not endpoint.endswith('?q='):
                        response = self.session.post(f"{self.base_url}{endpoint}",
                                                    json={'input': payload})
                        if response.status_code == 200 and payload in response.text:
                            self.add_result('vulnerability', f'Stored XSS at {endpoint}',
                                          {'payload': payload})
                except:
                    pass
    
    def test_idor(self):
        """Test for IDOR vulnerabilities"""
        print("Testing IDOR vulnerabilities...")
        
        # Try to access other users' resources
        resource_endpoints = [
            '/users/{id}',
            '/orders/{id}',
            '/documents/{id}',
            '/profile/{id}'
        ]
        
        for endpoint_template in resource_endpoints:
            # Try sequential IDs
            for test_id in ['1', '2', '100', '9999']:
                endpoint = endpoint_template.format(id=test_id)
                try:
                    response = self.session.get(f"{self.base_url}{endpoint}")
                    
                    if response.status_code == 200:
                        # Check if response contains other user's data
                        data = response.json() if 'json' in response.headers.get('content-type', '') else {}
                        if data and 'email' in str(data):
                            self.add_result('vulnerability', f'IDOR vulnerability at {endpoint}',
                                          {'accessible_id': test_id})
                    elif response.status_code == 403:
                        self.add_result('passed', f'Proper access control at {endpoint}')
                except:
                    pass
    
    def test_jwt_vulnerabilities(self):
        """Test for JWT vulnerabilities"""
        print("Testing JWT vulnerabilities...")
        
        if not self.token:
            self.add_result('info', 'No JWT token available for testing')
            return
        
        # Test none algorithm
        try:
            import jwt
            
            # Decode without verification
            decoded = jwt.decode(self.token, options={"verify_signature": False})
            
            # Try none algorithm
            none_token = jwt.encode(decoded, '', algorithm='none')
            test_session = requests.Session()
            test_session.headers['Authorization'] = f'Bearer {none_token}'
            
            response = test_session.get(f"{self.base_url}/users/me")
            if response.status_code == 200:
                self.add_result('vulnerability', 'JWT none algorithm accepted')
            else:
                self.add_result('passed', 'JWT none algorithm rejected')
            
            # Check for sensitive data in JWT
            sensitive_fields = ['password', 'secret', 'apiKey', 'creditCard']
            for field in sensitive_fields:
                if field in decoded:
                    self.add_result('vulnerability', f'Sensitive data in JWT: {field}')
            
        except Exception as e:
            self.add_result('info', f'JWT testing skipped: {str(e)}')
    
    def test_api_versioning(self):
        """Test for exposed API versions and deprecated endpoints"""
        print("Testing API versioning...")
        
        version_patterns = [
            '/v1/',
            '/v2/',
            '/api/v1/',
            '/api/v2/',
            '/old/',
            '/legacy/',
            '/deprecated/'
        ]
        
        for pattern in version_patterns:
            try:
                response = self.session.get(f"{self.base_url}{pattern}")
                if response.status_code != 404:
                    self.add_result('warning', f'Exposed API version/legacy endpoint: {pattern}',
                                  {'status_code': response.status_code})
            except:
                pass
    
    def test_error_handling(self):
        """Test error handling and information disclosure"""
        print("Testing error handling...")
        
        # Test various malformed requests
        test_cases = [
            {'method': 'GET', 'path': '/api/\\..\\..\\etc\\passwd'},
            {'method': 'POST', 'path': '/api/users', 'data': 'invalid-json'},
            {'method': 'GET', 'path': '/api/users/invalid-uuid'},
            {'method': 'PUT', 'path': '/api/users/1', 'data': {'id': 'different-id'}},
        ]
        
        for test in test_cases:
            try:
                if test['method'] == 'GET':
                    response = self.session.get(f"{self.base_url}{test['path']}")
                elif test['method'] == 'POST':
                    response = self.session.post(f"{self.base_url}{test['path']}", 
                                                data=test.get('data', {}))
                elif test['method'] == 'PUT':
                    response = self.session.put(f"{self.base_url}{test['path']}", 
                                              json=test.get('data', {}))
                
                # Check for stack traces or sensitive info
                sensitive_patterns = [
                    'stacktrace',
                    'traceback',
                    'at line',
                    'file:',
                    '/usr/',
                    '/var/',
                    'C:\\\\',
                    'database',
                    'table',
                    'column'
                ]
                
                response_text = response.text.lower()
                for pattern in sensitive_patterns:
                    if pattern.lower() in response_text:
                        self.add_result('vulnerability', 
                                      f'Information disclosure in error response: {test["path"]}',
                                      {'pattern': pattern})
                        break
            except:
                pass
    
    def generate_report(self) -> Dict:
        """Generate security report"""
        total_tests = sum(len(v) for v in self.results.values())
        
        report = {
            'summary': {
                'total_tests': total_tests,
                'vulnerabilities': len(self.results['vulnerabilities']),
                'warnings': len(self.results['warnings']),
                'passed': len(self.results['passed']),
                'info': len(self.results['info'])
            },
            'results': self.results,
            'timestamp': time.time(),
            'target': self.base_url
        }
        
        return report
    
    def run_all_tests(self):
        """Run all security tests"""
        print(f"Starting API security tests for {self.base_url}")
        print("=" * 50)
        
        self.test_security_headers()
        self.test_rate_limiting()
        self.test_authentication_bypass()
        self.test_sql_injection()
        self.test_xss()
        self.test_idor()
        self.test_jwt_vulnerabilities()
        self.test_api_versioning()
        self.test_error_handling()
        
        print("=" * 50)
        print("Security testing completed")
        
        return self.generate_report()

def main():
    parser = argparse.ArgumentParser(description='API Security Testing')
    parser.add_argument('--url', required=True, help='Base API URL')
    parser.add_argument('--auth-endpoint', help='Authentication endpoint')
    parser.add_argument('--test-user', help='Test username')
    parser.add_argument('--test-password', help='Test password')
    parser.add_argument('--output', default='api-security-report.json', help='Output file')
    
    args = parser.parse_args()
    
    tester = APISecurityTester(args.url, args.auth_endpoint)
    
    # Authenticate if credentials provided
    if args.test_user and args.test_password:
        if not tester.authenticate(args.test_user, args.test_password):
            print("Warning: Authentication failed, continuing with limited tests")
    
    # Run tests
    report = tester.run_all_tests()
    
    # Save report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print("\nSecurity Test Summary:")
    print(f"  Vulnerabilities: {report['summary']['vulnerabilities']}")
    print(f"  Warnings: {report['summary']['warnings']}")
    print(f"  Passed: {report['summary']['passed']}")
    print(f"  Info: {report['summary']['info']}")
    
    # Exit with error if vulnerabilities found
    if report['summary']['vulnerabilities'] > 0:
        print("\n❌ Security vulnerabilities detected!")
        for vuln in report['results']['vulnerabilities']:
            print(f"  - {vuln['message']}")
        sys.exit(1)
    else:
        print("\n✅ No critical vulnerabilities found")
        sys.exit(0)

if __name__ == '__main__':
    main()