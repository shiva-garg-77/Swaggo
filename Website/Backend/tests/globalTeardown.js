/**
 * Global Test Teardown
 * Cleanup function executed after all tests complete
 * Handles database cleanup, performance reporting, and resource cleanup
 */

import { cleanup } from './globalSetup.js';

/**
 * Global teardown function executed after all tests
 */
export default async function globalTeardown() {
  await cleanup();
}