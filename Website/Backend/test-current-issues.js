import fetch from 'node-fetch';

async function testCurrentIssues() {
  console.log('🔍 Testing Current GraphQL Endpoint Issues\n');
  
  const GRAPHQL_URL = 'http://localhost:45799/graphql';
  
  // Test 1: Check if GraphQL endpoint is working
  console.log('1️⃣ Testing GraphQL endpoint availability...');
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ hello }'
      })
    });
    
    const result = await response.json();
    console.log('✅ GraphQL endpoint is working:', result);
  } catch (error) {
    console.error('❌ GraphQL endpoint error:', error.message);
    return;
  }
  
  // Test 2: Check current schema for PublishDraft
  console.log('\n2️⃣ Testing PublishDraft schema...');
  try {
    const schemaQuery = `
      query IntrospectionQuery {
        __schema {
          mutationType {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: schemaQuery })
    });
    
    const result = await response.json();
    const mutations = result.data.__schema.mutationType.fields;
    const publishDraftMutation = mutations.find(m => m.name === 'PublishDraft');
    
    if (publishDraftMutation) {
      console.log('✅ PublishDraft mutation found with args:', 
        publishDraftMutation.args.map(arg => `${arg.name}: ${arg.type.name || arg.type.kind}`));
    } else {
      console.log('❌ PublishDraft mutation not found');
    }
  } catch (error) {
    console.error('❌ Schema introspection error:', error.message);
  }
  
  // Test 3: Test actual PublishDraft with minimal data
  console.log('\n3️⃣ Testing PublishDraft mutation...');
  try {
    const testMutation = `
      mutation TestPublishDraft {
        PublishDraft(draftid: "test-draft-id") {
          postid
          postType
          title
        }
      }
    `;
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: testMutation })
    });
    
    const result = await response.json();
    console.log('PublishDraft test result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ PublishDraft test error:', error.message);
  }
  
  // Test 4: Check if autoPlay field is in schema
  console.log('\n4️⃣ Testing autoPlay field in schema...');
  try {
    const typeQuery = `
      query {
        __type(name: "Posts") {
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    `;
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: typeQuery })
    });
    
    const result = await response.json();
    const fields = result.data.__type.fields;
    const autoPlayField = fields.find(f => f.name === 'autoPlay');
    
    if (autoPlayField) {
      console.log('✅ autoPlay field found in Posts type');
    } else {
      console.log('❌ autoPlay field NOT found in Posts type');
      console.log('Available fields:', fields.map(f => f.name));
    }
  } catch (error) {
    console.error('❌ Type introspection error:', error.message);
  }
}

testCurrentIssues().catch(console.error);
