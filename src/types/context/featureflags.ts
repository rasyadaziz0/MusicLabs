export type FeatureFlags = Record<string, boolean>;

export interface FeatureFlagsContextType {
  flags: FeatureFlags;
  loading: boolean;
}
