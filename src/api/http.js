import { ApiError, toErrorBody } from "./errors.js";

export function execute(handler, input) {
  const correlationId = `corr_${Math.random().toString(36).slice(2, 12)}`;
  try {
    const result = handler(input);
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

export async function executeAsync(handler, input) {
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
