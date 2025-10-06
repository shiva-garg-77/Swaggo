/**
 * Ultra-Stable Instrumentation - Crash Prevention Priority
 */

export async function register() {
  // Minimal, ultra-safe implementation
  if (typeof window === 'undefined') {
    try {
      console.log('✅ Ultra-stable instrumentation loaded');
    } catch (e) {
      // Silent fallback - prevent any instrumentation crashes
    }
  }
}
