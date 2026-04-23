import logger from "../services/logger.js";

class FeatureFlags {
  constructor() {
    this.flags = new Map();
    this.defaults = new Map();
    this.initializeDefaults();
  }

  initializeDefaults() {
    this.defaults.set("api_versioning", true);
    this.defaults.set("rate_limiting", true);
    this.defaults.set("circuit_breaker", true);
    this.defaults.set("request_caching", true);
    this.defaults.set("zkp_proofs", true);
    this.defaults.set("emergency_access", true);
    this.defaults.set("batch_uploads", true);
    this.defaults.set("websocket_events", true);
    this.defaults.set("pdf_generation", true);
    this.defaults.set("insurance_claims", true);
    this.defaults.set("family_sharing", true);
    this.defaults.set("wellness_tracking", true);
    this.defaults.set("health_insights", true);
    this.defaults.set("ipfs_backup", true);
    this.defaults.set("offline_mode", true);
  }

  set(key, value) {
    this.flags.set(key, value);
    logger.info({ message: "Feature flag updated", flag: key, value }, { requestId: null });
  }

  get(key, fallback = null) {
    if (this.flags.has(key)) {
      return this.flags.get(key);
    }
    return this.defaults.get(key) ?? fallback;
  }

  isEnabled(key) {
    return this.get(key, false) === true;
  }

  isDisabled(key) {
    return this.get(key, true) === false;
  }

  getAll() {
    const all = {};
    for (const [key, defaultValue] of this.defaults) {
      all[key] = this.flags.has(key) ? this.flags.get(key) : defaultValue;
    }
    return all;
  }

  enable(key) {
    this.set(key, true);
  }

  disable(key) {
    this.set(key, false);
  }

  reset(key) {
    if (this.flags.has(key)) {
      this.flags.delete(key);
      logger.info({ message: "Feature flag reset", flag: key }, { requestId: null });
    }
  }

  resetAll() {
    this.flags.clear();
    logger.info({ message: "All feature flags reset to defaults" }, { requestId: null });
  }
}

export const featureFlags = new FeatureFlags();

export const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!featureFlags.isEnabled(featureName)) {
      return res.status(503).json({
        error: {
          code: "FEATURE_DISABLED",
          message: `Feature '${featureName}' is currently disabled`,
          requestId: req.id
        }
      });
    }
    next();
  };
};

export default featureFlags;