/**
 * End-to-End Tests for Critical User Workflows
 * Tests complete user journeys from registration to advanced features
 */

import request from 'supertest';
import {
  TestDataFactory,
  TestEnvironment,
  ApiTestUtils,
  DatabaseTestUtils,
  SecurityTestUtils,
  PerformanceTestUtils,
  FileSystemTestUtils
} from '../utils/testHelpers.js';

describe('Critical User Workflows E2E Tests', () => {
  let app;
  let testUser;
  let adminUser;
  let userTokens;
  let adminTokens;

  beforeAll(async () => {
    // Import the Express app
    try {
      const appModule = await import('../../app.js');
      app = appModule.default;
    } catch (error) {
      console.warn('App module not found, creating mock Express app');
      app = await createMockExpressApp();
    }

    // Setup comprehensive test environment
    await TestEnvironment.setup({ database: true, seedData: true });
  });

  beforeEach(async () => {
    // Setup fresh test data for each workflow test
    await DatabaseTestUtils.clearDatabase();
    
    // Create test users
    testUser = TestDataFactory.users.standard;
    adminUser = TestDataFactory.users.admin;
  });

  afterEach(async () => {
    // Clean up after each test
    await DatabaseTestUtils.clearDatabase();
    await FileSystemTestUtils.cleanupTempFiles();
  });

  afterAll(async () => {
    await TestEnvironment.cleanup();
  });

  describe('Complete User Registration and Onboarding Flow', () => {
    test('should complete full user registration and onboarding journey', async () => {
      // Step 1: User Registration
      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          username: testUser.username,
          firstName: 'Test',
          lastName: 'User',
          acceptTerms: true
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(registrationResponse);
      expect(registrationResponse.body.data.user).toHaveProperty('id');
      const userId = registrationResponse.body.data.user.id;
      const initialToken = registrationResponse.body.data.token;

      // Step 2: Email Verification (simulated)
      const verificationResponse = await request(app)
        .post(`/api/auth/verify-email`)
        .send({
          token: 'mock-verification-token',
          userId: userId
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(verificationResponse);

      // Step 3: Complete Profile Setup
      const profileResponse = await request(app)
        .post('/api/users/complete-profile')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          bio: 'Test user bio',
          interests: ['technology', 'design'],
          preferences: {
            theme: 'dark',
            notifications: true,
            privacy: 'friends'
          },
          profilePicture: 'base64-encoded-image-data'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(profileResponse);

      // Step 4: Initial Login with Complete Profile
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(loginResponse);
      expect(loginResponse.body.data.user.isVerified).toBe(true);
      expect(loginResponse.body.data.user.profileComplete).toBe(true);

      userTokens = {
        accessToken: loginResponse.body.data.accessToken,
        refreshToken: loginResponse.body.data.refreshToken
      };

      // Step 5: Access Dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(dashboardResponse);
      expect(dashboardResponse.body.data.welcome).toBe(true);
      expect(dashboardResponse.body.data.onboardingComplete).toBe(true);
    });

    test('should handle registration with social login integration', async () => {
      // Step 1: Initiate Social Login (Google)
      const socialAuthResponse = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(socialAuthResponse.headers.location).toContain('googleapis.com');

      // Step 2: Handle Social Login Callback (simulated)
      const callbackResponse = await request(app)
        .get('/api/auth/google/callback')
        .query({
          code: 'mock-authorization-code',
          state: 'mock-state-token'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(callbackResponse);
      expect(callbackResponse.body.data.user.provider).toBe('google');
      expect(callbackResponse.body.data.user.email).toBeDefined();

      // Step 3: Complete Social Profile
      const socialToken = callbackResponse.body.data.accessToken;
      const completeProfileResponse = await request(app)
        .post('/api/users/complete-social-profile')
        .set('Authorization', `Bearer ${socialToken}`)
        .send({
          username: 'socialuser123',
          preferences: {
            theme: 'light',
            notifications: true
          }
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(completeProfileResponse);
      expect(completeProfileResponse.body.data.user.profileComplete).toBe(true);
    });
  });

  describe('Content Creation and Management Workflow', () => {
    beforeEach(async () => {
      // Setup authenticated user for content tests
      await registerAndLoginUser();
    });

    test('should complete full content creation and management journey', async () => {
      // Step 1: Create New Post
      const createPostResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          title: 'Test Post Title',
          content: 'This is a test post content with **markdown** formatting.',
          tags: ['test', 'automation', 'e2e'],
          category: 'technology',
          visibility: 'public',
          allowComments: true
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(createPostResponse);
      const postId = createPostResponse.body.data.post.id;
      expect(createPostResponse.body.data.post.title).toBe('Test Post Title');
      expect(createPostResponse.body.data.post.status).toBe('draft');

      // Step 2: Upload Media for Post
      const testImage = await FileSystemTestUtils.createTempFile('mock-image-data', '.jpg');
      const uploadResponse = await request(app)
        .post(`/api/posts/${postId}/media`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .attach('media', testImage.path)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(uploadResponse);
      expect(uploadResponse.body.data.media).toHaveProperty('url');
      expect(uploadResponse.body.data.media).toHaveProperty('thumbnail');

      // Step 3: Preview Post
      const previewResponse = await request(app)
        .get(`/api/posts/${postId}/preview`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(previewResponse);
      expect(previewResponse.body.data.post.rendered).toBeTruthy();
      expect(previewResponse.body.data.post.media.length).toBeGreaterThan(0);

      // Step 4: Publish Post
      const publishResponse = await request(app)
        .patch(`/api/posts/${postId}/publish`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          publishAt: new Date().toISOString(),
          notifications: true
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(publishResponse);
      expect(publishResponse.body.data.post.status).toBe('published');
      expect(publishResponse.body.data.post.publishedAt).toBeTruthy();

      // Step 5: View Published Post (Public Access)
      const publicViewResponse = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(publicViewResponse);
      expect(publicViewResponse.body.data.post.title).toBe('Test Post Title');
      expect(publicViewResponse.body.data.post.views).toBeGreaterThan(0);

      // Step 6: Edit Post
      const editResponse = await request(app)
        .patch(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          title: 'Updated Test Post Title',
          content: 'Updated content with more details.',
          tags: ['test', 'automation', 'e2e', 'updated']
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(editResponse);
      expect(editResponse.body.data.post.title).toBe('Updated Test Post Title');
      expect(editResponse.body.data.post.updatedAt).toBeTruthy();

      // Step 7: Manage Post Analytics
      const analyticsResponse = await request(app)
        .get(`/api/posts/${postId}/analytics`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(analyticsResponse);
      expect(analyticsResponse.body.data.analytics).toHaveProperty('views');
      expect(analyticsResponse.body.data.analytics).toHaveProperty('engagement');
      expect(analyticsResponse.body.data.analytics).toHaveProperty('demographics');
    });

    test('should handle collaborative content editing workflow', async () => {
      // Step 1: Create Post with Collaboration
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          title: 'Collaborative Post',
          content: 'Initial content',
          collaborationEnabled: true,
          inviteCollaborators: ['collaborator@example.com']
        })
        .expect(201);

      const postId = createResponse.body.data.post.id;

      // Step 2: Accept Collaboration Invite (Simulate Second User)
      const collaboratorTokens = await registerAndLoginCollaborator();
      const acceptInviteResponse = await request(app)
        .post(`/api/posts/${postId}/collaboration/accept`)
        .set('Authorization', `Bearer ${collaboratorTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          inviteToken: 'mock-invite-token'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(acceptInviteResponse);

      // Step 3: Collaborative Edit
      const collaborativeEditResponse = await request(app)
        .patch(`/api/posts/${postId}/collaborate`)
        .set('Authorization', `Bearer ${collaboratorTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          content: 'Initial content\n\nCollaborator addition',
          changes: [{
            type: 'insert',
            position: 15,
            text: '\n\nCollaborator addition'
          }]
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(collaborativeEditResponse);

      // Step 4: View Collaboration History
      const historyResponse = await request(app)
        .get(`/api/posts/${postId}/collaboration/history`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(historyResponse);
      expect(historyResponse.body.data.changes.length).toBeGreaterThan(0);
      expect(historyResponse.body.data.collaborators.length).toBe(2);
    });
  });

  describe('Social Interaction and Engagement Workflow', () => {
    let postId;

    beforeEach(async () => {
      await registerAndLoginUser();
      
      // Create a post for interaction tests
      const createPostResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          title: 'Social Interaction Test Post',
          content: 'Content for testing social features',
          visibility: 'public'
        });

      await request(app)
        .patch(`/api/posts/${createPostResponse.body.data.post.id}/publish`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({});

      postId = createPostResponse.body.data.post.id;
    });

    test('should complete social interaction journey', async () => {
      // Step 1: Like Post
      const likeResponse = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .expect(200);

      ApiTestUtils.assertSuccessResponse(likeResponse);
      expect(likeResponse.body.data.liked).toBe(true);
      expect(likeResponse.body.data.likeCount).toBeGreaterThan(0);

      // Step 2: Comment on Post
      const commentResponse = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          content: 'Great post! Thanks for sharing.',
          replyTo: null
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(commentResponse);
      const commentId = commentResponse.body.data.comment.id;
      expect(commentResponse.body.data.comment.content).toBe('Great post! Thanks for sharing.');

      // Step 3: Reply to Comment
      const replyResponse = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          content: 'Thanks for the feedback!',
          replyTo: commentId
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(replyResponse);
      expect(replyResponse.body.data.comment.parentId).toBe(commentId);

      // Step 4: Share Post
      const shareResponse = await request(app)
        .post(`/api/posts/${postId}/share`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          platform: 'internal',
          message: 'Check out this amazing post!'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(shareResponse);
      expect(shareResponse.body.data.shared).toBe(true);
      expect(shareResponse.body.data.shareCount).toBeGreaterThan(0);

      // Step 5: Follow Author
      const followResponse = await request(app)
        .post(`/api/users/follow`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          userId: 'mock-author-id'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(followResponse);
      expect(followResponse.body.data.following).toBe(true);

      // Step 6: View Social Activity Feed
      const activityResponse = await request(app)
        .get('/api/users/activity-feed')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(activityResponse);
      expect(activityResponse.body.data.activities).toBeDefined();
      expect(Array.isArray(activityResponse.body.data.activities)).toBe(true);
    });

    test('should handle private messaging workflow', async () => {
      // Register second user for messaging
      const secondUserTokens = await registerAndLoginSecondUser();

      // Step 1: Start Conversation
      const startConversationResponse = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          recipientId: 'mock-second-user-id',
          message: 'Hello! I saw your post and wanted to connect.',
          subject: 'Great post!'
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(startConversationResponse);
      const conversationId = startConversationResponse.body.data.conversation.id;

      // Step 2: Reply to Message
      const replyResponse = await request(app)
        .post(`/api/messages/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${secondUserTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          message: 'Hi there! Thanks for reaching out. I\'d love to chat!'
        })
        .expect(201);

      ApiTestUtils.assertSuccessResponse(replyResponse);

      // Step 3: View Conversation History
      const historyResponse = await request(app)
        .get(`/api/messages/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(historyResponse);
      expect(historyResponse.body.data.messages.length).toBe(2);

      // Step 4: Mark Messages as Read
      const markReadResponse = await request(app)
        .patch(`/api/messages/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .expect(200);

      ApiTestUtils.assertSuccessResponse(markReadResponse);
    });
  });

  describe('Admin Management Workflow', () => {
    beforeEach(async () => {
      await registerAndLoginAdmin();
    });

    test('should complete admin user management workflow', async () => {
      // Step 1: View User Management Dashboard
      const dashboardResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(dashboardResponse);
      expect(dashboardResponse.body.data.users).toBeDefined();
      expect(dashboardResponse.body.data.pagination).toBeDefined();

      // Step 2: Search and Filter Users
      const searchResponse = await request(app)
        .get('/api/admin/users')
        .query({
          search: 'test',
          role: 'user',
          status: 'active',
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(searchResponse);

      // Step 3: Moderate User Content
      const moderateResponse = await request(app)
        .patch('/api/admin/posts/mock-post-id/moderate')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          action: 'flag',
          reason: 'inappropriate_content',
          message: 'Content violates community guidelines'
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(moderateResponse);

      // Step 4: Manage User Permissions
      const permissionsResponse = await request(app)
        .patch('/api/admin/users/mock-user-id/permissions')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .set('X-CSRF-Token', SecurityTestUtils.generateCSRFToken())
        .send({
          role: 'moderator',
          permissions: ['read', 'write', 'moderate']
        })
        .expect(200);

      ApiTestUtils.assertSuccessResponse(permissionsResponse);

      // Step 5: Generate Admin Reports
      const reportsResponse = await request(app)
        .get('/api/admin/reports/user-activity')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          format: 'json'
        })
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      ApiTestUtils.assertSuccessResponse(reportsResponse);
      expect(reportsResponse.body.data.report).toBeDefined();
      expect(reportsResponse.body.data.report.metrics).toBeDefined();
    });
  });

  // Helper functions
  async function registerAndLoginUser() {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
        username: testUser.username
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    userTokens = {
      accessToken: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken
    };
  }

  async function registerAndLoginAdmin() {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: adminUser.email,
        password: adminUser.password,
        username: adminUser.username,
        role: 'admin'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    adminTokens = {
      accessToken: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken
    };
  }

  async function registerAndLoginCollaborator() {
    const collaboratorUser = {
      email: 'collaborator@example.com',
      password: 'CollaboratorPass123!',
      username: 'collaborator123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(collaboratorUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: collaboratorUser.email,
        password: collaboratorUser.password
      });

    return {
      accessToken: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken
    };
  }

  async function registerAndLoginSecondUser() {
    const secondUser = {
      email: 'seconduser@example.com',
      password: 'SecondUserPass123!',
      username: 'seconduser123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(secondUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: secondUser.email,
        password: secondUser.password
      });

    return {
      accessToken: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken
    };
  }
});

// Mock Express app for E2E testing
async function createMockExpressApp() {
  const { default: express } = await import('express');
  const app = express();
  
  app.use(express.json());

  // Mock all the endpoints needed for E2E tests
  // (This would be a comprehensive mock of your entire API)
  
  // Auth endpoints
  app.post('/api/auth/register', (req, res) => {
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: { id: 'mock-user-id', email: req.body.email, username: req.body.username },
        token: 'mock-jwt-token'
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/auth/login', (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        user: { id: 'mock-user-id', email: req.body.email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Add more mock endpoints as needed...
  
  return app;
}