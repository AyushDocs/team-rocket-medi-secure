import semver from "semver";
import logger from "../../services/logger.js";

const SUPPORTED_VERSIONS = ["v1", "v2"];
const DEFAULT_VERSION = "v1";

export const API_VERSION_HEADER = "X-API-Version";
export const API_VERSION_RESPONSE = "X-API-Version";

const versionMiddleware = (req, res, next) => {
  const requestId = req.id;
  
  let version = DEFAULT_VERSION;
  
  const pathMatch = req.path.match(/^\/api\/(v\d+)/);
  if (pathMatch) {
    version = pathMatch[1];
  }
  
  const headerVersion = req.headers[API_VERSION_HEADER.toLowerCase()];
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    version = headerVersion;
  }
  
  const queryVersion = req.query.apiVersion;
  if (queryVersion && SUPPORTED_VERSIONS.includes(queryVersion)) {
    version = queryVersion;
  }
  
  if (!SUPPORTED_VERSIONS.includes(version)) {
    version = DEFAULT_VERSION;
  }
  
  req.apiVersion = version;
  res.setHeader(API_VERSION_RESPONSE, version);
  
  logger.debug({
    requestId,
    message: "API Version detected",
    pathVersion: pathMatch?.[1],
    headerVersion,
    queryVersion,
    resolvedVersion: version
  });
  
  next();
};

export const validateVersion = (requiredVersion) => {
  return (req, res, next) => {
    const currentVersion = req.apiVersion;
    
    if (!semver.satisfies(currentVersion, requiredVersion)) {
      return res.status(400).json({
        error: {
          code: "VERSION_NOT_SUPPORTED",
          message: `API version ${requiredVersion} is required, but you are using ${currentVersion}`,
          supportedVersions: SUPPORTED_VERSIONS,
          currentVersion
        }
      });
    }
    
    next();
  };
};

export const createVersionedRouter = (basePath, version = DEFAULT_VERSION) => {
  const { Router } = require("express");
  const router = Router();
  
  const versionedPath = basePath.replace("{version}", version);
  
  return { router, path: versionedPath };
};

export const getVersionInfo = () => ({
  current: DEFAULT_VERSION,
  supported: SUPPORTED_VERSIONS,
  deprecationSchedule: {
    v1: "2026-12-31"
  }
});

export default versionMiddleware;