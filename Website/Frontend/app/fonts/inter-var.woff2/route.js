/**
 * Font redirect handler
 * Handles requests for old inter-var.woff2 font file
 * Redirects to explain that font is now handled by next/font
 */

export async function GET() {
  // Return 404 with explanation instead of 500
  return Response.json({
    error: 'Font not found',
    message: 'Inter font is now handled by next/font/google automatically. No manual font files needed.',
    suggestion: 'Please clear your browser cache and reload the page.'
  }, { status: 404 });
}