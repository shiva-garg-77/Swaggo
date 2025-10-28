# API Routes

This directory contains all the Express routes for the Swaggo API, organized by version.

## Structure

### [v1](file:///c:/swaggo-testing/Swaggo/Website/Backend/Routes/api/v1)
Contains all routes for API version 1. This is the current stable version of the API.

### [v2](file:///c:/swaggo-testing/Swaggo/Website/Backend/Routes/api/v2)
Contains all routes for API version 2. This version can be used for breaking changes.

## Versioning Strategy

The API uses URL versioning with the version number included in the path:

- `/api/v1/` - Version 1 of the API
- `/api/v2/` - Version 2 of the API
- `/api/` - Defaults to version 1 for backward compatibility

## Adding New Routes

1. Add new route files to the appropriate version directory
2. Update the index.js file in that version directory to import and mount the new routes
3. If creating a new version, copy the previous version's index.js and modify as needed

## Best Practices

1. **Backward Compatibility**: Maintain backward compatibility within the same version
2. **Breaking Changes**: Introduce breaking changes in new versions only
3. **Documentation**: Document all routes and changes in the API documentation
4. **Testing**: Ensure all routes are properly tested