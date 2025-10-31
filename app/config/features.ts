/**
 * Feature flags configuration
 * 
 * This file controls which features are enabled or disabled in the application.
 * Use the npm scripts to toggle features:
 * - npm run fidelity:on  -> Enable fidelity features
 * - npm run fidelity:off -> Disable fidelity features (Coming Soon mode)
 */

export const FEATURES = {
  /**
   * Controls the availability of loyalty/fidelity features
   * - true:  Full access to loyalty features
   * - false: Coming Soon mode with tooltips
   */
  FIDELITY_ENABLED: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
