# Middleware

This directory contains all the Express middleware used in the Swaggo application.

## Structure

The middleware is organized into subdirectories based on their functionality:

### [Authentication](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/Authentication)
Middleware for handling user authentication and authorization.

### [Security](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/Security)
Security-related middleware including CSRF protection, DDoS protection, and security headers.

### [Performance](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/Performance)
Performance optimization middleware including caching and rate limiting.

### [GraphQL](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/GraphQL)
Middleware specific to GraphQL operations.

### [Socket](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/Socket)
Middleware for WebSocket connections and socket authentication.

### [Features](file:///c:/swaggo-testing/Swaggo/Website/Backend/Middleware/Features)
Middleware for feature flags and other feature-specific functionality.

## Best Practices

1. **Middleware Organization**: Middleware should be placed in the most appropriate subdirectory based on its primary functionality.
2. **Order of Execution**: Middleware order matters in Express. Ensure middleware is registered in the correct order.
3. **Error Handling**: All middleware should properly handle errors and pass them to the next middleware in the chain.
4. **Documentation**: Each middleware should include JSDoc comments explaining its purpose and usage.
5. **Testing**: Each middleware should have corresponding test files.