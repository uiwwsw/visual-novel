const ErrorCode = Object.freeze({
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

class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function toErrorBody(error, correlationId) {
  return {
    code: error.code ?? "UNKNOWN",
    message: error.message ?? "Unknown error",
    details: error.details ?? {},
    correlationId
  };
}

async function executeAsync(handler, input) {
  const correlationId = `corr_${Math.random().toString(36).slice(2, 12)}`;
  try {
    const result = await handler(input);
    return {
      status: result.status,
      body: {
        ...result.body,
        correlationId: result.body.correlationId ?? correlationId
      }
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: error.status,
        body: toErrorBody(error, correlationId)
      };
    }

    return {
      status: 500,
      body: {
        code: "UNKNOWN",
        message: "Unexpected server error",
        details: {},
        correlationId
      }
    };
  }
}

const Role = Object.freeze({
  VIEWER: "viewer",
  EDITOR: "editor",
  OWNER: "owner"
});

const rank = Object.freeze({
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.OWNER]: 3
});

function requireRole(userRole, minimumRole) {
  if (!userRole || !minimumRole) {
    throw new ApiError(401, ErrorCode.AUTH_REQUIRED, "Authentication required.");
  }
  if ((rank[userRole] ?? 0) < (rank[minimumRole] ?? 99)) {
    throw new ApiError(403, ErrorCode.FORBIDDEN_ROLE, "Insufficient role for this action.", {
      requiredRole: minimumRole,
      userRole
    });
  }
}

function requireOwner(userRole) {
  requireRole(userRole, Role.OWNER);
}

function requirePlan(planTier, requiredTier) {
  if (!planTier || false) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Plan validation parameters missing.");
  }

  if (planTier !== "pro") {
    throw new ApiError(
      402,
      ErrorCode.PLAN_LIMIT_EXCEEDED,
      "This feature requires a Pro plan.",
      { requiredPlan: "pro", currentPlan: planTier }
    );
  }
}

export { ApiError as A, ErrorCode as E, Role as R, requirePlan as a, requireOwner as b, executeAsync as e, requireRole as r };
