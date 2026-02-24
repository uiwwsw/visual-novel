export const ErrorCode = Object.freeze({
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN_ROLE: "FORBIDDEN_ROLE",
  INVALID_REQUEST: "INVALID_REQUEST",
  CONFIG_MISSING: "CONFIG_MISSING",
  INTEGRATION_FAILED: "INTEGRATION_FAILED",
  PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
  SCENARIO_VALIDATION_FAILED: "SCENARIO_VALIDATION_FAILED",
  VERSION_CONFLICT: "VERSION_CONFLICT",
  BUILD_FAILED: "BUILD_FAILED",
  DEPLOY_FAILED: "DEPLOY_FAILED"
});

export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toErrorBody(error, correlationId) {
  return {
    code: error.code ?? "UNKNOWN",
    message: error.message ?? "Unknown error",
    details: error.details ?? {},
    correlationId
  };
}
