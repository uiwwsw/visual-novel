import { ApiError, ErrorCode, executeAsync, requestBuild } from "../../../../lib/platform-api.js";
import { readActorContext, readJson } from "../../../../lib/request-context.js";

export const prerender = false;

export async function POST({ request, params }) {
  const body = await readJson(request);
  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }
    const actor = await readActorContext(request);
    return requestBuild({
      userRole: actor.userRole,
      planTier: actor.planTier,
      projectId: params.id,
      jobType: body.jobType
    });
  }, {});

  return Response.json(result.body, { status: result.status });
}
