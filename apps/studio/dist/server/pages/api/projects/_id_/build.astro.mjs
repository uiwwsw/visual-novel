import { e as executeAsync, A as ApiError, E as ErrorCode } from '../../../../chunks/permissions_BskKVdUi.mjs';
import { r as requestBuild } from '../../../../chunks/routes_CcMLnfyp.mjs';
import { a as readJson, r as readActorContext } from '../../../../chunks/request-context_hfaLwzy9.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;

async function POST({ request, params }) {
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
