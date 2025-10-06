/**
 * 📚 SWAGGER API DOCUMENTATION CONFIGURATION
 * 
 * Comprehensive OpenAPI 3.0 specification for Swaggo Backend API
 * Features:
 * - Interactive API explorer
 * - Detailed endpoint documentation
 * - Authentication schemas
 * - Request/response examples
 * - Security specifications
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger configuration options
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Swaggo Backend API',
      version: '1.0.0',
      description: `
        🚀 **Swaggo Backend API Documentation**
        
        A comprehensive, secure, and scalable backend API with enterprise-grade authentication.
        
        ## Features
        - 🔐 **Enterprise Security**: JWT, 2FA, WebAuthn, device fingerprinting
        - 🛡️ **Advanced Authentication**: Multi-factor authentication with quantum-safe encryption
        - 📊 **Real-time Analytics**: Behavioral analysis and threat detection
        - 🎯 **High Performance**: Optimized for scale with intelligent caching
        - 🔒 **Zero Trust**: Comprehensive session management and authorization
        
        ## Getting Started
        1. Register a new account using \`POST /api/auth/register\`
        2. Login to get access tokens using \`POST /api/auth/login\`
        3. Use the access token in Authorization header: \`Bearer <token>\`
        4. Explore protected endpoints with your authenticated session
        
        ## Security Features
        - **Token Rotation**: Automatic JWT token refresh
        - **Device Tracking**: Comprehensive device fingerprinting
        - **Rate Limiting**: Advanced protection against abuse
        - **CSRF Protection**: State-changing request validation
        - **Session Management**: Secure, scalable session handling
      `,
      contact: {
        name: 'Swaggo Development Team',
        email: 'dev@swaggo.com',
        url: 'https://swaggo.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://swaggo.com/terms'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api-dev.swaggo.com',
        description: 'Development API server'
      },
      {
        url: 'https://api.swaggo.com',
        description: 'Production API server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token for authenticated requests'
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: '__Secure-authToken',
          description: 'Secure cookie-based authentication'
        },
        CSRFToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF protection token for state-changing requests'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              description: 'User unique identifier'
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Unique username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            displayName: {
              type: 'string',
              maxLength: 100,
              description: 'User display name'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'User role'
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last successful login'
            }
          },
          required: ['username', 'email', 'role']
        },
        UserRegistration: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Unique username (3-30 characters, alphanumeric and underscore only)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Valid email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Strong password (min 8 chars, uppercase, lowercase, number, special char)'
            },
            displayName: {
              type: 'string',
              maxLength: 100,
              description: 'Display name for the user'
            }
          },
          required: ['username', 'email', 'password'],
          example: {
            username: 'johndoe',
            email: 'john@example.com',
            password: 'SecurePass123!',
            displayName: 'John Doe'
          }
        },
        UserLogin: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            },
            rememberMe: {
              type: 'boolean',
              description: 'Extend session duration'
            },
            twoFactorCode: {
              type: 'string',
              length: 6,
              pattern: '^[0-9]{6}$',
              description: 'Two-factor authentication code (if enabled)'
            }
          },
          required: ['email', 'password'],
          example: {
            email: 'john@example.com',
            password: 'SecurePass123!',
            rememberMe: true
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token for API requests'
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token for obtaining new access tokens'
            },
            expiresIn: {
              type: 'integer',
              description: 'Access token expiration time in seconds'
            },
            tokenType: {
              type: 'string',
              enum: ['Bearer'],
              description: 'Token type'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
              description: 'Response status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data payload'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp'
            }
          },
          required: ['status', 'message', 'timestamp']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Error status'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field that caused the error'
                  },
                  message: {
                    type: 'string',
                    description: 'Field-specific error message'
                  }
                }
              },
              description: 'Detailed validation errors'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          },
          required: ['status', 'message', 'timestamp']
        }
      },
      responses: {
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - validation errors',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                message: 'Validation failed',
                errors: [
                  {
                    field: 'email',
                    message: 'Invalid email format'
                  }
                ],
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                message: 'Authorization token required',
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Too many requests - rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'error',
                message: 'Rate limit exceeded. Try again later.',
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      parameters: {
        PaginationPage: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        PaginationLimit: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        },
        SortBy: {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string'
          },
          description: 'Field to sort by'
        },
        SortOrder: {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          },
          description: 'Sort order'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management and profile operations'
      },
      {
        name: 'Security',
        description: 'Security features and monitoring'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin only)'
      },
      {
        name: 'System',
        description: 'System health and monitoring endpoints'
      }
    ]
  },
  apis: [
    './Routes/*.js',
    './Controllers/*.js',
    './Middleware/*.js',
    './main.js'
  ]
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI customization options
 */
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .scheme-container { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      color: #333;
      font-size: 36px;
      font-weight: 700;
    }
  `,
  customSiteTitle: 'Swaggo API Documentation',
  customfavIcon: '/favicon.ico'
};

/**
 * Setup Swagger documentation middleware
 */
export function setupSwagger(app) {
  // Serve swagger specification as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Serve swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve alternative documentation formats
  app.get('/api-docs/redoc', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Swaggo API Documentation - ReDoc</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <redoc spec-url='/api-docs.json'></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script>
        </body>
      </html>
    `);
  });
  
  console.log('📚 Swagger documentation available at:');
  console.log('   • Swagger UI: http://localhost:3001/api-docs');
  console.log('   • ReDoc: http://localhost:3001/api-docs/redoc');
  console.log('   • JSON Spec: http://localhost:3001/api-docs.json');
}

export { swaggerSpec, swaggerUiOptions };
export default swaggerOptions;