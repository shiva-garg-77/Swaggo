/**
 * Health check endpoint
 * Provides a simple health check for development
 */

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'Frontend service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, { status: 200 });
}