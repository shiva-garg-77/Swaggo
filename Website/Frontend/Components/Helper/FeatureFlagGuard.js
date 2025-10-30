'use client';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';

/**
 * Feature Flag Guard Component
 * Conditionally renders children based on feature flag status
 * 
 * @example
 * <FeatureFlagGuard flag="ENABLE_NEW_MESSAGING_UI">
 *   <NewMessagingUI />
 * </FeatureFlagGuard>
 * 
 * @example With fallback
 * <FeatureFlagGuard 
 *   flag="ENABLE_VIDEO_CALLS" 
 *   fallback={<ComingSoonBanner />}
 * >
 *   <VideoCallButton />
 * </FeatureFlagGuard>
 */
export default function FeatureFlagGuard({ 
  flag, 
  children, 
  fallback = null,
  loadingFallback = null,
  checkOnMount = true
}) {
  const isEnabled = useFeatureFlag(flag, checkOnMount);

  // Show loading fallback while checking (optional)
  if (loadingFallback && isEnabled === undefined) {
    return loadingFallback;
  }

  // Show children if feature is enabled
  if (isEnabled) {
    return <>{children}</>;
  }

  // Show fallback if feature is disabled
  return fallback;
}

/**
 * Multiple Feature Flag Guard
 * Requires ALL specified flags to be enabled
 * 
 * @example
 * <MultiFeatureFlagGuard flags={["ENABLE_VIDEO_CALLS", "ENABLE_VOICE_MESSAGES"]}>
 *   <AdvancedCallFeatures />
 * </MultiFeatureFlagGuard>
 */
export function MultiFeatureFlagGuard({ 
  flags = [], 
  children, 
  fallback = null,
  requireAll = true // If false, requires ANY flag to be enabled
}) {
  const flagStatuses = flags.map(flag => useFeatureFlag(flag));

  const isEnabled = requireAll
    ? flagStatuses.every(status => status === true)
    : flagStatuses.some(status => status === true);

  if (isEnabled) {
    return <>{children}</>;
  }

  return fallback;
}

/**
 * Inverted Feature Flag Guard
 * Renders children when feature is DISABLED
 * Useful for showing "upgrade" messages or old UI
 * 
 * @example
 * <InvertedFeatureFlagGuard flag="ENABLE_NEW_UI">
 *   <OldUIComponent />
 * </InvertedFeatureFlagGuard>
 */
export function InvertedFeatureFlagGuard({ 
  flag, 
  children, 
  fallback = null 
}) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return <>{children}</>;
  }

  return fallback;
}
