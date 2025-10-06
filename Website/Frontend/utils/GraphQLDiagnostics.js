/**
 * GraphQL Diagnostics and Troubleshooting Utility
 * Comprehensive tool to identify and fix GraphQL connectivity issues
 */

import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Test queries
const TEST_QUERIES = {
  HEALTH_CHECK: gql`
    query HealthCheck {
      __typename
    }
  `,
  
  SIMPLE_HELLO: gql`
    query SimpleHello {
      hello
    }
  `,
  
  GET_POSTS_TEST: gql`
    query GetPostsTest {
      getPosts {
        postid
        title
        Description
      }
    }
  `,

  INTROSPECTION: gql`
    query IntrospectionQuery {
      __schema {
        queryType {
          name
        }
        mutationType {
          name
        }
        subscriptionType {
          name
        }
      }
    }
  `
};

class GraphQLDiagnostics {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.possibleURLs = [
      'http://localhost:45799/graphql',
      'http://127.0.0.1:45799/graphql',
      'http://localhost:5000/graphql',
      'http://localhost:3000/graphql',
      'http://localhost:4000/graphql',
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    switch (type) {
      case 'error':
        this.errors.push(logEntry);
        break;
      case 'warning':
        this.warnings.push(logEntry);
        break;
      default:
        this.results.push(logEntry);
    }
  }

  async testURL(url, testName = 'Basic connectivity') {
    this.log(`Testing ${testName} for: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __typename }'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
      }

      this.log(`✅ SUCCESS: ${testName} - ${url}`, 'success');
      return { success: true, url, data, response };
      
    } catch (error) {
      this.log(`❌ FAILED: ${testName} - ${url} - ${error.message}`, 'error');
      return { success: false, url, error: error.message };
    }
  }

  async testApolloClient(url) {
    this.log(`Testing Apollo Client with: ${url}`);
    
    try {
      const httpLink = createHttpLink({
        uri: url,
        credentials: 'include',
        fetch: (uri, options) => {
          this.log(`Apollo fetch to: ${uri}`);
          return fetch(uri, options);
        }
      });

      const client = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: { errorPolicy: 'all' },
          query: { errorPolicy: 'all' }
        }
      });

      // Test simple query
      const result = await client.query({
        query: TEST_QUERIES.SIMPLE_HELLO,
        fetchPolicy: 'no-cache'
      });

      this.log(`✅ SUCCESS: Apollo Client - ${url}`, 'success');
      return { success: true, url, data: result.data, client };
      
    } catch (error) {
      this.log(`❌ FAILED: Apollo Client - ${url} - ${error.message}`, 'error');
      return { success: false, url, error: error.message };
    }
  }

  async checkCORS(url) {
    this.log(`Checking CORS for: ${url}`);
    
    try {
      // Test OPTIONS request
      const optionsResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': optionsResponse.headers.get('Access-Control-Allow-Credentials')
      };

      this.log(`CORS Headers: ${JSON.stringify(corsHeaders, null, 2)}`);
      
      if (!corsHeaders['Access-Control-Allow-Origin']) {
        this.log('⚠️ WARNING: No CORS headers found', 'warning');
      }

      return { success: true, corsHeaders };
      
    } catch (error) {
      this.log(`❌ CORS check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAuthentication(url) {
    this.log(`Testing authentication for: ${url}`);
    
    try {
      // Check if cookies are present
      const cookies = document.cookie;
      this.log(`Current cookies: ${cookies || 'None'}`);

      // Test authenticated query
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query TestAuth {
              __typename
            }
          `
        })
      });

      const data = await response.json();
      
      if (response.status === 401) {
        this.log('⚠️ Authentication required', 'warning');
        return { success: false, requiresAuth: true };
      }

      this.log('✅ Authentication test passed', 'success');
      return { success: true, data };
      
    } catch (error) {
      this.log(`❌ Authentication test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const envVars = {
      'NEXT_PUBLIC_GRAPHQL_URL': process.env.NEXT_PUBLIC_GRAPHQL_URL,
      'NEXT_PUBLIC_SERVER_URL': process.env.NEXT_PUBLIC_SERVER_URL,
      'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
      'NODE_ENV': process.env.NODE_ENV
    };

    this.log('Environment Variables:');
    Object.entries(envVars).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      this.log(`  ${status} ${key}: ${value || 'NOT SET'}`);
      
      if (!value && key.startsWith('NEXT_PUBLIC_')) {
        this.log(`⚠️ WARNING: ${key} is not set`, 'warning');
      }
    });

    return envVars;
  }

  async testIntrospection(url) {
    this.log(`Testing GraphQL introspection for: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          query: TEST_QUERIES.INTROSPECTION.loc.source.body
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
      }

      this.log('✅ Introspection successful', 'success');
      this.log(`Schema info: ${JSON.stringify(data.data.__schema, null, 2)}`);
      
      return { success: true, schema: data.data.__schema };
      
    } catch (error) {
      this.log(`❌ Introspection failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async diagnoseNetworkIssues() {
    this.log('Diagnosing network issues...');
    
    // Test if backend is reachable
    const backendTests = await Promise.allSettled([
      fetch('http://localhost:45799/health').catch(e => ({ error: e.message })),
      fetch('http://localhost:45799/').catch(e => ({ error: e.message })),
      fetch('http://127.0.0.1:45799/health').catch(e => ({ error: e.message }))
    ]);

    backendTests.forEach((result, index) => {
      const url = ['http://localhost:45799/health', 'http://localhost:45799/', 'http://127.0.0.1:45799/health'][index];
      
      if (result.status === 'fulfilled' && result.value.ok) {
        this.log(`✅ Backend reachable: ${url}`, 'success');
      } else {
        this.log(`❌ Backend unreachable: ${url}`, 'error');
      }
    });
  }

  async runComprehensiveDiagnostics() {
    this.log('🔍 Starting comprehensive GraphQL diagnostics...');
    this.log('=====================================================');
    
    // 1. Check environment variables
    const envVars = await this.checkEnvironmentVariables();
    
    // 2. Test network connectivity
    await this.diagnoseNetworkIssues();
    
    // 3. Test all possible GraphQL URLs
    const workingURLs = [];
    
    for (const url of this.possibleURLs) {
      const result = await this.testURL(url, 'Basic GraphQL test');
      if (result.success) {
        workingURLs.push(url);
        
        // Test additional features for working URLs
        await this.checkCORS(url);
        await this.testAuthentication(url);
        await this.testIntrospection(url);
        await this.testApolloClient(url);
      }
    }

    // 4. Summary and recommendations
    this.generateReport(workingURLs, envVars);
    
    return {
      workingURLs,
      errors: this.errors,
      warnings: this.warnings,
      results: this.results
    };
  }

  generateReport(workingURLs, envVars) {
    this.log('=====================================================');
    this.log('🎯 DIAGNOSTIC REPORT');
    this.log('=====================================================');
    
    if (workingURLs.length === 0) {
      this.log('❌ CRITICAL: No working GraphQL URLs found!', 'error');
      this.log('🔧 SOLUTIONS:', 'error');
      this.log('  1. Make sure your backend is running on port 45799', 'error');
      this.log('  2. Check if the GraphQL endpoint is properly configured', 'error');
      this.log('  3. Verify CORS settings allow your frontend origin', 'error');
      this.log('  4. Check for firewall or proxy issues', 'error');
    } else {
      this.log(`✅ SUCCESS: Found ${workingURLs.length} working GraphQL URL(s):`, 'success');
      workingURLs.forEach(url => {
        this.log(`  ✅ ${url}`, 'success');
      });
      
      // Check if environment matches working URLs
      const configuredURL = envVars.NEXT_PUBLIC_GRAPHQL_URL;
      if (configuredURL && !workingURLs.includes(configuredURL)) {
        this.log(`⚠️ WARNING: Configured URL (${configuredURL}) is not working!`, 'warning');
        this.log(`🔧 SOLUTION: Update NEXT_PUBLIC_GRAPHQL_URL to: ${workingURLs[0]}`, 'warning');
      }
    }

    // Environment variable recommendations
    if (!envVars.NEXT_PUBLIC_GRAPHQL_URL) {
      this.log('❌ CRITICAL: NEXT_PUBLIC_GRAPHQL_URL not set!', 'error');
      this.log(`🔧 SOLUTION: Add to your .env.local file:`, 'error');
      this.log(`  NEXT_PUBLIC_GRAPHQL_URL=${workingURLs[0] || 'http://localhost:45799/graphql'}`, 'error');
    }

    if (!envVars.NEXT_PUBLIC_SERVER_URL) {
      this.log('❌ CRITICAL: NEXT_PUBLIC_SERVER_URL not set!', 'error');
      this.log(`🔧 SOLUTION: Add to your .env.local file:`, 'error');
      this.log(`  NEXT_PUBLIC_SERVER_URL=http://localhost:45799`, 'error');
    }

    // Error summary
    if (this.errors.length > 0) {
      this.log(`❌ Total errors: ${this.errors.length}`, 'error');
    }
    
    if (this.warnings.length > 0) {
      this.log(`⚠️ Total warnings: ${this.warnings.length}`, 'warning');
    }

    this.log('=====================================================');
  }

  // Quick fix generator
  generateQuickFix(workingURLs) {
    if (workingURLs.length === 0) {
      return `
# Add this to your .env.local file in the frontend directory:
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:45799/graphql
NEXT_PUBLIC_SERVER_URL=http://localhost:45799
NEXT_PUBLIC_API_URL=http://localhost:45799/api

# Then restart your frontend development server
`;
    }

    return `
# Update your .env.local file in the frontend directory:
NEXT_PUBLIC_GRAPHQL_URL=${workingURLs[0]}
NEXT_PUBLIC_SERVER_URL=${workingURLs[0].replace('/graphql', '')}
NEXT_PUBLIC_API_URL=${workingURLs[0].replace('/graphql', '/api')}

# Then restart your frontend development server
`;
  }
}

// Export for use in components
export default GraphQLDiagnostics;

// Browser console helper
if (typeof window !== 'undefined') {
  window.GraphQLDiagnostics = GraphQLDiagnostics;
  window.runGraphQLDiagnostics = async () => {
    const diagnostics = new GraphQLDiagnostics();
    const results = await diagnostics.runComprehensiveDiagnostics();
    
    console.log('\n🎯 Quick Fix:');
    console.log(diagnostics.generateQuickFix(results.workingURLs));
    
    return results;
  };
  
  console.log('🔍 GraphQL Diagnostics loaded!');
  console.log('Run: runGraphQLDiagnostics() to diagnose issues');
}