import fs from 'fs';
import path from 'path';

/**
 * 🔍 SECURITY TEST RESULTS PROCESSOR
 * 
 * Analyzes test results for security vulnerabilities and generates
 * detailed security compliance reports
 */

export default function securityResultsProcessor(testResult) {
  console.log('🔍 Processing security test results...');
  
  const securityAnalysis = {
    timestamp: new Date().toISOString(),
    totalTests: testResult.numTotalTests,
    passedTests: testResult.numPassedTests,
    failedTests: testResult.numFailedTests,
    coverage: testResult.coverageMap ? calculateSecurityCoverage(testResult.coverageMap) : null,
    securityMetrics: analyzeSecurityMetrics(testResult),
    vulnerabilities: detectPotentialVulnerabilities(testResult),
    compliance: checkSecurityCompliance(testResult)
  };
  
  // Generate security report
  generateSecurityReport(securityAnalysis);
  
  // Log security summary
  logSecuritySummary(securityAnalysis);
  
  return testResult;
}

function calculateSecurityCoverage(coverageMap) {
  const securityFiles = [
    'AuthMiddleware.js',
    'RefreshToken.js', 
    'User.js',
    'AuthRoutes.js'
  ];
  
  const securityCoverage = {};
  
  for (const [filename, fileCoverage] of Object.entries(coverageMap)) {
    const isSecurityFile = securityFiles.some(sf => filename.includes(sf));
    
    if (isSecurityFile) {
      const summary = fileCoverage.toSummary();
      securityCoverage[filename] = {
        statements: summary.statements.pct,
        branches: summary.branches.pct,
        functions: summary.functions.pct,
        lines: summary.lines.pct
      };
    }
  }
  
  return securityCoverage;
}

function analyzeSecurityMetrics(testResult) {
  const securityTests = testResult.testResults.filter(test => 
    test.testFilePath.includes('auth') || 
    test.testFilePath.includes('security')
  );
  
  const totalSecurityTests = securityTests.reduce((acc, test) => 
    acc + test.numPassingTests + test.numFailingTests, 0
  );
  
  const passedSecurityTests = securityTests.reduce((acc, test) => 
    acc + test.numPassingTests, 0
  );
  
  const securityTestCategories = analyzeTestCategories(securityTests);
  
  return {
    totalSecurityTests,
    passedSecurityTests,
    securityTestSuccessRate: (passedSecurityTests / totalSecurityTests * 100).toFixed(2),
    categories: securityTestCategories,
    criticalSecurityTests: securityTestCategories.filter(cat => cat.critical).length
  };
}

function analyzeTestCategories(securityTests) {
  const categories = [];
  
  securityTests.forEach(test => {
    test.assertionResults.forEach(assertion => {
      const title = assertion.title || assertion.ancestorTitles?.join(' ') || '';
      
      if (title.includes('token rotation') || title.includes('refresh token')) {
        categories.push({
          name: 'Token Rotation Security',
          status: assertion.status,
          critical: true
        });
      }
      
      if (title.includes('reuse detection') || title.includes('token reuse')) {
        categories.push({
          name: 'Token Reuse Detection',
          status: assertion.status,
          critical: true
        });
      }
      
      if (title.includes('device binding') || title.includes('device verification')) {
        categories.push({
          name: 'Device Binding Security',
          status: assertion.status,
          critical: true
        });
      }
      
      if (title.includes('risk assessment') || title.includes('security verification')) {
        categories.push({
          name: 'Risk Assessment',
          status: assertion.status,
          critical: true
        });
      }
      
      if (title.includes('brute force') || title.includes('rate limiting')) {
        categories.push({
          name: 'Attack Prevention',
          status: assertion.status,
          critical: true
        });
      }
    });
  });
  
  return categories;
}

function detectPotentialVulnerabilities(testResult) {
  const vulnerabilities = [];
  
  // Check for failed critical security tests
  testResult.testResults.forEach(test => {
    if (test.numFailingTests > 0) {
      test.assertionResults.forEach(assertion => {
        if (assertion.status === 'failed') {
          const title = assertion.title || '';
          
          if (title.includes('token') || title.includes('auth') || title.includes('security')) {
            vulnerabilities.push({
              type: 'CRITICAL_SECURITY_TEST_FAILURE',
              description: `Failed critical security test: ${title}`,
              severity: 'HIGH',
              test: assertion.fullName,
              message: assertion.failureMessages?.[0] || 'Unknown failure'
            });
          }
        }
      });
    }
  });
  
  // Check coverage thresholds
  if (testResult.coverageMap) {
    for (const [filename, coverage] of Object.entries(testResult.coverageMap)) {
      const summary = coverage.toSummary();
      
      if (filename.includes('AuthMiddleware') || filename.includes('RefreshToken')) {
        if (summary.statements.pct < 95) {
          vulnerabilities.push({
            type: 'INSUFFICIENT_SECURITY_COVERAGE',
            description: `Critical security file ${filename} has insufficient test coverage`,
            severity: 'MEDIUM',
            coverage: summary.statements.pct,
            required: 95
          });
        }
      }
    }
  }
  
  return vulnerabilities;
}

function checkSecurityCompliance(testResult) {
  const compliance = {
    owasp: checkOWASPCompliance(testResult),
    tokenSecurity: checkTokenSecurityCompliance(testResult),
    deviceSecurity: checkDeviceSecurityCompliance(testResult),
    overallScore: 0
  };
  
  // Calculate overall compliance score
  const scores = [compliance.owasp.score, compliance.tokenSecurity.score, compliance.deviceSecurity.score];
  compliance.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  return compliance;
}

function checkOWASPCompliance(testResult) {
  const owaspChecks = [
    'password hashing',
    'session management',
    'input validation',
    'authentication bypass',
    'broken access control'
  ];
  
  const passedChecks = owaspChecks.filter(check => 
    testResult.testResults.some(test => 
      test.assertionResults.some(assertion => 
        assertion.title?.toLowerCase().includes(check) && assertion.status === 'passed'
      )
    )
  );
  
  return {
    totalChecks: owaspChecks.length,
    passedChecks: passedChecks.length,
    score: Math.round((passedChecks.length / owaspChecks.length) * 100),
    details: passedChecks
  };
}

function checkTokenSecurityCompliance(testResult) {
  const tokenChecks = [
    'token rotation',
    'token expiry',
    'reuse detection',
    'token binding'
  ];
  
  const passedChecks = tokenChecks.filter(check => 
    testResult.testResults.some(test => 
      test.assertionResults.some(assertion => 
        assertion.title?.toLowerCase().includes(check) && assertion.status === 'passed'
      )
    )
  );
  
  return {
    totalChecks: tokenChecks.length,
    passedChecks: passedChecks.length,
    score: Math.round((passedChecks.length / tokenChecks.length) * 100),
    details: passedChecks
  };
}

function checkDeviceSecurityCompliance(testResult) {
  const deviceChecks = [
    'device binding',
    'device verification',
    'trusted device',
    'device limit'
  ];
  
  const passedChecks = deviceChecks.filter(check => 
    testResult.testResults.some(test => 
      test.assertionResults.some(assertion => 
        assertion.title?.toLowerCase().includes(check) && assertion.status === 'passed'
      )
    )
  );
  
  return {
    totalChecks: deviceChecks.length,
    passedChecks: passedChecks.length,
    score: Math.round((passedChecks.length / deviceChecks.length) * 100),
    details: passedChecks
  };
}

function generateSecurityReport(analysis) {
  const reportDir = path.join(process.cwd(), 'coverage', 'security-reports');
  
  // Ensure directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `security-report-${Date.now()}.json`);
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`📊 Security report generated: ${reportPath}`);
  } catch (error) {
    console.error('❌ Failed to generate security report:', error);
  }
  
  // Generate human-readable HTML report
  generateHTMLSecurityReport(analysis, reportDir);
}

function generateHTMLSecurityReport(analysis, reportDir) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>🛡️ Security Test Report - ${new Date(analysis.timestamp).toLocaleString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; margin: 20px 0; }
        .score.high { color: #22c55e; }
        .score.medium { color: #f59e0b; }
        .score.low { color: #ef4444; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { font-size: 14px; color: #666; }
        .section { margin: 30px 0; }
        .vulnerability { background: #fee2e2; border: 1px solid #fecaca; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .vulnerability.HIGH { border-color: #f87171; }
        .vulnerability.MEDIUM { background: #fef3c7; border-color: #fcd34d; }
        .compliance-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.high { background: #22c55e; }
        .progress-fill.medium { background: #f59e0b; }
        .progress-fill.low { background: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Authentication Security Test Report</h1>
            <p>Generated: ${new Date(analysis.timestamp).toLocaleString()}</p>
            <div class="score ${getScoreClass(analysis.compliance.overallScore)}">${analysis.compliance.overallScore}%</div>
            <p>Overall Security Compliance Score</p>
        </div>
        
        <div class="section">
            <h2>📊 Test Metrics</h2>
            <div class="metric">
                <div class="metric-value">${analysis.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analysis.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analysis.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analysis.securityMetrics.totalSecurityTests}</div>
                <div class="metric-label">Security Tests</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Security Compliance</h2>
            <div class="compliance-item">
                <strong>OWASP Compliance: ${analysis.compliance.owasp.score}%</strong>
                <div class="progress-bar">
                    <div class="progress-fill ${getScoreClass(analysis.compliance.owasp.score)}" style="width: ${analysis.compliance.owasp.score}%"></div>
                </div>
                <small>${analysis.compliance.owasp.passedChecks}/${analysis.compliance.owasp.totalChecks} checks passed</small>
            </div>
            <div class="compliance-item">
                <strong>Token Security: ${analysis.compliance.tokenSecurity.score}%</strong>
                <div class="progress-bar">
                    <div class="progress-fill ${getScoreClass(analysis.compliance.tokenSecurity.score)}" style="width: ${analysis.compliance.tokenSecurity.score}%"></div>
                </div>
                <small>${analysis.compliance.tokenSecurity.passedChecks}/${analysis.compliance.tokenSecurity.totalChecks} checks passed</small>
            </div>
            <div class="compliance-item">
                <strong>Device Security: ${analysis.compliance.deviceSecurity.score}%</strong>
                <div class="progress-bar">
                    <div class="progress-fill ${getScoreClass(analysis.compliance.deviceSecurity.score)}" style="width: ${analysis.compliance.deviceSecurity.score}%"></div>
                </div>
                <small>${analysis.compliance.deviceSecurity.passedChecks}/${analysis.compliance.deviceSecurity.totalChecks} checks passed</small>
            </div>
        </div>
        
        <div class="section">
            <h2>⚠️ Vulnerabilities (${analysis.vulnerabilities.length})</h2>
            ${analysis.vulnerabilities.length === 0 ? '<p>✅ No vulnerabilities detected!</p>' : analysis.vulnerabilities.map(vuln => `
                <div class="vulnerability ${vuln.severity}">
                    <strong>${vuln.type}</strong><br>
                    ${vuln.description}<br>
                    <small>Severity: ${vuln.severity}</small>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🔍 Coverage Summary</h2>
            ${analysis.coverage ? Object.entries(analysis.coverage).map(([file, cov]) => `
                <div class="compliance-item">
                    <strong>${file}</strong><br>
                    Statements: ${cov.statements}% | Branches: ${cov.branches}% | Functions: ${cov.functions}% | Lines: ${cov.lines}%
                </div>
            `).join('') : '<p>No coverage data available</p>'}
        </div>
    </div>
</body>
</html>
  `;
  
  function getScoreClass(score) {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }
  
  const htmlPath = path.join(reportDir, `security-report-${Date.now()}.html`);
  
  try {
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📋 HTML security report generated: ${htmlPath}`);
  } catch (error) {
    console.error('❌ Failed to generate HTML security report:', error);
  }
}

function logSecuritySummary(analysis) {
  console.log('\n🛡️  SECURITY TEST SUMMARY');
  console.log('================================');
  console.log(`Overall Compliance Score: ${analysis.compliance.overallScore}%`);
  console.log(`Security Tests: ${analysis.securityMetrics.passedSecurityTests}/${analysis.securityMetrics.totalSecurityTests} passed`);
  console.log(`Vulnerabilities Found: ${analysis.vulnerabilities.length}`);
  
  if (analysis.vulnerabilities.length > 0) {
    console.log('\n⚠️  SECURITY ISSUES:');
    analysis.vulnerabilities.forEach(vuln => {
      console.log(`- ${vuln.severity}: ${vuln.description}`);
    });
  }
  
  console.log('\n📊 COMPLIANCE BREAKDOWN:');
  console.log(`OWASP: ${analysis.compliance.owasp.score}%`);
  console.log(`Token Security: ${analysis.compliance.tokenSecurity.score}%`);
  console.log(`Device Security: ${analysis.compliance.deviceSecurity.score}%`);
  console.log('================================\n');
}